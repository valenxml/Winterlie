import Link from "next/link";
import type { ReactNode } from "react";

const MAIN = [
  { href: "/dashboard", label: "Home" },
  { href: "/projects", label: "Projects" },
];

const TOOLS = [
  { href: "/tools/slop-detector", label: "Slop Detector" },
  { href: "/tools/prompt-doctor", label: "Prompt Doctor" },
  { href: "/tools/project-architect", label: "Project Architect" },
  { href: "/tools/output-checker", label: "AI Output Checker" },
  { href: "/tools/mockup-maker", label: "Mockup Maker" },
  { href: "/tools/color-palette", label: "Color Palette" },
  { href: "/tools/typography", label: "Typography" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="logo">
          <span className="logo-mark">✦</span> winterlie.
        </Link>
        {MAIN.map((n) => (
          <Link key={n.href} href={n.href} className="nav-item">
            <span className="nav-dot" /> {n.label}
          </Link>
        ))}
        <div className="nav-label">Tools</div>
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="nav-item">
            <span className="nav-dot" /> {t.label}
          </Link>
        ))}
      </aside>
      <div className="app-main">
        <div className="topbar">
          <span>Tools ▾</span>
          <span>Templates</span>
          <span>Pricing</span>
          <span>About</span>
          <span className="spacer" />
          <span className="avatar" />
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
