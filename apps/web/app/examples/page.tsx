import Link from "next/link";
import { EXAMPLES } from "@/lib/examples";
import { SpecPreview } from "@/components/spec-preview";
import { Icon } from "@/components/icons";

export const metadata = { title: "Contoh website · Winterlie" };

export default function ExamplesPage() {
  return (
    <main className="examples-page">
      <nav className="site-nav">
        <Link href="/" className="logo"><span className="logo-svg"><Icon name="logo" size={18} /></span> winterlie.</Link>
        <div className="links">
          <Link href="/examples">Contoh</Link>
        </div>
        <Link href="/dashboard" className="btn btn-dark">Buka workspace</Link>
      </nav>

      <section className="section">
        <div className="section-head">
          <div className="eyebrow">Contoh hasil</div>
          <h2>Lihat dulu sebelum mulai.</h2>
          <p>Empat contoh dari jenis website yang berbeda. Setiap contoh dibuat dari brief yang sama dengan yang Anda isi di Mockup Maker.</p>
        </div>
        <div className="example-grid">
          {EXAMPLES.map((ex) => (
            <Link key={ex.slug} href={`/examples/${ex.slug}`} className="example-card">
              <div className="example-thumb">
                <div className="example-frame">
                  <SpecPreview spec={ex.spec} />
                </div>
              </div>
              <div className="example-meta">
                <div className="example-title">{ex.title}</div>
                <div className="muted" style={{ fontSize: 13 }}>{ex.brief}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="cta-row" style={{ marginTop: 28 }}>
          <Link href="/tools/mockup-maker" className="btn">Buat website seperti ini <Icon name="arrow" size={16} /></Link>
        </div>
      </section>
    </main>
  );
}
