import { z } from "zod";
import { designSpecSchema, type DesignSpec } from "./design.js";
import { FONT_STYLES } from "./tokens.js";
import { HERO_VISUALS, type Section } from "./sections.js";
import { applySectionCopy, sectionCopySchema } from "./section-regen.js";
import { buildLandingDirections, clean } from "./templates.js";
import { extractJsonObject } from "./copy.js";

/**
 * Structure composition. The model chooses which sections a site needs, in what order,
 * plus palette, fonts, hero visual, and copy. Every choice is limited to a fixed catalog,
 * and the final spec is validated, so a model cannot invent layouts or markup.
 */

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Expected #RRGGBB");

/** Section types the model may choose. Navbar and footer are always added by the composer. */
export const COMPOSABLE_TYPES = [
  "hero-centered", "hero-split", "hero-editorial", "feature-grid", "feature-alternating", "faq", "cta-banner",
  "stats-row", "pricing", "testimonials", "product-grid",
] as const;
export type ComposableType = (typeof COMPOSABLE_TYPES)[number];

/** Background must be light enough for the template text color to stay readable. */
function isLightHex(value: string): boolean {
  const n = parseInt(value.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r + g + b) / 3 >= 200;
}

export const composePlanSchema = z
  .object({
    label: z.string().trim().min(3).max(40),
    name: z.string().trim().min(3).max(80),
    palette: z.object({ primary: hex, accent: hex, background: hex.refine(isLightHex, "Background harus terang") }),
    headingFont: z.enum(FONT_STYLES),
    bodyFont: z.enum(FONT_STYLES),
    heroVisual: z.enum(HERO_VISUALS),
    sections: z.array(z.enum(COMPOSABLE_TYPES)).min(2).max(6),
    copy: z.record(z.string(), z.record(z.string(), z.unknown())),
  })
  .superRefine((plan, ctx) => {
    if (!plan.sections[0]?.startsWith("hero-")) {
      ctx.addIssue({ code: "custom", path: ["sections"], message: "Section pertama harus hero" });
    }
    if (plan.sections.filter((s) => s.startsWith("hero-")).length !== 1) {
      ctx.addIssue({ code: "custom", path: ["sections"], message: "Harus tepat satu hero" });
    }
    if (new Set(plan.sections).size !== plan.sections.length) {
      ctx.addIssue({ code: "custom", path: ["sections"], message: "Tidak boleh ada tipe section ganda" });
    }
    for (const type of new Set(plan.sections)) {
      const r = sectionCopySchema(type).safeParse(plan.copy[type]);
      if (!r.success) ctx.addIssue({ code: "custom", path: ["copy", type], message: `Copy untuk ${type} tidak sesuai` });
    }
  });
export type ComposePlan = z.infer<typeof composePlanSchema>;

export const composeReplySchema = z.object({
  plans: z.array(composePlanSchema).length(3),
});

/** Three plans must differ in structure, otherwise the directions would look alike again. */
export function plansAreDistinct(plans: ComposePlan[]): boolean {
  const keys = plans.map((p) => `${p.sections.join(",")}|${p.heroVisual}|${p.headingFont}`);
  return new Set(keys).size === plans.length;
}

const FIELD_HINTS: Record<ComposableType, string> = {
  "stats-row": '{"items":[{"label","value","note"}] 2-4 item}',
  pricing: '{"heading","plans":[{"name","price","period","features":[teks] 2-8,"highlighted"}] 1-4 paket}',
  testimonials: '{"heading","items":[{"quote","name","role"}] 1-4 item}',
  "product-grid": '{"heading","items":[{"title","price","note"}] 2-8 produk}',
  "hero-centered": '{"badge","title","accent","description","ctaLabel"}',
  "hero-split": '{"badge","title","accent","description","ctaLabel"}',
  "hero-editorial": '{"badge","title","accent","description","ctaLabel"}',
  "feature-grid": '{"heading","items":[{"title","description"}] 2-8 item}',
  "feature-alternating": '{"heading","items":[{"title","description"}] 2-5 item}',
  faq: '{"heading","items":[{"question","answer"}] 2-8 item}',
  "cta-banner": '{"title","description","ctaLabel"}',
};

const SITE_TYPE_NAMES: Record<string, string> = {
  ecommerce: "toko online (jualan produk dengan katalog, harga, dan keranjang)",
  game: "landing game (promosi game, mode permainan, peringkat, dan komunitas)",
  streaming: "layanan streaming (film, serial, atau musik dengan paket langganan)",
  landing: "landing page profil usaha atau jasa",
};

