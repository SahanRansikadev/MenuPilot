const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Booking = require("../src/models/Booking");
const Food = require("../src/models/Food");
const Hotel = require("../src/models/Hotel");
const Ingredient = require("../src/models/Ingredient");
const KitchenTask = require("../src/models/KitchenTask");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("authenticated guests can save a booking and retrieve only their own bookings", async (t) => {
  const originalSessionFindOne = Session.findOne;
  const originalUserFindById = User.findById;
  const originalFoodFind = Food.find;
  const originalIngredientFind = Ingredient.find;
  const originalHotelFindById = Hotel.findById;
  const originalBookingCreate = Booking.create;
  const originalBookingFind = Booking.find;
  const originalBookingFindOne = Booking.findOne;
  const originalKitchenTaskUpdateMany = KitchenTask.updateMany;
  const userId = new mongoose.Types.ObjectId();
  const foodId = new mongoose.Types.ObjectId("64b000000000000000000001");
  const secondFoodId = new mongoose.Types.ObjectId("64b000000000000000000002");
  const ingredientId = new mongoose.Types.ObjectId("64b000000000000000000003");
  const hotelId = new mongoose.Types.ObjectId("64b000000000000000000004");
  const dessertId = new mongoose.Types.ObjectId("64b000000000000000000005");
  let savedBooking;
  let queriedUserId;
  let taskCancellation;
  let bookingDeleted = false;

  Session.findOne = (query) => {
    assert.equal(typeof query.tokenHash, "string");
    return { lean: async () => ({ userId }) };
  };
  User.findById = () => ({
    select() { return this; },
    lean: async () => ({ _id: userId, name: "Casey Guest", email: "casey@example.com" }),
  });
  Food.find = (query) => {
    assert.ok(query._id.$in.includes(foodId.toString()));
    return {
      select() { return this; },
      lean: async () => query._id.$in.map((id) => {
        const entries = [
          { _id: foodId, name: "String hoppers" },
          { _id: secondFoodId, name: "Rice and curry" },
          { _id: dessertId, name: "Watalappan" },
        ];
        return entries.find((entry) => entry._id.toString() === id);
      }),
    };
  };
  Ingredient.find = (query) => {
    assert.deepEqual(query._id.$in, [ingredientId.toString()]);
    return {
      select() { return this; },
      lean: async () => [{ _id: ingredientId, name: "Coconut milk" }],
    };
  };
  Hotel.findById = () => ({
    select() { return this; },
    lean: async () => ({ _id: hotelId, name: "Villa Serene", location: "Galle" }),
  });
  Booking.create = async (booking) => {
    savedBooking = {
      ...booking,
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date("2026-11-28T10:00:00.000Z"),
      async save() {},
      async deleteOne() { bookingDeleted = true; },
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
  Booking.findOne = (query) => {
    const booking = query._id.toString() === savedBooking._id.toString() &&
      query.userId.toString() === userId.toString()
      ? savedBooking
      : null;
    return {
      lean: async () => booking,
      then(resolve, reject) { return Promise.resolve(booking).then(resolve, reject); },
    };
  };
  KitchenTask.updateMany = async (query, update) => {
    taskCancellation = { query, update };
  };
  t.after(() => {
    Session.findOne = originalSessionFindOne;
    User.findById = originalUserFindById;
    Food.find = originalFoodFind;
    Ingredient.find = originalIngredientFind;
    Hotel.findById = originalHotelFindById;
    Booking.create = originalBookingCreate;
    Booking.find = originalBookingFind;
    Booking.findOne = originalBookingFindOne;
    KitchenTask.updateMany = originalKitchenTaskUpdateMany;
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
      hotelId: hotelId.toString(),
      date: "2026-12-05",
      guestCount: 2,
      childrenCount: 0,
      meals: [{
        type: "Breakfast",
        time: "08:00",
        hasIngredients: true,
        ingredientIds: [ingredientId.toString()],
        foodIds: [foodId.toString()],
        dessertIds: [dessertId.toString()],
      }, {
        type: "Lunch",
        time: "12:30",
        hasIngredients: false,
        ingredientIds: [],
        foodIds: [secondFoodId.toString()],
      }],
      isVegetarian: false,
      hasAllergies: false,
      allergyCount: 0,
      notes: "",
    }),
  });
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  assert.equal(created.booking.date, "2026-12-05");
  assert.deepEqual(created.booking.hotel, { id: hotelId.toString(), name: "Villa Serene", location: "Galle" });
  assert.equal(created.booking.meals[0].foods[0].name, "String hoppers");
  assert.deepEqual(created.booking.meals[0].desserts, [{ id: dessertId.toString(), name: "Watalappan" }]);
  assert.equal(created.booking.meals[0].hasIngredients, true);
  assert.deepEqual(created.booking.meals[0].ingredients, [{ id: ingredientId.toString(), name: "Coconut milk" }]);
  assert.equal(created.booking.meals[1].hasIngredients, false);
  assert.deepEqual(created.booking.meals[1].ingredients, []);
  assert.equal(savedBooking.userId.toString(), userId.toString());
  assert.equal(savedBooking.guestName, "Casey Guest");
  assert.equal(savedBooking.guestEmail, "casey@example.com");

  const listResponse = await fetch(baseUrl, { headers });
  assert.equal(listResponse.status, 200);
  const list = await listResponse.json();
  assert.equal(list.bookings.length, 1);
  assert.equal(list.bookings[0].id, created.booking.id);
  assert.equal(queriedUserId.toString(), userId.toString());

  const updateResponse = await fetch(`${baseUrl}/${created.booking.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      hotelId: hotelId.toString(),
      date: "2026-12-06",
      guestCount: 2,
      childrenCount: 0,
      meals: [{
        type: "Breakfast",
        time: "08:00",
        hasIngredients: true,
        ingredientIds: [ingredientId.toString()],
        foodIds: [foodId.toString()],
      }, {
        type: "Lunch",
        time: "12:30",
        hasIngredients: false,
        ingredientIds: [],
        foodIds: [secondFoodId.toString()],
      }],
      isVegetarian: false,
      hasAllergies: false,
      allergyCount: 0,
      notes: "",
    }),
  });
  assert.equal(updateResponse.status, 200);
  assert.equal((await updateResponse.json()).booking.date, "2026-12-06");
  assert.deepEqual(taskCancellation.query.status.$in, ["sent", "accepted", "preparing"]);
  assert.equal(taskCancellation.update.$set.costingStatus, "cancelled");

  const otherBookingResponse = await fetch(`${baseUrl}/${new mongoose.Types.ObjectId()}`, { headers });
  assert.equal(otherBookingResponse.status, 404);

  const deleteResponse = await fetch(`${baseUrl}/${created.booking.id}`, { method: "DELETE", headers });
  assert.equal(deleteResponse.status, 200);
  assert.equal(bookingDeleted, true);
});
