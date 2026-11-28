const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Food = require("../src/models/Food");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("authenticated guests can search the shared food catalog and add a new food", async (t) => {
  const originalSessionFindOne = Session.findOne;
  const originalUserFindById = User.findById;
  const originalFoodFind = Food.find;
  const originalFoodFindOne = Food.findOne;
  const originalFoodCreate = Food.create;
  const userId = new mongoose.Types.ObjectId();
  const foodId = new mongoose.Types.ObjectId();
  let createdFood;
  let searchExpression;

  Session.findOne = () => ({ lean: async () => ({ userId }) });
  User.findById = () => ({
    select() { return this; },
    lean: async () => ({ _id: userId }),
  });
  Food.find = (filter) => {
    searchExpression = filter.name;
    return {
      select() { return this; },
      sort() { return this; },
      limit() { return this; },
      lean: async () => [{ _id: foodId, name: "Rice cake" }],
    };
  };
  Food.findOne = () => ({ lean: async () => null });
  Food.create = async (food) => {
    createdFood = { ...food, _id: new mongoose.Types.ObjectId() };
    return createdFood;
  };
  t.after(() => {
    Session.findOne = originalSessionFindOne;
    User.findById = originalUserFindById;
    Food.find = originalFoodFind;
    Food.findOne = originalFoodFindOne;
    Food.create = originalFoodCreate;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}/api/foods`;
  const headers = {
    "Content-Type": "application/json",
    Cookie: "menupilot_session=test-session-token",
  };

  const searchResponse = await fetch(`${baseUrl}?search=rice.cake`, { headers });
  assert.equal(searchResponse.status, 200);
  assert.deepEqual((await searchResponse.json()).foods, [{ id: foodId.toString(), name: "Rice cake" }]);
  assert.equal(searchExpression.test("rice.cake"), true);
  assert.equal(searchExpression.test("riceXcake"), false);

  const createResponse = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "  Hoppers   with curry " }),
  });
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  assert.equal(created.food.name, "Hoppers with curry");
  assert.equal(createdFood.normalizedName, "hoppers with curry");
  assert.equal(createdFood.createdBy.toString(), userId.toString());
});
