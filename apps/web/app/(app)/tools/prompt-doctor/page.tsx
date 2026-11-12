import { ToolHead, ToolSoon } from "@/components/tool-page";

export default function PromptDoctorPage() {
  return (
    <>
      <div className="crumb">Tools / <b>Prompt Doctor</b></div>
      <ToolHead icon="✎" title="Prompt Doctor" lead="Ubah prompt berantakan jadi instruksi AI yang jelas dan efektif." />
      <div className="card">
        <div className="field-area">
          <textarea placeholder="Masukkan prompt Anda di sini..." disabled rows={4} />
          <div className="counter">0/2000</div>
        </div>
        <div className="foot">
          <div className="pills">
            <span className="pill active">Simple</span>
            <span className="pill">Detailed</span>
            <span className="pill">Expert</span>
          </div>
          <button className="btn" disabled>Improve Prompt →</button>
        </div>
        <ToolSoon />
      </div>
    </>
  );
}
