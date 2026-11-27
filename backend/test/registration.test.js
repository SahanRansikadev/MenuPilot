const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const app = require("../src/application");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("confirms the saved user before returning registration success", async (t) => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCreate = User.create;
  const originalFindById = User.findById;
  const originalSessionCreate = Session.create;
  const userId = new mongoose.Types.ObjectId();
  let savedUser;
  let createdUser;
  let verifySavedUser = true;
  let sessionWrites = 0;

  process.env.NODE_ENV = "production";

  User.create = async (user) => {
    createdUser = { ...user, _id: userId };
    savedUser = verifySavedUser
      ? {
          _id: userId,
          name: user.name,
          email: user.email,
        }
      : null;
    return createdUser;
  };
  User.findById = () => ({
    select() {
      return this;
    },
    lean: async () => savedUser,
  });
  Session.create = async () => {
    sessionWrites += 1;
  };

  t.after(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    User.create = originalCreate;
    User.findById = originalFindById;
    Session.create = originalSessionCreate;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const response = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: " Test User ",
      email: " TEST@example.com ",
      password: "password123",
    }),
  });

  assert.equal(response.status, 201);
  assert.match(response.headers.get("set-cookie") || "", /;\s*SameSite=None/i);
  assert.match(response.headers.get("set-cookie") || "", /;\s*Secure/i);
  assert.deepEqual((await response.json()).user, {
    id: userId.toString(),
    name: "Test User",
    email: "test@example.com",
  });
  assert.notEqual(createdUser.passwordHash, "password123");
  assert.equal(await bcrypt.compare("password123", createdUser.passwordHash), true);
  assert.equal(sessionWrites, 1);

  verifySavedUser = false;
  const unverifiedResponse = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Unverified User",
      email: "unverified@example.com",
      password: "password123",
    }),
  });

  assert.equal(unverifiedResponse.status, 500);
  assert.equal(sessionWrites, 1);
});
