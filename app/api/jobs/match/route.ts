import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { FieldValue } from "firebase-admin/firestore";
import { gateway } from "@ai-sdk/gateway";
import { generateText, Output } from "ai";
import { z } from "zod";
import { cvSchema, type CVData } from "@/lib/schemas/cv";
import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  getPineconeClient,
  PINECONE_JOB_INDEX,
  PINECONE_JOB_NAMESPACE,
} from "@/lib/pinecone";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";
import {
  ENGAGEMENT_TYPE_INDEX_VALUES,
  EXTENT_INDEX_VALUES,
} from "@/lib/job-match-filters";

const USERS_COLLECTION = "users";

// Map common Norwegian location strings to county values used in the index (uppercase)
const LOCATION_TO_COUNTY: Record<string, string> = {
  oslo: "OSLO",
  bergen: "VESTLAND",
  trondheim: "TRØNDELAG",
  stavanger: "ROGALAND",
  tromsø: "TROMS",
  kristiansand: "AGDER",
  drammen: "BUSKERUD",
  fredrikstad: "ØSTFOLD",
  sandnes: "ROGALAND",
  tønsberg: "VESTFOLD",
  ålesund: "MØRE OG ROMSDAL",
  bodø: "NORDLAND",
  haugesund: "ROGALAND",
  moss: "ØSTFOLD",
  lillestrøm: "AKERSHUS",
  bærum: "AKERSHUS",
  asker: "AKERSHUS",
  akershus: "AKERSHUS",
  vestland: "VESTLAND",
  rogaland: "ROGALAND",
  trøndelag: "TRØNDELAG",
  nordland: "NORDLAND",
  agder: "AGDER",
  vestfold: "VESTFOLD",
  buskerud: "BUSKERUD",
  østfold: "ØSTFOLD",
  innlandet: "INNLANDET",
  telemark: "TELEMARK",
  "møre og romsdal": "MØRE OG ROMSDAL",
  troms: "TROMS",
  finnmark: "FINNMARK",
};

function resolveCounty(location: string | null): string | null {
  if (!location) return null;
  const normalized = location.toLowerCase().trim();
  // Direct match
  if (LOCATION_TO_COUNTY[normalized]) return LOCATION_TO_COUNTY[normalized];
  // Check if location contains a known key
  for (const [key, county] of Object.entries(LOCATION_TO_COUNTY)) {
    if (normalized.includes(key)) return county;
  }
  // If the location itself looks like a county (all uppercase or known pattern), try it
  return null;
}

function buildCvSummary(cv: CVData): string {
  const parts: string[] = [];

  if (cv.summary) {
    parts.push(`Sammendrag: ${cv.summary}`);
  }

  if (cv.experience.length > 0) {
    const expLines = cv.experience
      .slice(0, 5)
      .map((e) => `${e.title} hos ${e.company}`);
    parts.push(`Erfaring: ${expLines.join(", ")}`);
  }

  if (cv.education.length > 0) {
    const eduLines = cv.education
      .slice(0, 3)
      .map(
        (e) =>
          `${e.degree}${e.field ? ` i ${e.field}` : ""} fra ${e.institution}`,
      );
    parts.push(`Utdanning: ${eduLines.join(", ")}`);
  }

  if (cv.skills.length > 0) {
    parts.push(`Ferdigheter: ${cv.skills.slice(0, 15).join(", ")}`);
  }

  return parts.join("\n");
}

