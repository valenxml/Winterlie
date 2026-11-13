"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError, API_URL } from "@/lib/api";

type Mode = "login" | "register";
type Step = "form" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const code = new URLSearchParams(window.location.search).get("error");
    return code ? googleErrorText(code) : null;
  });

  async function requestCode(e?: FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await api("/auth/register/request", {
        method: "POST",
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      setStep("code");
      setInfo(`Kode 6 digit sudah dikirim ke ${email}. Berlaku 10 menit.`);
    } catch (err) {
      setError(err instanceof ApiError ? readableMessage(err.message) : "Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/auth/register/verify", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? readableMessage(err.message) : "Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? readableMessage(err.message) : "Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(mode === "login" ? "register" : "login");
    setStep("form");
    setError(null);
    setInfo(null);
    setCode("");
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div className="logo" style={{ justifyContent: "center", marginBottom: 22 }}>
          <span className="logo-mark">✦</span> winterlie.
        </div>

        <div className="card stack" style={{ marginBottom: 14 }}>
          <a className="btn btn-ghost" href={`${API_URL}/auth/google`} style={{ justifyContent: "center" }}>
            Lanjutkan dengan Google
          </a>
          <div className="muted" style={{ textAlign: "center", fontSize: 12 }}>atau pakai email</div>
        </div>

        {mode === "login" && (
          <form className="card stack" onSubmit={onLogin}>
            <h1 style={{ fontSize: 22, margin: 0, letterSpacing: "-0.02em" }}>Masuk ke workspace</h1>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" className="plain" value={email} required maxLength={254}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className="plain" value={password} required maxLength={128}
                onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
            <button className="btn" type="submit" disabled={busy}>{busy ? "Memproses..." : "Masuk"}</button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }} onClick={switchMode}>
              Belum punya akun? Daftar
            </button>
          </form>
        )}

        {mode === "register" && step === "form" && (
          <form className="card stack" onSubmit={requestCode}>
            <h1 style={{ fontSize: 22, margin: 0, letterSpacing: "-0.02em" }}>Buat akun baru</h1>
            <div>
              <label htmlFor="name">Nama (opsional)</label>
              <input id="name" className="plain" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="remail">Email</label>
              <input id="remail" type="email" className="plain" value={email} required maxLength={254}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="rpassword">Password</label>
              <input id="rpassword" type="password" className="plain" value={password} required minLength={8} maxLength={128}
                onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <div className="hint" style={{ marginTop: 6 }}>Minimal 8 karakter</div>
            </div>
            {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
            <button className="btn" type="submit" disabled={busy}>{busy ? "Mengirim kode..." : "Kirim kode verifikasi"}</button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }} onClick={switchMode}>
              Sudah punya akun? Masuk
            </button>
          </form>
        )}

        {mode === "register" && step === "code" && (
          <form className="card stack" onSubmit={verifyCode}>
            <h1 style={{ fontSize: 22, margin: 0, letterSpacing: "-0.02em" }}>Masukkan kode</h1>
            {info && <p className="muted" style={{ margin: 0 }}>{info}</p>}
            <div>
              <label htmlFor="code">Kode 6 digit</label>
              <input id="code" inputMode="numeric" pattern="\d{6}" maxLength={6} className="plain"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                style={{ letterSpacing: 6, fontSize: 20, textAlign: "center" }} autoComplete="one-time-code" required />
            </div>
            {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
            <button className="btn" type="submit" disabled={busy || code.length !== 6}>
              {busy ? "Memeriksa..." : "Verifikasi dan daftar"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }}
              disabled={busy} onClick={() => requestCode()}>
              Kirim ulang kode
            </button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ justifyContent: "center" }}
              onClick={() => { setStep("form"); setError(null); setInfo(null); }}>
              Ubah email
            </button>
          </form>
        )}

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
  if (message.includes("Kode salah")) return "Kode salah. Periksa lagi.";
  if (message.includes("kedaluwarsa")) return "Kode sudah kedaluwarsa. Kirim ulang kode.";
  if (message.includes("Terlalu banyak")) return "Terlalu banyak percobaan. Kirim ulang kode.";
  if (message.includes("Tunggu")) return message;
  return message;
}

function googleErrorText(code: string): string {
  if (code === "google_dibatalkan") return "Login Google dibatalkan.";
  if (code === "google_state") return "Sesi login Google kedaluwarsa. Coba lagi.";
  return "Login Google gagal. Coba lagi atau masuk dengan email.";
}
