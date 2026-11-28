const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Menu = require("../src/models/Menu");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("guest menu view groups and orders recipes by hotel and meal type", async (t) => {
  const originals = {
    sessionFindOne: Session.findOne,
    userFindById: User.findById,
    menuFind: Menu.find,
  };
  const userId = new mongoose.Types.ObjectId();
  Session.findOne = () => ({ lean: async () => ({ userId }) });
  User.findById = () => ({
    select() { return this; },
    lean: async () => ({ _id: userId, role: "guest" }),
  });
  Menu.find = () => ({
    select() { return this; },
    sort() { return this; },
    limit() { return this; },
    lean: async () => [
      { hotelName: "Villa Serene", mealType: "Dinner", name: "Coconut curry", description: "Dinner menu." },
      { hotelName: "Villa Serene", mealType: "Breakfast", foods: ["String hoppers"], desserts: ["Fruit plate"], description: "Breakfast menu." },
      { hotelName: "Villa Serene", mealType: "Tea time", foods: [], desserts: ["Butter cake"], recipeNames: ["Butter cake"], description: "" },
      { hotelName: "Villa Serene", mealType: "Dinner", foods: ["Roast chicken"], desserts: ["Watalappan"], description: "" },
    ],
  });
  t.after(() => {
    Session.findOne = originals.sessionFindOne;
    User.findById = originals.userFindById;
    Menu.find = originals.menuFind;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  const response = await fetch(`http://127.0.0.1:${address.port}/api/menus`, {
    headers: { Cookie: "menupilot_session=menupilot-guest-menu-session" },
  });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).menus, [
    {
      hotelName: "Villa Serene",
      mealType: "Breakfast",
      foods: ["String hoppers"],
      desserts: ["Fruit plate"],
      description: "Breakfast menu.",
    },
    {
      hotelName: "Villa Serene",
      mealType: "Tea time",
      foods: [],
      desserts: ["Butter cake"],
      description: "",
    },
    {
      hotelName: "Villa Serene",
      mealType: "Dinner",
      foods: ["Coconut curry", "Roast chicken"],
      desserts: ["Watalappan"],
      description: "Dinner menu.",
    },
  ]);
});
