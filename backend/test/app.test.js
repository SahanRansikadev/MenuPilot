const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");

const app = require("../src");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("root reports API status", async () => {
  const response = await fetch(baseUrl);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    name: "MenuPilot API",
    status: "ok",
    health: "/api/health",
  });
});

test("health endpoint reports service status", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "menupilot-backend");
  assert.ok(Number.isFinite(Date.parse(body.timestamp)));
});

test("unknown routes return a JSON 404", async () => {
  const response = await fetch(`${baseUrl}/not-found`);

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Route not found" });
});
