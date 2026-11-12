import { test } from "node:test";
import assert from "node:assert/strict";
import { withRetry } from "./retry.js";
import { AIProviderError } from "./provider.js";

const noSleep = async () => {};

test("withRetry stops at the first non-retryable error", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(async () => { calls += 1; throw new AIProviderError("bad", false, 400); }, 5, noSleep),
  );
  assert.equal(calls, 1);
});

test("withRetry backs off between attempts", async () => {
  const delays: number[] = [];
  let calls = 0;
  const result = await withRetry(
    async () => { calls += 1; if (calls < 3) throw new AIProviderError("busy", true, 503); return "ok"; },
    3,
    async (ms) => { delays.push(ms); },
  );
  assert.equal(result, "ok");
  assert.deepEqual(delays, [500, 1000]);
});
