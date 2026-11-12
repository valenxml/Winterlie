import { designSpecSchema, type DesignSpec } from "./design.js";
import type { Section } from "./sections.js";
import type { DesignTokens } from "./tokens.js";

/**
 * Deterministic direction generator. Each direction has a distinct archetype:
 * layout, type, density, and section order. Output always passes designSpecSchema.
 * AI generation will later replace the body of these builders, not their contract.
 */

export interface DirectionInput {
  brand: string;
  description: string;
}

const MAX = { brand: 30, title: 120, description: 300, label: 40 };

/** Strips markup and trims to a limit. The schema rejects < and >, so this must run first. */
export function clean(value: string, max: number): string {
  const v = value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
  return v.length > max ? v.slice(0, max - 1).trimEnd() + "…" : v;
}

function firstSentence(text: string, max: number): string {
  const cleaned = clean(text, 2000);
  const match = cleaned.match(/^.*?[.!?](\s|$)/);
  return clean(match ? match[0] : cleaned, max);
}

const common = {
  primaryCta: { label: "Mulai sekarang", href: "#contact" },
  secondaryCta: { label: "Lihat detail", href: "#features" },
};

/** Picks the last word of the title as the accent, so it stays a real substring of the title. */
export function accentWord(title: string): string | undefined {
  const words = title.split(/\s+/).filter(Boolean);
  const last = words[words.length - 1];
  return last && last.length <= 40 ? last : undefined;
}

const image = (label: string) => ({ kind: "placeholder" as const, label: clean(label, 80), aspect: "4:3" as const });

function footer(brand: string): Section {
  return {
    id: "footer", type: "footer",
    content: {
      brand: clean(brand, MAX.brand),
      tagline: "Dibuat dengan Winterlie",
      columns: [
        { title: "Halaman", links: [{ label: "Tentang", href: "#about" }, { label: "Kontak", href: "#contact" }] },
      ],
      legal: "© 2026 " + clean(brand, MAX.brand),
    },
    settings: { layout: "columns" },
  } as Section;
}

function navbar(brand: string, style: "plain" | "bordered" | "floating"): Section {
  return {
    id: "nav", type: "navbar",
    content: {
      brand: clean(brand, MAX.brand),
      links: [{ label: "Tentang", href: "#about" }, { label: "Layanan", href: "#features" }, { label: "Kontak", href: "#contact" }],
      cta: { label: "Hubungi kami", href: "#contact" },
    },
    settings: { style, sticky: true },
  } as Section;
}

function tokens(t: DesignTokens): DesignTokens { return t; }

