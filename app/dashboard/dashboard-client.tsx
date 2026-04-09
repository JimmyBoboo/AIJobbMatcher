"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AiCvCard } from "@/components/ai-cv-card";
import { CVUpload } from "@/components/cv-upload";
import { CvDataView } from "@/components/cv-data-view";
import { CvDataViewSkeleton } from "@/components/cv-data-view-skeleton";
import { MatchedJobs } from "@/components/matched-jobs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { CVData } from "@/lib/schemas/cv";
import {
  pineconeJobRecordSchema,
  type PineconeJobRecord,
} from "@/lib/schemas/job-feed";
import type { JobMatchSearchResult } from "@/components/job-match-chat";
import { z } from "zod";

const matchedJobsResponseSchema = z.object({
  matches: z.array(pineconeJobRecordSchema),
  savedAt: z.string().optional(),
});

function MatchedJobsCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex flex-col gap-2 text-center">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mx-auto h-3 w-72" />
        </div>
        <Skeleton className="h-10 w-48 rounded-md" />
      </CardContent>
    </Card>
  );
}

export function DashboardClient() {
  const { data: session, status } = useSession();
  const [parsedCV, setParsedCV] = useState<CVData | null>(null);
  const [cvFileHash, setCvFileHash] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(true);

  const [matchedJobs, setMatchedJobs] = useState<PineconeJobRecord[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(
    null,
  );

  const fetchJobMatches = useCallback(
    async (
      cvData: CVData,
      opts?: { chatMessage?: string },
    ): Promise<JobMatchSearchResult> => {
      setMatchLoading(true);
      setMatchError(null);
      try {
        const body: Record<string, unknown> = { cvData };
        if (opts?.chatMessage?.trim()) {
          body.chatMessage = opts.chatMessage.trim();
        } else {
          body.county = "ANY";
        }
        const res = await fetch("/api/jobs/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Kunne ikke hente jobbmatcher");
        }
        const data = await res.json();
        const matches = data.matches ?? [];
        setMatchedJobs(matches);
        setHasSearched(true);
        return {
          searchQuery:
            typeof data.searchQuery === "string" ? data.searchQuery : "",
          replyToUser:
            typeof data.replyToUser === "string"
              ? data.replyToUser
              : undefined,
        };
      } catch (e) {
        setMatchError(
          e instanceof Error ? e.message : "Kunne ikke hente jobbmatcher",
        );
        throw e;
      } finally {
        setMatchLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    async function hentCv() {
      try {
        const res = await fetch("/api/cv");
        if (!res.ok) return;
        const data = await res.json();
        if (data.cvData && typeof data.cvData === "object") {
          setParsedCV(data.cvData as CVData);
        }
        if (typeof data.cvFileHash === "string") {
          setCvFileHash(data.cvFileHash);
        } else {
          setCvFileHash(null);
        }
      } catch {
        // Ignorer feil ved henting
      } finally {
        setCvLoading(false);
      }
    }
    if (status === "authenticated") hentCv();
    else if (status !== "loading") setCvLoading(false);
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    async function loadMatchedJobs() {
      try {
        const res = await fetch("/api/jobs/matched");
        if (!res.ok || cancelled) return;
        const data: unknown = await res.json();
        const result = matchedJobsResponseSchema.safeParse(data);
        if (!result.success || result.data.matches.length === 0) return;
        setMatchedJobs(result.data.matches);
        setHasSearched(true);
      } catch {
        // Ignore fetch/parse errors
      }
    }
    loadMatchedJobs();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            name?: string | null;
            profile?: { profileImageUrl?: string };
          } | null,
        ) => {
          if (cancelled || !data) return;
          setProfileDisplayName(data.name ?? null);
          setProfileImageUrl(data.profile?.profileImageUrl ?? null);
        },
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading") {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <CvDataViewSkeleton />
        <MatchedJobsCardSkeleton />
      </div>
    );
  }

  const handleCVParsed = async (data: CVData, fileHash?: string) => {
    setParsedCV(data);
    if (fileHash) setCvFileHash(fileHash);
    try {
      const body: { cvData: CVData; fileHash?: string } = { cvData: data };
      if (fileHash !== undefined) body.fileHash = fileHash;
      const res = await fetch("/api/cv/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Kunne ikke lagre CV til Firestore:", err);
      }
    } catch (e) {
      console.error("Kunne ikke lagre CV til Firestore:", e);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      {cvLoading && <CvDataViewSkeleton />}
      {!cvLoading && parsedCV && (
        <>
          <CvDataView
            cvData={parsedCV}
            showPdfDownload={false}
            profileImageUrl={profileImageUrl}
            profileDisplayName={
              profileDisplayName ??
              session?.user?.name ??
              session?.user?.email ??
              null
            }
            actions={
              <CVUpload
                onParsed={handleCVParsed}
                compact
                existingCvData={parsedCV}
                existingFileHash={cvFileHash}
              />
            }
          />
          <MatchedJobs
            matches={matchedJobs}
            isLoading={matchLoading}
            error={matchError}
            hasSearched={hasSearched}
            onSearch={(opts) => fetchJobMatches(parsedCV, opts)}
          />
        </>
      )}
      {!cvLoading && !parsedCV && (
        <div className="grid gap-4 sm:grid-cols-2">
          <AiCvCard />
          <CVUpload onParsed={handleCVParsed} />
        </div>
      )}
    </div>
  );
}
