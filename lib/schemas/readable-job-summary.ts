import { z } from "zod";

export const readableSummarySectionSchema = z.object({
  title: z
    .string()
    .describe(
      "Tittel på norsk, f.eks. Arbeidsoppgaver, Kvalifikasjoner, Hva vi tilbyr, Om rollen",
    ),
  kind: z
    .enum(["paragraph", "bullets"])
    .describe(
      "paragraph = én eller to sammenhengende avsnitt (bruk ett element i lines per avsnitt). bullets = punktliste, ett punkt per linje.",
    ),
  lines: z
    .array(z.string())
    .min(1)
    .max(12)
    .describe("Innhold: for paragraph 1–2 korte avsnitt; for bullets 3–8 korte punkter uten innledningstegn."),
});

export const readableSummarySchema = z.object({
  sections: z
    .array(readableSummarySectionSchema)
    .min(3)
    .max(6)
    .describe(
      "Minst tre seksjoner når annonsen har innhold. Typisk rekkefølge: Arbeidsoppgaver (paragraph), Kvalifikasjoner (bullets), Hva vi tilbyr (bullets). Legg til Om arbeidsgiveren el.l. kun hvis det er tydelig i kilden.",
    ),
});

export type ReadableSummarySection = z.infer<typeof readableSummarySectionSchema>;
export type ReadableSummaryPayload = z.infer<typeof readableSummarySchema>;
