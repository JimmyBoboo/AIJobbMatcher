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
import { ArrowLeft } from "lucide-react";
import type { NavJobDetailResponse, NavJobDetailJson } from "@/lib/schemas/job-feed";

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

  const plainDescription = htmlToPlainText(json.description ?? "");
  const descriptionParagraphs = plainDescription
    ? plainDescription
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

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
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <h2 className="text-base font-semibold">Informasjon fra NAV</h2>
            {plainDescription ? (
              <div className="space-y-3">
                {descriptionParagraphs.length > 0 ? (
                  descriptionParagraphs.map((para, i) => (
                    <p
                      key={i}
                      className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
                    >
                      {para}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {plainDescription}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ingen beskrivelse tilgjengelig.
              </p>
            )}
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
