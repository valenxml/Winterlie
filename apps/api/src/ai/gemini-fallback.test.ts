import { test } from "node:test";
import assert from "node:assert/strict";
import { GeminiProvider } from "./gemini-provider.js";
import { AIProviderError } from "./provider.js";

const req = { system: "s", user: "u", maxTokens: 50, timeoutMs: 1000 };
const noSleep = async () => {};
const ok = () =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }), { status: 200 });

test("falls back to the next model when the primary is busy (503)", async () => {
  const tried: string[] = [];
  const p = new GeminiProvider({
    apiKey: "k", model: "busy-model", fallbackModels: ["good-model"], maxRetries: 0, sleep: noSleep,
    fetchImpl: async (url) => {
      tried.push(url.includes("busy-model") ? "busy" : "good");
      return url.includes("busy-model") ? new Response("busy", { status: 503 }) : ok();
    },
  });
  const r = await p.complete(req);
  assert.equal(r.text, "ok");
  assert.deepEqual(tried, ["busy", "good"]);
});

test("falls back on rate limit (429) and missing model (404)", async () => {
  const p = new GeminiProvider({
    apiKey: "k", model: "a", fallbackModels: ["b", "c"], maxRetries: 0, sleep: noSleep,
    fetchImpl: async (url) => {
      if (url.includes("/a:")) return new Response("x", { status: 429 });
      if (url.includes("/b:")) return new Response("x", { status: 404 });
      return ok();
    },
  });
  assert.equal((await p.complete(req)).text, "ok");
});

test("does not fall back on a blocked (empty) response", async () => {
  let calls = 0;
  const p = new GeminiProvider({
    apiKey: "k", model: "a", fallbackModels: ["b"], maxRetries: 0, sleep: noSleep,
    fetchImpl: async () => {
      calls += 1;
      return new Response(JSON.stringify({ candidates: [{ finishReason: "SAFETY" }] }), { status: 200 });
    },
  });
  await assert.rejects(p.complete(req), (e: unknown) => e instanceof AIProviderError && !e.retryable);
  assert.equal(calls, 1);
});

test("does not fall back on a client error such as a bad request (400)", async () => {
  let calls = 0;
  const p = new GeminiProvider({
    apiKey: "k", model: "a", fallbackModels: ["b"], maxRetries: 0, sleep: noSleep,
    fetchImpl: async () => {
      calls += 1;
      return new Response("bad", { status: 400 });
    },
  });
  await assert.rejects(p.complete(req));
  assert.equal(calls, 1);
});

test("throws the last error when every model is busy", async () => {
  const p = new GeminiProvider({
    apiKey: "k", model: "a", fallbackModels: ["b"], maxRetries: 0, sleep: noSleep,
    fetchImpl: async () => new Response("busy", { status: 503 }),
  });
  await assert.rejects(p.complete(req), (e: unknown) => e instanceof AIProviderError && e.status === 503);
});

test("duplicate models in the list are tried once", async () => {
  let calls = 0;
  const p = new GeminiProvider({
    apiKey: "k", model: "a", fallbackModels: ["a", "a"], maxRetries: 0, sleep: noSleep,
    fetchImpl: async () => { calls += 1; return new Response("busy", { status: 503 }); },
  });
  await assert.rejects(p.complete(req));
  assert.equal(calls, 1);
});
