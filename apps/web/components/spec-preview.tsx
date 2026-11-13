import type { CSSProperties, ReactNode } from "react";
import type { DesignSpec, Section } from "@workshop/design-schema";
import { stackFor, type FontStyle } from "@/lib/typography";
import { Icon } from "@/components/icons";

/**
 * Renders a validated DesignSpec. Reads data fields only, never HTML or scripts.
 * Visual treatments (device frame, floating cards, gradient) are drawn from tokens.
 */
export function SpecPreview({ spec }: { spec: DesignSpec }) {
  const c = spec.tokens.colors;
  const root: CSSProperties = {
    background: c.background,
    color: c.text,
    fontFamily: stackFor(spec.tokens.typography.body as FontStyle),
    borderRadius: 16,
    border: `1px solid ${c.border}`,
    overflow: "hidden",
  };
  return (
    <div style={root}>
      {spec.sections.map((s) => (
        <div key={s.id}>{renderSection(s, spec)}</div>
      ))}
    </div>
  );
}

function headingStyle(spec: DesignSpec): CSSProperties {
  return { fontFamily: stackFor(spec.tokens.typography.heading as FontStyle), color: spec.tokens.colors.text, letterSpacing: "-0.03em" };
}

/** Title with one word in the accent color. */
function Title({ text, accent, spec, size, align = "left" }: { text: string; accent?: string; spec: DesignSpec; size: number; align?: "left" | "center" }) {
  const c = spec.tokens.colors;
  const idx = accent ? text.lastIndexOf(accent) : -1;
  return (
    <div style={{ ...headingStyle(spec), fontSize: size, lineHeight: 1.05, fontWeight: 700, textAlign: align }}>
      {idx >= 0 && accent ? (
        <>
          {text.slice(0, idx)}
          <span style={{ color: c.primary }}>{accent}</span>
          {text.slice(idx + accent.length)}
        </>
      ) : (
        text
      )}
    </div>
  );
}

function Btn({ label, spec, invert = false }: { label: string; spec: DesignSpec; invert?: boolean }) {
  const c = spec.tokens.colors;
  return (
    <span style={{
      display: "inline-block", fontSize: 12, fontWeight: 600, padding: "8px 16px", borderRadius: 999,
      background: invert ? "transparent" : c.primary, color: invert ? c.text : "#fff",
      border: invert ? `1px solid ${c.border}` : "none",
    }}>
      {label}
    </span>
  );
}

function Badge({ label, spec }: { label: string; spec: DesignSpec }) {
  const c = spec.tokens.colors;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: c.primary + "14", color: c.primary, marginBottom: 14 }}>
      <Icon name="sparkles" size={12} /> {label}
    </span>
  );
}

