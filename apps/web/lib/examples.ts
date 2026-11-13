import examples from "./examples.json";
import type { DesignSpec } from "@workshop/design-schema";

export interface Example {
  slug: string;
  /** Site type, matches the Mockup Maker picker value. */
  type: "ecommerce" | "game" | "streaming" | "landing";
  title: string;
  brief: string;
  spec: DesignSpec;
}

/** Example websites shown on the public gallery. Built from the same archetypes as Mockup Maker. */
export const EXAMPLES = examples as unknown as Example[];

export function findExample(slug: string): Example | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}
