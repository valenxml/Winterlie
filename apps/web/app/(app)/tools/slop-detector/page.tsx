import { ToolHead, ToolSoon } from "@/components/tool-page";

export default function SlopDetectorPage() {
  return (
    <>
      <div className="crumb">Tools / <b>Slop Detector</b></div>
      <ToolHead icon="◇" title="Slop Detector" lead="Periksa apakah website terlihat berkualitas atau cuma AI-generated slop." />
      <div className="card">
        <div className="tabs">
          <span className="tab active">Website URL</span>
          <span className="tab">Upload Screenshot</span>
        </div>
        <div className="field">
          <input placeholder="https://example.com" disabled />
          <button className="btn" disabled>Analyze Website →</button>
        </div>
        <div className="hint">Contoh: https://techcrunch.com, https://google.com</div>
        <ToolSoon />
      </div>
    </>
  );
}
