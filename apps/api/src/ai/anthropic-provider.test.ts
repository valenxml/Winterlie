import { test } from "node:test";
import assert from "node:assert/strict";
import { AnthropicProvider } from "./anthropic-provider.js";
import { AIProviderError } from "./provider.js";

const req = { system: "s", user: "u", maxTokens: 100, timeoutMs: 1000 };
const ok = (text: string) =>
  new Response(
    JSON.stringify({ content: [{ type: "text", text }], model: "claude-test", usage: { input_tokens: 3, output_tokens: 5 } }),
    { status: 200 },
  );
const noSleep = async () => {};

test("returns text from a successful response", async () => {
  const p = new AnthropicProvider({ apiKey: "k", model: "m", maxRetries: 0, fetchImpl: async () => ok("hello"), sleep: noSleep });
  const r = await p.complete(req);
  assert.equal(r.text, "hello");
  assert.equal(r.outputTokens, 5);
});

test("retries transient 429 then succeeds", async () => {
  let calls = 0;
  const p = new AnthropicProvider({
    apiKey: "k", model: "m", maxRetries: 2, sleep: noSleep,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? new Response("slow down", { status: 429 }) : ok("done");
    },
  });
  assert.equal((await p.complete(req)).text, "done");
  assert.equal(calls, 2);
});

test("does not retry non-retryable 400 errors", async () => {
  let calls = 0;
  const p = new AnthropicProvider({
    apiKey: "k", model: "m", maxRetries: 3, sleep: noSleep,
    fetchImpl: async () => {
      calls += 1;
      return new Response("bad", { status: 400 });
    },
  });
  await assert.rejects(p.complete(req), (e: unknown) => e instanceof AIProviderError && e.retryable === false);
  assert.equal(calls, 1);
});

test("gives up after maxRetries", async () => {
  let calls = 0;
  const p = new AnthropicProvider({
    apiKey: "k", model: "m", maxRetries: 2, sleep: noSleep,
    fetchImpl: async () => {
      calls += 1;
      return new Response("down", { status: 503 });
    },
  });
  await assert.rejects(p.complete(req));
  assert.equal(calls, 3);
});

test("timeouts are retryable and do not leak the API key", async () => {
  const p = new AnthropicProvider({
    apiKey: "secret-key", model: "m", maxRetries: 0, sleep: noSleep,
    fetchImpl: (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
        );
      }),
  });
  await assert.rejects(p.complete({ ...req, timeoutMs: 10 }), (e: unknown) =>
    e instanceof AIProviderError && e.retryable && !e.message.includes("secret-key"),
  );
});
