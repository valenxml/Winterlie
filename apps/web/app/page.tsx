import Link from "next/link";
import { Icon } from "@/components/icons";
import { EditablePreview } from "@/components/editable-preview";
import { contrastLevel, contrastRatio, generatePalette } from "@/lib/palette";

const SAMPLE = generatePalette("#6D4AFF", "complementary");
const SAMPLE_ROLES: [string, string][] = [
  ["Primary", SAMPLE.primary],
  ["Accent", SAMPLE.accent],
  ["Background", SAMPLE.background],
  ["Text", SAMPLE.text],
  ["Muted", SAMPLE.muted],
];

const TOOLS = [
  { name: "Mockup Maker", href: "/tools/mockup-maker", desc: "Brief menjadi mockup website yang bisa diedit per section.", status: "soon" },
  { name: "Color Palette", href: "/tools/color-palette", desc: "Palet warna harmonis dengan pengecekan kontras WCAG.", status: "live" },
  { name: "Project Architect", href: "/tools/project-architect", desc: "Ubah ide menjadi struktur project, skema data, dan roadmap.", status: "soon" },
  { name: "Prompt Doctor", href: "/tools/prompt-doctor", desc: "Susun prompt yang jelas, lengkap, dan sesuai tujuan.", status: "soon" },
  { name: "Slop Detector", href: "/tools/slop-detector", desc: "Periksa kualitas website dengan temuan yang bisa ditindaklanjuti.", status: "soon" },
  { name: "AI Output Checker", href: "/tools/output-checker", desc: "Cari kesalahan, celah, dan instruksi yang terlewat di hasil AI.", status: "soon" },
];

