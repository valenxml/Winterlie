"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { DesignSpec } from "@workshop/design-schema";
import { api, ApiError, type Project } from "@/lib/api";
import { SpecPreview } from "@/components/spec-preview";
import { SectionEditor, type DesignOpPayload } from "@/components/section-editor";
import { SiteTypePicker, type SiteTypeId } from "@/components/site-type-picker";

interface Direction {
  id: string;
  version: number;
  direction: string;
  spec: DesignSpec;
  /** "ai" or "template". Only known for the result of generate; edits keep the original value. */
  source?: "ai" | "template";
}

const LABEL: Record<string, string> = {
  "editorial-warm": "Editorial hangat",
  "bold-modern": "Modern tegas",
  "calm-minimal": "Tenang minimal",
};

const MIN_DESCRIPTION = 20;

export function MockupMakerView() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [siteType, setSiteType] = useState<SiteTypeId>("auto");
  const [projectId, setProjectId] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState<{ id: string; version: number; createdAt: string; spec: DesignSpec }[]>([]);

  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("type");
    if (fromLink && ["auto", "ecommerce", "game", "streaming", "landing"].includes(fromLink)) {
      setSiteType(fromLink as SiteTypeId);
    }
  }, []);

  useEffect(() => {
    api<Project[]>("/projects")
      .then((list) => {
        setProjects(list);
        if (list[0]) setProjectId(list[0].id);
      })
      .catch((err) => {
        setProjects([]);
        setError(err instanceof ApiError ? err.message : "Gagal memuat project");
      });
  }, []);

  const current = useMemo(() => directions.find((d) => d.id === selected) ?? directions[0] ?? null, [directions, selected]);

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api<Direction[]>(`/projects/${projectId}/designs/generate`, {
        method: "POST",
        body: JSON.stringify({
          description,
          category: "landing",
          siteType,
          businessType: brand.trim() || undefined,
        }),
      });
      setDirections(result);
      setSelected(result[0]?.id ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError("Credit kamu habis. Klaim credit harian di Dashboard, atau coba lagi besok.");
      } else {
        setError(err instanceof ApiError ? err.message : "Gagal membuat arah desain");
      }
    } finally {
      setBusy(false);
    }
  }

  /** Loads the version history for the current direction when the editor opens. */
  async function openEditor() {
    const next = !editing;
    setEditing(next);
    if (!next || !current) return;
    try {
      setVersions(await api(`/projects/${projectId}/designs/${current.id}/versions`));
    } catch (err) {
      setVersions([]);
      setError(err instanceof ApiError ? err.message : "Gagal memuat riwayat versi");
    }
  }

  /** Makes an earlier version the current one. The next edit starts from it. */
  function useVersion(v: { id: string; version: number; spec: DesignSpec }) {
    setDirections((prev) =>
      prev.map((d) => (d.direction === v.spec.direction ? { ...d, id: v.id, version: v.version, spec: v.spec } : d)),
    );
    setSelected(v.id);
  }

  /** Asks the API to rewrite one section's text with AI. Other sections are unchanged. */
  async function regenerate(sectionId: string) {
    if (!current) return;
    setSaving(true);
    setError(null);
    try {
      const next = await api<Direction>(
        `/projects/${projectId}/designs/${current.id}/sections/${sectionId}/regenerate`,
        { method: "POST" },
      );
      setDirections((prev) => prev.map((d) => (d.direction === next.direction ? next : d)));
      setSelected(next.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat ulang section");
    } finally {
      setSaving(false);
    }
  }

  /** Sends one edit to the API. The server validates it and returns the new version. */
  async function applyOp(op: DesignOpPayload) {
    if (!current) return;
    setSaving(true);
    setError(null);
    try {
      const next = await api<Direction>(`/projects/${projectId}/designs/${current.id}/ops`, {
        method: "POST",
        body: JSON.stringify(op),
      });
      // One card per direction: replace it with the newest version, keeping its source label.
      setDirections((prev) =>
        prev.map((d) => (d.direction === next.direction ? { ...next, source: d.source } : d)),
      );
      setSelected(next.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  }

  if (projects !== null && projects.length === 0) {
    return (
      <div className="card empty">
        <div className="empty-title">Buat project dulu</div>
        Arah desain disimpan di dalam project. <Link href="/projects" style={{ color: "var(--accent)", fontWeight: 600 }}>Buka Projects</Link>
      </div>
    );
  }

  const canSubmit = !busy && projectId && description.trim().length >= MIN_DESCRIPTION;

  return (
    <>
      <form className="card stack" onSubmit={onGenerate}>
        <div className="grid-2">
          <div>
            <label htmlFor="project">Project</label>
            <select id="project" className="plain" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {(projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="brand">Nama bisnis</label>
            <input id="brand" className="plain" maxLength={30} placeholder="Contoh: Kopi Kenangan" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
        </div>
        <SiteTypePicker value={siteType} onChange={setSiteType} />
        <div>
          <label htmlFor="desc">Deskripsikan website Anda</label>
          <textarea id="desc" className="plain" rows={4} maxLength={2000}
            placeholder="Contoh: Kedai kopi untuk anak muda dengan suasana hangat dan menu lokal."
            value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="hint" style={{ marginTop: 6 }}>
            {description.trim().length < MIN_DESCRIPTION
              ? `Minimal ${MIN_DESCRIPTION} karakter (${description.trim().length} sekarang)`
              : `${description.length}/2000`}
          </div>
        </div>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="muted" style={{ fontSize: 13 }}>Membuat tiga arah yang berbeda dari brief Anda.</span>
          <div className="row" style={{ gap: 10 }}>
            <span className="muted" style={{ fontSize: 12 }}>Biaya: 1 credit</span>
            <button className="btn" type="submit" disabled={!canSubmit}>{busy ? "Membuat..." : "Buat 3 arah desain →"}</button>
          </div>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {directions.length > 0 && current && (
        <div className="stack" style={{ marginTop: 16, gap: 16 }}>
          <div className="dir-grid">
            {directions.map((d) => {
              const c = d.spec.tokens.colors;
              const active = d.id === current.id;
              return (
                <button key={d.id} type="button" className={`option ${active ? "active" : ""}`} onClick={() => setSelected(d.id)}>
                  <span style={{ fontWeight: 600 }}>{LABEL[d.direction] ?? d.spec.name}</span>
                  <span className="row" style={{ gap: 6, marginTop: 4 }}>
                    {[c.primary, c.accent, c.background].map((hex) => (
                      <span key={hex} style={{ width: 16, height: 16, borderRadius: 4, background: hex, border: "1px solid var(--border)" }} />
                    ))}
                    <span className="muted" style={{ fontSize: 12 }}>{d.spec.tokens.typography.heading} · {d.spec.tokens.typography.body}</span>
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {d.spec.sections.length} section · versi {d.version}
                    {d.source && (
                      <span className={`src-badge ${d.source}`}>{d.source === "ai" ? "Teks AI" : "Teks template"}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>{LABEL[current.direction] ?? current.spec.name}</h2>
              <div className="row" style={{ gap: 8 }}>
                <span className="muted" style={{ fontSize: 12 }}>Versi {current.version}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={openEditor}>
                  {editing ? "Tutup editor" : "Edit section"}
                </button>
              </div>
            </div>
            {editing && (
              <div className="card" style={{ background: "var(--bg)", boxShadow: "none" }}>
                <SectionEditor spec={current.spec} busy={saving} onOp={applyOp} onRegenerate={regenerate} />
                {versions.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div className="muted" style={{ fontSize: 12.5, marginBottom: 8 }}>Riwayat versi</div>
                    <div className="stack" style={{ gap: 6 }}>
                      {versions.map((v) => {
                        const isCurrent = v.id === current.id;
                        return (
                          <div key={v.id} className="row" style={{ justifyContent: "space-between", fontSize: 13 }}>
                            <span>
                              Versi {v.version}
                              <span className="muted" style={{ marginLeft: 8 }}>
                                {new Date(v.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                              </span>
                            </span>
                            {isCurrent ? (
                              <span className="muted" style={{ fontSize: 12 }}>Sedang dipakai</span>
                            ) : (
                              <button type="button" className="btn btn-ghost btn-sm" disabled={saving} onClick={() => useVersion(v)}>
                                Pakai versi ini
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            <SpecPreview spec={current.spec} />
          </div>
        </div>
      )}
    </>
  );
}
