import { z } from "zod";
import { COUNTIES } from "@/lib/job-match-filters";

const ENGAGEMENT_VALUES = [
  "",
  "Heltid",
  "Deltid",
  "Vikariat",
  "Sommerjobb",
  "Praktikk",
] as const;

export const jobMatchChatOutputSchema = z.object({
  searchQuery: z
    .string()
    .describe(
      "Norsk semantisk søkestreng til Pinecone, 5–14 ord: stillingstype + nøkkelferdigheter/område. Kombiner CV og brukerens ønske. Ikke stedsnavn her.",
    ),
  countyFilter: z
    .string()
    .describe(
      `Geografi: "USE_CV" hvis bruker ikke nevner sted/fylke (bruk da CV-bosted som filter). "ANY" for hele Norge. Ellers ett fylke nøyaktig: ${COUNTIES.join(", ")}.`,
    ),
  engagementType: z
    .enum(ENGAGEMENT_VALUES)
    .describe(
      "Stillingsform fra brukerens melding. Tom streng hvis ikke nevnt eller irrelevant.",
    ),
  replyToUser: z
    .string()
    .describe(
      "Én kort, vennlig setning på norsk som bekrefter hva du søker etter (maks ~25 ord).",
    ),
});

export type JobMatchChatOutput = z.infer<typeof jobMatchChatOutputSchema>;

export function normalizeCountyFilter(raw: string): "USE_CV" | "ANY" | string {
  const t = raw.trim().toUpperCase().replace(/\s+/g, " ");
  if (t === "USE_CV" || t === "USE CV") return "USE_CV";
  if (t === "ANY" || t === "ALLE" || t === "HELE NORGE" || t === "HELE LANDET") {
    return "ANY";
  }
  const hit = COUNTIES.find(
    (c) => c.toUpperCase() === t || c.toUpperCase().replace(/\s/g, " ") === t,
  );
  return hit ?? "USE_CV";
}
