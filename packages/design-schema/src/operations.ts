import { designSpecSchema, type DesignSpec } from "./design.js";
import { sectionSchema, type Section } from "./sections.js";

export class DesignOperationError extends Error {}

function indexOfSection(spec: DesignSpec, id: string): number {
  const idx = spec.sections.findIndex((s) => s.id === id);
  if (idx === -1) throw new DesignOperationError(`Section "${id}" not found`);
  return idx;
}

/** Re-validates the whole spec so no operation can produce an invalid design. */
function commit(spec: DesignSpec, sections: Section[]): DesignSpec {
  return designSpecSchema.parse({ ...spec, sections });
}

/**
 * Replace exactly one section (used by "Regenerate This Section").
 * The replacement is validated and must keep the original id. All other
 * sections are left structurally identical, which the tests assert.
 */
export function replaceSection(spec: DesignSpec, sectionId: string, replacement: unknown): DesignSpec {
  const idx = indexOfSection(spec, sectionId);
  const parsed = sectionSchema.parse(replacement);
  if (parsed.id !== sectionId) {
    throw new DesignOperationError("Replacement section must keep the original id");
  }
  const next = spec.sections.slice();
  next[idx] = parsed;
  return commit(spec, next);
}

export function removeSection(spec: DesignSpec, sectionId: string): DesignSpec {
  const idx = indexOfSection(spec, sectionId);
  if (spec.sections.length === 1) throw new DesignOperationError("A design needs at least one section");
  return commit(spec, spec.sections.filter((_, i) => i !== idx));
}

export function moveSection(spec: DesignSpec, sectionId: string, toIndex: number): DesignSpec {
  const from = indexOfSection(spec, sectionId);
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= spec.sections.length) {
    throw new DesignOperationError("Target index out of range");
  }
  const next = spec.sections.slice();
  const [moved] = next.splice(from, 1);
  next.splice(toIndex, 0, moved as Section);
  return commit(spec, next);
}

export function addSection(spec: DesignSpec, section: unknown, atIndex?: number): DesignSpec {
  const parsed = sectionSchema.parse(section);
  const next = spec.sections.slice();
  next.splice(atIndex ?? next.length, 0, parsed);
  return commit(spec, next);
}

/** Returns the ids of sections whose content or settings differ between two specs. */
export function changedSectionIds(a: DesignSpec, b: DesignSpec): string[] {
  const ids = new Set([...a.sections, ...b.sections].map((s) => s.id));
  return [...ids].filter((id) => {
    const x = a.sections.find((s) => s.id === id);
    const y = b.sections.find((s) => s.id === id);
    return JSON.stringify(x) !== JSON.stringify(y);
  });
}
