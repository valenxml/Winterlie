"use client";

import { useMemo, useState } from "react";
import {
  contrastLevel, contrastRatio, generatePalette, isHex, toCssVariables, type Scheme,
} from "@/lib/palette";

const SCHEMES: { id: Scheme; label: string; hint: string }[] = [
  { id: "complementary", label: "Komplementer", hint: "Kontras kuat, cocok untuk CTA" },
  { id: "analogous", label: "Analog", hint: "Harmonis dan tenang" },
  { id: "triadic", label: "Triadik", hint: "Berwarna dan energik" },
  { id: "monochrome", label: "Monokrom", hint: "Satu hue, fokus pada cahaya" },
];

const ROLE_LABEL: Record<string, string> = {
  primary: "Primary",
  accent: "Accent",
  background: "Background",
  surface: "Surface",
  text: "Text",
  muted: "Muted",
  border: "Border",
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard?.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Tersalin" : label}
    </button>
  );
}

export function PaletteTool() {
  const [base, setBase] = useState("#6D4AFF");
  const [draft, setDraft] = useState("#6D4AFF");
  const [scheme, setScheme] = useState<Scheme>("complementary");

  const palette = useMemo(() => generatePalette(base, scheme), [base, scheme]);
  const css = useMemo(() => toCssVariables(palette), [palette]);

  const checks = [
    { label: "Text di atas Background", fg: palette.text, bg: palette.background, need: "AAA" },
    { label: "Muted di atas Background", fg: palette.muted, bg: palette.background, need: "AA" },
    { label: "Putih di atas Primary (tombol)", fg: "#FFFFFF", bg: palette.primary, need: "AA" },
    { label: "Primary di atas Background", fg: palette.primary, bg: palette.background, need: "AA" },
  ];

  return (
    <div className="two-col">
      <div className="stack">
        <div className="card">
          <h2>Warna dasar</h2>
          <p className="muted" style={{ marginTop: 0 }}>Pilih warna brand Anda. Palet lainnya dihitung dari warna ini.</p>
          <div className="row" style={{ marginTop: 12 }}>
            <input
              type="color"
              value={base}
              onChange={(e) => {
                setBase(e.target.value.toUpperCase());
                setDraft(e.target.value.toUpperCase());
              }}
              aria-label="Pilih warna"
              style={{ width: 56, height: 44, padding: 4, border: "1px solid var(--border)", borderRadius: 10, background: "#fff" }}
            />
            <input
              className="plain"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (isHex(e.target.value)) setBase(e.target.value.startsWith("#") ? e.target.value.toUpperCase() : `#${e.target.value.toUpperCase()}`);
              }}
              placeholder="#6D4AFF"
              style={{ maxWidth: 180, fontFamily: "ui-monospace, monospace" }}
              aria-invalid={!isHex(draft)}
            />
          </div>
          {!isHex(draft) && <p className="error" style={{ marginTop: 8 }}>Gunakan format heks, misalnya #6D4AFF.</p>}
        </div>

        <div className="card">
          <h2>Skema harmoni</h2>
          <div className="pills" style={{ marginTop: 10 }}>
            {SCHEMES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`pill ${scheme === s.id ? "active" : ""}`}
                onClick={() => setScheme(s.id)}
                title={s.hint}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 10 }}>{SCHEMES.find((s) => s.id === scheme)?.hint}</p>
        </div>

        <div className="card">
          <h2>Palet</h2>
          <div className="swatches">
            {(Object.keys(ROLE_LABEL) as (keyof typeof palette)[]).map((role) => (
              <div key={role} className="swatch">
                <div className="swatch-color" style={{ background: palette[role] }} />
                <div className="swatch-meta">
                  <div className="swatch-role">{ROLE_LABEL[role]}</div>
                  <div className="swatch-hex">{palette[role]}</div>
                </div>
                <CopyButton value={palette[role]} label="Salin" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <h2>Cek keterbacaan</h2>
          <p className="muted" style={{ marginTop: 0 }}>Standar WCAG. Teks normal butuh minimal 4.5:1 (AA).</p>
          <div className="stack" style={{ gap: 10, marginTop: 8 }}>
            {checks.map((c) => {
              const ratio = contrastRatio(c.fg, c.bg);
              const level = contrastLevel(ratio);
              const pass = level === "AAA" || level === "AA";
              return (
                <div key={c.label} className="check-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{ratio}:1</div>
                  </div>
                  <span className={`status ${pass ? "ok" : "bad"}`}>{level}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2>Pratinjau</h2>
          <div className="preview-swatch" style={{ background: palette.background, color: palette.text, borderColor: palette.border }}>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>Coffee, crafted slowly.</div>
            <div style={{ color: palette.muted, fontSize: 13, margin: "6px 0 14px" }}>
              Single-origin beans, roasted weekly.
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span className="fake-btn" style={{ background: palette.primary }}>Lihat menu</span>
              <span className="fake-btn" style={{ background: palette.accent, color: contrastRatio("#000000", palette.accent) > 4.5 ? "#000" : "#fff" }}>Pesan</span>
            </div>
            <div className="fake-card" style={{ background: palette.surface, borderColor: palette.border }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Kartu</div>
              <div style={{ color: palette.muted, fontSize: 12 }}>Teks sekunder di surface</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ margin: 0 }}>CSS variables</h2>
            <CopyButton value={css} label="Salin CSS" />
          </div>
          <pre className="code-block">{css}</pre>
        </div>
      </div>
    </div>
  );
}
