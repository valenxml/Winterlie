// End-to-end check against a running API. Usage: node scripts/smoke-test.mjs
// Requires: API running on API_URL (default http://localhost:4000) with AUTH_SECRET set.
const API = process.env.API_URL ?? "http://localhost:4000";
const email = `smoke-${Date.now()}@test.local`;
const password = "smoke-test-123";
let cookie = "";
let failures = 0;

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const session = setCookie.find((c) => c.startsWith("wl_session="));
  if (session) cookie = session.split(";")[0];
  const text = await res.text();
  let data = text;
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) {
    const err = new Error(`${res.status} ${typeof data === "string" ? data : JSON.stringify(data)}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function step(name, fn) {
  try {
    const detail = await fn();
    console.log(`PASS  ${name}${detail ? ` (${detail})` : ""}`);
  } catch (err) {
    failures += 1;
    console.log(`FAIL  ${name}: ${err.message}`);
  }
}

async function registerWithOtp(address, pwd, name) {
  const req = await call("POST", "/auth/register/request", { email: address, password: pwd, name });
  if (!req.devCode) throw new Error("devCode tidak ada. Pastikan AUTH_DEV_BYPASS=true dan NODE_ENV bukan production");
  return call("POST", "/auth/register/verify", { email: address, code: req.devCode });
}

let projectId, directions, artifactId, sectionId, versionsBefore;

await step("API health", async () => {
  const h = await call("GET", "/health");
  if (h.status !== "ok") throw new Error("status is not ok");
});

await step("register with email code (request, then verify)", async () => {
  const u = await registerWithOtp(email, password, "Smoke");
  if (!u.id) throw new Error("no user id");
  return u.email;
});

await step("session works (/auth/me)", async () => {
  const me = await call("GET", "/auth/me");
  if (me.email !== email) throw new Error("wrong user");
});

await step("create a project", async () => {
  const p = await call("POST", "/projects", { name: "Smoke project", description: "Dibuat oleh skrip uji" });
  projectId = p.id;
  if (!projectId) throw new Error("no project id");
});

await step("generate three design directions", async () => {
  directions = await call("POST", `/projects/${projectId}/designs/generate`, {
    description: "Kedai kopi untuk anak muda yang suka suasana tenang dan menu lokal.",
    category: "landing",
    businessType: "Kopi Smoke",
  });
  if (!Array.isArray(directions) || directions.length !== 3) throw new Error(`expected 3, got ${directions?.length}`);
  artifactId = directions[0].id;
  sectionId = directions[0].spec.sections[1].id;
  return directions.map((d) => d.direction).join(", ");
});

await step("edit: move a section (creates a new version)", async () => {
  const before = await call("GET", `/projects/${projectId}/designs`);
  versionsBefore = before.length;
  const next = await call("POST", `/projects/${projectId}/designs/${artifactId}/ops`, {
    op: "move", sectionId, toIndex: 2,
  });
  if (next.version < 2) throw new Error(`expected version >= 2, got ${next.version}`);
  artifactId = next.id;
  return `now version ${next.version}`;
});

await step("version history lists all versions of the direction", async () => {
  const versions = await call("GET", `/projects/${projectId}/designs/${artifactId}/versions`);
  if (versions.length < 2) throw new Error(`expected >= 2 versions, got ${versions.length}`);
  const numbers = versions.map((v) => v.version);
  if (numbers[0] <= numbers[numbers.length - 1]) throw new Error("versions are not newest first");
  return `${versions.length} versions`;
});

await step("invalid edit is rejected (unknown section)", async () => {
  try {
    await call("POST", `/projects/${projectId}/designs/${artifactId}/ops`, { op: "remove", sectionId: "tidak-ada" });
  } catch (err) {
    if (err.status === 400 || err.status === 404) return `rejected with ${err.status}`;
    throw err;
  }
  throw new Error("invalid edit was accepted");
});

await step("another user cannot read this project", async () => {
  const otherEmail = `other-${Date.now()}@test.local`;
  await call("POST", "/auth/logout");
  cookie = "";
  await registerWithOtp(otherEmail, password, "Lain");
  try {
    await call("GET", `/projects/${projectId}/designs`);
  } catch (err) {
    if (err.status === 404) return "404, as expected";
    throw err;
  }
  throw new Error("other user could read the project");
});

await step("logout ends the session", async () => {
  await call("POST", "/auth/logout");
  cookie = "";
  try {
    await call("GET", "/auth/me");
  } catch (err) {
    if (err.status === 401) return "401, as expected";
    throw err;
  }
  throw new Error("still signed in after logout");
});

console.log(failures === 0 ? "\nSemua langkah lulus." : `\n${failures} langkah gagal. Kirim baris FAIL pertama.`);
process.exit(failures === 0 ? 0 : 1);
