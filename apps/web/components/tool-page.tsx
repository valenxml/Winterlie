import type { ReactNode } from "react";

export function ToolHead({ title, lead, icon }: { title: string; lead: string; icon: string }) {
  return (
    <div className="tool-head">
      <div>
        <div className="tool-title">
          <div className="tool-icon">{icon}</div>
          <div>
            <h1 className="title">{title}</h1>
            <p className="lead">{lead}</p>
          </div>
        </div>
      </div>
      <div className="tool-art" aria-hidden="true" />
    </div>
  );
}

export function ToolSoon({ children }: { children?: ReactNode }) {
  return (
    <p className="hint" style={{ marginTop: 14 }}>
      {children ?? "Fitur ini sedang dibangun. Tampilan sudah siap, tombol akan aktif setelah backend-nya selesai."}
    </p>
  );
}
