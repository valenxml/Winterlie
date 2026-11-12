import { MockupMakerView } from "./mockup-maker-view";

export default function MockupMakerPage() {
  return (
    <>
      <div className="crumb">Tools / <b>Mockup Maker</b></div>
      <div className="tool-head">
        <div className="tool-title">
          <div className="tool-icon">▣</div>
          <div>
            <h1 className="title">Mockup Maker</h1>
            <p className="lead">Tulis brief, pilih satu dari tiga arah desain, lalu lihat hasilnya.</p>
          </div>
        </div>
        <div className="tool-art" aria-hidden="true" />
      </div>
      <MockupMakerView />
    </>
  );
}
