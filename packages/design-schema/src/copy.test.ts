import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCopy, buildCopyPrompt, extractJsonObject, parseAiCopy } from "./copy.js";
import { buildLandingDirections } from "./templates.js";
import { designSpecSchema } from "./design.js";

const copyJson = {
  badge: "Baru buka",
  title: "Kopi yang bercerita tentang Bandung",
  accent: "Bandung",
  description: "Biji pilihan dari petani lokal, disangrai setiap minggu di kedai kecil kami.",
  ctaLabel: "Lihat menu",
  features: [
    { title: "Biji lokal", description: "Dipilih langsung dari petani di dataran tinggi." },
    { title: "Sangrai mingguan", description: "Setiap batch disangrai untuk rasa yang konsisten." },
    { title: "Suasana tenang", description: "Tempat nyaman untuk bekerja atau berbincang." },
  ],
  faq: [
    { question: "Apakah ada Wi-Fi?", answer: "Ada, dan tersedia area tenang untuk bekerja." },
    { question: "Bisa pesan untuk acara?", answer: "Bisa, hubungi kami untuk paket grup." },
  ],
  ctaTitle: "Mampir sore ini",
  ctaDescription: "Buka setiap hari dari pukul sembilan pagi sampai sembilan malam.",
};

const input = { brand: "Kopi Kenangan", description: "Kedai kopi untuk anak muda di Bandung." };

test("parses copy wrapped in prose and code fences", () => {
  const reply = "Berikut hasilnya:\n```json\n" + JSON.stringify(copyJson) + "\n```\nSemoga membantu.";
  assert.equal(parseAiCopy(reply).badge, "Baru buka");
});

test("rejects copy that contains markup", () => {
  const bad = { ...copyJson, title: "<img src=x onerror=alert(1)> Kopi" };
  assert.throws(() => parseAiCopy(JSON.stringify(bad)));
});

test("rejects copy with the wrong number of features or faq items", () => {
  assert.throws(() => parseAiCopy(JSON.stringify({ ...copyJson, features: copyJson.features.slice(0, 2) })));
  assert.throws(() => parseAiCopy(JSON.stringify({ ...copyJson, faq: [copyJson.faq[0]] })));
});

test("a reply without JSON is an error", () => {
  assert.throws(() => extractJsonObject("maaf, saya tidak bisa"));
});

test("applying copy keeps the spec valid and the same section ids", () => {
  for (const template of buildLandingDirections(input)) {
    const out = applyCopy(template, parseAiCopy(JSON.stringify(copyJson)));
    assert.equal(designSpecSchema.safeParse(out).success, true, out.direction);
    assert.deepEqual(out.sections.map((s) => s.id), template.sections.map((s) => s.id));
  }
});

test("applied copy replaces the hero text and keeps the accent inside the title", () => {
  const out = applyCopy(buildLandingDirections(input)[0]!, parseAiCopy(JSON.stringify(copyJson)));
  const hero = out.sections.find((s) => s.type.startsWith("hero-")) as { content: { title: string; accent?: string } };
  assert.equal(hero.content.title, copyJson.title);
  assert.ok(hero.content.title.includes(hero.content.accent ?? ""));
});

test("an accent word that is not in the title is replaced by the last title word", () => {
  const copy = { ...copyJson, accent: "tidakada" };
  const out = applyCopy(buildLandingDirections(input)[0]!, parseAiCopy(JSON.stringify(copy)));
  const hero = out.sections.find((s) => s.type.startsWith("hero-")) as { content: { accent?: string } };
  assert.equal(hero.content.accent, "Bandung");
});

test("prompt asks for JSON only and includes the brief", () => {
  const { system, user } = buildCopyPrompt(input);
  assert.ok(system.includes("JSON"));
  assert.ok(user.includes("Kopi Kenangan"));
});
