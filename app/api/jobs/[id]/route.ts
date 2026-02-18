import { NextRequest, NextResponse } from "next/server";
import {
  getPineconeClient,
  PINECONE_JOB_INDEX,
  PINECONE_JOB_NAMESPACE,
} from "@/lib/pinecone";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";

function mapRecordToJob(id: string, record: Record<string, unknown>): PineconeJobRecord {
  const meta = (record.metadata ?? record.fields ?? record) as Record<string, string | undefined>;
  const str = (v: string | undefined) => (v != null ? String(v) : "");
  return {
    _id: id,
    title: str(meta.title),
    employer: str(meta.employer),
    location: str(meta.location),
    county: str(meta.county),
    occupation: str(meta.occupation),
    engagement_type: str(meta.engagement_type),
    published: str(meta.published),
    application_due: str(meta.application_due),
    source_url: str(meta.source_url),
    content: meta.content != null ? String(meta.content) : undefined,
    nav_feed_path: meta.nav_feed_path != null ? String(meta.nav_feed_path) : undefined,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Mangler jobb-id" }, { status: 400 });
    }

    const pc = getPineconeClient();
    const index = pc.index(PINECONE_JOB_INDEX);
    const response = await index.fetch({
      ids: [id.trim()],
      namespace: PINECONE_JOB_NAMESPACE,
    });

    const records = response.records ?? {};
    const raw = records[id.trim()] as Record<string, unknown> | undefined;
    if (!raw) {
      return NextResponse.json(
        { error: "Stillingen ble ikke funnet" },
        { status: 404 }
      );
    }

    const job = mapRecordToJob(id.trim(), raw);
    return NextResponse.json(job);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Job fetch error:", message);
    return NextResponse.json(
      { error: "Kunne ikke hente stillingen.", details: message },
      { status: 500 }
    );
  }
}
