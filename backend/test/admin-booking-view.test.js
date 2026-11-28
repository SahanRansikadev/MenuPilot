const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Booking = require("../src/models/Booking");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("admins can view guest identity, meal selections, dietary details, and notes for bookings", async (t) => {
  const originalSessionFindOne = Session.findOne;
  const originalUserFindById = User.findById;
  const originalBookingFind = Booking.find;
  const adminId = new mongoose.Types.ObjectId();
  const guestId = new mongoose.Types.ObjectId();
  const booking = {
    _id: new mongoose.Types.ObjectId(),
    userId: { _id: guestId, name: "Alex Morgan", email: "alex@example.com" },
    date: new Date("2026-12-05T00:00:00.000Z"),
    status: "confirmed",
    guestCount: 3,
    childrenCount: 1,
    driverCount: 1,
    guideCount: 0,
    meals: [{
      type: "Dinner",
      time: "19:00",
      hasIngredients: true,
      ingredients: [{ ingredientId: new mongoose.Types.ObjectId(), name: "Coconut milk" }],
      foods: [{ foodId: new mongoose.Types.ObjectId(), name: "Coconut curry" }],
    }],
    isVegetarian: false,
    hasAllergies: true,
    allergyCount: 1,
    notes: "Please avoid peanuts.",
  };

  Session.findOne = () => ({ lean: async () => ({ userId: adminId }) });
  User.findById = () => ({
    select() { return this; },
    lean: async () => ({ _id: adminId, role: "admin" }),
  });
  Booking.find = () => ({
    populate() { return this; },
    sort() { return this; },
    limit() { return this; },
    lean: async () => [booking],
  });
  t.after(() => {
    Session.findOne = originalSessionFindOne;
    User.findById = originalUserFindById;
    Booking.find = originalBookingFind;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  const response = await fetch(`http://127.0.0.1:${address.port}/api/admin/bookings`, {
    headers: { Cookie: "menupilot_session=booking-admin-session" },
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.bookings[0].guest.email, "alex@example.com");
  assert.equal(result.bookings[0].meals[0].foods[0].name, "Coconut curry");
  assert.equal(result.bookings[0].meals[0].ingredients[0].name, "Coconut milk");
  assert.equal(result.bookings[0].allergyCount, 1);
  assert.equal(result.bookings[0].notes, "Please avoid peanuts.");
});
