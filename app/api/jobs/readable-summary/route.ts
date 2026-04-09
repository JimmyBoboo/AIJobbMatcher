import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { gateway } from "@ai-sdk/gateway";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getFullReadableJobText } from "@/lib/format-job";
import { fetchPineconeJobById } from "@/lib/pinecone-fetch-job";
import { readableSummarySchema } from "@/lib/schemas/readable-job-summary";

const MAX_BODY_CHARS = 8000;

const requestBodySchema = z.object({
  jobId: z.string().min(1, "jobId er påkrevd"),
});

function fallbackSections(
  jobTitle: string,
  employer: string,
  occupation?: string,
  location?: string,
) {
  return {
    sections: [
      {
        title: "Om stillingen",
        kind: "paragraph" as const,
        lines: [
          `${jobTitle} hos ${employer}. Se full annonse og søknadslenke hos NAV for alle detaljer.`,
        ],
      },
      {
        title: "Praktisk",
        kind: "bullets" as const,
        lines: [
          ...(occupation ? [`Fagområde: ${occupation}`] : []),
          ...(location ? [`Sted: ${location}`] : ["Sted og omfang står i den fullstendige annonsen."]),
          "Åpne «Søk på stillingen» nedenfor for komplett informasjon.",
        ].filter((l) => l.length > 0),
      },
      {
        title: "Merk",
        kind: "bullets" as const,
        lines: [
          "Denne stillingen har begrenset tekst i appen.",
          "Bruk alltid kilden (NAV) før du søker.",
        ],
      },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id || typeof token.id !== "string") {
      return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ugyldig forespørsel", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const job = await fetchPineconeJobById(parsed.data.jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Stillingen ble ikke funnet" },
        { status: 404 },
      );
    }

    const fullText = getFullReadableJobText(job);
    const source =
      fullText.length > MAX_BODY_CHARS
        ? `${fullText.slice(0, MAX_BODY_CHARS)}\n\n[…teksten er forkortet for oppsummering]`
        : fullText;

    if (!source.trim()) {
      return NextResponse.json(
        fallbackSections(
          job.title,
          job.employer,
          job.occupation,
          job.location,
        ),
        { status: 200 },
      );
    }

    const { output } = await generateText({
      model: gateway("anthropic/claude-sonnet-4"),
      output: Output.object({ schema: readableSummarySchema }),
      prompt: `Du hjelper en jobbsøker i Norge. Les stillingsannonsen og lag et strukturert, lettlest KI-sammendrag.

Returner JSON med feltet "sections": en liste med 3–6 seksjoner. Hver seksjon har:
- "title": kort norsk tittel (bruk gjerne: «Arbeidsoppgaver», «Kvalifikasjoner», «Hva vi tilbyr» når innholdet passer — tilpass titler hvis annonsen bruker andre begreper).
- "kind": "paragraph" for sammenhengende beskrivelse (typisk arbeidsoppgaver/rollen), eller "bullets" for punktlister (krav, fordeler, tilbud).
- "lines": 
  - Ved kind "paragraph": 1–2 strenger, hver er et avsnitt (2–4 setninger hvis mulig).
  - Ved kind "bullets": 3–8 korte punkter, ett punkt per streng, uten «-» eller tall i starten.

Regler:
- Skriv på norsk (bokmål). Vær konkret; ikke kopier annonsen ordrett.
- Ikke finn opp krav eller fordeler som ikke står i eller tydelig følger av teksten.
- Ingen markdown, ingen HTML.
- Rekkefølge: start gjerne med arbeidsoppgaver/rollen, deretter kvalifikasjoner/krav, deretter hva arbeidsgiver tilbyr (hvis det finnes i kilden).

Stilling: ${job.title}
Arbeidsgiver: ${job.employer}
${job.occupation ? `Yrkesområde: ${job.occupation}` : ""}
${job.location ? `Sted: ${job.location}` : ""}

Annonsetekst:
${source}`,
    });

    if (!output?.sections?.length) {
      return NextResponse.json(
        { error: "Kunne ikke lage oppsummering" },
        { status: 500 },
      );
    }

    const sections = output.sections.map((s) => ({
      title: s.title.trim(),
      kind: s.kind,
      lines: s.lines.map((l) => l.trim()).filter(Boolean),
    }));

    for (const s of sections) {
      if (s.lines.length === 0) {
        return NextResponse.json(
          { error: "Ugyldig oppsummering" },
          { status: 500 },
        );
      }
      if (s.kind === "bullets" && s.lines.length < 2) {
        s.kind = "paragraph";
      }
    }

    return NextResponse.json({ sections });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Readable summary error:", message);
    return NextResponse.json(
      { error: "Kunne ikke lage oppsummering.", details: message },
      { status: 500 },
    );
  }
}
