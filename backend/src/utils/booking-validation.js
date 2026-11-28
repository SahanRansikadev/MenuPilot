const mealTypes = new Set(["Breakfast", "Lunch", "Tea time", "Dinner", "Barbecue", "Other"]);
const objectIdPattern = /^[a-f\d]{24}$/i;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function isIntegerInRange(value, minimum, maximum = 1000) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function parseBookingPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Enter valid booking details." };
  }

  const {
    date,
    guestCount,
    childrenCount,
    driverCount = 0,
    guideCount = 0,
    meals,
    isVegetarian,
    hasAllergies,
    allergyCount = 0,
    notes = "",
  } = payload;

  if (!isValidDate(date)) {
    return { error: "Choose a valid booking date." };
  }
  if (!isIntegerInRange(guestCount, 1)) {
    return { error: "Guest count must be a positive whole number." };
  }
  if (!isIntegerInRange(childrenCount, 0) || childrenCount > guestCount) {
    return { error: "Children count must be between zero and the guest count." };
  }
  if (!isIntegerInRange(driverCount, 0) || !isIntegerInRange(guideCount, 0)) {
    return { error: "Driver and guide counts must be zero or a positive whole number." };
  }
  if (typeof isVegetarian !== "boolean" || typeof hasAllergies !== "boolean") {
    return { error: "Choose the dietary and allergy options." };
  }
  if (
    (hasAllergies && !isIntegerInRange(allergyCount, 1, guestCount)) ||
    (!hasAllergies && allergyCount !== 0)
  ) {
    return { error: "Enter a valid number of guests with allergies." };
  }
  if (typeof notes !== "string" || notes.length > 1000) {
    return { error: "Notes must be 1,000 characters or fewer." };
  }
  if (!Array.isArray(meals) || meals.length === 0 || meals.length > mealTypes.size) {
    return { error: "Select at least one valid meal type." };
  }

  const seenTypes = new Set();
  const parsedMeals = [];
  for (const meal of meals) {
    if (!meal || !mealTypes.has(meal.type) || seenTypes.has(meal.type)) {
      return { error: "Meal types must be valid and unique." };
    }
    if (typeof meal.time !== "string" || !timePattern.test(meal.time)) {
      return { error: "Choose a valid time for every meal." };
    }
    const name = meal.type === "Other" && typeof meal.name === "string" ? meal.name.trim() : undefined;
    if (meal.type === "Other" && (!name || name.length > 100)) {
      return { error: "Enter a name for the other meal or event." };
    }
    const hasIngredients = meal.hasIngredients === undefined ? false : meal.hasIngredients;
    const ingredientIds = meal.ingredientIds === undefined ? [] : meal.ingredientIds;
    if (typeof hasIngredients !== "boolean") {
      return { error: "Choose whether you are bringing the ingredients for every meal." };
    }
    if (!Array.isArray(ingredientIds) || ingredientIds.length > 50) {
      return { error: "Choose no more than 50 ingredients per meal." };
    }
    if (hasIngredients && ingredientIds.length === 0) {
      return { error: "Select at least one ingredient when bringing ingredients for a meal." };
    }
    if (!hasIngredients && ingredientIds.length > 0) {
      return { error: "Do not include ingredients unless you are bringing them for that meal." };
    }
    const parsedIngredientIds = ingredientIds.map((ingredientId) => String(ingredientId));
    if (
      parsedIngredientIds.some((ingredientId) => !objectIdPattern.test(ingredientId)) ||
      new Set(parsedIngredientIds).size !== parsedIngredientIds.length
    ) {
      return { error: "Meal ingredient selections are invalid." };
    }
    if (!Array.isArray(meal.foodIds) || meal.foodIds.length === 0 || meal.foodIds.length > 20) {
      return { error: "Choose at least one food for every meal." };
    }

    const foodIds = meal.foodIds.map((foodId) => String(foodId));
    if (foodIds.some((foodId) => !objectIdPattern.test(foodId)) || new Set(foodIds).size !== foodIds.length) {
      return { error: "Meal food selections are invalid." };
    }

    seenTypes.add(meal.type);
    parsedMeals.push({
      type: meal.type,
      ...(name ? { name } : {}),
      time: meal.time,
      hasIngredients,
      ingredientIds: parsedIngredientIds,
      foodIds,
    });
  }

  return {
    value: {
      date,
      guestCount,
      childrenCount,
      driverCount,
      guideCount,
      meals: parsedMeals,
      isVegetarian,
      hasAllergies,
      allergyCount: hasAllergies ? allergyCount : 0,
      notes: notes.trim(),
    },
  };
}

module.exports = parseBookingPayload;
