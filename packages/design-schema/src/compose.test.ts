import { test } from "node:test";
import assert from "node:assert/strict";
import { composePlanSchema, composeSpec, parseComposeReply, plansAreDistinct, buildComposePrompt, type ComposePlan } from "./compose.js";
import { designSpecSchema } from "./design.js";

const chessPlan = {
  label: "Papan gelap",
  name: "Catur Arena",
  palette: { primary: "#1F2937", accent: "#B45309", background: "#F8F5EE" },
  headingFont: "sans-grotesk",
  bodyFont: "sans-humanist",
  heroVisual: "pattern",
  sections: ["hero-centered", "feature-grid", "faq", "cta-banner"],
  copy: {
    "hero-centered": { badge: "Main sekarang", title: "Catur online untuk semua level", accent: "level", description: "Lawan teman atau pemain acak dengan kontrol waktu yang adil.", ctaLabel: "Mulai main" },
    "feature-grid": { heading: "Mode permainan", items: [
      { title: "Bullet 1 menit", description: "Partai cepat untuk latihan refleks." },
      { title: "Rapid 10 menit", description: "Waktu cukup untuk strategi yang matang." },
      { title: "Analisis partai", description: "Tinjau langkah dan lihat evaluasi posisi." },
    ] },
    faq: { heading: "Pertanyaan umum", items: [
      { question: "Apakah gratis dimainkan?", answer: "Ya, mode dasar gratis tanpa batas." },
      { question: "Bagaimana sistem peringkat?", answer: "Peringkat dihitung dari hasil partai yang rated." },
    ] },
    "cta-banner": { title: "Siap menguji langkahmu?", description: "Buat akun dan langsung cari lawan.", ctaLabel: "Daftar" },
  },
};

const variantA = chessPlan;
const variantB = { ...chessPlan, label: "Kayu hangat", heroVisual: "gradient", headingFont: "serif-classic", sections: ["hero-split", "faq", "cta-banner"], copy: { ...chessPlan.copy, "hero-split": chessPlan.copy["hero-centered"] } };
const variantC = { ...chessPlan, label: "Turnamen", heroVisual: "cards", headingFont: "display-condensed", sections: ["hero-editorial", "feature-alternating", "cta-banner"], copy: { ...chessPlan.copy, "hero-editorial": chessPlan.copy["hero-centered"], "feature-alternating": { heading: "Format turnamen", items: [{ title: "Swiss 7 ronde", description: "Pemain bertemu lawan dengan poin serupa." }, { title: "Final terbuka", description: "Delapan pemain terbaik maju ke final." }] } } };

test("a chess plan composes into a valid spec with the requested visuals", () => {
  const spec = composeSpec(composePlanSchema.parse(chessPlan), { brand: "Catur Arena", description: "Website game catur online", index: 0 });
  assert.equal(designSpecSchema.safeParse(spec).success, true);
  assert.equal(spec.tokens.colors.primary, "#1F2937");
  const hero = spec.sections.find((s) => s.type.startsWith("hero-")) as any;
  assert.equal(hero.settings.visual, "pattern");
  assert.equal(spec.sections[0]!.type, "navbar");
  assert.equal(spec.sections[spec.sections.length - 1]!.type, "footer");
});

test("composed sections get unique ids and keep the chosen order", () => {
  const spec = composeSpec(composePlanSchema.parse(chessPlan), { brand: "Catur", description: "Game catur", index: 0 });
  assert.deepEqual(spec.sections.map((s) => s.type), ["navbar", "hero-centered", "feature-grid", "faq", "cta-banner", "footer"]);
  assert.equal(new Set(spec.sections.map((s) => s.id)).size, spec.sections.length);
});

test("a plan without a leading hero is rejected", () => {
  assert.equal(composePlanSchema.safeParse({ ...chessPlan, sections: ["faq", "hero-centered"] }).success, false);
});

test("two heroes or duplicate section types are rejected", () => {
  assert.equal(composePlanSchema.safeParse({ ...chessPlan, sections: ["hero-centered", "hero-split"] }).success, false);
  assert.equal(composePlanSchema.safeParse({ ...chessPlan, sections: ["hero-centered", "faq", "faq"] }).success, false);
});

test("a dark background is rejected, so the template text stays readable", () => {
  const dark = { ...chessPlan, palette: { ...chessPlan.palette, background: "#111111" } };
  assert.equal(composePlanSchema.safeParse(dark).success, false);
});

test("copy must match the section it belongs to", () => {
  const bad = { ...chessPlan, copy: { ...chessPlan.copy, faq: { heading: "FAQ", items: [{ question: "Satu?", answer: "Satu." }] } } };
  assert.equal(composePlanSchema.safeParse(bad).success, false);
});

test("three distinct plans parse from a noisy reply, and identical plans are refused", () => {
  const reply = "Berikut rencananya:\n" + JSON.stringify({ plans: [variantA, variantB, variantC] }) + "\nSemoga cocok.";
  const plans = parseComposeReply(reply);
  assert.equal(plans.length, 3);
  assert.throws(() => parseComposeReply(JSON.stringify({ plans: [variantA, variantA, variantA] })));
});

test("the three composed directions differ in structure", () => {
  const plans = [variantA, variantB, variantC].map((p) => composePlanSchema.parse(p)) as ComposePlan[];
  assert.equal(plansAreDistinct(plans), true);
  const specs = plans.map((p, i) => composeSpec(p, { brand: "Catur", description: "Game catur", index: i }));
  assert.equal(new Set(specs.map((s) => s.sections.map((x) => x.type).join(","))).size, 3);
});

test("the prompt lists the catalog and the chess brief", () => {
  const { system, user } = buildComposePrompt({ brand: "Catur Arena", description: "Website game catur" });
  assert.ok(system.includes("JSON"));
  assert.ok(user.includes("hero-centered"));
  assert.ok(user.includes("catur"));
});
