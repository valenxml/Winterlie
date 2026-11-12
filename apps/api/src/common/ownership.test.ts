import { test } from "node:test";
import assert from "node:assert/strict";
import { canRead, canWrite, roleFor } from "./ownership.js";

test("viewers can read but not write", () => {
  assert.equal(canRead("VIEWER"), true);
  assert.equal(canWrite("VIEWER"), false);
});

test("non-members can neither read nor write", () => {
  assert.equal(canRead(null), false);
  assert.equal(canWrite(null), false);
});

test("members and above can write", () => {
  for (const role of ["OWNER", "ADMIN", "MEMBER"] as const) {
    assert.equal(canWrite(role), true, role);
  }
});

test("roleFor returns null for workspaces the user does not belong to", () => {
  const memberships = [{ workspaceId: "ws-a", role: "OWNER" as const }];
  assert.equal(roleFor(memberships, "ws-a"), "OWNER");
  assert.equal(roleFor(memberships, "ws-b"), null);
});
