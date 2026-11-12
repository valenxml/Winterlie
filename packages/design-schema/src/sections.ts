import { z } from "zod";
import { iconSchema, imageRefSchema, linkSchema, safeText, safeHref, sectionIdSchema } from "./primitives.js";

const section = <T extends string, C extends z.ZodTypeAny, S extends z.ZodTypeAny>(
  type: T,
  content: C,
  settings: S,
) => z.object({ id: sectionIdSchema, type: z.literal(type), content, settings });

/** Visual treatment for the hero: a device frame, floating cards, or a soft gradient. */
export const HERO_VISUALS = ["device", "cards", "gradient"] as const;

const heroContent = z.object({
  eyebrow: safeText(40).optional(),
  badge: safeText(30).optional(),
  title: safeText(120),
  /** One word of the title shown in the accent color. Must appear in title (checked in the design spec). */
  accent: safeText(40).optional(),
  description: safeText(300),
  primaryCta: linkSchema,
  secondaryCta: linkSchema.optional(),
  image: imageRefSchema,
});

const item = z.object({ title: safeText(60), description: safeText(220) });

// ---------- Landing sections ----------
export const navbarSection = section(
  "navbar",
  z.object({ brand: safeText(30), links: z.array(linkSchema).min(2).max(6), cta: linkSchema.optional() }),
  z.object({ style: z.enum(["plain", "bordered", "floating"]), sticky: z.boolean() }),
);

export const heroEditorialSection = section(
  "hero-editorial",
  heroContent,
  z.object({
    alignment: z.enum(["left", "center"]),
    imagePosition: z.enum(["left", "right", "background"]),
    titleScale: z.enum(["large", "xl", "massive"]),
    visual: z.enum(HERO_VISUALS).optional(),
  }),
);

export const heroSplitSection = section(
  "hero-split",
  heroContent,
  z.object({ imagePosition: z.enum(["left", "right"]), emphasis: z.enum(["text", "image"]), visual: z.enum(HERO_VISUALS).optional() }),
);

export const heroCenteredSection = section(
  "hero-centered",
  heroContent.extend({ image: imageRefSchema.optional() }),
  z.object({ showBadge: z.boolean(), visual: z.enum(HERO_VISUALS).optional() }),
);

export const featureGridSection = section(
  "feature-grid",
  z.object({
    heading: safeText(100),
    intro: safeText(240).optional(),
    items: z.array(item.extend({ icon: iconSchema })).min(3).max(8),
  }),
  z.object({ columns: z.union([z.literal(2), z.literal(3), z.literal(4)]), cardStyle: z.enum(["outlined", "filled", "plain"]) }),
);

export const featureAlternatingSection = section(
  "feature-alternating",
  z.object({ heading: safeText(100), items: z.array(item.extend({ image: imageRefSchema })).min(2).max(5) }),
  z.object({ startImageSide: z.enum(["left", "right"]) }),
);

export const statsRowSection = section(
  "stats-row",
  z.object({
    items: z.array(z.object({ label: safeText(40), value: safeText(20), note: safeText(80).optional() })).min(2).max(4),
  }),
  z.object({ layout: z.enum(["inline", "boxed"]) }),
);

export const testimonialsSection = section(
  "testimonials",
  z.object({
    heading: safeText(100),
    items: z.array(z.object({ quote: safeText(280), name: safeText(60), role: safeText(80) })).min(1).max(4),
  }),
  z.object({ layout: z.enum(["single", "columns"]) }),
);

export const pricingSection = section(
  "pricing",
  z.object({
    heading: safeText(100),
    plans: z
      .array(
        z.object({
          name: safeText(40),
          price: safeText(24),
          period: safeText(20).optional(),
          features: z.array(safeText(100)).min(2).max(8),
          cta: linkSchema,
          highlighted: z.boolean(),
        }),
      )
      .min(1)
      .max(4),
  }),
  z.object({ emphasis: z.enum(["highlighted", "equal"]) }),
);

export const faqSection = section(
  "faq",
  z.object({
    heading: safeText(100),
    items: z.array(z.object({ question: safeText(140), answer: safeText(400) })).min(2).max(8),
  }),
  z.object({ layout: z.enum(["accordion", "two-column"]) }),
);

export const ctaBannerSection = section(
  "cta-banner",
  z.object({ title: safeText(120), description: safeText(240).optional(), cta: linkSchema }),
  z.object({ tone: z.enum(["primary", "inverted", "subtle"]) }),
);

export const footerSection = section(
  "footer",
  z.object({
    brand: safeText(30),
    tagline: safeText(140).optional(),
    columns: z.array(z.object({ title: safeText(30), links: z.array(linkSchema).min(1).max(6) })).min(1).max(4),
    legal: safeText(140),
  }),
  z.object({ layout: z.enum(["columns", "minimal"]) }),
);

// ---------- Dashboard sections ----------
export const dashboardSidebarSection = section(
  "dashboard-sidebar",
  z.object({
    brand: safeText(30),
    items: z.array(z.object({ label: safeText(30), href: safeHref, icon: iconSchema })).min(3).max(10),
  }),
  z.object({ collapsed: z.boolean() }),
);

export const dashboardKpisSection = section(
  "dashboard-kpis",
  z.object({
    items: z.array(z.object({ label: safeText(40), value: safeText(20), delta: safeText(20).optional() })).min(2).max(4),
  }),
  z.object({ density: z.enum(["compact", "comfortable"]) }),
);

export const dashboardTableSection = section(
  "dashboard-table",
  z.object({
    title: safeText(80),
    columns: z.array(safeText(30)).min(2).max(6),
    rows: z.array(z.array(safeText(60))).min(1).max(10),
  }),
  z.object({ striped: z.boolean(), density: z.enum(["compact", "comfortable"]) }),
);

export const sectionSchema = z.discriminatedUnion("type", [
  navbarSection, heroEditorialSection, heroSplitSection, heroCenteredSection,
  featureGridSection, featureAlternatingSection, statsRowSection, testimonialsSection,
  pricingSection, faqSection, ctaBannerSection, footerSection,
  dashboardSidebarSection, dashboardKpisSection, dashboardTableSection,
]);
export type Section = z.infer<typeof sectionSchema>;
export type SectionType = Section["type"];

export const LANDING_SECTION_TYPES = [
  "navbar", "hero-editorial", "hero-split", "hero-centered", "feature-grid",
  "feature-alternating", "stats-row", "testimonials", "pricing", "faq", "cta-banner", "footer",
] as const satisfies readonly SectionType[];

export const DASHBOARD_SECTION_TYPES = [
  "dashboard-sidebar", "dashboard-kpis", "dashboard-table",
] as const satisfies readonly SectionType[];
