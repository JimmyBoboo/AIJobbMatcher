"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { NavJobDetailResponse, NavJobDetailJson } from "@/lib/schemas/job-feed";
import { isApplicationOpen } from "@/lib/job-utils";
import { formatApplicationDue } from "@/lib/format-job";
import { JobSummaryContent } from "@/components/job-summary-content";

function buildKeyPointsFromNav(
  json: NavJobDetailJson
): { label: string; value: string }[] {
  const points: { label: string; value: string }[] = [];
  if (json.employer?.name?.trim())
    points.push({ label: "Arbeidsgiver", value: json.employer.name.trim() });
  if (json.engagementtype?.trim())
    points.push({
      label: "Ansettelsesform",
      value: json.engagementtype.trim(),
    });
  const formattedDue = formatApplicationDue(json.applicationDue);
  if (formattedDue) points.push({ label: "Søknadsfrist", value: formattedDue });
  if (json.workLocations?.length) {
    const locations = json.workLocations
      .map((l) => [l.city, l.county, l.municipal].filter(Boolean).join(", "))
      .filter(Boolean);
    if (locations.length) {
      points.push({ label: "Sted", value: locations.join("; ") });
    }
    const counties = [
      ...new Set(
        json.workLocations.map((l) => l.county).filter(Boolean)
      ),
    ].filter(Boolean) as string[];
    if (counties.length) {
      points.push({ label: "Fylke", value: counties.join(", ") });
    }
  }
  return points;
}

/** Strips HTML and normalizes to plain text with paragraph breaks. */
function htmlToPlainText(html: string): string {
  if (!html?.trim()) return "";
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
  return text.replace(/\n{3,}/g, "\n\n");
}

function VacancyContent() {
  const searchParams = useSearchParams();
  const path = searchParams.get("path");
  const [data, setData] = useState<NavJobDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path?.trim()) {
      setError("Mangler sti til stilling");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    const pathSegments = path.trim().split("/").filter(Boolean);
    const apiPath = pathSegments.map(encodeURIComponent).join("/");
    fetch(`/api/nav/job/${apiPath}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error("Ikke tilgang til stillingen");
          if (res.status === 404) throw new Error("Stillingen ble ikke funnet");
          throw new Error("Kunne ikke hente stillingen");
        }
        return res.json();
      })
      .then((body: NavJobDetailResponse) => {
        if (!cancelled) setData(body);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-4 h-9 w-32" />
        <Skeleton className="mb-2 h-8 w-3/4" />
        <Skeleton className="mb-6 h-5 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til stillingsliste
        </Link>
        <Card className="mt-6">
          <CardContent className="py-10 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/jobs">Tilbake til stillinger</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const json = (data?.json ?? data?.ad_content) as NavJobDetailJson | undefined;

  if (!json) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til stillingsliste
        </Link>
        <Card className="mt-6">
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Ingen stillingsdetaljer tilgjengelig.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/jobs">Tilbake til stillinger</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const applicationUrl =
    json.url ?? json.sourceUrl ?? (data as { url?: string }).url;
  const applicationClosed = !isApplicationOpen(json.applicationDue);
  const plainDescription = htmlToPlainText(json.description ?? "");
  const keyPoints = buildKeyPointsFromNav(json);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Tilbake til stillingsliste
      </Link>

      {applicationClosed && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Søknadsfristen for denne stillingen er utløpt.
        </p>
      )}

      <Card className="mt-6">
        <CardHeader>
          {json.employer?.name && (
            <p className="text-sm font-medium text-muted-foreground">
              {json.employer.name}
            </p>
          )}
          <CardTitle className="text-2xl leading-tight">
            {json.title ?? "Stilling"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {keyPoints.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-base font-semibold">Nøkkelpunkter</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {keyPoints.map(({ label, value }) => (
                  <li key={label}>
                    <span className="font-medium text-foreground">{label}:</span>{" "}
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-5">
            <h2 className="text-base font-semibold">Sammendrag</h2>
            <JobSummaryContent
              summaryText={plainDescription || "Ingen beskrivelse tilgjengelig."}
            />
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <h2 className="text-base font-semibold">Informasjon fra NAV</h2>
            <dl className="grid gap-1 text-sm sm:grid-cols-2">
              {json.employer?.name && (
                <>
                  <dt className="font-medium text-foreground">Arbeidsgiver</dt>
                  <dd className="text-muted-foreground">{json.employer.name}</dd>
                </>
              )}
              {json.applicationDue && (
                <>
                  <dt className="font-medium text-foreground">Søknadsfrist</dt>
                  <dd className="text-muted-foreground">
                    {new Date(json.applicationDue).toLocaleDateString("nb-NO")}
                  </dd>
                </>
              )}
              {json.engagementtype && (
                <>
                  <dt className="font-medium text-foreground">Ansettelsesform</dt>
                  <dd className="text-muted-foreground">{json.engagementtype}</dd>
                </>
              )}
              {json.workLocations?.length ? (
                <>
                  <dt className="font-medium text-foreground">Sted</dt>
                  <dd className="text-muted-foreground">
                    {json.workLocations
                      .map((l) =>
                        [l.city, l.county, l.municipal].filter(Boolean).join(", ")
                      )
                      .filter(Boolean)
                      .join("; ") || "—"}
                  </dd>
                </>
              ) : null}
            </dl>
          </div>

          <div className="pt-2">
            {applicationUrl && !applicationClosed ? (
              <>
                <Button asChild className="gap-2">
                  <a
                    href={applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Søk på stillingen
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Åpner annonsen på NAV i ny fane
                </p>
              </>
            ) : (
              <>
                <Button asChild className="gap-2">
                  <a
                    href={`https://arbeidsplassen.nav.no/stillinger?q=${encodeURIComponent([json.title, json.employer?.name].filter(Boolean).join(" "))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Søk på stillingen
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Åpner NAV Arbeidsplassen med søk etter stillingen
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JobVacancyPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <Skeleton className="mb-4 h-9 w-32" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <VacancyContent />
    </Suspense>
  );
}
