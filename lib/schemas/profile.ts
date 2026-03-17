import { z } from "zod";

const urlOptional = z
  .string()
  .max(2048)
  .url()
  .optional()
  .or(z.literal(""));

export const socialsSchema = z.object({
  linkedIn: z.string().max(2048).optional(),
  twitter: z.string().max(2048).optional(),
  github: z.string().max(2048).optional(),
});

export const userProfileSchema = z.object({
  /** Set by avatar upload API only; GET returns /api/profile/avatar when profileImagePath exists */
  profileImageUrl: z.string().max(2048).optional(),
  username: z.string().max(64).optional(),
  bio: z.string().max(2000).optional(),
  location: z.string().max(256).optional(),
  website: urlOptional,
  socials: socialsSchema.optional(),
});

export const patchProfileSchema = userProfileSchema
  .partial()
  .omit({ profileImageUrl: true });

export type UserProfile = z.infer<typeof userProfileSchema>;
export type Socials = z.infer<typeof socialsSchema>;
