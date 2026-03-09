"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { buildKeyPoints, getSummaryForPreview } from "@/lib/format-job";
import { isApplicationOpen } from "@/lib/job-utils";
import { JobSummaryContent } from "@/components/job-summary-content";
import type {
  PineconeJobRecord,
  NavJobDetailResponse,
  NavJobDetailJson,
} from "@/lib/schemas/job-feed";

const NAV_DESC_MAX = 280;

function shortDescription(desc: string | undefined): string {
  if (!desc?.trim()) return "";
  const t = desc.trim().replace(/\s+/g, " ");
  if (t.length <= NAV_DESC_MAX) return t;
  const cut = t.slice(0, NAV_DESC_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut) + "…";
}

export default function JobDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [job, setJob] = useState<PineconeJobRecord | null>(null);
  const [navDetail, setNavDetail] = useState<NavJobDetailJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Mangler stillings-id");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNavDetail(null);
    fetch(`/api/jobs/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Stillingen ble ikke funnet");
          throw new Error("Kunne ikke hente stillingen");
        }
        return res.json();
      })
      .then((data: PineconeJobRecord) => {
        if (!cancelled) setJob(data);
        if (!cancelled && data.nav_feed_path?.trim()) {
          const path = data.nav_feed_path.trim();
          fetch(`/api/nav/job/${path}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((body: NavJobDetailResponse | null) => {
              if (cancelled || !body) return;
              const json = body.json ?? (body.ad_content as NavJobDetailJson) ?? null;
              if (json) setNavDetail(json);
            })
            .catch(() => {});
        }
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
  }, [id]);

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

  if (error || !job) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til jobbliste
        </Link>
        <Card className="mt-6">
          <CardContent className="py-10 text-center">
            <p className="text-destructive">{error ?? "Ukjent feil"}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard">Gå til dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const keyPoints = buildKeyPoints(job);
  const summaryText = getSummaryForPreview(job, 1200);
  const applicationClosed = !isApplicationOpen(job.application_due);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Tilbake til jobbliste
      </Link>

      {applicationClosed && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Søknadsfristen for denne stillingen er utløpt.
        </p>
      )}

      <Card className="mt-6">
        <CardHeader>
          <p className="text-sm font-medium text-muted-foreground">
            {job.employer}
          </p>
          <CardTitle className="text-2xl leading-tight">{job.title}</CardTitle>
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
            <JobSummaryContent summaryText={summaryText} />
          </div>

          {navDetail && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <h2 className="text-base font-semibold">Informasjon fra NAV</h2>
              {navDetail.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {shortDescription(navDetail.description)}
                </p>
              )}
              <dl className="grid gap-1 text-sm sm:grid-cols-2">
                {navDetail.employer?.name && (
                  <>
                    <dt className="font-medium text-foreground">Arbeidsgiver</dt>
                    <dd className="text-muted-foreground">{navDetail.employer.name}</dd>
                  </>
                )}
                {navDetail.applicationDue && (
                  <>
                    <dt className="font-medium text-foreground">Søknadsfrist</dt>
                    <dd className="text-muted-foreground">{navDetail.applicationDue}</dd>
                  </>
                )}
                {navDetail.engagementtype && (
                  <>
                    <dt className="font-medium text-foreground">Ansettelsesform</dt>
                    <dd className="text-muted-foreground">{navDetail.engagementtype}</dd>
                  </>
                )}
                {navDetail.workLocations?.length ? (
                  <>
                    <dt className="font-medium text-foreground">Sted</dt>
                    <dd className="text-muted-foreground">
                      {navDetail.workLocations
                        .map((l) => [l.city, l.county, l.municipal].filter(Boolean).join(", "))
                        .filter(Boolean)
                        .join("; ") || "—"}
                    </dd>
                  </>
                ) : null}
              </dl>
            </div>
          )}

          <div className="pt-2">
            {job.source_url && !applicationClosed ? (
              <>
                <Button asChild className="gap-2">
                  <a
                    href={job.source_url}
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
            ) : job.nav_feed_path ? (
              <>
                <Button asChild className="gap-2">
                  <Link
                    href={`/jobs/v?path=${encodeURIComponent(job.nav_feed_path.trim())}`}
                  >
                    Søk på stillingen
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Åpner stillingssiden med full informasjon og søknadslenke
                </p>
              </>
            ) : (
              <>
                <Button asChild className="gap-2">
                  <a
                    href={`https://arbeidsplassen.nav.no/stillinger?q=${encodeURIComponent([job.title, job.employer].filter(Boolean).join(" "))}`}
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
