"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";
import { JobSummaryContent } from "@/components/job-summary-content";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReadableSummarySection } from "@/lib/schemas/readable-job-summary";

interface JobPineconeSummaryProps {
  fullText: string;
  /** Pinecone job id when available; otherwise send fullText + metadata. */
  jobId?: string;
  title?: string;
  employer?: string;
  occupation?: string;
  location?: string;
}

export function JobPineconeSummary({
  fullText,
  jobId,
  title,
  employer,
  occupation,
  location,
}: JobPineconeSummaryProps) {
  const { status } = useSession();
  const [sections, setSections] = useState<ReadableSummarySection[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const trimmedText = fullText.trim();
    const trimmedJobId = jobId?.trim();
    if (!trimmedJobId && (!trimmedText || !title?.trim())) return;

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    const body: Record<string, string | undefined> = {
      fullText: trimmedText || undefined,
      title: title?.trim() || undefined,
      employer: employer?.trim() || undefined,
      occupation: occupation?.trim() || undefined,
      location: location?.trim() || undefined,
    };
    if (trimmedJobId) body.jobId = trimmedJobId;

    fetch("/api/jobs/readable-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data: unknown = await res.json();
        if (!res.ok) throw new Error("fetch failed");
        const parsed = data as { sections?: ReadableSummarySection[] };
        if (cancelled) return;
        setSections(Array.isArray(parsed.sections) ? parsed.sections : []);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setSections([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId, fullText, title, employer, occupation, location, status]);

  const showAiBlock =
    status === "authenticated" && (loading || sections.length >= 2);
  const hasFullText = fullText.trim().length > 0;

  return (
    <div className="space-y-6">
      {status === "authenticated" && loading && (
        <div className="space-y-6 rounded-lg border border-primary/15 bg-primary/5 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          {[1, 2, 3].map((k) => (
            <div key={k} className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {showAiBlock && !loading && sections.length >= 2 && (
        <div className="space-y-8 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Sparkles
                className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5"
                aria-hidden
              />
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                KI - Generert sammendrag
              </h3>
            </div>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <section
                key={`${section.title}-${section.lines[0]?.slice(0, 20) ?? ""}`}
                className="space-y-3"
              >
                <h4 className="text-base font-semibold text-foreground">
                  {section.title}
                </h4>
                {section.kind === "paragraph" ? (
                  <div className="space-y-3">
                    {section.lines.map((line, i) => (
                      <p
                        key={i}
                        className="text-[15px] leading-7 text-foreground/90"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ) : (
                  <ul className="list-none space-y-2.5 pl-0">
                    {section.lines.map((line, i) => (
                      <li
                        key={i}
                        className="relative pl-4 text-[15px] leading-7 text-foreground/90 before:absolute before:left-0 before:top-[0.55em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary/65"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <p className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
            Sammendraget er generert av KI ut fra tilgjengelig annonsetekst. Les
            alltid full annonse og opplysninger hos NAV før du søker.
          </p>
        </div>
      )}

      {status === "authenticated" && failed && !loading && (
        <p className="text-xs text-muted-foreground">
          Kunne ikke lage automatisk oppsummering akkurat nå. Full annonsetekst
          vises under.
        </p>
      )}

      {status === "unauthenticated" && (
        <p className="text-xs text-muted-foreground">
          Logg inn for et strukturert KI-sammendrag av stillingen. Full tekst
          vises under.
        </p>
      )}

      {hasFullText ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Full annonsetekst
          </h3>
          <JobSummaryContent variant="pinecone" summaryText={fullText} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Ingen lengre beskrivelse er tilgjengelig for denne stillingen. Bruk
          «Søk på stillingen» for mer hos NAV.
        </p>
      )}
    </div>
  );
}