export function buildComposePrompt(input: { brand: string; description: string; siteType?: string }): { system: string; user: string } {
  const catalog = COMPOSABLE_TYPES.map((t) => `- ${t}: copy ${FIELD_HINTS[t]}`).join("\n");
  const system =
    "Kamu adalah arsitek website berbahasa Indonesia. Balas HANYA dengan satu objek JSON. " +
    "Tanpa penjelasan, tanpa markdown, tanpa tag HTML, dan jangan memakai karakter < atau >. " +
    "Rancang struktur yang benar-benar cocok dengan jenis website yang diminta, bukan template umum.";
  const user = [
    `Nama bisnis atau proyek: ${clean(input.brand, 30) || "belum disebutkan"}`,
    `Brief: ${clean(input.description, 1000)}`,
    ...(input.siteType && SITE_TYPE_NAMES[input.siteType]
      ? [`Jenis website yang dipilih client: ${SITE_TYPE_NAMES[input.siteType]}. Susun struktur untuk jenis ini.`]
      : []),
    "",
    "Buat 3 rencana (plans) yang BERBEDA struktur, warna, dan font. Setiap plan berisi:",
    '- label: nama arah (3-40 karakter), name: nama website (3-80 karakter)',
    '- palette: {"primary","accent","background"} dalam format #RRGGBB. Background harus terang.',
    `- headingFont dan bodyFont: salah satu dari ${FONT_STYLES.join(", ")}`,
    `- heroVisual: salah satu dari ${HERO_VISUALS.join(", ")}. "pattern" cocok untuk game, papan, atau teknologi.`,
    "- sections: urutan section dari katalog. Section pertama harus hero, dan hanya satu hero. Tanpa duplikat.",
    "- copy: objek yang berisi copy untuk SETIAP section yang dipakai, dengan kunci berupa tipe section.",
    "",
    "Katalog section:",
    catalog,
    "",
    'Format balasan: {"plans":[plan1, plan2, plan3]}',
  ].join("\n");
  return { system, user };
}

export function parseComposeReply(text: string): ComposePlan[] {
  const parsed = composeReplySchema.parse(extractJsonObject(text));
  if (!plansAreDistinct(parsed.plans)) throw new Error("Plans are not distinct enough");
  return parsed.plans;
}

/**
 * Starting content for types the templates do not cover. Copy replaces it entirely,
 * so only the shape (and the image reference) matters here.
 */
function minimalBase(type: string): Section | undefined {
  const placeholder = { kind: "placeholder" as const, label: "Gambar", aspect: "1:1" as const };
  switch (type) {
    case "stats-row":
      return { id: type, type, content: { items: [{ label: "Item", value: "0" }, { label: "Item", value: "0" }] }, settings: { layout: "boxed" } } as Section;
    case "pricing":
      return { id: type, type, content: { heading: "Paket", plans: [{ name: "Paket", price: "0", features: ["Fitur", "Fitur"], cta: { label: "Pilih", href: "#contact" }, highlighted: false }] }, settings: { emphasis: "highlighted" } } as Section;
    case "testimonials":
      return { id: type, type, content: { heading: "Testimoni", items: [{ quote: "Pengalaman yang baik.", name: "Pelanggan", role: "Pengguna" }] }, settings: { layout: "columns" } } as Section;
    case "product-grid":
      return { id: type, type, content: { heading: "Produk", items: [{ title: "Produk", price: "0", image: placeholder }, { title: "Produk", price: "0", image: placeholder }] }, settings: { columns: 3 } } as Section;
    default:
      return undefined;
  }
}

/** Turns one validated plan into a full spec. Navbar and footer come from the template. */
export function composeSpec(plan: ComposePlan, ctx: { brand: string; description: string; index: number }): DesignSpec {
  const starter = buildLandingDirections({ brand: ctx.brand, description: ctx.description });
  const find = (type: string): Section | undefined => {
    for (const d of starter) {
      const found = d.sections.find((s) => s.type === type);
      if (found) return found;
    }
    return minimalBase(type);
  };
  const nav = starter[0]!.sections.find((s) => s.type === "navbar")!;
  const footer = starter[0]!.sections.find((s) => s.type === "footer")!;

  const counts = new Map<string, number>();
  const chosen: Section[] = plan.sections.map((type) => {
    const base = find(type);
    if (!base) throw new Error(`No template for ${type}`);
    const section = applySectionCopy(structuredClone(base), plan.copy[type] as Record<string, any>);
    const n = (counts.get(type) ?? 0) + 1;
    counts.set(type, n);
    const id = n === 1 ? (type.startsWith("hero-") ? "hero" : type) : `${type}-${n}`;
    const withVisual = type.startsWith("hero-")
      ? { ...section, settings: { ...(section as any).settings, visual: plan.heroVisual } }
      : section;
    return { ...withVisual, id } as Section;
  });

  const base = starter[0]!.tokens;
  const spec = {
    schemaVersion: 1 as const,
    name: plan.name,
    direction: `ai-${ctx.index + 1}`,
    category: "landing" as const,
    tokens: {
      ...base,
      colors: { ...base.colors, primary: plan.palette.primary, accent: plan.palette.accent, background: plan.palette.background },
      typography: { heading: plan.headingFont, body: plan.bodyFont, scale: "balanced" as const },
    },
    sections: [nav, ...chosen, footer],
  };
  return designSpecSchema.parse(spec);
}
