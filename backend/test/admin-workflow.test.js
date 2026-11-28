const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Booking = require("../src/models/Booking");
const Hotel = require("../src/models/Hotel");
const Ingredient = require("../src/models/Ingredient");
const KitchenTask = require("../src/models/KitchenTask");
const Menu = require("../src/models/Menu");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

function queryFor(value) {
  return {
    select() { return this; },
    lean: async () => value,
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}

test("admins can save a recipe and dispatch its ingredients for a booking", async (t) => {
  const originals = {
    sessionFindOne: Session.findOne,
    userFindById: User.findById,
    bookingFindById: Booking.findById,
    menuCreate: Menu.create,
    menuFindById: Menu.findById,
    hotelExists: Hotel.exists,
    kitchenTaskCreate: KitchenTask.create,
  };
  const adminId = new mongoose.Types.ObjectId();
  const kitchenMemberId = new mongoose.Types.ObjectId();
  const bookingId = new mongoose.Types.ObjectId();
  const menuId = new mongoose.Types.ObjectId();
  let createdMenu;
  let createdTask;

  Session.findOne = () => ({ lean: async () => ({ userId: adminId }) });
  User.findById = (id) => queryFor({
    _id: id,
    role: id.toString() === adminId.toString() ? "admin" : "kitchenTeam",
  });

  Booking.findById = () => queryFor({ _id: bookingId, status: "confirmed" });
  Menu.create = async (menu) => {
    createdMenu = { ...menu, _id: menuId };
    return createdMenu;
  };
  Hotel.exists = async () => ({ _id: new mongoose.Types.ObjectId() });
  Menu.findById = () => Promise.resolve({
    _id: menuId,
    hotelName: "Villa Serene",
    name: "Coconut curry",
    mealType: "Dinner",
    description: "Freshly prepared.",
    ingredients: ["Chicken - 1 kg", "Coconut milk - 500 ml"],
    instructions: "Simmer until cooked.",
  });
  KitchenTask.create = async (task) => {
    createdTask = { ...task, _id: new mongoose.Types.ObjectId(), status: "sent", createdAt: new Date() };
    return createdTask;
  };
  t.after(() => {
    Session.findOne = originals.sessionFindOne;
    User.findById = originals.userFindById;
    Booking.findById = originals.bookingFindById;
    Menu.create = originals.menuCreate;
    Menu.findById = originals.menuFindById;
    Hotel.exists = originals.hotelExists;
    KitchenTask.create = originals.kitchenTaskCreate;
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
    Cookie: "menupilot_session=admin-workflow-session",
  };

  const menuResponse = await fetch(`${baseUrl}/menus`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      hotelName: "Villa Serene",
      name: "Coconut curry",
      mealType: "Dinner",
      description: "Freshly prepared.",
      ingredients: ["Chicken - 1 kg", "Coconut milk - 500 ml"],
      instructions: "Simmer until cooked.",
    }),
  });
  assert.equal(menuResponse.status, 201);
  assert.equal(createdMenu.createdBy.toString(), adminId.toString());

  const taskResponse = await fetch(`${baseUrl}/kitchen/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      assignedTo: kitchenMemberId.toString(),
      bookingId: bookingId.toString(),
      menuId: menuId.toString(),
      notes: "Serve at 7pm.",
    }),
  });
  assert.equal(taskResponse.status, 201);
  const result = await taskResponse.json();
  assert.equal(result.task.recipeName, "Coconut curry");
  assert.deepEqual(result.task.ingredients, ["Chicken - 1 kg", "Coconut milk - 500 ml"]);
  assert.equal(createdTask.bookingId.toString(), bookingId.toString());
  assert.equal(createdTask.assignedTo.toString(), kitchenMemberId.toString());
});

test("admins can plan supplies per booking meal without duplicating guest ingredients and confirm actual costing", async (t) => {
  const originals = {
    sessionFindOne: Session.findOne,
    userFindById: User.findById,
    bookingFindById: Booking.findById,
    kitchenTaskExists: KitchenTask.exists,
    kitchenTaskCreate: KitchenTask.create,
    kitchenTaskFindById: KitchenTask.findById,
    ingredientFindOneAndUpdate: Ingredient.findOneAndUpdate,
  };
  const adminId = new mongoose.Types.ObjectId();
  const kitchenMemberId = new mongoose.Types.ObjectId();
  const bookingId = new mongoose.Types.ObjectId();
  const taskId = new mongoose.Types.ObjectId();
  const ingredientId = new mongoose.Types.ObjectId();
  const guestIngredientId = new mongoose.Types.ObjectId();
  const booking = {
    _id: bookingId,
    status: "confirmed",
    hotelName: "Villa Serene",
    isVegetarian: false,
    hasAllergies: true,
    allergyCount: 1,
    notes: "No peanuts",
    meals: [{
      type: "Dinner",
      time: "19:00",
      foods: [{ name: "Coconut curry" }],
      desserts: [{ name: "Watalappan" }],
      ingredients: [{ ingredientId: guestIngredientId, name: "Guest flour" }],
    }],
  };
  let createdTask;
  Session.findOne = () => ({ lean: async () => ({ userId: adminId }) });
  User.findById = (id) => queryFor({
    _id: id,
    role: id.toString() === adminId.toString() ? "admin" : "kitchenTeam",
  });
  Booking.findById = () => Promise.resolve(booking);
  KitchenTask.exists = async () => null;
  Ingredient.findOneAndUpdate = (filter, update) => queryFor({
    _id: ingredientId,
    name: update.$setOnInsert.name,
    normalizedName: filter.normalizedName,
  });
  KitchenTask.create = async (task) => {
    createdTask = {
      ...task,
      _id: taskId,
      supplies: task.supplies.map((supply) => ({ ...supply, _id: new mongoose.Types.ObjectId() })),
      status: "sent",
      costingStatus: "not_submitted",
      createdAt: new Date("2026-11-29T00:00:00.000Z"),
      async save() {},
    };
    return createdTask;
  };
  KitchenTask.findById = async () => createdTask;
  t.after(() => {
    Session.findOne = originals.sessionFindOne;
    User.findById = originals.userFindById;
    Booking.findById = originals.bookingFindById;
    KitchenTask.exists = originals.kitchenTaskExists;
    KitchenTask.create = originals.kitchenTaskCreate;
    KitchenTask.findById = originals.kitchenTaskFindById;
    Ingredient.findOneAndUpdate = originals.ingredientFindOneAndUpdate;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  const baseUrl = `http://127.0.0.1:${address.port}/api/admin`;
  const headers = {
    "Content-Type": "application/json",
    Cookie: "menupilot_session=admin-meal-plan-session",
  };
  const dispatch = (name) => fetch(`${baseUrl}/kitchen/meal-tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      assignedTo: kitchenMemberId.toString(),
      bookingId: bookingId.toString(),
      mealIndex: 0,
      recipeName: "Coconut curry",
      instructions: "Simmer and serve.",
      supplies: [{ name, quantity: 2, unit: "kg" }],
    }),
  });

  const guestIngredientResponse = await dispatch("Guest flour");
  assert.equal(guestIngredientResponse.status, 400);
  assert.match((await guestIngredientResponse.json()).error, /guest is bringing/);

  const dispatchResponse = await dispatch("Rice");
  assert.equal(dispatchResponse.status, 201);
  const taskResult = await dispatchResponse.json();
  assert.equal(taskResult.task.mealType, "Dinner");
  assert.deepEqual(taskResult.task.foods, [{ name: "Coconut curry" }]);
  assert.deepEqual(taskResult.task.desserts, [{ name: "Watalappan" }]);
  assert.deepEqual(taskResult.task.guestIngredients, [{ name: "Guest flour" }]);
  assert.equal(createdTask.supplies[0].quantity, 2);

  createdTask.costingStatus = "submitted";
  createdTask.actualTotalPrice = 1750;
  const costingResponse = await fetch(`${baseUrl}/kitchen/tasks/${taskId}/costing`, {
    method: "PATCH",
    headers,
  });
  assert.equal(costingResponse.status, 200);
  assert.equal((await costingResponse.json()).task.costingStatus, "confirmed");
});
