import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMPLES, findExample } from "@/lib/examples";
import { SpecPreview } from "@/components/spec-preview";
import { Icon } from "@/components/icons";

export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ slug: e.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const ex = findExample(params.slug);
  return { title: ex ? `${ex.title} · Contoh Winterlie` : "Contoh · Winterlie" };
}

export default function ExamplePage({ params }: { params: { slug: string } }) {
  const ex = findExample(params.slug);
  if (!ex) notFound();
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
        <div className="crumb" style={{ marginBottom: 10 }}>
          <Link href="/examples" style={{ color: "var(--accent)" }}>Contoh</Link> / <b>{ex.title}</b>
        </div>
        <h1 className="title" style={{ fontSize: 30 }}>{ex.title}</h1>
        <p className="lead" style={{ marginBottom: 22 }}>{ex.brief}</p>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <SpecPreview spec={ex.spec} />
        </div>
        <div className="row" style={{ marginTop: 22 }}>
          <Link href={`/tools/mockup-maker?type=${ex.type}`} className="btn">
            Buat yang seperti ini <Icon name="arrow" size={16} />
          </Link>
          <Link href="/examples" className="btn btn-ghost">Lihat contoh lain</Link>
        </div>
      </section>
    </main>
  );
}
