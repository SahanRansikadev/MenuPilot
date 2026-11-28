const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const mongoose = require("mongoose");
const app = require("../src/application");
const Ingredient = require("../src/models/Ingredient");
const Session = require("../src/models/Session");
const User = require("../src/models/User");

test("authenticated guests can search the ingredient catalog and add a missing ingredient", async (t) => {
  const originalSessionFindOne = Session.findOne;
  const originalUserFindById = User.findById;
  const originalIngredientFind = Ingredient.find;
  const originalIngredientFindOne = Ingredient.findOne;
  const originalIngredientCreate = Ingredient.create;
  const userId = new mongoose.Types.ObjectId();
  const ingredientId = new mongoose.Types.ObjectId();
  let createdIngredient;
  let searchExpression;

  Session.findOne = () => ({ lean: async () => ({ userId }) });
  User.findById = () => ({
    select() { return this; },
    lean: async () => ({ _id: userId }),
  });
  Ingredient.find = (filter) => {
    searchExpression = filter.name;
    return {
      select() { return this; },
      sort() { return this; },
      limit() { return this; },
      lean: async () => [{ _id: ingredientId, name: "Coconut milk" }],
    };
  };
  Ingredient.findOne = () => ({ lean: async () => null });
  Ingredient.create = async (ingredient) => {
    createdIngredient = { ...ingredient, _id: new mongoose.Types.ObjectId() };
    return createdIngredient;
  };
  t.after(() => {
    Session.findOne = originalSessionFindOne;
    User.findById = originalUserFindById;
    Ingredient.find = originalIngredientFind;
    Ingredient.findOne = originalIngredientFindOne;
    Ingredient.create = originalIngredientCreate;
  });

  const server = app.listen(0);
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  const baseUrl = `http://127.0.0.1:${address.port}/api/ingredients`;
  const headers = {
    "Content-Type": "application/json",
    Cookie: "menupilot_session=test-session-token",
  };

  const searchResponse = await fetch(`${baseUrl}?search=coconut`, { headers });
  assert.equal(searchResponse.status, 200);
  assert.deepEqual((await searchResponse.json()).ingredients, [
    { id: ingredientId.toString(), name: "Coconut milk" },
  ]);
  assert.equal(searchExpression.test("coconut"), true);

  const createResponse = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: "  Fresh   basil " }),
  });
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  assert.equal(created.ingredient.name, "Fresh basil");
  assert.equal(createdIngredient.normalizedName, "fresh basil");
  assert.equal(createdIngredient.createdBy.toString(), userId.toString());
});
