const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Booking = require("../src/models/Booking");
const KitchenTask = require("../src/models/KitchenTask");
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

test("admins can save user details and delete another account but cannot delete themselves", async (t) => {
  const originals = {
    sessionFindOne: Session.findOne,
    userFindById: User.findById,
    userExists: User.exists,
    userDeleteOne: User.deleteOne,
    sessionDeleteMany: Session.deleteMany,
    kitchenTaskExists: KitchenTask.exists,
    bookingUpdateMany: Booking.updateMany,
  };
  const adminId = new mongoose.Types.ObjectId();
  const guestId = new mongoose.Types.ObjectId();
  const guest = {
    _id: guestId,
    name: "Casey Guest",
    email: "casey@example.com",
    role: "guest",
    phone: "",
    guestCount: 1,
    childrenCount: 0,
    async save() {},
  };
  let deletedUserId;
  Session.findOne = () => ({ lean: async () => ({ userId: adminId }) });
  User.findById = (id) => {
    if (id.toString() === adminId.toString()) {
      return {
        select() { return this; },
        lean: async () => ({ _id: adminId, name: "Admin", email: "admin@example.com", role: "admin" }),
      };
    }
    return {
      select() { return guest; },
      then(resolve, reject) { return Promise.resolve(guest).then(resolve, reject); },
    };
  };
  User.exists = async () => null;
  KitchenTask.exists = async () => null;
  User.deleteOne = async (query) => { deletedUserId = query._id; };
  Session.deleteMany = async () => ({ deletedCount: 1 });
  Booking.updateMany = async () => ({ modifiedCount: 1 });
  t.after(() => {
    Session.findOne = originals.sessionFindOne;
    User.findById = originals.userFindById;
    User.exists = originals.userExists;
    User.deleteOne = originals.userDeleteOne;
    Session.deleteMany = originals.sessionDeleteMany;
    KitchenTask.exists = originals.kitchenTaskExists;
    Booking.updateMany = originals.bookingUpdateMany;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  const baseUrl = `http://127.0.0.1:${address.port}/api/admin/users`;
  const headers = {
    "Content-Type": "application/json",
    Cookie: "menupilot_session=admin-user-management-session",
  };

  const updateResponse = await fetch(`${baseUrl}/${guestId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ name: "Casey Updated", email: "casey.updated@example.com", role: "kitchenTeam" }),
  });
  assert.equal(updateResponse.status, 200);
  const updateResult = await updateResponse.json();
  assert.equal(updateResult.user.name, "Casey Updated");
  assert.equal(updateResult.user.email, "casey.updated@example.com");
  assert.equal(updateResult.user.role, "kitchenTeam");

  const selfDeleteResponse = await fetch(`${baseUrl}/${adminId}`, { method: "DELETE", headers });
  assert.equal(selfDeleteResponse.status, 400);

  const deleteResponse = await fetch(`${baseUrl}/${guestId}`, { method: "DELETE", headers });
  assert.equal(deleteResponse.status, 200);
  assert.equal(deletedUserId.toString(), guestId.toString());
});
