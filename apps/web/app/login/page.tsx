"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(mode === "login" ? "/auth/login" : "/auth/register", {
        method: "POST",
        body: JSON.stringify(mode === "login" ? { email, password } : { email, password, name: name || undefined }),
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? readableMessage(err.message) : "Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div className="logo" style={{ justifyContent: "center", marginBottom: 22 }}>
          <span className="logo-mark">✦</span> winterlie.
        </div>
        <form className="card stack" onSubmit={onSubmit}>
          <h1 style={{ fontSize: 22, margin: 0, letterSpacing: "-0.02em" }}>
            {mode === "login" ? "Masuk ke workspace" : "Buat akun baru"}
          </h1>

          {mode === "register" && (
            <div>
              <label htmlFor="name">Nama (opsional)</label>
              <input id="name" className="plain" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="plain" value={email} required maxLength={254}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="plain" value={password} required
              minLength={mode === "register" ? 8 : 1} maxLength={128}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"} />
            {mode === "register" && <div className="hint" style={{ marginTop: 6 }}>Minimal 8 karakter</div>}
          </div>

          {error && <p className="error" style={{ margin: 0 }}>{error}</p>}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>

          <button type="button" className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>
            {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
          </button>
        </form>
        <p className="muted" style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
          <Link href="/" style={{ color: "var(--accent)" }}>Kembali ke beranda</Link>
        </p>
      </div>
    </div>
  );
}

/** Maps server messages to plain Indonesian. Unknown messages are shown as they are. */
function readableMessage(message: string): string {
  if (message.includes("Email atau password salah")) return "Email atau password salah";
  if (message.includes("sudah terdaftar")) return "Email ini sudah terdaftar. Silakan masuk.";
  if (message.includes("minimal 8")) return "Password minimal 8 karakter";
  return message;
}
