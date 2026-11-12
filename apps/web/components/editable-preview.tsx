"use client";

import { useReducer, useRef, useState, type CSSProperties } from "react";
import {
  DEVICE_WIDTH, FONT_CHOICES, INITIAL, LIMITS, PRESETS, deriveTheme, historyReducer, initialHistory,
  type Align, type Device, type FontChoice, type PresetId,
} from "@/lib/preview-state";

const SECTIONS = ["Hero", "Navbar", "Menu", "FAQ", "Footer"] as const;
const EDITABLE_SECTIONS = new Set<string>(["Hero", "Navbar"]);
const isEditable = (name: string) => EDITABLE_SECTIONS.has(name);

export function EditablePreview() {
  const [hist, dispatch] = useReducer(historyReducer, undefined, () => initialHistory(INITIAL));
  const s = hist.present;
  const theme = deriveTheme(s);
  const [section, setSection] = useState<string>("Hero");
  const [open, setOpen] = useState(false);

  const brandRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const ctaRef = useRef<HTMLInputElement>(null);

  const edit = (patch: Partial<typeof s>, key?: string) => dispatch({ type: "edit", patch, key });
  const focus = (ref: { current: HTMLElement | null }) => ref.current?.focus();

  const canUndo = hist.past.length > 0;
  const canRedo = hist.future.length > 0;
  const frameStyle: CSSProperties = {
    background: theme.palette.background,
    color: theme.palette.text,
    fontFamily: theme.bodyStack,
  };

  return (
    <div className="ep">
      <div className="ep-bar">
        <span className="ep-dots"><i /><i /><i /></span>
        <span className="ep-title">Coffee Studio · {s.device === "desktop" ? "Desktop" : s.device === "tablet" ? "Tablet" : "Mobile"}</span>
        <div className="ep-devices" role="group" aria-label="Perangkat">
          {(["desktop", "tablet", "mobile"] as Device[]).map((d) => (
            <button key={d} type="button" className={`ep-dev ${s.device === d ? "on" : ""}`} onClick={() => edit({ device: d })}>
              {d === "desktop" ? "Desktop" : d === "tablet" ? "Tablet" : "Mobile"}
            </button>
          ))}
        </div>
      </div>

      <div className="ep-body">
        <div className="ep-sections" role="list">
          {SECTIONS.map((name) => (
            <button
              key={name}
              type="button"
              role="listitem"
              className={`ep-sec ${section === name ? "on" : ""} ${isEditable(name) ? "" : "locked"}`}
              onClick={() => { setSection(name); if (isEditable(name)) setOpen(true); }}
            >
              {name}
              {!isEditable(name) && <span className="ep-lock">Segera</span>}
            </button>
          ))}
        </div>

        <div className="ep-stage">
          <div className="ep-frame" style={{ width: DEVICE_WIDTH[s.device], maxWidth: "100%", ...frameStyle }}>
            <div className="ep-nav" style={{ borderColor: theme.palette.border }}>
              <button type="button" className="ep-brand" style={{ fontFamily: theme.headingStack }} onClick={() => { setSection("Navbar"); setOpen(true); setTimeout(() => focus(brandRef), 0); }}>
                {s.brand}
              </button>
              <span className="ep-navlink" style={{ color: theme.palette.muted }}>Menu</span>
              <span className="ep-navlink" style={{ color: theme.palette.muted }}>Visit</span>
              <span className="ep-navcta" style={{ background: theme.palette.text, color: theme.palette.background }}>Pesan</span>
            </div>

            <div className={`ep-hero ${s.align === "center" ? "center" : ""}`}>
              <button
                type="button"
                className="ep-title-text"
                style={{ fontFamily: theme.headingStack, color: theme.palette.text }}
                onClick={() => { setSection("Hero"); setOpen(true); setTimeout(() => focus(titleRef), 0); }}
              >
                {s.title}
              </button>
              <button
                type="button"
                className="ep-desc"
                style={{ color: theme.palette.muted }}
                onClick={() => { setSection("Hero"); setOpen(true); setTimeout(() => focus(descRef), 0); }}
              >
                {s.description}
              </button>
              <button
                type="button"
                className="ep-cta"
                style={{ background: theme.palette.primary }}
                onClick={() => { setSection("Hero"); setOpen(true); setTimeout(() => focus(ctaRef), 0); }}
              >
                {s.ctaLabel}
              </button>
              {s.showImage && (
                <div className="ep-img" style={{ borderColor: theme.palette.border, background: theme.palette.surface }} aria-hidden="true" />
              )}
            </div>
          </div>

          <div className="ep-swatches">
            <span style={{ width: 14, height: 14, borderRadius: 4, background: theme.palette.primary }} />
            <span style={{ width: 14, height: 14, borderRadius: 4, background: theme.palette.accent }} />
            <span style={{ width: 14, height: 14, borderRadius: 4, background: theme.palette.background, border: "1px solid var(--border)" }} />
            <span className="muted" style={{ fontSize: 12 }}>
              {FONT_CHOICES[s.font].label}: {theme.headingFamily} + {theme.bodyFamily}
            </span>
          </div>
        </div>
      </div>

      <div className="ep-panel">
        <div className="ep-panel-head">
          <button type="button" className="ep-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? "Tutup editor" : "Buka editor"} <span className={`ep-caret ${open ? "up" : ""}`}>▾</span>
          </button>
          <div className="ep-toolbar">
            <button type="button" className="btn btn-ghost btn-sm" disabled={!canUndo} onClick={() => dispatch({ type: "undo" })} aria-label="Undo">↶</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={!canRedo} onClick={() => dispatch({ type: "redo" })} aria-label="Redo">↷</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "reset" })}>Reset</button>
          </div>
        </div>

        {open && (section === "Hero" ? (
          <div className="ep-fields">
            <label className="ep-field">
              <span>Brand <em>{s.brand.length}/{LIMITS.brand}</em></span>
              <input ref={brandRef} className="plain" value={s.brand} maxLength={LIMITS.brand}
                onChange={(e) => edit({ brand: e.target.value }, "brand")} />
            </label>
            <label className="ep-field">
              <span>Judul <em>{s.title.length}/{LIMITS.title}</em></span>
              <input ref={titleRef} className="plain" value={s.title} maxLength={LIMITS.title}
                onChange={(e) => edit({ title: e.target.value }, "title")} />
            </label>
            <label className="ep-field ep-wide">
              <span>Deskripsi <em>{s.description.length}/{LIMITS.description}</em></span>
              <input ref={descRef} className="plain" value={s.description} maxLength={LIMITS.description}
                onChange={(e) => edit({ description: e.target.value }, "description")} />
            </label>
            <label className="ep-field">
              <span>Tombol <em>{s.ctaLabel.length}/{LIMITS.cta}</em></span>
              <input ref={ctaRef} className="plain" value={s.ctaLabel} maxLength={LIMITS.cta}
                onChange={(e) => edit({ ctaLabel: e.target.value }, "cta")} />
            </label>
            <div className="ep-field">
              <span>Perataan</span>
              <div className="pills">
                {(["left", "center"] as Align[]).map((a) => (
                  <button key={a} type="button" className={`pill ${s.align === a ? "active" : ""}`} onClick={() => edit({ align: a })}>
                    {a === "left" ? "Kiri" : "Tengah"}
                  </button>
                ))}
              </div>
            </div>
            <div className="ep-field">
              <span>Font</span>
              <div className="pills">
                {(Object.keys(FONT_CHOICES) as FontChoice[]).map((f) => (
                  <button key={f} type="button" className={`pill ${s.font === f ? "active" : ""}`} onClick={() => edit({ font: f })}>
                    {FONT_CHOICES[f].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="ep-field ep-wide">
              <span>Warna</span>
              <div className="pills">
                {PRESETS.map((p) => (
                  <button key={p.id} type="button" className={`pill ${s.preset === p.id ? "active" : ""}`} onClick={() => edit({ preset: p.id as PresetId })}>
                    <i className="ep-dot" style={{ background: p.base }} /> {p.name}
                  </button>
                ))}
              </div>
            </div>
            <label className="ep-field ep-check ep-wide">
              <input type="checkbox" checked={s.showImage} onChange={(e) => edit({ showImage: e.target.checked })} />
              <span>Tampilkan gambar</span>
            </label>
          </div>
        ) : section === "Navbar" ? (
          <div className="ep-fields">
            <label className="ep-field ep-wide">
              <span>Brand <em>{s.brand.length}/{LIMITS.brand}</em></span>
              <input ref={brandRef} className="plain" value={s.brand} maxLength={LIMITS.brand}
                onChange={(e) => edit({ brand: e.target.value }, "brand")} />
            </label>
          </div>
        ) : (
          <p className="hint" style={{ margin: "10px 0 0" }}>Edit untuk section {section} segera hadir.</p>
        ))}
      </div>
    </div>
  );
}
