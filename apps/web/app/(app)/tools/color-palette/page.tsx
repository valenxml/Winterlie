import { PaletteTool } from "./palette-tool";

export default function ColorPalettePage() {
  return (
    <>
      <div className="crumb">Tools / <b>Color Palette</b></div>
      <div className="tool-head">
        <div className="tool-title">
          <div className="tool-icon">◐</div>
          <div>
            <h1 className="title">Color Palette</h1>
            <p className="lead">Pilih satu warna brand. Kami buat palet lengkap dan memeriksa apakah teksnya terbaca.</p>
          </div>
        </div>
        <div className="tool-art" aria-hidden="true" />
      </div>
      <PaletteTool />
    </>
  );
}
