"use client";

import { useId, useMemo, useState } from "react";
import { parseSummaryIntoParts } from "@/lib/format-job";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const COLLAPSE_CHARS = 720;

function truncateAtSentence(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen);
  const lastSentence = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  );
  const cut = lastSentence > maxLen * 0.45 ? lastSentence + 1 : maxLen;
  return text.slice(0, cut).trim();
}

function ExpandableBody({
  text,
  variant,
}: {
  text: string;
  variant: "default" | "pinecone";
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const needsToggle = text.length > COLLAPSE_CHARS;
  const preview = useMemo(
    () => (needsToggle ? truncateAtSentence(text, COLLAPSE_CHARS) : text),
    [text, needsToggle],
  );

  const bodyClass =
    variant === "pinecone"
      ? "text-[15px] leading-7 text-foreground/90"
      : "text-sm text-muted-foreground leading-relaxed";

  if (!needsToggle) {
    return <p className={cn(bodyClass, "mb-0 whitespace-pre-wrap")}>{text}</p>;
  }

  return (
    <div className="space-y-2">
      <p className={cn(bodyClass, "mb-0 whitespace-pre-wrap")} id={`${id}-preview`}>
        {open ? text : `${preview}…`}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto px-0 py-1 text-xs font-medium text-primary"
        aria-expanded={open}
        aria-controls={`${id}-preview`}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Vis mindre" : "Vis hele avsnittet"}
      </Button>
    </div>
  );
}

interface JobSummaryContentProps {
  summaryText: string;
  className?: string;
  /** Pinecone / indeksert annonse: større type, luft, «vis mer» på lange blokker. */
  variant?: "default" | "pinecone";
}

export function JobSummaryContent({
  summaryText,
  className,
  variant = "default",
}: JobSummaryContentProps) {
  const parts = parseSummaryIntoParts(summaryText);

  const baseTextClass =
    variant === "pinecone"
      ? "text-[15px] leading-7 text-foreground/90 whitespace-pre-wrap"
      : "text-sm text-muted-foreground leading-relaxed";

  if (parts.length === 0) {
    const fallback = summaryText.trim();
    if (!fallback) {
      return (
        <p className={cn(baseTextClass, className)}>
          Ingen sammendrag tilgjengelig.
        </p>
      );
    }
    if (variant === "pinecone") {
      return (
        <div className={cn(className)}>
          <ExpandableBody text={fallback} variant="pinecone" />
        </div>
      );
    }
    return (
      <p className={cn(baseTextClass, className)}>
        {fallback || "Ingen sammendrag tilgjengelig."}
      </p>
    );
  }

  const sectionGap =
    variant === "pinecone" ? "space-y-6 border-t border-border/80 pt-6 mt-6" : "space-y-3 border-t border-border pt-6 mt-6";
  const titleClass =
    variant === "pinecone"
      ? "text-lg font-semibold tracking-tight text-foreground"
      : "text-base font-semibold text-foreground";

  return (
    <div className={cn(variant === "pinecone" ? "space-y-2" : "space-y-8", className)}>
      {parts.map((part, index) => {
        if (part.type === "paragraph") {
          if (variant === "pinecone") {
            return (
              <div key={index} className="rounded-md bg-muted/25 px-3 py-3 sm:px-4">
                <ExpandableBody text={part.content} variant="pinecone" />
              </div>
            );
          }
          return (
            <p key={index} className={cn(baseTextClass, "mb-0")}>
              {part.content}
            </p>
          );
        }
        const sectionParagraphs = part.content
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter(Boolean);
        return (
          <section
            key={index}
            className={cn(
              sectionGap,
              "first:border-t-0 first:pt-0 first:mt-0",
            )}
          >
            <h3 className={titleClass}>{part.title}</h3>
            <div className={variant === "pinecone" ? "space-y-5" : "space-y-4"}>
              {sectionParagraphs.map((para, i) => {
                const lines = para
                  .split(/\n/)
                  .map((l) => l.trim())
                  .filter(Boolean);
                const bulletLines = lines.filter((l) => /^[–\-*]\s/.test(l));
                const useList =
                  bulletLines.length >= 2 ||
                  (lines.length >= 2 && bulletLines.length >= 1);
                if (useList && bulletLines.length > 0) {
                  const items = lines
                    .map((l) => l.replace(/^[–\-*]\s*/, "").trim())
                    .filter(Boolean);
                  return (
                    <ul
                      key={i}
                      className={cn(
                        "list-disc space-y-2 pl-5",
                        variant === "pinecone"
                          ? "text-[15px] leading-7 text-foreground/90"
                          : "space-y-1.5 text-sm text-muted-foreground leading-relaxed",
                      )}
                    >
                      {items.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                if (variant === "pinecone") {
                  return (
                    <ExpandableBody key={i} text={para} variant="pinecone" />
                  );
                }
                return (
                  <p key={i} className={cn(baseTextClass, "mb-0")}>
                    {para}
                  </p>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
