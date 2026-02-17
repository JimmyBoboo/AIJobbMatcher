"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";

const absoluteDateOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

function parseDate(value: string | undefined | null): Date | null {
  if (value == null || String(value).trim() === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatApplicationDue(value: string | undefined | null): string | null {
  const date = parseDate(value);
  if (date) return date.toLocaleDateString("nb-NO", absoluteDateOptions);
  return value && String(value).trim() ? value : null;
}

const RECENT_DAYS = 7;

function formatPublished(value: string | undefined | null): string | null {
  const date = parseDate(value);
  if (!date) return value && String(value).trim() ? value : null;
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysDiff >= 0 && daysDiff <= RECENT_DAYS) {
    const rtf = new Intl.RelativeTimeFormat("nb-NO", { style: "long" });
    return rtf.format(-daysDiff, "day");
  }
  return date.toLocaleDateString("nb-NO", absoluteDateOptions);
}

const SUMMARY_MAX_LENGTH = 500;

function truncateSummary(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= SUMMARY_MAX_LENGTH) return trimmed;
  const cut = trimmed.slice(0, SUMMARY_MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > SUMMARY_MAX_LENGTH / 2 ? cut.slice(0, lastSpace) + "…" : cut + "…";
}

function buildKeyPoints(job: PineconeJobRecord): { label: string; value: string }[] {
  const formattedDue = formatApplicationDue(job.application_due);
  const formattedPublished = formatPublished(job.published);
  const points: { label: string; value: string }[] = [];
  if (job.occupation?.trim()) points.push({ label: "Stillingstype", value: job.occupation.trim() });
  if (job.location?.trim()) points.push({ label: "Sted", value: job.location.trim() });
  if (job.county?.trim()) points.push({ label: "Fylke", value: job.county.trim() });
  if (job.engagement_type?.trim()) points.push({ label: "Ansettelsesform", value: job.engagement_type.trim() });
  if (formattedDue) points.push({ label: "Søknadsfrist", value: formattedDue });
  if (formattedPublished) points.push({ label: "Publisert", value: formattedPublished });
  return points;
}

function buildGeneratedSummary(job: PineconeJobRecord): string {
  const formattedDue = formatApplicationDue(job.application_due);
  const parts: string[] = [];
  if (job.employer?.trim()) {
    const rest: string[] = [];
    if (job.occupation?.trim()) rest.push(job.occupation);
    if (job.location?.trim()) rest.push(`i ${job.location}`);
    if (rest.length > 0) {
      parts.push(`${job.employer.trim()} søker ${rest.join(" ")}.`);
    } else {
      parts.push(`${job.employer.trim()} tilbyr denne stillingen.`);
    }
  }
  if (job.engagement_type?.trim()) parts.push(`${job.engagement_type}.`);
  if (formattedDue) parts.push(`Søknadsfrist: ${formattedDue}.`);
  return parts.join(" ");
}

interface JobSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: PineconeJobRecord | null;
}

export function JobSummaryDialog({
  open,
  onOpenChange,
  job,
}: JobSummaryDialogProps) {
  if (!job) return null;

  const keyPoints = buildKeyPoints(job);
  const hasContent = job.content != null && job.content.trim() !== "";
  const summary =
    hasContent
      ? truncateSummary(job.content!)
      : buildGeneratedSummary(job) || "Se hele annonsen for mer informasjon.";

  function handleShowFullAd() {
    if (job?.source_url) {
      window.open(job.source_url, "_blank", "noopener,noreferrer");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="gap-1 pr-8">
          <p className="text-sm font-medium text-muted-foreground">
            {job.employer}
          </p>
          <DialogTitle className="text-left text-base leading-tight">
            {job.title}
          </DialogTitle>
        </DialogHeader>

        {keyPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Nøkkelpunkter</h4>
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

        <div className="space-y-1.5">
          <h4 className="text-sm font-medium text-foreground">Sammendrag</h4>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
            {summary}
          </p>
        </div>

        <DialogFooter className="flex justify-end sm:justify-end">
          <Button onClick={handleShowFullAd} className="gap-2">
            Vis hele annonsen
            <ExternalLink className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
