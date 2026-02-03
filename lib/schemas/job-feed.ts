import { z } from "zod";

export const feedEntrySchema = z.object({
  uuid: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  title: z.string(),
  businessName: z.string().optional(),
  municipal: z.string().optional(),
  sistEndret: z.string().optional(),
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
