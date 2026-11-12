import { z } from "zod";

/** Plain text only. AI output is untrusted, so markup characters are rejected. */
export const safeText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((s) => !/[<>]/.test(s), "Markup is not allowed in text fields");

export const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Expected #RRGGBB");

export function isSafeHref(value: string): boolean {
  if (value.startsWith("#")) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" || u.protocol === "mailto:";
  } catch {
    return false;
  }
}

export const safeHref = z.string().trim().max(300).refine(isSafeHref, "Unsafe or invalid link");

export const sectionIdSchema = z.string().regex(/^[a-z][a-z0-9-]{0,47}$/, "Invalid section id");

export const linkSchema = z.object({ label: safeText(40), href: safeHref });
export type Link = z.infer<typeof linkSchema>;

/** Images are never arbitrary URLs: either a placeholder or a stored asset. */
export const imageRefSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("placeholder"),
    label: safeText(80),
    aspect: z.enum(["1:1", "4:3", "3:4", "16:9", "21:9"]),
  }),
  z.object({ kind: z.literal("asset"), assetId: z.string().uuid(), alt: safeText(160) }),
]);
export type ImageRef = z.infer<typeof imageRefSchema>;

export const ICON_NAMES = [
  "sparkles", "clock", "shield", "map-pin", "coffee", "users",
  "chart", "layers", "zap", "heart", "home", "settings", "inbox", "file",
] as const;
export const iconSchema = z.enum(ICON_NAMES);
