"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Usage {
  days: number;
  runs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostIdr: number;
}

/** Shows the signed-in user's AI usage for the last 30 days. */
export function AiUsageCard() {
  const [u, setU] = useState<Usage | null>(null);
  useEffect(() => {
    api<Usage>("/ai/usage").then(setU).catch(() => setU(null));
  }, []);
  if (!u) return null;
  return (
    <div className="card">
      <h2>Pemakaian AI (30 hari)</h2>
      <div className="grid-2" style={{ marginTop: 8, gap: 8 }}>
        <div className="muted">Permintaan: <b style={{ color: "var(--text)" }}>{u.runs}</b></div>
        <div className="muted">Token: <b style={{ color: "var(--text)" }}>{(u.inputTokens + u.outputTokens).toLocaleString("id-ID")}</b></div>
        <div className="muted">Perkiraan biaya: <b style={{ color: "var(--text)" }}>Rp {u.estimatedCostIdr.toLocaleString("id-ID")}</b></div>
      </div>
    </div>
  );
}
