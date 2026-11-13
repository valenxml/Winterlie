import { z } from "zod";
import type { Section } from "./sections.js";
import { accentWord, clean } from "./templates.js";

/**
 * Regeneration of one section's text. The model only fills the text slots for that
 * section type. Layout, settings, icons, and images are copied from the existing section.
 */

const noMarkup = (s: string) => !/[<>]/.test(s);
const txt = (min: number, max: number) => z.string().trim().min(min).max(max).refine(noMarkup, "Markup tidak diizinkan");
const item = (qMin: number, qMax: number, aMin: number, aMax: number) =>
  z.object({ title: txt(qMin, qMax), description: txt(aMin, aMax) });

const heroCopy = z.object({
  badge: txt(2, 30),
  title: txt(3, 120),
  accent: txt(1, 40).optional(),
  description: txt(10, 300),
  ctaLabel: txt(2, 40),
});
const ctaCopy = z.object({ title: txt(3, 120), description: txt(5, 240), ctaLabel: txt(2, 40) });
const featureCopy = z.object({ heading: txt(3, 100), items: z.array(item(2, 60, 5, 220)).min(2).max(8) });
const faqCopy = z.object({
  heading: txt(3, 100),
  items: z.array(z.object({ question: txt(5, 140), answer: txt(5, 400) })).min(2).max(8),
});

const statsCopy = z.object({
  items: z.array(z.object({ label: txt(2, 40), value: txt(1, 20), note: txt(2, 80).optional() })).min(2).max(4),
});
const pricingCopy = z.object({
  heading: txt(3, 100),
  plans: z
    .array(z.object({
      name: txt(2, 40),
      price: txt(1, 24),
      period: txt(1, 20).optional(),
      features: z.array(txt(2, 100)).min(2).max(8),
      highlighted: z.boolean(),
    }))
    .min(1)
    .max(4),
});
const testimonialsCopy = z.object({
  heading: txt(3, 100),
  items: z.array(z.object({ quote: txt(10, 280), name: txt(2, 60), role: txt(2, 80) })).min(1).max(4),
});
const productCopy = z.object({
  heading: txt(3, 100),
  items: z.array(z.object({ title: txt(2, 60), price: txt(1, 24), note: txt(2, 80).optional() })).min(2).max(8),
});

/** Section types that can be regenerated or composed by AI. Navbar and footer stay template-only. */
export const REGENERATABLE_TYPES = [
  "hero-editorial", "hero-split", "hero-centered", "cta-banner", "feature-grid", "feature-alternating",
  "faq", "stats-row", "pricing", "testimonials", "product-grid",
] as const;

export function isRegeneratable(type: string): boolean {
  return (REGENERATABLE_TYPES as readonly string[]).includes(type);
}

export function sectionCopySchema(type: string): z.ZodTypeAny {
  if (type.startsWith("hero-")) return heroCopy;
  if (type === "cta-banner") return ctaCopy;
  if (type === "faq") return faqCopy;
  if (type === "feature-grid" || type === "feature-alternating") return featureCopy;
  if (type === "stats-row") return statsCopy;
  if (type === "pricing") return pricingCopy;
  if (type === "testimonials") return testimonialsCopy;
  if (type === "product-grid") return productCopy;
  throw new Error(`Section ${type} cannot be regenerated`);
}

/** Current text of a section, as plain JSON for the prompt. */
export function currentText(s: Section): Record<string, unknown> {
  switch (s.type) {
    case "hero-editorial":
    case "hero-split":
    case "hero-centered":
      return { badge: s.content.badge, title: s.content.title, accent: s.content.accent, description: s.content.description, ctaLabel: s.content.primaryCta.label };
    case "cta-banner":
      return { title: s.content.title, description: s.content.description, ctaLabel: s.content.cta.label };
    case "faq":
      return { heading: s.content.heading, items: s.content.items.map((i) => ({ question: i.question, answer: i.answer })) };
    case "feature-grid":
    case "feature-alternating":
      return { heading: s.content.heading, items: s.content.items.map((i) => ({ title: i.title, description: i.description })) };
    case "stats-row":
      return { items: s.content.items.map((i) => ({ label: i.label, value: i.value, note: i.note })) };
    case "pricing":
      return { heading: s.content.heading, plans: s.content.plans.map((p) => ({ name: p.name, price: p.price, period: p.period, features: p.features, highlighted: p.highlighted })) };
    case "testimonials":
      return { heading: s.content.heading, items: s.content.items.map((i) => ({ quote: i.quote, name: i.name, role: i.role })) };
    case "product-grid":
      return { heading: s.content.heading, items: s.content.items.map((i) => ({ title: i.title, price: i.price, note: i.note })) };
    default:
      return {};
  }
}

