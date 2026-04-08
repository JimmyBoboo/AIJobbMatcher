"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, FileDown, MapPin, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { downloadCvPdf } from "@/lib/cv-to-pdf";
import type { CVData } from "@/lib/schemas/cv";

interface CvDataViewProps {
  cvData: CVData;
  title?: string;
  actions?: ReactNode;
  /** Profile image URL (e.g. from /api/profile/avatar). When set, shown instead of the User icon. */
  profileImageUrl?: string | null;
  /** Display name for avatar fallback initials when no image. */
  profileDisplayName?: string | null;
  /** Når satt, brukes denne i stedet for standard PDF-generering fra strukturerte data. */
  onDownloadPdf?: () => void | Promise<void>;
  /** Når false, vises ikke «Last ned som PDF» (f.eks. på dashboard). Standard: true. */
  showPdfDownload?: boolean;
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function CvDataView({
  cvData,
  title = "Din CV",
  actions,
  profileImageUrl,
  profileDisplayName,
  onDownloadPdf,
  showPdfDownload = true,
}: CvDataViewProps) {
  const [expanded, setExpanded] = useState(false);
  const showAvatar = profileImageUrl != null || profileDisplayName != null;
  const displayName = profileDisplayName ?? cvData.personalInfo.name ?? "";

  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {showAvatar ? (
            <Avatar className="h-8 w-8 shrink-0">
              {profileImageUrl && (
                <AvatarImage src={profileImageUrl} alt={displayName} />
              )}
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">
              {cvData.personalInfo.name}
            </p>
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              {cvData.personalInfo.location && (
                <span className="inline-flex shrink-0 items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {cvData.personalInfo.location}
                </span>
              )}
              {cvData.skills.length > 0 && (
                <span className="hidden truncate sm:inline">
                  {cvData.skills.slice(0, 3).join(", ")}
                  {cvData.skills.length > 3 &&
                    ` +${cvData.skills.length - 3}`}
                </span>
              )}
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3">
          {showPdfDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onDownloadPdf) {
                  void onDownloadPdf();
                } else {
                  downloadCvPdf(cvData);
                }
              }}
              className="gap-1.5"
            >
              <FileDown className="h-3.5 w-3.5" />
              Last ned som PDF
            </Button>
          )}
          {actions}
        </div>
      </div>

      {expanded && (
        <div className="flex flex-col gap-3 border-t px-4 py-3">
          {cvData.summary && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                Sammendrag
              </h4>
              <p className="text-sm">{cvData.summary}</p>
            </div>
          )}

          {cvData.experience.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                Erfaring ({cvData.experience.length})
              </h4>
              <ul className="mt-1 space-y-0.5">
                {cvData.experience.slice(0, 5).map((exp, i) => (
                  <li key={i} className="text-sm">
                    {exp.title} @ {exp.company}
                  </li>
                ))}
                {cvData.experience.length > 5 && (
                  <li className="text-xs text-muted-foreground">
                    +{cvData.experience.length - 5} mer
                  </li>
                )}
              </ul>
            </div>
          )}

          {cvData.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                Ferdigheter
              </h4>
              <div className="mt-1 flex flex-wrap gap-1">
                {cvData.skills.slice(0, 12).map((skill, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {skill}
                  </span>
                ))}
                {cvData.skills.length > 12 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    +{cvData.skills.length - 12}
                  </span>
                )}
              </div>
            </div>
          )}

          {cvData.additionalInfo?.trim() && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">
                Tilleggsinformasjon
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {cvData.additionalInfo.trim()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
