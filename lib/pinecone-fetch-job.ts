import {
  getPineconeClient,
  PINECONE_JOB_INDEX,
  PINECONE_JOB_NAMESPACE,
} from "@/lib/pinecone";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";

function mapRecordToJob(
  id: string,
  record: Record<string, unknown>,
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

export async function fetchPineconeJobById(
  id: string,
): Promise<PineconeJobRecord | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const pc = getPineconeClient();
  const index = pc.index(PINECONE_JOB_INDEX);
  const response = await index.fetch({
    ids: [trimmed],
    namespace: PINECONE_JOB_NAMESPACE,
  });
  const records = response.records ?? {};
  const raw = records[trimmed] as Record<string, unknown> | undefined;
  if (!raw) return null;
  return mapRecordToJob(trimmed, raw);
}
