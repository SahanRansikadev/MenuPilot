const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Booking = require("../src/models/Booking");
const Food = require("../src/models/Food");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("authenticated guests can save a booking and retrieve only their own bookings", async (t) => {
  const originalSessionFindOne = Session.findOne;
  const originalUserFindById = User.findById;
  const originalFoodFind = Food.find;
  const originalBookingCreate = Booking.create;
  const originalBookingFind = Booking.find;
  const userId = new mongoose.Types.ObjectId();
  const foodId = new mongoose.Types.ObjectId("64b000000000000000000001");
  let savedBooking;
  let queriedUserId;

  Session.findOne = (query) => {
    assert.equal(typeof query.tokenHash, "string");
    return { lean: async () => ({ userId }) };
  };
  User.findById = () => ({
    select() { return this; },
    lean: async () => ({ _id: userId }),
  });
  Food.find = (query) => {
    assert.deepEqual(query._id.$in, [foodId.toString()]);
    return {
      select() { return this; },
      lean: async () => [{ _id: foodId, name: "String hoppers" }],
    };
  };
  Booking.create = async (booking) => {
    savedBooking = {
      ...booking,
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date("2026-11-28T10:00:00.000Z"),
    };
    return savedBooking;
  };
  Booking.find = (query) => {
    queriedUserId = query.userId;
    return {
      sort() { return this; },
      lean: async () => [savedBooking],
    };
  };
  t.after(() => {
    Session.findOne = originalSessionFindOne;
    User.findById = originalUserFindById;
    Food.find = originalFoodFind;
    Booking.create = originalBookingCreate;
    Booking.find = originalBookingFind;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}/api/bookings`;
  const headers = {
    "Content-Type": "application/json",
    Cookie: "menupilot_session=test-session-token",
  };

  const unauthorizedResponse = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(unauthorizedResponse.status, 401);

  const createResponse = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      date: "2026-12-05",
      guestCount: 2,
      childrenCount: 0,
      meals: [{ type: "Breakfast", time: "08:00", foodIds: [foodId.toString()] }],
      isVegetarian: false,
      hasAllergies: false,
      allergyCount: 0,
      notes: "",
    }),
  });
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  assert.equal(created.booking.date, "2026-12-05");
  assert.equal(created.booking.meals[0].foods[0].name, "String hoppers");
  assert.equal(savedBooking.userId.toString(), userId.toString());

  const listResponse = await fetch(baseUrl, { headers });
  assert.equal(listResponse.status, 200);
  const list = await listResponse.json();
  assert.equal(list.bookings.length, 1);
  assert.equal(list.bookings[0].id, created.booking.id);
  assert.equal(queriedUserId.toString(), userId.toString());
});