export function buildLandingDirections(input: DirectionInput): DesignSpec[] {
  const brand = clean(input.brand, MAX.brand) || "Brand Anda";
  const title = clean(input.brand, MAX.title) || "Selamat datang";
  const desc = firstSentence(input.description, MAX.description);
  const ctaDesc = firstSentence(input.description, 240); // cta-banner description limit

  const editorial: DesignSpec = {
    schemaVersion: 1,
    name: `${brand} · Editorial`,
    direction: "editorial-warm",
    category: "landing",
    tokens: tokens({
      colors: { primary: "#493426", accent: "#C0733A", background: "#F7F2EA", surface: "#FFFFFF", text: "#25211E", muted: "#6B625A", border: "#E2D7C8" },
      typography: { heading: "serif-editorial", body: "sans-humanist", scale: "dramatic" },
      spacing: { section: "airy", containerWidth: 1200 },
      radius: "sm",
      shadow: "soft",
    }),
    sections: [
      navbar(brand, "bordered"),
      {
        id: "hero", type: "hero-editorial",
        content: { eyebrow: clean(brand, MAX.label), badge: "Baru", title, accent: accentWord(title), description: desc, ...common, image: image(`Gambar utama ${brand}`) },
        settings: { alignment: "left", imagePosition: "right", titleScale: "massive", visual: "device" },
      } as Section,
      {
        id: "features", type: "feature-grid",
        content: {
          heading: "Yang kami tawarkan", intro: "Tiga alasan untuk memilih kami.",
          items: [
            { title: "Dikerjakan dengan teliti", description: "Setiap detail diperiksa sebelum dikirim.", icon: "heart" },
            { title: "Respons cepat", description: "Pertanyaan dijawab dalam hari yang sama.", icon: "clock" },
            { title: "Hasil yang terukur", description: "Setiap langkah punya tujuan yang jelas.", icon: "chart" },
          ],
        },
        settings: { columns: 3, cardStyle: "plain" },
      } as Section,
      {
        id: "faq", type: "faq",
        content: {
          heading: "Pertanyaan umum",
          items: [
            { question: "Bagaimana cara memulai?", answer: "Hubungi kami dan ceritakan kebutuhan Anda." },
            { question: "Berapa lama prosesnya?", answer: "Tergantung cakupan, biasanya kami kabari di awal." },
          ],
        },
        settings: { layout: "accordion" },
      } as Section,
      footer(brand),
    ],
  };

  const bold: DesignSpec = {
    schemaVersion: 1,
    name: `${brand} · Bold`,
    direction: "bold-modern",
    category: "landing",
    tokens: tokens({
      colors: { primary: "#6D4AFF", accent: "#17151F", background: "#F5F4FB", surface: "#FFFFFF", text: "#15131C", muted: "#6B6880", border: "#E6E4F0" },
      typography: { heading: "sans-grotesk", body: "sans-humanist", scale: "balanced" },
      spacing: { section: "normal", containerWidth: 1120 },
      radius: "lg",
      shadow: "layered",
    }),
    sections: [
      navbar(brand, "floating"),
      {
        id: "hero", type: "hero-centered",
        content: { badge: "Baru", title, accent: accentWord(title), description: desc, ...common, image: image(`Visual ${brand}`) },
        settings: { showBadge: true, visual: "cards" },
      } as Section,
      {
        id: "stats", type: "stats-row",
        content: {
          items: [
            { label: "Proyek", value: "Mulai", note: "Dari satu brief" },
            { label: "Revisi", value: "Terbuka", note: "Setiap section" },
            { label: "Format", value: "Siap pakai" },
          ],
        },
        settings: { layout: "boxed" },
      } as Section,
      {
        id: "features", type: "feature-alternating",
        content: {
          heading: "Cara kerjanya",
          items: [
            { title: "Ceritakan kebutuhan", description: "Satu brief sudah cukup untuk memulai.", image: image("Brief") },
            { title: "Pilih arah", description: "Bandingkan beberapa arah sebelum memutuskan.", image: image("Arah desain") },
          ],
        },
        settings: { startImageSide: "left" },
      } as Section,
      {
        id: "cta", type: "cta-banner",
        content: { title: "Siap mulai?", description: ctaDesc, cta: { label: "Mulai sekarang", href: "#contact" } },
        settings: { tone: "inverted" },
      } as Section,
      footer(brand),
    ],
  };

  const calm: DesignSpec = {
    schemaVersion: 1,
    name: `${brand} · Calm`,
    direction: "calm-minimal",
    category: "landing",
    tokens: tokens({
      colors: { primary: "#2F5D50", accent: "#8FB9A8", background: "#F4F7F5", surface: "#FFFFFF", text: "#1C2B27", muted: "#5D6F69", border: "#D9E4DF" },
      typography: { heading: "sans-geometric", body: "sans-humanist", scale: "compact" },
      spacing: { section: "tight", containerWidth: 1080 },
      radius: "md",
      shadow: "none",
    }),
    sections: [
      navbar(brand, "plain"),
      {
        id: "hero", type: "hero-split",
        content: { title, description: desc, ...common, image: image(`Foto ${brand}`) },
        settings: { imagePosition: "right", emphasis: "text", visual: "gradient" },
      } as Section,
      {
        id: "features", type: "feature-grid",
        content: {
          heading: "Fokus pada yang penting",
          items: [
            { title: "Sederhana", description: "Tanpa elemen yang tidak perlu.", icon: "layers" },
            { title: "Terpercaya", description: "Dikerjakan dengan konsisten.", icon: "shield" },
            { title: "Dekat", description: "Mudah dihubungi kapan saja.", icon: "users" },
            { title: "Jelas", description: "Harga dan proses tidak disembunyikan.", icon: "inbox" },
          ],
        },
        settings: { columns: 2, cardStyle: "outlined" },
      } as Section,
      {
        id: "faq", type: "faq",
        content: {
          heading: "Sebelum Anda menghubungi kami",
          items: [
            { question: "Apakah ada minimal pemesanan?", answer: "Tidak ada. Mulai dari kebutuhan yang Anda punya." },
            { question: "Di mana lokasinya?", answer: "Silakan hubungi kami untuk alamat dan jadwal kunjungan." },
          ],
        },
        settings: { layout: "two-column" },
      } as Section,
      footer(brand),
    ],
  };

  return [editorial, bold, calm].map((spec) => designSpecSchema.parse(spec));
}
