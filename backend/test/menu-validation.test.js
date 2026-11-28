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

test("accepts multiple recipe names with only a menu description", () => {
  const parsed = parseMenuPayload({
    hotelName: " Villa Serene ",
    mealType: "Dinner",
    recipeNames: [" Coconut curry ", "Roast chicken"],
    description: "Evening favourites.",
  });
  assert.deepEqual(parsed.value, {
    hotelName: "Villa Serene",
    mealType: "Dinner",
    foods: ["Coconut curry", "Roast chicken"],
    desserts: [],
    recipeNames: ["Coconut curry", "Roast chicken"],
    description: "Evening favourites.",
  });
});

test("accepts separate food and dessert lists and rejects duplicates", () => {
  const parsed = parseMenuPayload({
    hotelName: "Villa Serene",
    mealType: "Dinner",
    foods: ["Coconut curry", "Roast chicken"],
    desserts: ["Watalappan"],
    description: "",
  });
  assert.deepEqual(parsed.value.foods, ["Coconut curry", "Roast chicken"]);
  assert.deepEqual(parsed.value.desserts, ["Watalappan"]);

  assert.match(parseMenuPayload({
    hotelName: "Villa Serene",
    mealType: "Dinner",
    foods: ["Coconut curry"],
    desserts: [" coconut   curry "],
    description: "",
  }).error, /food or dessert name/);
  assert.match(parseMenuPayload({
    hotelName: "Villa Serene",
    mealType: "Dinner",
    foods: [],
    desserts: [],
    description: "",
  }).error, /food or dessert name/);
});
