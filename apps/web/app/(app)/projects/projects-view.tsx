"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError, type Project } from "@/lib/api";

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setProjects(await api<Project[]>("/projects"));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat project");
      setProjects([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({ name, description: description || undefined }),
      });
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="breadcrumb">Projects</div>
      <h1 className="page-title">
        Your <span className="hl">projects</span>
      </h1>
      <p className="page-lead">Setiap ide dimulai sebagai project.</p>

      <form className="card stack" onSubmit={onCreate}>
        <h2>Project baru</h2>
        <div>
          <label htmlFor="pname">Nama</label>
          <input
            className="plain"
            id="pname"
            placeholder="Contoh: Website Kopi Kenangan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
          />
        </div>
        <div>
          <label htmlFor="pdesc">Deskripsi (opsional)</label>
          <textarea
            className="plain"
            id="pdesc"
            placeholder="Tujuan singkat project ini"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
          />
        </div>
        <div className="row">
          <button className="btn" type="submit" disabled={saving || !name.trim()}>
            {saving ? "Menyimpan..." : "Buat project →"}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="card">
        {projects === null && <p className="muted">Memuat...</p>}
        {projects !== null && projects.length === 0 && !error && (
          <div className="empty">
            <div className="empty-title">Belum ada project</div>
            Buat project pertama Anda di atas.
          </div>
        )}
        {projects !== null && projects.length > 0 && (
          <ul className="projects">
            {projects.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong>
                {p.description && <span className="muted">{p.description}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
