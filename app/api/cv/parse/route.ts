import { gateway } from "@ai-sdk/gateway";
import { generateText, Output, convertToModelMessages } from "ai";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { cvSchema } from "@/lib/schemas/cv";
import { getAdminFirestore } from "@/lib/firebase-admin";

const USERS_COLLECTION = "users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl, mimeType, fileHash } = body as {
      fileUrl?: string;
      mimeType?: string;
      fileHash?: string;
    };

    if (!fileUrl || !mimeType) {
      return Response.json(
        { error: "Mangler fil eller filtype" },
        { status: 400 }
      );
    }

    // Re-upload optimization: same file → skip AI. Future: partial re-parse/diff-based
    // updates if we store previous extracted text and detect changed sections.
    if (fileHash && typeof fileHash === "string") {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (token?.id && typeof token.id === "string") {
        const db = getAdminFirestore();
        const userDoc = await db
          .collection(USERS_COLLECTION)
          .doc(token.id)
          .get();
        const storedHash = userDoc.data()?.cvFileHash as string | undefined;
        const storedCvData = userDoc.data()?.cvData as Record<string, unknown> | undefined;
        if (storedHash === fileHash && storedCvData) {
          return Response.json({
            data: storedCvData,
            skipped: true,
          });
        }
      }
    }

    // Convert UI messages to model messages format
    const uiMessages = [
      {
        id: "1",
        role: "user" as const,
        parts: [
          {
            type: "file" as const,
            mediaType: mimeType,
            url: fileUrl,
          },
          {
            type: "text" as const,
            text: `Analyser denne CV-en og ekstraher all relevant informasjon.

Viktige instruksjoner:
- Ekstraher all informasjon du finner, selv om noen felt er tomme
- For arbeidserfaring, sorter fra nyeste til eldste
- Hvis fødselsår ikke er eksplisitt oppgitt, sett birthYear til null
- For ferdigheter, inkluder både tekniske og myke ferdigheter
- Språk: hvis ikke oppgitt, anta norsk som morsmål hvis CV-en er på norsk`,
          },
        ],
      },
    ];

    const modelMessages = await convertToModelMessages(uiMessages);

    const { output } = await generateText({
      model: gateway("anthropic/claude-3.5-sonnet"),
      output: Output.object({ schema: cvSchema }),
      messages: modelMessages,
    });

    return Response.json({ data: output });
  } catch (error) {
    console.error("CV parsing error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Ukjent feil";
    return Response.json(
      {
        error: "Kunne ikke analysere CV-en. Prøv igjen.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