export default function LandingPage() {
  return (
    <>
      <nav className="site-nav">
        <Link href="/" className="logo">
          <span className="logo-svg"><Icon name="logo" size={18} /></span> winterlie.
        </Link>
        <div className="links">
          <a href="#how">Cara kerja</a>
          <a href="#tools">Tools</a>
          <a href="#features">Fitur</a>
          <a href="#palette">Palet</a>
          <a href="#pilih">Jenis website</a>
          <Link href="/examples">Contoh</Link>
        </div>
        <Link href="/dashboard" className="btn btn-dark">Buka workspace</Link>
      </nav>

      <section className="hero2">
        <div>
          <h1>
            Dari brief ke website<br />
            yang <span className="hl">bisa Anda edit.</span>
          </h1>
          <p className="sub">
            Winterlie membuat arah desain dari deskripsi Anda, lalu memberi kontrol penuh per section.
            Ubah satu bagian tanpa merusak yang lain.
          </p>
          <div className="cta-row">
            <Link href="/tools/mockup-maker" className="btn">
              Mulai mendesain <Icon name="arrow" size={16} />
            </Link>
            <Link href="/projects" className="btn btn-ghost">Lihat project</Link>
          </div>
          <div className="note">Gratis untuk dicoba. Tidak perlu kartu kredit.</div>
        </div>

        <EditablePreview />
      </section>

      <section className="section" id="how">
        <div className="section-head">
          <div className="eyebrow">Cara kerja</div>
          <h2>Dari satu ide ke arah desain, dalam tiga langkah.</h2>
          <p>Anda tetap memegang kendali di setiap langkah. Tidak ada hasil yang dikunci.</p>
        </div>
        <div className="flow">
          <div className="flow-line" aria-hidden="true" />
          <div className="flow-step">
            <div className="flow-num">1</div>
            <div className="flow-card">
              <div className="icon-badge"><Icon name="pen" /></div>
              <h3>Tulis ide</h3>
              <p>Jelaskan bisnis atau produk Anda, dan pilih jenis website: toko, game, streaming, atau landing page.</p>
            </div>
          </div>
          <div className="flow-step">
            <div className="flow-num">2</div>
            <div className="flow-card">
              <div className="icon-badge"><Icon name="layers" /></div>
              <h3>AI menyusun tiga arah</h3>
              <p>Tiga arah desain yang berbeda struktur, warna, dan font. Bandingkan, lalu pilih satu.</p>
            </div>
          </div>
          <div className="flow-step">
            <div className="flow-num">3</div>
            <div className="flow-card">
              <div className="icon-badge"><Icon name="edit" /></div>
              <h3>Edit per section</h3>
              <p>Ubah teks, urutan, atau tulis ulang satu section. Setiap perubahan tersimpan sebagai versi baru.</p>
            </div>
          </div>
        </div>
        <div className="cta-row" style={{ marginTop: 28 }}>
          <Link href="/examples/toko-online" className="btn">Coba dulu, tanpa daftar <Icon name="arrow" size={16} /></Link>
          <Link href="/tools/mockup-maker" className="btn btn-ghost">Mulai dengan ide Anda</Link>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-head">
          <div className="eyebrow">Fitur</div>
          <h2>Dibuat untuk orang yang harus mengirim hasil.</h2>
          <p>Setiap fitur di sini adalah bagian dari rencana produk. Status ditandai jujur.</p>
        </div>
        <div className="feat-grid">
          <div className="feat">
            <div className="icon-badge"><Icon name="sparkle" /></div>
            <div>
              <h3>Regenerasi satu section <span className="badge-soon">Segera hadir</span></h3>
              <p>Minta ulang satu bagian dengan konteks sekitarnya. Section lain tidak berubah.</p>
            </div>
          </div>
          <div className="feat">
            <div className="icon-badge"><Icon name="history" /></div>
            <div>
              <h3>Riwayat versi <span className="badge-soon">Segera hadir</span></h3>
              <p>Setiap perubahan tersimpan sebagai versi. Kembali ke versi sebelumnya kapan saja.</p>
            </div>
          </div>
          <div className="feat">
            <div className="icon-badge"><Icon name="code" /></div>
            <div>
              <h3>Export ke React + Tailwind <span className="badge-soon">Segera hadir</span></h3>
              <p>Unduh proyek yang siap dibuka di editor Anda, dengan token desain yang sama.</p>
            </div>
          </div>
          <div className="feat">
            <div className="icon-badge"><Icon name="shield" /></div>
            <div>
              <h3>Aman secara default</h3>
              <p>Konten AI diperlakukan sebagai data, bukan kode. Tidak ada HTML atau script yang dijalankan dari hasil AI.</p>
            </div>
          </div>
        </div>
      </section>


      <section className="section" id="palette">
        <div className="section-head">
          <div className="eyebrow">Color palette</div>
          <h2>Satu warna brand, palet lengkap yang tetap terbaca.</h2>
          <p>Masukkan satu warna, kami hitung palet harmonis dan memeriksa kontrasnya sesuai standar WCAG.</p>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="mini-swatches">
            {SAMPLE_ROLES.map(([label, hex]) => {
              const ratio = contrastRatio(hex, SAMPLE.background);
              return (
                <div key={label} className="mini">
                  <i style={{ background: hex }} />
                  <span>{hex}</span>
                  <b>{label}</b>
                  <span style={{ paddingTop: 0 }}>{label === "Background" ? "Latar" : `${ratio}:1 · ${contrastLevel(ratio)}`}</span>
                </div>
              );
            })}
          </div>
          <div className="cta-row" style={{ marginTop: 20 }}>
            <Link href="/tools/color-palette" className="btn">Coba dengan warna brand Anda <Icon name="arrow" size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="section" id="pilih">
        <div className="section-head">
          <div className="eyebrow">Mulai dari sini</div>
          <h2>Mau bikin website apa?</h2>
          <p>Pilih jenisnya dulu. Struktur halaman, warna, dan teksnya akan menyesuaikan.</p>
        </div>
        <div className="site-type-grid">
          {[
            { id: "ecommerce", label: "Toko online", hint: "Jualan produk dengan katalog dan keranjang", icon: "🛒" },
            { id: "game", label: "Landing game", hint: "Promosi game, peringkat, dan komunitas", icon: "♟" },
            { id: "streaming", label: "Streaming", hint: "Film, serial, atau musik dengan paket langganan", icon: "▶" },
            { id: "landing", label: "Landing page", hint: "Profil usaha atau jasa dengan ajakan", icon: "◻" },
          ].map((o) => (
            <Link key={o.id} href={`/tools/mockup-maker?type=${o.id}`} className="site-type">
              <span className="site-type-icon">{o.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{o.label}</span>
              <span className="muted" style={{ fontSize: 12 }}>{o.hint}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="tools">
        <div className="section-head">
          <div className="eyebrow">Tools</div>
          <h2>Satu workspace, beberapa alat.</h2>
          <p>Mulai dari DesignForge. Tools lain menyusul sesuai roadmap.</p>
        </div>
        <div className="feat-grid">
          {TOOLS.map((t) => (
            <Link key={t.name} href={t.href} className="feat">
              <div className="icon-badge"><Icon name="grid" /></div>
              <div>
                <h3>
                  {t.name}
                  <span className={t.status === "live" ? "badge-live" : "badge-soon"}>
                    {t.status === "live" ? "Tersedia" : "Segera hadir"}
                  </span>
                </h3>
                <p>{t.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>Coba dengan brief Anda sendiri.</h2>
          <p>Mulai dari satu deskripsi. Anda bisa mengedit semuanya setelah itu.</p>
        </div>
        <Link href="/tools/mockup-maker" className="btn">
          Mulai mendesain <Icon name="arrow" size={16} />
        </Link>
      </section>

      <footer className="site-foot">
        <span className="logo"><span className="logo-svg"><Icon name="logo" size={16} /></span> winterlie.</span>
        <span>© 2026 Winterlie</span>
      </footer>
    </>
  );
}
