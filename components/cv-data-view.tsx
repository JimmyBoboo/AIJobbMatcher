"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, MapPin, User } from "lucide-react";
import type { CVData } from "@/lib/schemas/cv";

interface CvDataViewProps {
  cvData: CVData;
  title?: string;
  actions?: ReactNode;
}

export function CvDataView({
  cvData,
  title = "Din CV",
  actions,
}: CvDataViewProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight">
              {cvData.personalInfo.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {cvData.personalInfo.location && (
                <span className="inline-flex items-center gap-0.5">
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
        {actions && (
          <div className="shrink-0 border-l pl-3">{actions}</div>
        )}
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
        </div>
      )}
    </div>
  );
}
