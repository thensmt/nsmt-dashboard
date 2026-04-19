import { z } from "zod";

/**
 * Narrow zod schemas covering only the fields we actually read. Extra fields
 * from the GitHub API are allowed (strict=false by default).
 */
export const RepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.string().url(),
  default_branch: z.string().nullable().optional(),
  fork: z.boolean(),
  archived: z.boolean(),
  private: z.boolean(),
  description: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  pushed_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  homepage: z.string().nullable().optional(),
});

export const CommitSchema = z.object({
  sha: z.string(),
  commit: z.object({
    message: z.string(),
    author: z
      .object({
        date: z.string().optional(),
      })
      .partial()
      .optional(),
    committer: z
      .object({
        date: z.string().optional(),
      })
      .partial()
      .optional(),
  }),
});

export type Repo = z.infer<typeof RepoSchema>;
export type CommitApi = z.infer<typeof CommitSchema>;
