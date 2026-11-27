const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const app = require("../src/app");

test("serves health checks and rejects invalid sign-up payloads", async (t) => {
  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: "ok" });

  const signUpResponse = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(signUpResponse.status, 400);
  assert.equal(typeof (await signUpResponse.json()).error, "string");

  const sessionResponse = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(sessionResponse.status, 401);

  const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" });
  assert.equal(logoutResponse.status, 200);
});
