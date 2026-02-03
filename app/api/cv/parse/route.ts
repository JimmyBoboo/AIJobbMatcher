import { gateway } from "@ai-sdk/gateway";
import { generateText, Output, convertToModelMessages } from "ai";
import { cvSchema } from "@/lib/schemas/cv";

export async function POST(request: Request) {
  try {
    const { fileUrl, mimeType } = await request.json();

    if (!fileUrl || !mimeType) {
      return Response.json(
        { error: "Mangler fil eller filtype" },
        { status: 400 }
      );
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
