import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  getPineconeClient,
  PINECONE_JOB_INDEX,
  PINECONE_JOB_NAMESPACE,
} from "@/lib/pinecone";
import { isCurrentJobListing } from "@/lib/job-utils";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";

const USERS_COLLECTION = "users";

function mapRecordToJob(
  id: string,
  record: Record<string, unknown>
): PineconeJobRecord {
  const meta = (record.metadata ?? record.fields ?? record) as Record<
    string,
    string | undefined
  >;
  const str = (v: string | undefined) => (v != null ? String(v) : "");
  return {
    _id: id,
    title: str(meta.title),
    employer: str(meta.employer),
    location: str(meta.location),
    county: str(meta.county),
    occupation: str(meta.occupation),
    engagement_type: str(meta.engagement_type),
    extent: meta.extent != null ? str(meta.extent) : undefined,
    published: str(meta.published),
    application_due: str(meta.application_due),
    source_url: str(meta.source_url),
    content: meta.content != null ? String(meta.content) : undefined,
    nav_feed_path:
      meta.nav_feed_path != null ? String(meta.nav_feed_path) : undefined,
  };
}

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token?.id || typeof token.id !== "string") return null;
  return token.id;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
    }

    const db = getAdminFirestore();
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    const data = userDoc.data();
    const savedJobIds = (data?.savedJobIds as string[] | undefined) ?? [];
    const jobIds = Array.isArray(savedJobIds) ? savedJobIds : [];

    const url = new URL(request.url);
    const withDetails = url.searchParams.get("details") === "1";

    if (!withDetails || jobIds.length === 0) {
      return NextResponse.json({ jobIds });
    }

    const pc = getPineconeClient();
    const index = pc.index(PINECONE_JOB_INDEX);
    const response = await index.fetch({
      ids: jobIds,
      namespace: PINECONE_JOB_NAMESPACE,
    });
    const records = response.records ?? {};
    const jobs: PineconeJobRecord[] = [];
    for (const id of jobIds) {
      const raw = records[id] as Record<string, unknown> | undefined;
      if (raw) jobs.push(mapRecordToJob(id, raw));
    }

    const openJobs = jobs.filter((job) =>
      isCurrentJobListing({
        applicationDue: job.application_due,
        sistEndret: job.published,
      }),
    );

    return NextResponse.json({ jobIds, jobs: openJobs });
  } catch (err) {
    console.error("Saved jobs fetch error:", err);
    return NextResponse.json(
      { error: "Kunne ikke hente lagrede stillinger." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
    }

    const body = await request.json();
    const jobId =
      typeof body?.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) {
      return NextResponse.json(
        { error: "Mangler jobb-id" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();
    const data = userDoc.data();
    const existing = (data?.savedJobIds as string[] | undefined) ?? [];
    const list = Array.isArray(existing) ? existing : [];
    if (list.includes(jobId)) {
      return NextResponse.json({ jobIds: list });
    }
    const jobIds = [...list, jobId];
    await userRef.set({ savedJobIds: jobIds }, { merge: true });

    return NextResponse.json({ jobIds });
  } catch (err) {
    console.error("Save job error:", err);
    return NextResponse.json(
      { error: "Kunne ikke lagre stillingen." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
    }

    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId")?.trim() ?? "";
    if (!jobId) {
      return NextResponse.json(
        { error: "Mangler jobb-id" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const userDoc = await userRef.get();
    const data = userDoc.data();
    const existing = (data?.savedJobIds as string[] | undefined) ?? [];
    const list = Array.isArray(existing) ? existing : [];
    const jobIds = list.filter((id) => id !== jobId);
    await userRef.set({ savedJobIds: jobIds }, { merge: true });

    return NextResponse.json({ jobIds });
  } catch (err) {
    console.error("Remove saved job error:", err);
    return NextResponse.json(
      { error: "Kunne ikke fjerne stillingen." },
      { status: 500 }
    );
  }
}
