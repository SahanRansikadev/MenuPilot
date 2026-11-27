const assert = require("node:assert/strict");
const test = require("node:test");
const parseAuthPayload = require("../src/utils/auth-validation");

test("normalizes valid sign-up identity fields", () => {
  assert.deepEqual(
    parseAuthPayload(
      { name: "  Alex Morgan ", email: "  ALEX@example.com ", password: "password123" },
      true,
    ),
    { name: "Alex Morgan", email: "alex@example.com", password: "password123" },
  );
});

test("rejects invalid sign-up fields and passwords over bcrypt's byte limit", () => {
  assert.equal(parseAuthPayload({ name: " ", email: "a@example.com", password: "password123" }, true), null);
  assert.equal(parseAuthPayload({ name: "Alex", email: "not-an-email", password: "password123" }, true), null);
  assert.equal(parseAuthPayload({ name: "Alex", email: "a@example.com", password: "short" }, true), null);
  assert.equal(parseAuthPayload({ name: "Alex", email: "a@example.com", password: "a".repeat(73) }, true), null);
});

test("allows sign-in payloads without a name but still requires credentials", () => {
  assert.deepEqual(
    parseAuthPayload({ email: "ALEX@example.com", password: "x" }, false),
    { name: undefined, email: "alex@example.com", password: "x" },
  );
  assert.equal(parseAuthPayload({ email: "a@example.com" }, false), null);
});
