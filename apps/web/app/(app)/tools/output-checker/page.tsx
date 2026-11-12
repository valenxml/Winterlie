import { ToolHead, ToolSoon } from "@/components/tool-page";

export default function OutputCheckerPage() {
  return (
    <>
      <div className="crumb">Tools / <b>AI Output Checker</b></div>
      <ToolHead icon="✓" title="AI Output Checker" lead="Audit hasil AI untuk menemukan kesalahan, celah, dan instruksi yang terlewat." />
      <div className="card">
        <div className="tabs">
          <span className="tab active">Text</span>
          <span className="tab">Article</span>
          <span className="tab">Code</span>
          <span className="tab">Image Analysis</span>
        </div>
        <div className="field-area">
          <textarea placeholder="Tempel atau ketik hasil AI di sini..." disabled rows={5} />
          <div className="counter">0/10000</div>
        </div>
        <div className="foot">
          <button className="btn btn-ghost" disabled>↑ Upload File</button>
          <button className="btn" disabled>Check Output →</button>
        </div>
        <ToolSoon />
      </div>
    </>
  );
}
