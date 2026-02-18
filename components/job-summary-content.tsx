import { parseSummaryIntoParts } from "@/lib/format-job";
import { cn } from "@/lib/utils";

const baseTextClass = "text-sm text-muted-foreground leading-relaxed";

interface JobSummaryContentProps {
  summaryText: string;
  className?: string;
}

export function JobSummaryContent({
  summaryText,
  className,
}: JobSummaryContentProps) {
  const parts = parseSummaryIntoParts(summaryText);

  if (parts.length === 0) {
    const fallback = summaryText.trim();
    return (
      <p className={cn(baseTextClass, className)}>
        {fallback || "Ingen sammendrag tilgjengelig."}
      </p>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {parts.map((part, index) => {
        if (part.type === "paragraph") {
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
          <div
            key={index}
            className="space-y-3 border-t border-border pt-6 [&:first-child]:border-t-0 [&:first-child]:pt-0"
          >
            <h4 className="text-sm font-semibold text-foreground">
              {part.title}
            </h4>
            <div className="space-y-4">
              {sectionParagraphs.map((para, i) => {
                const lines = para.split(/\n/).map((l) => l.trim()).filter(Boolean);
                const bulletLines = lines.filter((l) => /^[–\-*]\s/.test(l));
                const useList = bulletLines.length >= 2 || (lines.length >= 2 && bulletLines.length >= 1);
                if (useList && bulletLines.length > 0) {
                  const items = lines.map((l) => l.replace(/^[–\-*]\s*/, "").trim()).filter(Boolean);
                  return (
                    <ul key={i} className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground leading-relaxed">
                      {items.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className={cn(baseTextClass, "mb-0")}>
                    {para}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
