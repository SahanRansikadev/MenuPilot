const assert = require("node:assert/strict");
const test = require("node:test");
const parseBookingPayload = require("../src/utils/booking-validation");

const validPayload = {
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
  });
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
  assert.equal(parsed.value.notes, "");
});
