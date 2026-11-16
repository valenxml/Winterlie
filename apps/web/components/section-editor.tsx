"use client";

import { useState } from "react";
import type { DesignSpec, Section } from "@workshop/design-schema";

export type DesignOpPayload =
  | { op: "replace"; sectionId: string; section: unknown }
  | { op: "move"; sectionId: string; toIndex: number }
  | { op: "remove"; sectionId: string };

const LABEL: Record<string, string> = {
  navbar: "Navbar",
  "hero-editorial": "Hero",
  "hero-split": "Hero",
  "hero-centered": "Hero",
  "feature-grid": "Fitur",
  "feature-alternating": "Fitur bergantian",
  "stats-row": "Statistik",
  faq: "FAQ",
  "cta-banner": "Ajakan",
  footer: "Footer",
};

/** Sections whose text can be edited in this version of the editor. */
const EDITABLE = new Set(["navbar", "hero-editorial", "hero-split", "hero-centered", "cta-banner"]);

/** Section types the API can rewrite with AI. Keep in sync with REGENERATABLE_TYPES in design-schema. */
const REGENERATABLE = new Set([
  "hero-editorial", "hero-split", "hero-centered", "cta-banner", "feature-grid", "feature-alternating", "faq",
  "stats-row", "pricing", "testimonials", "product-grid",
]);

interface Props {
  spec: DesignSpec;
  busy: boolean;
  onOp: (op: DesignOpPayload) => Promise<void>;
  onRegenerate?: (sectionId: string) => Promise<void>;
  /** False when the user has no credits. Edits stay free; only AI rewrites are blocked. */
  canRegenerate?: boolean;
  regenerateHint?: string;
}

export function SectionEditor({ spec, busy, onOp, onRegenerate, canRegenerate = true, regenerateHint }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const active = spec.sections.find((s) => s.id === activeId) ?? null;

  function openSection(s: Section) {
    setActiveId(s.id);
    setDraft(readText(s));
  }

  async function save() {
    if (!active) return;
    const next = JSON.parse(JSON.stringify(active)) as Section;
    writeText(next, draft);
    await onOp({ op: "replace", sectionId: active.id, section: next });
    setActiveId(null);
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="muted" style={{ fontSize: 12.5 }}>Urutan section. Klik untuk mengedit teks.</div>
      {spec.sections.map((s, i) => {
        const editable = EDITABLE.has(s.type);
        return (
          <div key={s.id} className={`sec-row ${activeId === s.id ? "open" : ""}`}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <button type="button" className="sec-name" onClick={() => editable && openSection(s)} disabled={!editable || busy}>
                {LABEL[s.type] ?? s.type}
                {!editable && <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>tidak bisa diedit</span>}
              </button>
              <div className="row" style={{ gap: 4 }}>
                {onRegenerate && REGENERATABLE.has(s.type) && (
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !canRegenerate}
                    onClick={() => onRegenerate(s.id)}
                    title={canRegenerate ? "Tulis ulang teks section ini dengan AI (1 credit)" : regenerateHint}>
                    Buat ulang
                  </button>
                )}
                <button type="button" className="icon-btn" aria-label="Naik" disabled={busy || i === 0}
                  onClick={() => onOp({ op: "move", sectionId: s.id, toIndex: i - 1 })}>↑</button>
                <button type="button" className="icon-btn" aria-label="Turun" disabled={busy || i === spec.sections.length - 1}
                  onClick={() => onOp({ op: "move", sectionId: s.id, toIndex: i + 1 })}>↓</button>
                <button type="button" className="icon-btn danger" aria-label="Hapus" disabled={busy || spec.sections.length === 1}
                  onClick={() => onOp({ op: "remove", sectionId: s.id })}>×</button>
              </div>
            </div>

            {activeId === s.id && active && (
              <div className="stack" style={{ marginTop: 10, gap: 10 }}>
                {Object.keys(draft).map((key) => (
                  <div key={key}>
                    <label htmlFor={`f-${s.id}-${key}`}>{FIELD_LABEL[key] ?? key}</label>
                    {key === "description" || key === "answer" ? (
                      <textarea id={`f-${s.id}-${key}`} className="plain" rows={2} value={draft[key]}
                        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                    ) : (
                      <input id={`f-${s.id}-${key}`} className="plain" value={draft[key]}
                        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                    )}
                  </div>
                ))}
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveId(null)} disabled={busy}>Batal</button>
                  <button type="button" className="btn btn-sm" onClick={save} disabled={busy}>
                    {busy ? "Menyimpan..." : "Simpan sebagai versi baru"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const FIELD_LABEL: Record<string, string> = {
  brand: "Brand",
  title: "Judul",
  description: "Deskripsi",
  ctaLabel: "Label tombol utama",
};

/** Maps a section to the plain-text fields the editor exposes. */
function readText(s: Section): Record<string, string> {
  switch (s.type) {
    case "navbar":
      return { brand: s.content.brand };
    case "hero-editorial":
    case "hero-split":
    case "hero-centered":
      return { title: s.content.title, description: s.content.description, ctaLabel: s.content.primaryCta.label };
    case "cta-banner":
      return { title: s.content.title, description: s.content.description ?? "", ctaLabel: s.content.cta.label };
    default:
      return {};
  }
}

/** Writes edited text back into a copy of the section. Lengths are enforced by the server schema. */
function writeText(s: Section, v: Record<string, string>): void {
  switch (s.type) {
    case "navbar":
      s.content.brand = v.brand ?? s.content.brand;
      return;
    case "hero-editorial":
    case "hero-split":
    case "hero-centered":
      s.content.title = v.title ?? s.content.title;
      s.content.description = v.description ?? s.content.description;
      s.content.primaryCta = { ...s.content.primaryCta, label: v.ctaLabel ?? s.content.primaryCta.label };
      // The accent word must stay inside the title, otherwise drop it.
      if (s.content.accent && !s.content.title.includes(s.content.accent)) delete s.content.accent;
      return;
    case "cta-banner":
      s.content.title = v.title ?? s.content.title;
      s.content.description = v.description ?? "";
      s.content.cta = { ...s.content.cta, label: v.ctaLabel ?? s.content.cta.label };
      return;
    default:
      return;
  }
}
