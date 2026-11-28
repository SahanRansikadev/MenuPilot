const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Booking = require("../src/models/Booking");
const Food = require("../src/models/Food");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("admins can add catalog foods while booking-referenced foods cannot be removed", async (t) => {
  const originalSessionFindOne = Session.findOne;
  const originalUserFindById = User.findById;
  const originalFoodFind = Food.find;
  const originalFoodCreate = Food.create;
  const originalFoodFindByIdAndDelete = Food.findByIdAndDelete;
  const originalBookingExists = Booking.exists;
  const adminId = new mongoose.Types.ObjectId();
  const foodId = new mongoose.Types.ObjectId();
  let created;
  let bookingReference;

  Session.findOne = () => ({ lean: async () => ({ userId: adminId }) });
  User.findById = () => ({
    select() { return this; },
    lean: async () => ({ _id: adminId, role: "admin" }),
  });
  Food.find = () => ({
    select() { return this; },
    sort() { return this; },
    limit() { return this; },
    lean: async () => [created],
  });
  Food.create = async (entry) => {
    created = { ...entry, _id: foodId };
    return created;
  };
  Food.findByIdAndDelete = async () => {
    throw new Error("Referenced food should not be deleted.");
  };
  Booking.exists = async (query) => {
    bookingReference = query;
    return { _id: new mongoose.Types.ObjectId() };
  };
  t.after(() => {
    Session.findOne = originalSessionFindOne;
    User.findById = originalUserFindById;
    Food.find = originalFoodFind;
    Food.create = originalFoodCreate;
    Food.findByIdAndDelete = originalFoodFindByIdAndDelete;
    Booking.exists = originalBookingExists;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}/api/admin/foods`;
  const headers = {
    "Content-Type": "application/json",
    Cookie: "menupilot_session=catalog-admin-session",
  };

  const addResponse = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "  String   hoppers " }),
  });
  assert.equal(addResponse.status, 201);
  assert.equal((await addResponse.json()).food.name, "String hoppers");
  assert.equal(created.normalizedName, "string hoppers");
  assert.equal(created.createdBy.toString(), adminId.toString());

  const listResponse = await fetch(baseUrl, { headers });
  assert.equal(listResponse.status, 200);
  assert.equal((await listResponse.json()).foods[0].name, "String hoppers");

  const deleteResponse = await fetch(`${baseUrl}/${foodId}`, { method: "DELETE", headers });
  assert.equal(deleteResponse.status, 409);
  assert.deepEqual(bookingReference, { "meals.foods.foodId": foodId.toString() });
});
