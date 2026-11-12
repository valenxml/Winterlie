import { TypographyTool } from "./typography-tool";

export default function TypographyPage() {
  return (
    <>
      <div className="crumb">Tools / <b>Typography</b></div>
      <div className="tool-head">
        <div className="tool-title">
          <div className="tool-icon">Aa</div>
          <div>
            <h1 className="title">Typography</h1>
            <p className="lead">Pilih pasangan font dan skala ukuran. Lihat langsung di contoh teks sebelum dipakai.</p>
          </div>
        </div>
        <div className="tool-art" aria-hidden="true" />
      </div>
      <TypographyTool />
    </>
  );
}
