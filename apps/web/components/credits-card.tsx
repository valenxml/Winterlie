"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface BalanceResponse { balance: number }
interface DailyResponse { granted: boolean; balance: number }

/** Shows the signed-in user's credit balance and the once-a-day claim. */
export function CreditsCard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<BalanceResponse>("/credits/balance")
      .then((r) => setBalance(r.balance))
      .catch(() => setBalance(null));
  }, []);

  async function claim() {
    setBusy(true);
    setMessage(null);
    try {
      const r = await api<DailyResponse>("/credits/daily", { method: "POST" });
      setBalance(r.balance);
      setMessage(r.granted ? "Credit harian berhasil diklaim." : "Credit harian hari ini sudah diklaim. Coba lagi besok.");
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Gagal mengklaim credit harian");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div>
        <h2>Credit kamu</h2>
        <div className="muted">Satu generate arah desain memakai 1 credit. Regenerasi satu section juga 1 credit.</div>
        {message && <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>{message}</div>}
      </div>
      <div className="row" style={{ gap: 12 }}>
        <span style={{ fontSize: 26, fontWeight: 700 }}>{balance ?? "–"}</span>
        <button type="button" className="btn btn-sm" onClick={claim} disabled={busy}>
          {busy ? "Mengklaim..." : "Klaim credit harian"}
        </button>
      </div>
    </div>
  );
}
