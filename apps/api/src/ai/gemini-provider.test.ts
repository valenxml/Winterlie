import { test } from "node:test";
import assert from "node:assert/strict";
import { GeminiProvider } from "./gemini-provider.js";
import { AIProviderError } from "./provider.js";

const req = { system: "s", user: "u", maxTokens: 100, timeoutMs: 1000 };
const ok = (text: string) =>
  new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text }] }, finishReason: "STOP" }],
      usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 6 },
      modelVersion: "gemini-test",
    }),
    { status: 200 },
  );
const noSleep = async () => {};

test("parses text and token usage from a successful response", async () => {
  const p = new GeminiProvider({ apiKey: "k", model: "m", maxRetries: 0, fetchImpl: async () => ok("halo"), sleep: noSleep });
  const r = await p.complete(req);
  assert.equal(r.text, "halo");
  assert.equal(r.inputTokens, 4);
  assert.equal(r.outputTokens, 6);
  assert.equal(r.provider, "gemini");
});

test("sends the key in a header and never in the URL", async () => {
  let seenUrl = "";
  let seenHeaders: Record<string, string> = {};
  const p = new GeminiProvider({
    apiKey: "secret-key", model: "gemini-2.5-flash", maxRetries: 0, sleep: noSleep,
    fetchImpl: async (url, init) => {
      seenUrl = url;
      seenHeaders = init.headers as Record<string, string>;
      return ok("x");
    },
  });
  await p.complete(req);
  assert.ok(!seenUrl.includes("secret-key"));
  assert.equal(seenHeaders["x-goog-api-key"], "secret-key");
  assert.ok(seenUrl.includes("gemini-2.5-flash:generateContent"));
});

test("requests JSON output when asked", async () => {
  let body = "";
  const p = new GeminiProvider({
    apiKey: "k", model: "m", maxRetries: 0, sleep: noSleep,
    fetchImpl: async (_u, init) => {
      body = String(init.body);
      return ok("{}");
    },
  });
  await p.complete({ ...req, json: true });
  assert.ok(body.includes('"responseMimeType":"application/json"'));
});

test("retries 429 then succeeds", async () => {
  let calls = 0;
  const p = new GeminiProvider({
    apiKey: "k", model: "m", maxRetries: 2, sleep: noSleep,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? new Response("busy", { status: 429 }) : ok("done");
    },
  });
  assert.equal((await p.complete(req)).text, "done");
  assert.equal(calls, 2);
});

test("empty candidates are not retried", async () => {
  let calls = 0;
  const p = new GeminiProvider({
    apiKey: "k", model: "m", maxRetries: 3, sleep: noSleep,
    fetchImpl: async () => {
      calls += 1;
      return new Response(JSON.stringify({ candidates: [{ finishReason: "SAFETY" }] }), { status: 200 });
    },
  });
  await assert.rejects(p.complete(req), (e: unknown) => e instanceof AIProviderError && !e.retryable);
  assert.equal(calls, 1);
});