/** Soft gradient panel built from the palette. Stands in for artwork. */
function GradientArt({ spec, height }: { spec: DesignSpec; height: number }) {
  const c = spec.tokens.colors;
  return (
    <div style={{
      height, borderRadius: 18, position: "relative", overflow: "hidden",
      background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${c.primary}33 38%, ${c.accent}66 100%)`,
      border: `1px solid ${c.border}`,
    }}>
      <div style={{ position: "absolute", inset: "auto 12% 12% auto", width: "38%", height: "55%", borderRadius: 14, background: c.surface, boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }} />
    </div>
  );
}

/** Browser-style frame with a placeholder screen, like a product screenshot. */
function DeviceArt({ spec, height }: { spec: DesignSpec; height: number }) {
  const c = spec.tokens.colors;
  return (
    <div style={{ height, borderRadius: 14, background: c.surface, border: `1px solid ${c.border}`, boxShadow: "0 18px 40px rgba(0,0,0,0.10)", overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 5, padding: "8px 10px", borderBottom: `1px solid ${c.border}` }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: c.border }} />)}
      </div>
      <div style={{ padding: 10, display: "grid", gridTemplateColumns: "28% 1fr", gap: 8, height: height - 30 }}>
        <div style={{ background: c.background, borderRadius: 8 }} />
        <div style={{ background: `linear-gradient(135deg, ${c.primary}22, ${c.accent}44)`, borderRadius: 8 }} />
      </div>
    </div>
  );
}

/** Two floating cards with a small metric, like a product dashboard tile. */
function CardsArt({ spec, height }: { spec: DesignSpec; height: number }) {
  const c = spec.tokens.colors;
  return (
    <div style={{ height, position: "relative" }}>
      <div style={{ position: "absolute", left: "8%", top: "10%", width: "60%", height: "70%", borderRadius: 14, background: c.surface, border: `1px solid ${c.border}`, boxShadow: "0 16px 36px rgba(0,0,0,0.10)", padding: 14 }}>
        <div style={{ height: 8, width: "40%", borderRadius: 4, background: c.border, marginBottom: 10 }} />
        <div style={{ height: 6, width: "80%", borderRadius: 3, background: c.border, marginBottom: 6 }} />
        <div style={{ height: 6, width: "60%", borderRadius: 3, background: c.border }} />
      </div>
      <div style={{ position: "absolute", right: "6%", bottom: "8%", padding: "10px 14px", borderRadius: 12, background: c.surface, border: `1px solid ${c.border}`, boxShadow: "0 12px 28px rgba(0,0,0,0.12)", fontSize: 12 }}>
        <div style={{ color: c.muted, fontSize: 10 }}>Skor</div>
        <div style={{ fontWeight: 700, color: c.primary }}>92 / 100</div>
      </div>
    </div>
  );
}

/** Checkerboard panel for game, board, or technical briefs. Built from palette colors only. */
function PatternArt({ spec, height }: { spec: DesignSpec; height: number }) {
  const c = spec.tokens.colors;
  return (
    <div style={{
      height, borderRadius: 18, border: `1px solid ${c.border}`, overflow: "hidden",
      background: `repeating-conic-gradient(${c.primary}26 0% 25%, ${c.surface} 0% 50%) 50% / ${Math.round(height / 4)}px ${Math.round(height / 4)}px`,
    }} />
  );
}

function HeroArt({ visual, spec, height }: { visual?: string; spec: DesignSpec; height: number }) {
  if (visual === "pattern") return <PatternArt spec={spec} height={height} />;
  if (visual === "device") return <DeviceArt spec={spec} height={height} />;
  if (visual === "cards") return <CardsArt spec={spec} height={height} />;
  return <GradientArt spec={spec} height={height} />;
}

const pad = (extra: CSSProperties = {}): CSSProperties => ({ padding: "28px 26px", ...extra });

function renderSection(s: Section, spec: DesignSpec): ReactNode {
  const c = spec.tokens.colors;
  const rule: CSSProperties = { borderBottom: `1px solid ${c.border}` };
  switch (s.type) {
    case "navbar": {
      const floating = s.settings.style === "floating";
      return (
        <div style={{ ...rule, padding: "14px 22px", display: "flex", alignItems: "center", gap: 16, fontSize: 12 }}>
          <strong style={{ ...headingStyle(spec), fontSize: 15 }}>{s.content.brand}</strong>
          <span style={{ display: "flex", gap: 14, color: c.muted }}>
            {s.content.links.map((l) => <span key={l.label}>{l.label}</span>)}
          </span>
          {s.content.cta && <span style={{ marginLeft: "auto" }}><Btn label={s.content.cta.label} spec={spec} /></span>}
          {floating && <span style={{ display: "none" }} />}
        </div>
      );
    }
    case "hero-editorial":
    case "hero-split":
    case "hero-centered": {
      const center = s.type === "hero-centered";
      const visual = s.settings.visual;
      const textBlock = (
        <div style={{ textAlign: center ? "center" : "left" }}>
          {s.content.badge && <div style={{ display: "flex", justifyContent: center ? "center" : "flex-start" }}><Badge label={s.content.badge} spec={spec} /></div>}
          {s.content.eyebrow && <div style={{ fontSize: 11, color: c.accent, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{s.content.eyebrow}</div>}
          <Title text={s.content.title} accent={s.content.accent} spec={spec} size={center ? 40 : 36} align={center ? "center" : "left"} />
          <p style={{ color: c.muted, fontSize: 14, margin: "14px 0 20px", lineHeight: 1.6, maxWidth: 420, marginLeft: center ? "auto" : 0, marginRight: center ? "auto" : 0 }}>
            {s.content.description}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: center ? "center" : "flex-start" }}>
            <Btn label={s.content.primaryCta.label} spec={spec} />
            {s.content.secondaryCta && <Btn label={s.content.secondaryCta.label} spec={spec} invert />}
          </div>
        </div>
      );
      const artBlock = <HeroArt visual={visual} spec={spec} height={230} />;
      if (center) {
        return (
          <div style={pad({ textAlign: "center" })}>
            {textBlock}
            <div style={{ marginTop: 26 }}>{artBlock}</div>
          </div>
        );
      }
      return (
        <div style={{ ...pad(), display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center", ...rule }}>
          {s.type === "hero-split" && s.settings.imagePosition === "left" ? <>{artBlock}{textBlock}</> : <>{textBlock}{artBlock}</>}
        </div>
      );
    }
    case "feature-grid":
      return (
        <div style={pad(rule)}>
          <div style={{ ...headingStyle(spec), fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 16 }}>{s.content.heading}</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${s.settings.columns}, 1fr)`, gap: 12 }}>
            {s.content.items.map((it) => (
              <div key={it.title} style={{
                background: s.settings.cardStyle === "filled" ? c.background : c.surface,
                border: s.settings.cardStyle === "plain" ? "none" : `1px solid ${c.border}`,
                borderRadius: 14, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: c.primary + "18", color: c.primary, display: "grid", placeItems: "center", marginBottom: 12 }}>
                  <Icon name={it.icon} size={16} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{it.title}</div>
                <div style={{ color: c.muted, fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>{it.description}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "feature-alternating":
      return (
        <div style={pad(rule)}>
          <div style={{ ...headingStyle(spec), fontSize: 22, fontWeight: 700, marginBottom: 14 }}>{s.content.heading}</div>
          {s.content.items.map((it) => (
            <div key={it.title} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 16, alignItems: "center", marginBottom: 12 }}>
              <GradientArt spec={spec} height={92} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{it.title}</div>
                <div style={{ color: c.muted, fontSize: 13, marginTop: 4 }}>{it.description}</div>
              </div>
            </div>
          ))}
        </div>
      );
    case "stats-row":
      return (
        <div style={{ ...pad(rule), display: "grid", gridTemplateColumns: `repeat(${s.content.items.length}, 1fr)`, gap: 12 }}>
          {s.content.items.map((it) => (
            <div key={it.label} style={{ background: c.surface, borderRadius: 14, padding: 16, border: `1px solid ${c.border}` }}>
              <div style={{ ...headingStyle(spec), fontSize: 26, fontWeight: 700 }}>{it.value}</div>
              <div style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{it.label}</div>
              {it.note && <div style={{ color: c.muted, fontSize: 11, marginTop: 6, opacity: 0.8 }}>{it.note}</div>}
            </div>
          ))}
        </div>
      );
    case "faq":
      return (
        <div style={pad(rule)}>
          <div style={{ ...headingStyle(spec), fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{s.content.heading}</div>
          {s.content.items.map((it) => (
            <div key={it.question} style={{ borderTop: `1px solid ${c.border}`, padding: "12px 0" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{it.question}</div>
              <div style={{ color: c.muted, fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{it.answer}</div>
            </div>
          ))}
        </div>
      );
    case "cta-banner": {
      const inverted = s.settings.tone === "inverted";
      return (
        <div style={{ margin: 20, borderRadius: 18, padding: "32px 28px", background: inverted ? c.text : c.surface, color: inverted ? c.background : c.text, border: inverted ? "none" : `1px solid ${c.border}` }}>
          <div style={{ ...headingStyle(spec), fontSize: 24, fontWeight: 700, color: "inherit" }}>{s.content.title}</div>
          {s.content.description && <div style={{ fontSize: 13, opacity: 0.8, margin: "6px 0 16px" }}>{s.content.description}</div>}
          <Btn label={s.content.cta.label} spec={spec} />
        </div>
      );
    }
    case "footer":
      return (
        <div style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", fontSize: 12, color: c.muted }}>
          <span style={{ fontWeight: 600, color: c.text }}>{s.content.brand}</span>
          <span>{s.content.legal}</span>
        </div>
      );
    case "product-grid":
      return (
        <div style={pad(rule)}>
          <div style={{ ...headingStyle(spec), fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 14 }}>{s.content.heading}</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${s.settings.columns}, 1fr)`, gap: 12 }}>
            {s.content.items.map((it) => (
              <div key={it.title + it.price} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ height: 90, background: `linear-gradient(135deg, ${c.primary}22, ${c.accent}33)` }} />
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{it.title}</div>
                  <div style={{ color: c.primary, fontWeight: 700, fontSize: 13, marginTop: 4 }}>{it.price}</div>
                  {it.note && <div style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{it.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "pricing":
      return (
        <div style={pad(rule)}>
          <div style={{ ...headingStyle(spec), fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 14 }}>{s.content.heading}</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${s.content.plans.length}, 1fr)`, gap: 12 }}>
            {s.content.plans.map((p) => (
              <div key={p.name} style={{
                background: p.highlighted ? c.primary : c.surface, color: p.highlighted ? "#fff" : c.text,
                border: p.highlighted ? "none" : `1px solid ${c.border}`, borderRadius: 14, padding: 16,
              }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontWeight: 700, fontSize: 20, marginTop: 6 }}>
                  {p.price}{p.period && <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.8 }}> {p.period}</span>}
                </div>
                <ul style={{ margin: "10px 0 0", paddingLeft: 16, fontSize: 12, lineHeight: 1.7, opacity: 0.9 }}>
                  {p.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    case "testimonials":
      return (
        <div style={pad(rule)}>
          <div style={{ ...headingStyle(spec), fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 14 }}>{s.content.heading}</div>
          <div style={{ display: "grid", gridTemplateColumns: s.settings.layout === "columns" ? `repeat(${Math.min(s.content.items.length, 3)}, 1fr)` : "1fr", gap: 12 }}>
            {s.content.items.map((it) => (
              <figure key={it.quote} style={{ margin: 0, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14, padding: 16 }}>
                <blockquote style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>&ldquo;{it.quote}&rdquo;</blockquote>
                <figcaption style={{ marginTop: 10, fontSize: 12, color: c.muted }}><b style={{ color: c.text }}>{it.name}</b> · {it.role}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      );
    default:
      return <div style={{ padding: 16, fontSize: 12, color: c.muted }}>Section {s.type} segera hadir</div>;
  }
}
