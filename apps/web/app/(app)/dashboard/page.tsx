import Link from "next/link";
import { API_URL } from "@/lib/api";
import { Icon } from "@/components/icons";

async function apiOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    const body = (await res.json()) as { status?: string };
    return body.status === "ok";
  } catch {
    return false;
  }
}

export default async function DashboardPage() {
  const online = await apiOnline();
  return (
    <>
      <div className="crumb">Home</div>
      <h1 className="title" style={{ fontSize: 34 }}>
        Make ideas <span className="hl">worth building.</span>
      </h1>
      <p className="lead" style={{ marginBottom: 24 }}>
        Satu workspace untuk merencanakan, mendesain, dan membangun website.
      </p>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2>Status layanan</h2>
          <div className="muted">API dan database Winterlie</div>
        </div>
        <span className={`status ${online ? "ok" : "bad"}`}>{online ? "Terhubung" : "Tidak terhubung"}</span>
      </div>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: "26px 0 12px" }}>Mulai dari sini</h2>
      <div className="feat-grid">
        <Link href="/tools/mockup-maker" className="feat">
          <div className="icon-badge"><Icon name="mockup" /></div>
          <div><h3>Buat mockup website</h3><p>Tulis brief, lalu pilih arah desain.</p></div>
        </Link>
        <Link href="/tools/color-palette" className="feat">
          <div className="icon-badge"><Icon name="layers" /></div>
          <div><h3>Cari palet warna</h3><p>Dari satu warna brand ke palet lengkap.</p></div>
        </Link>
        <Link href="/projects" className="feat">
          <div className="icon-badge"><Icon name="pen" /></div>
          <div><h3>Kelola project</h3><p>Lihat dan buat project untuk website Anda.</p></div>
        </Link>
        <Link href="/tools/output-checker" className="feat">
          <div className="icon-badge"><Icon name="check" /></div>
          <div><h3>Periksa hasil AI</h3><p>Temukan kesalahan sebelum dipakai.</p></div>
        </Link>
      </div>
      {!online && (
        <p className="muted">
          Jalankan <code>pnpm --filter @workshop/api dev</code>, lalu muat ulang halaman ini.
        </p>
      )}
    </>
  );
}
