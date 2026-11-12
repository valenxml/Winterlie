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
          <h2>Tiga langkah, dengan kontrol di setiap langkah.</h2>
          <p>Anda tidak menerima satu hasil lalu menebak-nebak. Setiap keputusan bisa diubah.</p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="icon-badge"><Icon name="pen" /></div>
            <h3>Tulis brief</h3>
            <p>Jelaskan bisnis, audiens, dan tujuan website. Semakin spesifik, semakin tepat hasilnya.</p>
          </div>
          <div className="step">
            <div className="icon-badge"><Icon name="layers" /></div>
            <h3>Pilih arah desain</h3>
            <p>Bandingkan tiga arah yang berbeda dalam tata letak, tipografi, dan kepadatan, lalu pilih satu.</p>
          </div>
          <div className="step">
            <div className="icon-badge"><Icon name="edit" /></div>
            <h3>Edit per section</h3>
            <p>Ganti satu section, pindahkan urutan, atau ubah warna dan font. Bagian lain tetap sama.</p>
          </div>
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
