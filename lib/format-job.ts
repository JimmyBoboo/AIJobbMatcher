import type { PineconeJobRecord } from "@/lib/schemas/job-feed";

const absoluteDateOptions: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

export function parseDate(value: string | undefined | null): Date | null {
  if (value == null || String(value).trim() === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatApplicationDue(
  value: string | undefined | null
): string | null {
  const date = parseDate(value);
  if (date) return date.toLocaleDateString("nb-NO", absoluteDateOptions);
  return value && String(value).trim() ? value : null;
}

const RECENT_DAYS = 7;

export function formatPublished(
  value: string | undefined | null
): string | null {
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

export function buildKeyPoints(
  job: PineconeJobRecord
): { label: string; value: string }[] {
  const formattedDue = formatApplicationDue(job.application_due);
  const formattedPublished = formatPublished(job.published);
  const points: { label: string; value: string }[] = [];
  if (job.occupation?.trim())
    points.push({ label: "Stillingstype", value: job.occupation.trim() });
  if (job.location?.trim())
    points.push({ label: "Sted", value: job.location.trim() });
  if (job.county?.trim())
    points.push({ label: "Fylke", value: job.county.trim() });
  if (job.engagement_type?.trim())
    points.push({
      label: "Ansettelsesform",
      value: job.engagement_type.trim(),
    });
  const extentVal = job.extent != null ? String(job.extent).trim() : "";
  if (extentVal && extentVal.toLowerCase() !== "null")
    points.push({ label: "Omfang", value: extentVal });
  if (formattedDue)
    points.push({ label: "Søknadsfrist", value: formattedDue });
  if (formattedPublished)
    points.push({ label: "Publisert", value: formattedPublished });
  return points;
}

export function buildGeneratedSummary(job: PineconeJobRecord): string {
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

export function getJobSummaryText(job: PineconeJobRecord): string {
  const hasContent = job.content != null && job.content.trim() !== "";
  if (hasContent) return job.content!.trim();
  return (
    buildGeneratedSummary(job) || "Se hele annonsen for mer informasjon."
  );
}

const SHORT_SUMMARY_MAX_LENGTH = 180;

/** One short sentence for compact display; no long content. */
export function getShortSummary(job: PineconeJobRecord): string {
  const generated = buildGeneratedSummary(job);
  if (job.content != null && job.content.trim() !== "") {
    const first = job.content.trim().split(/\n\n+/)[0]?.trim() ?? "";
    const oneLine = first.replace(/\n/g, " ").trim();
    if (oneLine.length <= SHORT_SUMMARY_MAX_LENGTH) return oneLine;
    const cut = oneLine.slice(0, SHORT_SUMMARY_MAX_LENGTH);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut) + "…";
  }
  if (generated.length <= SHORT_SUMMARY_MAX_LENGTH) return generated;
  return generated.slice(0, SHORT_SUMMARY_MAX_LENGTH).trim() + "…";
}

/** Truncate summary at word boundary for preview (e.g. popup). */
export function getSummaryForPreview(
  job: PineconeJobRecord,
  maxChars: number
): string {
  const full = getJobSummaryText(job);
  if (full.length <= maxChars) return full;
  const cut = full.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxChars / 2 ? cut.slice(0, lastSpace) : cut) + "…";
}

const SECTION_HEADING_MAX_LENGTH = 80;
const SECTION_LABELS = [
  "arbeidsoppgaver",
  "kvalifikasjoner",
  "om stillingen",
  "om oss",
  "vi tilbyr",
  "vi søker",
  "oppgaver",
  "krav",
  "ansvarsområder",
  "arbeidssted",
  "kontakt",
  "slik fungerer det",
  "om oppdraget",
  "teknisk fokus",
  "hva du lærer",
  "hvem passer dette for",
  "praktisk info",
  "om arbeidsgiveren",
  "krav til deg",
  "hva du vil jobbe med",
  "hvem vi ser etter",
];

function looksLikeSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > SECTION_HEADING_MAX_LENGTH)
    return false;
  if (trimmed.endsWith(":")) return true;
  const lower = trimmed.toLowerCase();
  if (SECTION_LABELS.some((label) => lower === label || lower.startsWith(`${label}:`)))
    return true;
  if (lower.startsWith("om ") && trimmed.length < 60) return true;
  return false;
}

export type SummaryPart =
  | { type: "paragraph"; content: string }
  | { type: "section"; title: string; content: string };

function flushPart(
  parts: SummaryPart[],
  current: { type: "paragraph"; content: string } | { type: "section"; title: string; content: string } | null
): void {
  if (!current) return;
  if (current.type === "paragraph") {
    if (current.content.trim()) parts.push(current);
  } else if (current.content.trim()) {
    parts.push(current);
  }
}

export function parseSummaryIntoParts(text: string): SummaryPart[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\n/).map((l) => l.trim());
  const parts: SummaryPart[] = [];
  let current: { type: "paragraph"; content: string } | { type: "section"; title: string; content: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isEmpty = line.length === 0;

    if (isEmpty) {
      if (current?.type === "paragraph") {
        current = { type: "paragraph" as const, content: current.content + "\n\n" };
      } else if (current?.type === "section") {
        current = { type: "section" as const, title: current.title, content: current.content + "\n\n" };
      }
      continue;
    }

    if (looksLikeSectionHeading(line)) {
      flushPart(parts, current);
      const title = line.replace(/:$/, "").trim();
      const rest: string[] = [];
      i++;
      while (i < lines.length && (lines[i]?.trim() === "" || !looksLikeSectionHeading(lines[i] ?? ""))) {
        if (lines[i]?.trim() !== "") rest.push(lines[i] ?? "");
        i++;
      }
      i--;
      const content = rest.join("\n").trim();
      if (content) parts.push({ type: "section", title, content });
      current = null;
    } else {
      if (current?.type === "paragraph") {
        current = { type: "paragraph", content: current.content + (current.content ? "\n" : "") + line };
      } else if (current?.type === "section") {
        current = { type: "section", title: current.title, content: current.content + (current.content ? "\n" : "") + line };
      } else {
        current = { type: "paragraph", content: line };
      }
    }
  }

  flushPart(parts, current);
  return parts;
}
