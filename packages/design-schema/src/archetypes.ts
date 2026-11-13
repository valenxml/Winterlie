import { composePlanSchema, composeSpec, type ComposePlan, type ComposableType } from "./compose.js";
import type { DesignSpec } from "./design.js";
import { clean } from "./templates.js";

/**
 * Website archetypes. Each one fixes the section structure and the copy vocabulary of a
 * kind of site. Used when the AI is unavailable, so the fallback still matches the brief.
 */

export type ArchetypeId = "ecommerce" | "game" | "streaming" | "landing";

interface Archetype {
  label: string;
  pattern: RegExp;
  sections: ComposableType[];
  heroVisual: "device" | "cards" | "gradient" | "pattern";
  cta: string;
  headline: string;
  features: [string, string][];
  featureHeading: string;
  faq: [string, string][];
  ctaTitle: string;
  ctaDesc: string;
  products?: [string, string][];
  stats?: [string, string][];
  plans?: { name: string; price: string; period: string; features: string[] }[];
  testimonials?: [string, string, string][];
}

const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  ecommerce: {
    label: "Toko online",
    pattern: /\b(toko|jual|jualan|produk|belanja|e-?commerce|marketplace|checkout|keranjang)\b/,
    sections: ["hero-split", "product-grid", "testimonials", "faq", "cta-banner"],
    heroVisual: "cards",
    cta: "Belanja sekarang",
    headline: "Produk pilihan dengan pengiriman cepat",
    features: [],
    featureHeading: "",
    faq: [
      ["Bagaimana cara memesan?", "Pilih produk, masukkan ke keranjang, lalu selesaikan pembayaran."],
      ["Berapa lama pengiriman?", "Pengiriman tergantung wilayah, biasanya dikonfirmasi saat checkout."],
    ],
    ctaTitle: "Temukan produk yang Anda cari",
    ctaDesc: "Mulai belanja dan nikmati penawaran yang tersedia hari ini.",
    products: [
      ["Produk unggulan", "Rp 150.000"],
      ["Pilihan terlaris", "Rp 220.000"],
      ["Edisi terbatas", "Rp 275.000"],
    ],
    testimonials: [
      ["Pesanan sampai dengan kondisi baik dan sesuai deskripsi.", "Rina", "Pembeli"],
      ["Prosesnya mudah dan admin responsif.", "Dimas", "Pelanggan tetap"],
    ],
  },
  game: {
    label: "Landing game",
    pattern: /\b(game|gim|esport|mabar|catur|papan|turnamen|rank|peringkat|level|permainan)\b/,
    sections: ["hero-centered", "feature-grid", "stats-row", "faq", "cta-banner"],
    heroVisual: "pattern",
    cta: "Main sekarang",
    headline: "Mainkan sekarang, tantang pemain lain",
    features: [
      ["Mode cepat", "Partai singkat untuk latihan dan hiburan."],
      ["Peringkat", "Naik level dari setiap kemenangan."],
      ["Komunitas", "Bergabung dengan pemain dari berbagai level."],
    ],
    featureHeading: "Yang bisa Anda lakukan",
    faq: [
      ["Apakah gratis dimainkan?", "Mode dasar gratis. Fitur tambahan tersedia di paket tertentu."],
      ["Bagaimana sistem peringkat?", "Peringkat dihitung dari hasil setiap partai."],
    ],
    ctaTitle: "Siap menguji kemampuanmu?",
    ctaDesc: "Buat akun dan langsung cari lawan yang sepadan.",
    stats: [["Pemain", "Ribuan"], ["Partai", "Setiap hari"], ["Mode", "Beragam"]],
  },
  streaming: {
    label: "Layanan streaming",
    pattern: /\b(stream|streaming|tonton|film|video|serial|musik|podcast|channel|konten|nonton)\b/,
    sections: ["hero-editorial", "feature-alternating", "pricing", "faq", "cta-banner"],
    heroVisual: "device",
    cta: "Mulai menonton",
    headline: "Tonton kapan saja, di perangkat apa saja",
    features: [],
    featureHeading: "Kenapa menonton di sini",
    faq: [
      ["Bisa dipakai di banyak perangkat?", "Bisa, dengan batas perangkat sesuai paket."],
      ["Bisa berhenti kapan saja?", "Ya, langganan bisa dihentikan kapan saja."],
    ],
    ctaTitle: "Mulai tonton hari ini",
    ctaDesc: "Coba gratis dan lanjutkan dari perangkat mana pun.",
    plans: [
      { name: "Dasar", price: "Rp 49.000", period: "/bulan", features: ["Kualitas standar", "1 perangkat"] },
      { name: "Keluarga", price: "Rp 99.000", period: "/bulan", features: ["Kualitas HD", "4 perangkat", "Profil anak"] },
    ],
  },
  landing: {
    label: "Landing page",
    pattern: /.*/,
    sections: ["hero-split", "feature-grid", "faq", "cta-banner"],
    heroVisual: "gradient",
    cta: "Mulai sekarang",
    headline: "Solusi yang dibuat untuk kebutuhan Anda",
    features: [
      ["Dikerjakan dengan teliti", "Setiap detail diperiksa sebelum dikirim."],
      ["Respons cepat", "Pertanyaan dijawab dengan cepat."],
      ["Hasil yang jelas", "Setiap langkah punya tujuan yang terukur."],
    ],
    featureHeading: "Yang kami tawarkan",
    faq: [
      ["Bagaimana cara memulai?", "Hubungi kami dan ceritakan kebutuhan Anda."],
      ["Berapa lama prosesnya?", "Tergantung cakupan, kami kabari di awal."],
    ],
    ctaTitle: "Siap memulai?",
    ctaDesc: "Ceritakan kebutuhan Anda dan kami bantu wujudkan.",
  },
};

