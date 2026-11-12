import { z } from "zod";
import { designSpecSchema, type DesignSpec } from "./design.js";
import type { Section } from "./sections.js";
import { accentWord, clean } from "./templates.js";

/**
 * AI-written copy. The model only supplies text for the fixed slots below; layout,
 * tokens, and section order always come from the templates. Every value is validated
 * here and again by designSpecSchema, so bad model output cannot reach the database.
 */

const noMarkup = (s: string) => !/[<>]/.test(s);
const txt = (min: number, max: number) =>
  z.string().trim().min(min).max(max).refine(noMarkup, "Markup tidak diizinkan");

export const aiCopySchema = z.object({
  badge: txt(2, 30),
  title: txt(3, 120),
  accent: txt(1, 40).optional(),
  description: txt(10, 300),
  ctaLabel: txt(2, 40),
  features: z.array(z.object({ title: txt(2, 60), description: txt(5, 220) })).length(3),
  faq: z.array(z.object({ question: txt(5, 140), answer: txt(5, 400) })).length(2),
  ctaTitle: txt(3, 120),
  ctaDescription: txt(5, 240),
});
export type AiCopy = z.infer<typeof aiCopySchema>;

/** Pulls the first JSON object out of a model reply, even if it has prose or code fences around it. */
export function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object in AI response");
  return JSON.parse(text.slice(start, end + 1));
}

export function parseAiCopy(text: string): AiCopy {
  return aiCopySchema.parse(extractJsonObject(text));
}

export function buildCopyPrompt(input: { brand: string; description: string }): { system: string; user: string } {
  const system =
    "Kamu adalah copywriter website berbahasa Indonesia. Balas HANYA dengan satu objek JSON yang valid. " +
    "Tanpa penjelasan, tanpa markdown, tanpa tag HTML, dan jangan memakai karakter < atau >.";
  const user = [
    `Nama bisnis: ${clean(input.brand, 30) || "belum disebutkan"}`,
    `Deskripsi bisnis: ${clean(input.description, 1000)}`,
    "",
    "Tulis JSON dengan field persis seperti ini:",
    '{"badge": teks singkat (maks 30), "title": judul utama yang spesifik untuk bisnis ini (maks 120), ' +
      '"accent": satu kata dari title yang akan ditekankan, "description": deskripsi hero (maks 300), ' +
      '"ctaLabel": label tombol utama (maks 40), "features": tepat 3 objek {"title","description"}, ' +
      '"faq": tepat 2 objek {"question","answer"}, "ctaTitle": judul ajakan (maks 120), ' +
      '"ctaDescription": deskripsi ajakan (maks 240)}',
  ].join("\n");
  return { system, user };
}

/**
 * Writes copy into a template spec. Section ids, layout, and tokens are not changed.
 * Items beyond the copy count keep their template text.
 */
export function applyCopy(spec: DesignSpec, copy: AiCopy): DesignSpec {
  const sections = spec.sections.map((s): Section => {
    switch (s.type) {
      case "hero-editorial":
      case "hero-split":
      case "hero-centered": {
        const title = copy.title;
        const accent = copy.accent && title.includes(copy.accent) ? copy.accent : accentWord(title);
        return {
          ...s,
          content: {
            ...s.content,
            badge: copy.badge,
            title,
            accent,
            description: copy.description,
            primaryCta: { ...s.content.primaryCta, label: copy.ctaLabel },
          },
        } as Section;
      }
      case "feature-grid":
        return {
          ...s,
          content: {
            ...s.content,
            items: s.content.items.map((it, i) => {
              const f = copy.features[i];
              return f ? { ...it, title: f.title, description: f.description } : it;
            }),
          },
        } as Section;
      case "feature-alternating":
        return {
          ...s,
          content: {
            ...s.content,
            items: s.content.items.map((it, i) => {
              const f = copy.features[i];
              return f ? { ...it, title: f.title, description: f.description } : it;
            }),
          },
        } as Section;
      case "faq":
        return {
          ...s,
          content: {
            ...s.content,
            items: s.content.items.map((it, i) => {
              const q = copy.faq[i];
              return q ? { ...it, question: q.question, answer: q.answer } : it;
            }),
          },
        } as Section;
      case "cta-banner":
        return {
          ...s,
          content: {
            ...s.content,
            title: copy.ctaTitle,
            description: copy.ctaDescription,
            cta: { ...s.content.cta, label: copy.ctaLabel },
          },
        } as Section;
      default:
        return s;
    }
  });
  return designSpecSchema.parse({ ...spec, sections });
}
