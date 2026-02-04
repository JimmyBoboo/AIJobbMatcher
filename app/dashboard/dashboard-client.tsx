"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CVUpload } from "@/components/cv-upload";
import { CvDataView } from "@/components/cv-data-view";
import { RelevantJobsSection } from "@/components/relevant-jobs-section";
import { Button } from "@/components/ui/button";
import type { CVData } from "@/lib/schemas/cv";

export function DashboardClient() {
  const { data: session, status } = useSession();
  const [parsedCV, setParsedCV] = useState<CVData | null>(null);
  const [cvLoading, setCvLoading] = useState(true);

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

  const displayName = session?.user?.name ?? session?.user?.email ?? "Bruker";

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
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground">Logget inn som {displayName}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/jobs">Se alle stillinger</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col gap-6">
          {cvLoading && (
            <p className="text-muted-foreground text-sm">Laster CV…</p>
          )}
          {!cvLoading && parsedCV && (
            <>
              <CvDataView cvData={parsedCV} title="Din CV" />
              <CVUpload onParsed={handleCVParsed} compact />
            </>
          )}
          {!cvLoading && !parsedCV && (
            <CVUpload onParsed={handleCVParsed} />
          )}
        </div>

        <div className="lg:min-w-0">
          <RelevantJobsSection cvData={parsedCV ?? null} />
        </div>
      </div>
    </div>
  );
}
