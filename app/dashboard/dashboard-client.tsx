"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CVUpload } from "@/components/cv-upload";
import { CvDataView } from "@/components/cv-data-view";
import { MatchedJobs } from "@/components/matched-jobs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import type { CVData } from "@/lib/schemas/cv";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";

function CvDataViewSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
        </div>
        <div className="shrink-0 border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3">
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}

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
  const [cvLoading, setCvLoading] = useState(true);

  const [matchedJobs, setMatchedJobs] = useState<PineconeJobRecord[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchJobMatches = useCallback(async (cvData: CVData) => {
    setMatchLoading(true);
    setMatchError(null);
    try {
      const res = await fetch("/api/jobs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Kunne ikke hente jobbmatcher");
      }
      const data = await res.json();
      setMatchedJobs(data.matches ?? []);
      setHasSearched(true);
    } catch (e) {
      setMatchError(
        e instanceof Error ? e.message : "Kunne ikke hente jobbmatcher"
      );
    } finally {
      setMatchLoading(false);
    }
  }, []);

  useEffect(() => {
    async function hentCv() {
      try {
        const res = await fetch("/api/cv");
        if (!res.ok) return;
        const data = await res.json();
        if (data.cvData && typeof data.cvData === "object") {
          setParsedCV(data.cvData as CVData);
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

  if (status === "loading") {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <CvDataViewSkeleton />
        <MatchedJobsCardSkeleton />
      </div>
    );
  }

  const handleCVParsed = async (data: CVData) => {
    setParsedCV(data);
    try {
      const res = await fetch("/api/cv/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvData: data }),
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
            actions={<CVUpload onParsed={handleCVParsed} compact />}
          />
          <MatchedJobs
            matches={matchedJobs}
            isLoading={matchLoading}
            error={matchError}
            hasSearched={hasSearched}
            onSearch={() => fetchJobMatches(parsedCV)}
          />
        </>
      )}
      {!cvLoading && !parsedCV && <CVUpload onParsed={handleCVParsed} />}
    </div>
  );
}
