import { z } from "zod";
import { designSpecSchema, type DesignSpec } from "./design.js";
import { moveSection, removeSection, replaceSection } from "./operations.js";

/**
 * Operations a client may send for one design version. Each one produces a new,
 * fully validated spec. The server stores it as a new version; the old one is kept.
 */
export const designOpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("replace"), sectionId: z.string().min(1).max(48), section: z.unknown() }),
  z.object({ op: z.literal("move"), sectionId: z.string().min(1).max(48), toIndex: z.number().int().min(0).max(29) }),
  z.object({ op: z.literal("remove"), sectionId: z.string().min(1).max(48) }),
]);
export type DesignOp = z.infer<typeof designOpSchema>;

export function applyDesignOp(spec: DesignSpec, op: DesignOp): DesignSpec {
  switch (op.op) {
    case "replace":
      return replaceSection(spec, op.sectionId, op.section);
    case "move":
      return moveSection(spec, op.sectionId, op.toIndex);
    case "remove":
      return removeSection(spec, op.sectionId);
  }
}

/** Re-validates a stored spec before it is edited, so old rows cannot bypass the schema. */
export function parseStoredSpec(value: unknown): DesignSpec {
  return designSpecSchema.parse(value);
}
