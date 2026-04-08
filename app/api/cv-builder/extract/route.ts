import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { gateway } from "@ai-sdk/gateway";
import { generateText, Output, convertToModelMessages, type UIMessage } from "ai";
import { cvSchema } from "@/lib/schemas/cv";

const EXTRACT_PROMPT = `Basert på samtalen under, ekstraher all CV-informasjon brukeren har gitt og fyll ut det strukturerte CV-objektet.
- personalInfo: name (påkrevd), email, phone, location, linkedIn, portfolio (URL), birthYear (tall eller null).
- summary: profesjonelt sammendrag eller null.
- experience: liste med { company, title, startDate, endDate (null hvis nåværende), description }. Sorter nyeste først.
- education: liste med { institution, degree, field, startDate, endDate }.
- skills: liste med strenger.
- languages: liste med { language, proficiency }.
- certifications: liste med strenger.
- additionalInfo: prosjekter/prestasjoner, interesser, frivillig arbeid som én tekst, eller null.

Hvis noe ikke er nevnt, bruk null for valgfrie felt og tom array [] for lister. 
Navn og minst én arbeidserfaring må finnes; ellers returner likevel best mulig objekt slik at validering kan feile med tydelig melding.`;

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id || typeof token.id !== "string") {
      return NextResponse.json(
        { error: "Ikke autentisert" },
        { status: 401 }
      );
    }

    let body: { messages?: UIMessage[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Ugyldig forespørsel" },
        { status: 400 }
      );
    }

    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Mangler meldinger" },
        { status: 400 }
      );
    }

    const modelMessages = await convertToModelMessages(messages);

    const { output } = await generateText({
      model: gateway("anthropic/claude-sonnet-4"),
      output: Output.object({ schema: cvSchema }),
      system: EXTRACT_PROMPT,
      messages: modelMessages,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Kunne ikke ekstrahere CV fra samtalen" },
        { status: 500 }
      );
    }

    const parsed = cvSchema.safeParse(output);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "CV-data fra samtalen er ufullstendig eller ugyldig",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ cvData: parsed.data });
  } catch (err) {
    console.error("CV extract error:", err);
    return NextResponse.json(
      { error: "Kunne ikke ekstrahere CV. Prøv igjen." },
      { status: 500 }
    );
  }
}