const PALETTES: [string, string, string][] = [
  ["#1F2937", "#B45309", "#F8F5EE"],
  ["#2F5D50", "#8FB9A8", "#F4F7F5"],
  ["#6D4AFF", "#17151F", "#F5F4FB"],
];

/** Picks the archetype from the brief. The first matching pattern wins; landing is the default. */
export function pickArchetype(description: string): ArchetypeId {
  const text = clean(description, 2000).toLowerCase();
  if (ARCHETYPES.ecommerce.pattern.test(text)) return "ecommerce";
  if (ARCHETYPES.game.pattern.test(text)) return "game";
  if (ARCHETYPES.streaming.pattern.test(text)) return "streaming";
  return "landing";
}

function headingFor(type: ComposableType, a: Archetype): string {
  return type === "faq" ? "Pertanyaan umum" : a.featureHeading || "Yang kami tawarkan";
}

/** Copy for one section type, from the archetype vocabulary and the brand name. */
function copyFor(type: ComposableType, a: Archetype, brand: string, description: string): Record<string, unknown> {
  const cleaned = clean(brand, 120);
  // Titles need at least 3 characters; very short brand names fall back to the archetype headline.
  const title = cleaned.length >= 3 ? cleaned : a.headline;
  const words = title.split(/\s+/).filter(Boolean);
  const accent = words[words.length - 1];
  const desc = clean(description, 300).length >= 10 ? clean(description, 300) : `${a.headline} dari ${title}.`;
  switch (type) {
    case "hero-centered":
    case "hero-split":
    case "hero-editorial":
      return { badge: a.label, title: `${title}`.slice(0, 120), accent: accent && accent.length <= 40 ? accent : undefined, description: desc, ctaLabel: a.cta };
    case "feature-grid":
    case "feature-alternating":
      return {
        heading: headingFor(type, a),
        items: (a.features.length ? a.features : [["Pilihan", "Dirancang sesuai kebutuhan Anda."], ["Kualitas", "Dikerjakan dengan teliti."], ["Dukungan", "Tim siap membantu."]]).map(([t, d]) => ({ title: t, description: d })),
      };
    case "faq":
      return { heading: "Pertanyaan umum", items: a.faq.map(([q, ans]) => ({ question: q, answer: ans })) };
    case "cta-banner":
      return { title: a.ctaTitle, description: a.ctaDesc, ctaLabel: a.cta };
    case "product-grid":
      return { heading: "Produk pilihan", items: (a.products ?? [["Produk", "Rp 0"], ["Produk", "Rp 0"]]).map(([t, p]) => ({ title: t, price: p })) };
    case "stats-row":
      return { items: (a.stats ?? [["Layanan", "Siap"], ["Dukungan", "Cepat"]]).map(([l, v]) => ({ label: l, value: v })) };
    case "pricing":
      return {
        heading: "Pilih paket",
        plans: (a.plans ?? [{ name: "Dasar", price: "Gratis", period: "", features: ["Fitur dasar", "Dukungan standar"] }]).map((p, i) => ({
          name: p.name, price: p.price, period: p.period || undefined, features: p.features, highlighted: i === 1,
        })),
      };
    case "testimonials":
      return { heading: "Kata mereka", items: (a.testimonials ?? []).map(([q, n, r]) => ({ quote: q, name: n, role: r })) };
    default:
      return {};
  }
}

