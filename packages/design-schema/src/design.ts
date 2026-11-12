import { z } from "zod";
import { safeText } from "./primitives.js";
import { designTokensSchema } from "./tokens.js";
import {
  DASHBOARD_SECTION_TYPES,
  LANDING_SECTION_TYPES,
  sectionSchema,
} from "./sections.js";

export const DESIGN_SCHEMA_VERSION = 1;

export const designSpecSchema = z
  .object({
    schemaVersion: z.literal(DESIGN_SCHEMA_VERSION),
    name: safeText(80),
    direction: z.string().regex(/^[a-z][a-z0-9-]{1,47}$/),
    category: z.enum(["landing", "dashboard"]),
    tokens: designTokensSchema,
    sections: z.array(sectionSchema).min(1).max(30),
  })
  .superRefine((spec, ctx) => {
    const seen = new Set<string>();
    spec.sections.forEach((s, i) => {
      if (seen.has(s.id)) {
        ctx.addIssue({ code: "custom", path: ["sections", i, "id"], message: `Duplicate section id "${s.id}"` });
      }
      seen.add(s.id);

      const allowed: readonly string[] =
        spec.category === "landing" ? LANDING_SECTION_TYPES : DASHBOARD_SECTION_TYPES;
      if (!allowed.includes(s.type)) {
        ctx.addIssue({
          code: "custom",
          path: ["sections", i, "type"],
          message: `Section type "${s.type}" is not allowed in a ${spec.category} design`,
        });
      }

      if (s.type.startsWith("hero-")) {
        const hero = s.content as { title: string; accent?: string };
        if (hero.accent !== undefined && !hero.title.includes(hero.accent)) {
          ctx.addIssue({
            code: "custom",
            path: ["sections", i, "content", "accent"],
            message: "Accent word must appear in the title",
          });
        }
      }

      if (s.type === "dashboard-table") {
        s.content.rows.forEach((row, r) => {
          if (row.length !== s.content.columns.length) {
            ctx.addIssue({
              code: "custom",
              path: ["sections", i, "content", "rows", r],
              message: "Row length must match the number of columns",
            });
          }
        });
      }
    });
  });

export type DesignSpec = z.infer<typeof designSpecSchema>;
