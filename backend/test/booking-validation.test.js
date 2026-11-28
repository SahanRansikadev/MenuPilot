const assert = require("node:assert/strict");
const test = require("node:test");
const parseBookingPayload = require("../src/utils/booking-validation");

const validPayload = {
  hotelId: "64b000000000000000000004",
  date: "2026-12-05",
  guestCount: 3,
  childrenCount: 1,
  driverCount: 0,
  guideCount: 1,
  meals: [
    {
      type: "Breakfast",
      time: "08:30",
      foodIds: ["64b000000000000000000001"],
      dessertIds: ["64b000000000000000000005"],
    },
    {
      type: "Other",
      name: "Birthday brunch",
      time: "11:00",
      foodIds: ["64b000000000000000000002"],
    },
  ],
  isVegetarian: true,
  hasAllergies: true,
  allergyCount: 1,
  notes: "No peanuts, please.",
};

test("parses a complete booking while retaining selected meal foods and times", () => {
  const parsed = parseBookingPayload(validPayload);

  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.value, {
    hotelId: "64b000000000000000000004",
    date: "2026-12-05",
    guestCount: 3,
    childrenCount: 1,
    driverCount: 0,
    guideCount: 1,
    meals: [
      {
        type: "Breakfast",
        time: "08:30",
        hasIngredients: false,
        ingredientIds: [],
        foodIds: ["64b000000000000000000001"],
        dessertIds: ["64b000000000000000000005"],
      },
      {
        type: "Other",
        name: "Birthday brunch",
        time: "11:00",
        hasIngredients: false,
        ingredientIds: [],
        foodIds: ["64b000000000000000000002"],
        dessertIds: [],
      },
    ],
    isVegetarian: true,
    hasAllergies: true,
    allergyCount: 1,
    notes: "No peanuts, please.",
  });
});

test("keeps desserts separate from food selections", () => {
  const parsed = parseBookingPayload({
    ...validPayload,
    meals: [{
      ...validPayload.meals[0],
      dessertIds: ["64b000000000000000000005"],
    }],
  });
  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.value.meals[0].foodIds, ["64b000000000000000000001"]);
  assert.deepEqual(parsed.value.meals[0].dessertIds, ["64b000000000000000000005"]);
});

test("rejects child and allergy counts greater than the number of guests", () => {
  assert.match(
    parseBookingPayload({ ...validPayload, childrenCount: 4 }).error,
    /Children count/,
  );
  assert.match(
    parseBookingPayload({ ...validPayload, allergyCount: 4 }).error,
    /allergies/,
  );
});

test("requires a time and at least one saved food for every meal", () => {
  assert.match(
    parseBookingPayload({
      ...validPayload,
      meals: [{ ...validPayload.meals[0], time: "8:30" }],
    }).error,
    /valid time/,
  );
  assert.match(
    parseBookingPayload({
      ...validPayload,
      meals: [{ ...validPayload.meals[0], foodIds: [] }],
    }).error,
    /at least one food/,
  );
});

test("rejects a non-text name for an other meal without throwing", () => {
  const parsed = parseBookingPayload({
    ...validPayload,
    meals: [{ ...validPayload.meals[1], name: { invalid: true } }],
  });

  assert.match(parsed.error, /name for the other meal/);
});

test("requires valid ingredient selections when the guest is bringing ingredients", () => {
  const ingredientId = "64b000000000000000000003";
  const parsed = parseBookingPayload({
    ...validPayload,
    meals: [
      { ...validPayload.meals[0], hasIngredients: true, ingredientIds: [ingredientId] },
      { ...validPayload.meals[1], hasIngredients: false, ingredientIds: [] },
    ],
  });

  assert.equal(parsed.error, undefined);
  assert.equal(parsed.value.meals[0].hasIngredients, true);
  assert.deepEqual(parsed.value.meals[0].ingredientIds, [ingredientId]);
  assert.equal(parsed.value.meals[1].hasIngredients, false);
  assert.deepEqual(parsed.value.meals[1].ingredientIds, []);
  assert.match(
    parseBookingPayload({
      ...validPayload,
      meals: [{ ...validPayload.meals[0], hasIngredients: true, ingredientIds: [] }],
    }).error,
    /at least one ingredient/,
  );
  assert.match(
    parseBookingPayload({
      ...validPayload,
      meals: [{ ...validPayload.meals[0], hasIngredients: false, ingredientIds: [ingredientId] }],
    }).error,
    /unless you are bringing them/,
  );
  assert.match(
    parseBookingPayload({
      ...validPayload,
      meals: [{ ...validPayload.meals[0], hasIngredients: true, ingredientIds: [ingredientId, ingredientId] }],
    }).error,
    /invalid/,
  );
});

test("normalizes omitted optional counts and clears allergy count when allergies are absent", () => {
  const parsed = parseBookingPayload({
    ...validPayload,
    driverCount: undefined,
    guideCount: undefined,
    hasAllergies: false,
    allergyCount: 0,
    notes: " ",
  });

  assert.equal(parsed.error, undefined);
  assert.equal(parsed.value.driverCount, 0);
  assert.equal(parsed.value.guideCount, 0);
  assert.equal(parsed.value.allergyCount, 0);
  assert.equal(parsed.value.meals[0].hasIngredients, false);
  assert.deepEqual(parsed.value.meals[0].ingredientIds, []);
  assert.equal(parsed.value.notes, "");
});
