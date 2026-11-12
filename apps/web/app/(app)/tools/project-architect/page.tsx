import { ToolHead, ToolSoon } from "@/components/tool-page";

const POPULAR = ["SaaS Platform", "E-commerce", "Mobile App", "Portfolio Website"];

export default function ProjectArchitectPage() {
  return (
    <>
      <div className="crumb">Tools / <b>Project Architect</b></div>
      <ToolHead icon="⬡" title="Project Architect" lead="Ubah ide menjadi struktur project, database, API, dan roadmap." />
      <div className="card">
        <div className="field">
          <input placeholder='Contoh: "I want to build a futsal court booking website..."' disabled />
          <button className="btn" disabled>Generate Blueprint →</button>
        </div>
        <div className="foot" style={{ justifyContent: "flex-start" }}>
          <span className="muted">Popular ideas:</span>
          <div className="pills">
            {POPULAR.map((p) => (
              <span key={p} className="pill">{p}</span>
            ))}
          </div>
        </div>
        <ToolSoon />
      </div>
    </>
  );
}
