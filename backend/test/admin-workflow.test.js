const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Booking = require("../src/models/Booking");
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
