const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("admin APIs reject guests and admins can promote users to kitchen team", async (t) => {
  const originalSessionFindOne = Session.findOne;
  const originalUserFindById = User.findById;
  const originalUserFind = User.find;
  const originalUserFindByIdAndUpdate = User.findByIdAndUpdate;
  const adminId = new mongoose.Types.ObjectId();
  const guestId = new mongoose.Types.ObjectId();
  let requesterRole = "guest";
  let updatedRole = "";

  Session.findOne = () => ({ lean: async () => ({ userId: adminId }) });
  User.findById = (id) => ({
    select() { return this; },
    lean: async () => ({ _id: id, role: id.toString() === adminId.toString() ? requesterRole : "guest" }),
  });
  User.find = () => ({
    select() { return this; },
    sort() { return this; },
    limit() { return this; },
    lean: async () => [{
      _id: guestId,
      name: "Casey Guest",
      email: "casey@example.com",
      role: "guest",
      phone: "",
      guestCount: 1,
      childrenCount: 0,
    }],
  });
  User.findByIdAndUpdate = (id, update) => {
    assert.equal(id.toString(), guestId.toString());
    updatedRole = update.$set.role;
    return {
      select() { return this; },
      lean: async () => ({
        _id: guestId,
        name: "Casey Guest",
        email: "casey@example.com",
        role: updatedRole,
        phone: "",
        guestCount: 1,
        childrenCount: 0,
      }),
    };
  };
  t.after(() => {
    Session.findOne = originalSessionFindOne;
    User.findById = originalUserFindById;
    User.find = originalUserFind;
    User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}/api/admin`;
  const headers = {
    "Content-Type": "application/json",
    Cookie: "menupilot_session=admin-test-session",
  };

  const forbiddenResponse = await fetch(`${baseUrl}/users`, { headers });
  assert.equal(forbiddenResponse.status, 403);

  requesterRole = "admin";
  const usersResponse = await fetch(`${baseUrl}/users`, { headers });
  assert.equal(usersResponse.status, 200);
  const usersResult = await usersResponse.json();
  assert.equal(usersResult.users[0].role, "guest");
  assert.equal("passwordHash" in usersResult.users[0], false);

  const roleResponse = await fetch(`${baseUrl}/users/${guestId}/role`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ role: "kitchenTeam" }),
  });
  assert.equal(roleResponse.status, 200);
  assert.equal((await roleResponse.json()).user.role, "kitchenTeam");
  assert.equal(updatedRole, "kitchenTeam");

  const selfRoleResponse = await fetch(`${baseUrl}/users/${adminId}/role`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ role: "guest" }),
  });
  assert.equal(selfRoleResponse.status, 400);
});
