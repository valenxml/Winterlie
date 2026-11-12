import type { DesignSpec } from "./design.js";

export function coffeeLanding(): DesignSpec {
  return {
    schemaVersion: 1,
    name: "Coffee Studio",
    direction: "editorial-minimal",
    category: "landing",
    tokens: {
      colors: {
        primary: "#493426", accent: "#C0733A", background: "#F5F0E8",
        surface: "#FFFFFF", text: "#25211E", muted: "#6B625A", border: "#DDD3C5",
      },
      typography: { heading: "serif-editorial", body: "sans-humanist", scale: "dramatic" },
      spacing: { section: "airy", containerWidth: 1200 },
      radius: "sm",
      shadow: "soft",
    },
    sections: [
      {
        id: "nav", type: "navbar",
        content: {
          brand: "Studio Kopi",
          links: [{ label: "Menu", href: "#menu" }, { label: "Visit", href: "#visit" }],
        },
        settings: { style: "plain", sticky: true },
      },
      {
        id: "hero", type: "hero-editorial",
        content: {
          eyebrow: "Roasted in small batches",
          title: "Coffee, Crafted Slowly",
          description: "Single-origin beans, roasted weekly and poured with patience.",
          primaryCta: { label: "See the menu", href: "#menu" },
          image: { kind: "placeholder", label: "Pour-over being prepared", aspect: "4:3" },
        },
        settings: { alignment: "left", imagePosition: "right", titleScale: "massive" },
      },
      {
        id: "faq", type: "faq",
        content: {
          heading: "Before you visit",
          items: [
            { question: "Do you take reservations?", answer: "Walk-ins only, except for group tastings." },
            { question: "Is there Wi-Fi?", answer: "Yes, and a quiet room for working." },
          ],
        },
        settings: { layout: "accordion" },
      },
    ],
  };
}