export function buildSectionPrompt(
  section: Section,
  context: { brand: string; description: string },
): { system: string; user: string } {
  const system =
    "Kamu adalah copywriter website berbahasa Indonesia. Balas HANYA dengan satu objek JSON yang valid " +
    "dengan field yang sama persis seperti contoh. Tanpa penjelasan, tanpa markdown, tanpa tag HTML, " +
    "dan jangan memakai karakter < atau >. Tulis teks yang berbeda dari versi sekarang, tetapi tetap sesuai bisnisnya.";
  const user = [
    `Nama bisnis: ${clean(context.brand, 30) || "belum disebutkan"}`,
    `Konteks bisnis: ${clean(context.description, 600) || "belum disebutkan"}`,
    `Jenis section: ${section.type}`,
    `Teks sekarang (JSON): ${JSON.stringify(currentText(section))}`,
    "",
    "Balas dengan JSON dengan field yang sama. Untuk daftar item, tulis jumlah item yang sama dengan teks sekarang.",
  ].join("\n");
  return { system, user };
}

/** Writes new text into a copy of the section. Everything except the text stays as it was. */
export function applySectionCopy(section: Section, copy: Record<string, any>): Section {
  switch (section.type) {
    case "hero-editorial":
    case "hero-split":
    case "hero-centered": {
      const title: string = copy.title;
      const accent: string | undefined = copy.accent && title.includes(copy.accent) ? copy.accent : accentWord(title);
      return {
        ...section,
        content: {
          ...section.content,
          badge: copy.badge,
          title,
          accent,
          description: copy.description,
          primaryCta: { ...section.content.primaryCta, label: copy.ctaLabel },
        },
      } as Section;
    }
    case "cta-banner":
      return {
        ...section,
        content: {
          ...section.content,
          title: copy.title,
          description: copy.description,
          cta: { ...section.content.cta, label: copy.ctaLabel },
        },
      } as Section;
    case "faq":
      return {
        ...section,
        content: {
          ...section.content,
          heading: copy.heading,
          items: section.content.items.map((it, i) => (copy.items[i] ? { ...it, question: copy.items[i].question, answer: copy.items[i].answer } : it)),
        },
      } as Section;
    case "feature-grid":
    case "feature-alternating":
      return {
        ...section,
        content: {
          ...section.content,
          heading: copy.heading,
          items: section.content.items.map((it, i) => (copy.items[i] ? { ...it, title: copy.items[i].title, description: copy.items[i].description } : it)),
        },
      } as Section;
    case "stats-row":
      // Item count follows the copy, since stats are short and fully replaced.
      return {
        ...section,
        content: { items: copy.items.map((i: { label: string; value: string; note?: string }) => ({ label: i.label, value: i.value, note: i.note })) },
      } as Section;
    case "pricing": {
      const base = section.content.plans;
      return {
        ...section,
        content: {
          ...section.content,
          heading: copy.heading,
          plans: copy.plans.map((p: any, i: number) => ({
            ...(base[i % base.length] as object),
            name: p.name, price: p.price, period: p.period, features: p.features, highlighted: p.highlighted,
          })),
        },
      } as Section;
    }
    case "testimonials": {
      const base = section.content.items;
      return {
        ...section,
        content: {
          ...section.content,
          heading: copy.heading,
          items: copy.items.map((it: any, i: number) => ({ ...(base[i % base.length] as object), quote: it.quote, name: it.name, role: it.role })),
        },
      } as Section;
    }
    case "product-grid": {
      const base = section.content.items;
      return {
        ...section,
        content: {
          ...section.content,
          heading: copy.heading,
          items: copy.items.map((it: any, i: number) => ({ ...(base[i % base.length] as object), title: it.title, price: it.price, note: it.note })),
        },
      } as Section;
    }
    default:
      return section;
  }
}
