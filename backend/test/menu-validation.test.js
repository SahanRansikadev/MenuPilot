const assert = require("node:assert/strict");
const test = require("node:test");
const parseMenuPayload = require("../src/utils/menu-validation");

const menuPayload = {
  hotelName: " Villa Serene ",
  name: "Coconut curry",
  mealType: "Dinner",
  description: "A local favourite.",
  ingredients: ["Chicken", "Coconut milk"],
  instructions: "Simmer until cooked.",
};

test("normalizes menu recipes for storage and kitchen dispatch", () => {
  assert.deepEqual(parseMenuPayload(menuPayload).value, {
    hotelName: "Villa Serene",
    name: "Coconut curry",
    mealType: "Dinner",
    description: "A local favourite.",
    ingredients: ["Chicken", "Coconut milk"],
    instructions: "Simmer until cooked.",
  });
});

test("rejects missing instructions, duplicate ingredients, and invalid meal types", () => {
  assert.match(parseMenuPayload({ ...menuPayload, instructions: "" }).error, /instructions/);
  assert.match(parseMenuPayload({ ...menuPayload, ingredients: ["Rice", " rice "] }).error, /unique ingredients/);
  assert.match(parseMenuPayload({ ...menuPayload, mealType: "Brunch" }).error, /meal type/);
});
