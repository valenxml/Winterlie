"use client";

/** Client-facing choice of website type. Values match SITE_TYPES in design-schema. */
export const SITE_TYPE_OPTIONS = [
  { id: "auto", label: "Otomatis", hint: "Biarkan brief yang menentukan", icon: "✦" },
  { id: "ecommerce", label: "Toko online", hint: "Jualan produk dengan katalog dan keranjang", icon: "🛒" },
  { id: "game", label: "Landing game", hint: "Promosi game, peringkat, dan komunitas", icon: "♟" },
  { id: "streaming", label: "Streaming", hint: "Film, serial, atau musik dengan paket langganan", icon: "▶" },
  { id: "landing", label: "Landing page", hint: "Profil usaha atau jasa dengan ajakan", icon: "◻" },
] as const;

export type SiteTypeId = (typeof SITE_TYPE_OPTIONS)[number]["id"];

export function SiteTypePicker({ value, onChange }: { value: SiteTypeId; onChange: (id: SiteTypeId) => void }) {
  return (
    <div>
      <label>Mau bikin website apa?</label>
      <div className="site-type-grid" role="radiogroup" aria-label="Jenis website">
        {SITE_TYPE_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            className={`site-type ${value === o.id ? "active" : ""}`}
            onClick={() => onChange(o.id)}
          >
            <span className="site-type-icon">{o.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</span>
            <span className="muted" style={{ fontSize: 12 }}>{o.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
