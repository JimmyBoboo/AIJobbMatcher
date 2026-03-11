import { z } from "zod";

export const feedEntrySchema = z.object({
  uuid: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  title: z.string(),
  businessName: z.string().optional(),
  municipal: z.string().optional(),
  sistEndret: z.string().optional(),
  applicationDue: z.string().optional(),
  /** Industry/occupation (e.g. from Pinecone); used for filtering. */
  occupation: z.string().optional(),
});

export const jobItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  content_text: z.string().optional(),
  date_modified: z.string().optional(),
  _feed_entry: feedEntrySchema,
});

export const feedResponseSchema = z.object({
  items: z.array(jobItemSchema),
  next_id: z.string().nullable().optional(),
});

export const paginatedJobsResponseSchema = z.object({
  items: z.array(jobItemSchema),
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
  hasMore: z.boolean(),
  isComplete: z.boolean(),
});

export type FeedEntry = z.infer<typeof feedEntrySchema>;
export type JobItem = z.infer<typeof jobItemSchema>;
export type FeedResponse = z.infer<typeof feedResponseSchema>;
export type PaginatedJobsResponse = z.infer<typeof paginatedJobsResponseSchema>;

// Pinecone job matching types

export const pineconeJobRecordSchema = z.object({
  _id: z.string(),
  _score: z.number().optional(),
  title: z.string(),
  employer: z.string(),
  location: z.string(),
  county: z.string(),
  occupation: z.string(),
  engagement_type: z.string(),
  /** Omfang (Heltid/Deltid) from NAV PAM extent; used to filter full-time vs part-time. */
  extent: z.string().optional(),
  published: z.string(),
  application_due: z.string(),
  source_url: z.string(),
  content: z.string().optional(),
  /** Relative path for NAV PAM feed detail (e.g. api/v1/vacancies/{uuid}) */
  nav_feed_path: z.string().optional(),
});

export type PineconeJobRecord = z.infer<typeof pineconeJobRecordSchema>;

export interface JobMatchResponse {
  matches: PineconeJobRecord[];
  searchQuery: string;
}

/** NAV PAM feed vacancy detail (from feed entry url response) */
export interface NavJobDetailJson {
  title?: string;
  description?: string;
  applicationDue?: string;
  engagementtype?: string;
  /** Omfang (Heltid/Deltid); should be stored as metadata when indexing to Pinecone. */
  extent?: string;
  employer?: { name?: string };
  workLocations?: Array<{
    city?: string;
    county?: string;
    municipal?: string;
    address?: string;
  }>;
  /** Public URL to view/apply for the job (e.g. on nav.no or arbeidsplassen) */
  url?: string;
  sourceUrl?: string;
}

export interface NavJobDetailResponse {
  ad_content?: unknown;
  json?: NavJobDetailJson;
}