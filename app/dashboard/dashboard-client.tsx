"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CVUpload } from "@/components/cv-upload";
import { CvDataView } from "@/components/cv-data-view";
import { MatchedJobs } from "@/components/matched-jobs";
import type { CVData } from "@/lib/schemas/cv";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";

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
    return <p className="mt-4 text-muted-foreground">Laster…</p>;
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
      {cvLoading && (
        <p className="text-muted-foreground text-sm">Laster CV…</p>
      )}
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
