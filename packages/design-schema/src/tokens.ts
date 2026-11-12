import { z } from "zod";
import { hexColor } from "./primitives.js";

/** Font roles map to an allowlist; arbitrary CSS font strings are never accepted. */
export const FONT_STYLES = [
  "serif-editorial", "serif-classic", "sans-grotesk", "sans-humanist",
  "sans-geometric", "display-condensed", "mono-technical",
] as const;

export const designTokensSchema = z.object({
  colors: z.object({
    primary: hexColor,
    accent: hexColor,
    background: hexColor,
    surface: hexColor,
    text: hexColor,
    muted: hexColor,
    border: hexColor,
  }),
  typography: z.object({
    heading: z.enum(FONT_STYLES),
    body: z.enum(FONT_STYLES),
    scale: z.enum(["compact", "balanced", "dramatic"]),
  }),
  spacing: z.object({
    section: z.enum(["tight", "normal", "airy", "dramatic"]),
    containerWidth: z.number().int().min(880).max(1440),
  }),
  radius: z.enum(["none", "sm", "md", "lg", "full"]),
  shadow: z.enum(["none", "soft", "hard", "layered"]),
});
export type DesignTokens = z.infer<typeof designTokensSchema>;
