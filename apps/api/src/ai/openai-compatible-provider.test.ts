import { test } from "node:test";
import assert from "node:assert/strict";
import { OpenAICompatibleProvider } from "./openai-compatible-provider.js";
import { AIProviderError } from "./provider.js";

const req = { system: "s", user: "u", maxTokens: 50, timeoutMs: 1000 };
const noSleep = async () => {};
const ok = (content: string | null) =>
  new Response(
    JSON.stringify({ model: "m-x", choices: [{ message: { content }, finish_reason: "stop" }], usage: { prompt_tokens: 3, completion_tokens: 4 } }),
    { status: 200 },
  );

test("posts to /chat/completions and parses the reply", async () => {
  let seenUrl = "";
  const p = new OpenAICompatibleProvider({
    baseUrl: "https://example.test/v1/", apiKey: "k", model: "m", maxRetries: 0, sleep: noSleep,
    fetchImpl: async (url) => { seenUrl = url; return ok("halo"); },
  });
  const r = await p.complete(req);
  assert.equal(seenUrl, "https://example.test/v1/chat/completions");
  assert.equal(r.text, "halo");
  assert.equal(r.inputTokens, 3);
  assert.equal(r.outputTokens, 4);
});

test("sends the key as a bearer header, never in the URL", async () => {
  let url = ""; let auth = "";
  const p = new OpenAICompatibleProvider({
    baseUrl: "https://example.test/v1", apiKey: "secret-key", model: "m", maxRetries: 0, sleep: noSleep,
    fetchImpl: async (u, init) => { url = u; auth = (init.headers as Record<string, string>).authorization ?? ""; return ok("x"); },
  });
  await p.complete(req);
  assert.equal(auth, "Bearer secret-key");
  assert.ok(!url.includes("secret-key"));
});

test("refuses non-https base URLs", () => {
  assert.throws(() => new OpenAICompatibleProvider({ baseUrl: "http://insecure.test/v1", apiKey: "k", model: "m", maxRetries: 0 }));
});

test("empty content is not retried", async () => {
  let calls = 0;
  const p = new OpenAICompatibleProvider({
    baseUrl: "https://example.test/v1", apiKey: "k", model: "m", maxRetries: 3, sleep: noSleep,
    fetchImpl: async () => { calls += 1; return ok(null); },
  });
  await assert.rejects(p.complete(req), (e: unknown) => e instanceof AIProviderError && !e.retryable);
  assert.equal(calls, 1);
});

test("retries 503 then succeeds", async () => {
  let calls = 0;
  const p = new OpenAICompatibleProvider({
    baseUrl: "https://example.test/v1", apiKey: "k", model: "m", maxRetries: 2, sleep: noSleep,
    fetchImpl: async () => { calls += 1; return calls === 1 ? new Response("busy", { status: 503 }) : ok("done"); },
  });
  assert.equal((await p.complete(req)).text, "done");
});
