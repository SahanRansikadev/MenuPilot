const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");

const originalFrontendUrl = process.env.FRONTEND_URL;
process.env.FRONTEND_URL = "http://localhost:3000,https://frontend.example";
const app = require("../src/application");
const vercelApp = require("../src/app");
if (originalFrontendUrl === undefined) {
  delete process.env.FRONTEND_URL;
} else {
  process.env.FRONTEND_URL = originalFrontendUrl;
}

const expectedHealth = {
  success: true,
  message: "MenuPilot Backend is running",
  status: "OK",
};
const expectedRoot = {
  status: "ok",
  message: "MenuPilot Backend is running!",
};

test("serves health checks and rejects invalid sign-up payloads", async (t) => {
  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const rootResponse = await fetch(baseUrl, {
    headers: { Origin: "https://frontend.example" },
  });
  assert.equal(rootResponse.status, 200);
  assert.deepEqual(await rootResponse.json(), expectedRoot);

  const healthResponse = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: "https://frontend.example" },
  });
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), expectedHealth);
  assert.equal(healthResponse.headers.get("access-control-allow-origin"), "https://frontend.example");
  assert.equal(healthResponse.headers.get("access-control-allow-credentials"), "true");

  const disallowedOriginResponse = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: "https://unlisted.example" },
  });
  assert.equal(disallowedOriginResponse.headers.get("access-control-allow-origin"), null);

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

  const notFoundResponse = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(notFoundResponse.status, 404);
  assert.deepEqual(await notFoundResponse.json(), { error: "Not found." });
});

test("serves the health check through Vercel without requiring MongoDB", async (t) => {
  const originalUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;

  const server = vercelApp.listen(0);
  t.after(() => {
    if (originalUri !== undefined) {
      process.env.MONGODB_URI = originalUri;
    } else {
      delete process.env.MONGODB_URI;
    }
    return new Promise((resolve) => server.close(resolve));
  });
  await once(server, "listening");

  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), expectedHealth);

  const rootResponse = await fetch(`http://127.0.0.1:${address.port}/`);
  assert.equal(rootResponse.status, 200);
  assert.deepEqual(await rootResponse.json(), expectedRoot);

  const preflightResponse = await fetch(`http://127.0.0.1:${address.port}/api/auth/signin`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://frontend.example",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  assert.equal(preflightResponse.status, 204);
  assert.equal(
    preflightResponse.headers.get("access-control-allow-origin"),
    "https://frontend.example",
  );
});
