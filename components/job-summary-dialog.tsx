"use client";

import Link from "next/link";
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
import { buildKeyPoints, getSummaryForPreview } from "@/lib/format-job";
import { JobSummaryContent } from "@/components/job-summary-content";

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
  const summaryText = getSummaryForPreview(job, 700);

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

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">Sammendrag</h4>
          <JobSummaryContent summaryText={summaryText} />
        </div>

        <DialogFooter className="flex justify-end sm:justify-end">
          <Button asChild className="gap-2">
            <Link href={`/jobs/${encodeURIComponent(job._id)}`} onClick={() => onOpenChange(false)}>
              Vis hele annonsen
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
