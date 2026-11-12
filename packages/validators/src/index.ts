import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
});
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export const projectUpdateSchema = projectCreateSchema.partial();
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const websiteCategorySchema = z.enum(["landing", "dashboard"]);
export type WebsiteCategory = z.infer<typeof websiteCategorySchema>;

const httpUrl = z
  .string()
  .url()
  .max(500)
  .refine((v) => /^https?:\/\//i.test(v), "Only http(s) URLs are allowed");

/** Input brief for DesignForge. Reference URLs are only syntax-checked here;
 *  SSRF protection happens at fetch time on the server. */
export const designBriefSchema = z.object({
  description: z.string().trim().min(20).max(2000),
  category: websiteCategorySchema,
  businessType: z.string().trim().max(120).optional(),
  targetAudience: z.string().trim().max(240).optional(),
  purpose: z.string().trim().max(240).optional(),
  visualDirection: z.string().trim().max(400).optional(),
  colorPreferences: z.string().trim().max(200).optional(),
  requiredSections: z.array(z.string().trim().min(1).max(60)).max(15).default([]),
  referenceUrls: z.array(httpUrl).max(5).default([]),
  constraints: z.string().trim().max(600).optional(),
});
export type DesignBrief = z.infer<typeof designBriefSchema>;
export * from "./auth.js";