/**
 * Structural variants of one archetype. Variant 0 keeps the base order. Variant 1 swaps two
 * middle sections. Variant 2 drops the section before the closing call to action. The hero
 * always stays first.
 */
function variantSections(base: ComposableType[], variant: number): ComposableType[] {
  const list = [...base];
  if (variant === 1 && list.length >= 4) {
    [list[1], list[2]] = [list[2]!, list[1]!];
  }
  if (variant === 2 && list.length >= 5) {
    list.splice(list.length - 2, 1);
  }
  return list;
}

/**
 * Three distinct plans for one archetype (different palette, font, and hero visual),
 * each validated. Used as the fallback when the AI cannot compose a structure.
 */
export function archetypePlans(
  description: string,
  brand: string,
  chosen: ArchetypeId | "auto" = "auto",
): { archetype: ArchetypeId; plans: ComposePlan[] } {
  const id = chosen === "auto" ? pickArchetype(description) : chosen;
  const a = ARCHETYPES[id];
  const fonts: ["sans-grotesk" | "serif-classic" | "sans-geometric", "sans-humanist"][] = [
    ["sans-grotesk", "sans-humanist"], ["serif-classic", "sans-humanist"], ["sans-geometric", "sans-humanist"],
  ];
  const visuals = [a.heroVisual, a.heroVisual === "pattern" ? "cards" : "gradient", "gradient"] as const;

  const plans = PALETTES.map(([primary, accent, background], i) => {
    const [headingFont, bodyFont] = fonts[i]!;
    const sections = variantSections(a.sections, i);
    const copy: Record<string, unknown> = {};
    for (const type of sections) copy[type] = copyFor(type, a, brand, description);
    return composePlanSchema.parse({
      label: `${a.label} ${i + 1}`,
      name: (clean(brand, 80).length >= 3 ? clean(brand, 80) : a.headline).slice(0, 80),
      palette: { primary, accent, background },
      headingFont,
      bodyFont,
      heroVisual: visuals[i],
      sections,
      copy,
    });
  });
  return { archetype: id, plans };
}

/** Website types a client can choose, with the text shown in the picker. */
export const SITE_TYPES: { id: ArchetypeId | "auto"; label: string; hint: string }[] = [
  { id: "auto", label: "Otomatis", hint: "Biarkan brief yang menentukan" },
  { id: "ecommerce", label: "Toko online", hint: "Jualan produk dengan katalog dan keranjang" },
  { id: "game", label: "Landing game", hint: "Promosi game, peringkat, dan komunitas" },
  { id: "streaming", label: "Streaming", hint: "Tonton film, serial, atau musik dengan paket langganan" },
  { id: "landing", label: "Landing page", hint: "Profil usaha atau jasa dengan ajakan" },
];

export function isArchetypeId(value: string): value is ArchetypeId {
  return value in ARCHETYPES;
}

/** Full specs from the archetype fallback. A chosen type overrides the keyword guess. */
export function archetypeSpecs(
  description: string,
  brand: string,
  chosen: ArchetypeId | "auto" = "auto",
): { archetype: ArchetypeId; specs: DesignSpec[] } {
  const { archetype, plans } = archetypePlans(description, brand, chosen);
  const specs = plans.map((plan, index) => composeSpec(plan, { brand, description, index }));
  return { archetype, specs };
}
