import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { gateway } from "@ai-sdk/gateway";
import { generateText, Output } from "ai";
import { z } from "zod";
import { cvSchema } from "@/lib/schemas/cv";
import { buildCvSummary } from "@/lib/cv-summary";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";

const USERS_COLLECTION = "users";

const MAX_JOB_CONTENT_CHARS = 1500;

const requestBodySchema = z.object({
  jobId: z.string().min(1, "jobId er påkrevd"),
});

const explanationSchema = z.object({
  explanation: z.string().describe("Kort forklaring på norsk, 2-4 setninger"),
});

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
    const parsedBody = requestBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Ugyldig forespørsel", details: parsedBody.error.flatten() },
        { status: 400 },
      );
    }

    const { jobId } = parsedBody.data;
    const userId = token.id;
    const db = getAdminFirestore();
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    const data = userDoc.data();

    const cvDataRaw = data?.cvData as unknown;
    const matchedJobs = data?.matchedJobs as PineconeJobRecord[] | undefined;

    const cvParsed = cvSchema.safeParse(cvDataRaw);
    if (!cvParsed.success || !cvParsed.data) {
      return NextResponse.json(
        { error: "CV ikke funnet. Last opp eller lagre CV først." },
        { status: 400 },
      );
    }

    if (!Array.isArray(matchedJobs)) {
      return NextResponse.json(
        { error: "Ingen lagrede jobbmatcher. Kjør et søk først." },
        { status: 404 },
      );
    }

    const job = matchedJobs.find((m) => m._id === jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Stillingen finnes ikke i dine matcher." },
        { status: 404 },
      );
    }

    const cvSummary = buildCvSummary(cvParsed.data);
    const jobContentSnippet =
      typeof job.content === "string" && job.content.trim().length > 0
        ? job.content.slice(0, MAX_JOB_CONTENT_CHARS).trim()
        : `${job.title} hos ${job.employer}. ${job.occupation ? `Stillingsområde: ${job.occupation}.` : ""}`;

    const { output } = await generateText({
      model: gateway("anthropic/claude-3.5-sonnet"),
      output: Output.object({ schema: explanationSchema }),
      prompt: `Du er en karriereveileder. Basert på kandidatens CV-sammendrag og stillingsannonsen, skriv en kort forklaring på norsk (2-4 setninger) om hvorfor denne stillingen passer for kandidaten. Vær konkret: nevne erfaring, ferdigheter eller utdanning som matcher. Skriv kun forklaringen, ingen overskrifter.

Kandidatens CV-sammendrag:
${cvSummary}

Stillingsannonse (utdrag):
Tittel: ${job.title}
Arbeidsgiver: ${job.employer}
${job.location ? `Sted: ${job.location}` : ""}

Innhold:
${jobContentSnippet}`,
    });

    const explanation =
      output?.explanation?.trim() ?? "Kunne ikke generere forklaring.";

    return NextResponse.json({ explanation });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Match explanation error:", message);
    return NextResponse.json(
      { error: "Kunne ikke generere forklaring.", details: message },
      { status: 500 },
    );
  }
}
