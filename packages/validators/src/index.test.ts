import { test } from "node:test";
import assert from "node:assert/strict";
import { designBriefSchema, projectCreateSchema } from "./index.js";

test("project name is trimmed and required", () => {
  assert.equal(projectCreateSchema.parse({ name: "  Futsal  " }).name, "Futsal");
  assert.equal(projectCreateSchema.safeParse({ name: "   " }).success, false);
});

test("design brief applies defaults and rejects non-http reference URLs", () => {
  const ok = designBriefSchema.parse({
    description: "Premium coffee shop website for young adults, warm and editorial.",
    category: "landing",
  });
  assert.deepEqual(ok.referenceUrls, []);
  const bad = designBriefSchema.safeParse({
    description: "Premium coffee shop website for young adults, warm and editorial.",
    category: "landing",
    referenceUrls: ["ftp://example.com/x"],
  });
  assert.equal(bad.success, false);
});

test("short briefs are rejected", () => {
  assert.equal(designBriefSchema.safeParse({ description: "coffee", category: "landing" }).success, false);
});