const searchQuerySchema = z.object({
  searchQuery: z
    .string()
    .describe(
      "Et søk på norsk med stillingstittel og nøkkelferdigheter, 5-10 ord",
    ),
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
    const parsed = cvSchema.safeParse(body?.cvData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ugyldig CV-data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const cvData = parsed.data;
    const cvSummary = buildCvSummary(cvData);

    // Optional filter params from request body
    const engagementType =
      typeof body?.engagementType === "string"
        ? body.engagementType.trim() || undefined
        : undefined;
    const countyOverride =
      body?.county != null && body?.county !== ""
        ? String(body.county).trim()
        : undefined;

    // County: use override if provided and not "ANY"; otherwise use CV-derived
    let county: string | null = null;
    if (countyOverride && countyOverride.toUpperCase() !== "ANY") {
      county = countyOverride;
    } else if (!countyOverride) {
      county = resolveCounty(cvData.personalInfo.location);
    }

    // Step 1: Generate search query from CV using Claude
    const { output } = await generateText({
      model: gateway("anthropic/claude-3.5-sonnet"),
      output: Output.object({ schema: searchQuerySchema }),
      prompt: `Du er en ekspert på jobbsøk i Norge. Basert på følgende CV-informasjon, generer et søk på norsk (5-10 ord) som fanger personens mest relevante stillingstittel og topp 2-3 nøkkelferdigheter. Søket brukes til semantisk vektorsøk i en stillingsannonsedatabase.

CV-informasjon:
${cvSummary}

Regler:
- Start med den mest relevante stillingstittel
- Inkluder 2-3 av de viktigste ferdighetene/teknologiene
- IKKE inkluder stedsnavn (filtreres separat)
- Eksempler: "frontend utvikler React JavaScript", "sykepleier geriatri palliasjon", "prosjektleder IT agile"`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Kunne ikke generere søk fra CV" },
        { status: 500 },
      );
    }

    const { searchQuery } = output;

    // Step 2: Search Pinecone for matching jobs
    const pc = getPineconeClient();
    const namespace = pc
      .index(PINECONE_JOB_INDEX)
      .namespace(PINECONE_JOB_NAMESPACE);

    const filterConditions: object[] = [];
    if (county) {
      filterConditions.push({ county: { $eq: county } });
    }
    if (engagementType) {
      if (engagementType === "Heltid" || engagementType === "Deltid") {
        const extentValues =
          EXTENT_INDEX_VALUES[engagementType as "Heltid" | "Deltid"];
        const engagementValues = ENGAGEMENT_TYPE_INDEX_VALUES[engagementType];
        const orParts: object[] = [];
        if (extentValues?.length > 0) {
          orParts.push({ extent: { $in: extentValues } });
        }
        if (engagementValues?.length > 0) {
          orParts.push({ engagement_type: { $in: engagementValues } });
        }
        if (orParts.length > 0) {
          filterConditions.push(
            orParts.length === 1 ? orParts[0]! : { $or: orParts },
          );
        }
      } else {
        const indexValues = ENGAGEMENT_TYPE_INDEX_VALUES[engagementType];
        if (indexValues && indexValues.length > 0) {
          filterConditions.push({ engagement_type: { $in: indexValues } });
        } else {
          filterConditions.push({ engagement_type: { $eq: engagementType } });
        }
      }
    }

    const query: { topK: number; inputs: { text: string }; filter?: object } = {
      topK: 50,
      inputs: { text: searchQuery },
    };
    if (filterConditions.length > 0) {
      query.filter =
        filterConditions.length === 1
          ? filterConditions[0]
          : { $and: filterConditions };
    }

    const response = await namespace.searchRecords({
      query,
      fields: [
        "title",
        "employer",
        "location",
        "county",
        "occupation",
        "engagement_type",
        "extent",
        "published",
        "application_due",
        "source_url",
        "content",
        "nav_feed_path",
      ],
    });

    const matches: PineconeJobRecord[] = (response.result?.hits ?? []).map(
      (hit) => {
        const f = hit.fields as Record<string, string>;
        return {
          _id: hit._id,
          _score: hit._score,
          title: f.title ?? "",
          employer: f.employer ?? "",
          location: f.location ?? "",
          county: f.county ?? "",
          occupation: f.occupation ?? "",
          engagement_type: f.engagement_type ?? "",
          extent: f.extent ?? undefined,
          published: f.published ?? "",
          application_due: f.application_due ?? "",
          source_url: f.source_url ?? "",
          content: f.content ?? undefined,
          nav_feed_path: f.nav_feed_path ?? undefined,
        };
      },
    );

    const userId = token.id;
    const db = getAdminFirestore();
    const matchesForFirestore = JSON.parse(
      JSON.stringify(matches),
    ) as PineconeJobRecord[];
    await db.collection(USERS_COLLECTION).doc(userId).set(
      {
        matchedJobs: matchesForFirestore,
        matchedJobsSavedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ matches, searchQuery });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Job match error:", message);
    return NextResponse.json(
      { error: "Kunne ikke finne matchende jobber.", details: message },
      { status: 500 },
    );
  }
}
