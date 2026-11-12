"use client";

import { useMemo, useState } from "react";
import {
  FONTS, PAIRINGS, SCALES, SCALE_SIZES, stackFor, toCssVariables, toTokenJson, type FontStyle, type TypeScale,
} from "@/lib/typography";

const SCALE_LABEL: Record<TypeScale, string> = { compact: "Ringkas", balanced: "Seimbang", dramatic: "Dramatis" };

export function TypographyTool() {
  const [pairingId, setPairingId] = useState(PAIRINGS[0]!.id);
  const [scale, setScale] = useState<TypeScale>("balanced");
  const [copied, setCopied] = useState<"css" | "json" | null>(null);

  const pairing = PAIRINGS.find((p) => p.id === pairingId) ?? PAIRINGS[0]!;
  const sizes = SCALE_SIZES[scale];
  const headingStack = useMemo(() => stackFor(pairing.heading), [pairing]);
  const bodyStack = useMemo(() => stackFor(pairing.body), [pairing]);
  const css = useMemo(() => toCssVariables(pairing.heading, pairing.body, scale), [pairing, scale]);
  const json = useMemo(() => toTokenJson(pairing.heading, pairing.body, scale), [pairing, scale]);

  async function copy(kind: "css" | "json", value: string) {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="two-col">
      <div className="stack">
        <div className="card">
          <h2>Pasangan font</h2>
          <p className="muted" style={{ marginTop: 0 }}>Satu font untuk judul, satu untuk isi. Pilih yang sesuai karakter brand.</p>
          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            {PAIRINGS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`option ${p.id === pairingId ? "active" : ""}`}
                onClick={() => setPairingId(p.id)}
              >
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {FONTS[p.heading].family} + {FONTS[p.body].family}
                </span>
                <span className="muted" style={{ fontSize: 12.5 }}>{p.summary}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Skala ukuran</h2>
          <div className="pills" style={{ marginTop: 10 }}>
            {SCALES.map((s) => (
              <button key={s} type="button" className={`pill ${scale === s ? "active" : ""}`} onClick={() => setScale(s)}>
                {SCALE_LABEL[s]}
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 10 }}>
            H1 {sizes.h1}px · H2 {sizes.h2}px · Isi {sizes.body}px · Tinggi baris {sizes.lineHeight}
          </p>
        </div>
      </div>

      <div className="stack">
        <div className="card type-preview" style={{ fontFamily: bodyStack, lineHeight: sizes.lineHeight }}>
          <div className="muted" style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>Pratinjau</div>
          <h1 style={{ fontFamily: headingStack, fontSize: sizes.h1, lineHeight: 1.05, margin: "12px 0 10px", letterSpacing: "-0.02em" }}>
            Coffee, crafted slowly.
          </h1>
          <h2 style={{ fontFamily: headingStack, fontSize: sizes.h2, margin: "0 0 10px", fontWeight: 600 }}>
            Single-origin, roasted weekly
          </h2>
          <p style={{ fontSize: sizes.body, margin: "0 0 14px", color: "var(--muted)" }}>
            Setiap cangkir dimulai dari biji yang dipilih satu per satu, lalu disangrai dalam batch kecil.
            Teks isi seperti ini harus tetap nyaman dibaca dari baris pertama sampai terakhir.
          </p>
          <h3 style={{ fontFamily: headingStack, fontSize: sizes.h3, margin: "0 0 8px", fontWeight: 600 }}>Menu hari ini</h3>
          <code style={{ fontFamily: stackFor("mono-technical"), fontSize: 13 }}>espresso · 18g · 28s</code>
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ margin: 0 }}>CSS variables</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy("css", css)}>
              {copied === "css" ? "Tersalin" : "Salin CSS"}
            </button>
          </div>
          <pre className="code-block">{css}</pre>
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ margin: 0 }}>Token untuk DesignForge</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy("json", json)}>
              {copied === "json" ? "Tersalin" : "Salin JSON"}
            </button>
          </div>
          <pre className="code-block">{json}</pre>
        </div>
      </div>
    </div>
  );
}
