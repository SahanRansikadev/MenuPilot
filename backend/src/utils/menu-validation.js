const mealTypes = ["Breakfast", "Lunch", "Tea time", "Dinner", "Barbecue", "Other"];

function parseMenuPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Enter valid menu details." };
  }

  const hotelName = typeof payload.hotelName === "string" ? payload.hotelName.trim().replace(/\s+/g, " ") : "";
  const name = typeof payload.name === "string" ? payload.name.trim().replace(/\s+/g, " ") : "";
  const mealType = payload.mealType;
  const description = typeof payload.description === "string" ? payload.description.trim() : "";
  const instructions = typeof payload.instructions === "string" ? payload.instructions.trim() : "";
  const ingredients = Array.isArray(payload.ingredients)
    ? payload.ingredients.map((ingredient) =>
        typeof ingredient === "string" ? ingredient.trim().replace(/\s+/g, " ") : "",
      )
    : [];
  const normalizedIngredients = ingredients.map((ingredient) => ingredient.toLocaleLowerCase("en"));

  if (!hotelName || hotelName.length > 100 || !name || name.length > 100) {
    return { error: "Hotel and recipe names must be between 1 and 100 characters." };
  }
  if (!mealTypes.includes(mealType)) {
    return { error: "Choose a valid meal type." };
  }
  if (description.length > 500 || !instructions || instructions.length > 5000) {
    return { error: "Description must be at most 500 characters and preparation instructions are required." };
  }
  if (
    ingredients.length === 0 ||
    ingredients.length > 40 ||
    ingredients.some((ingredient) => !ingredient || ingredient.length > 100) ||
    new Set(normalizedIngredients).size !== normalizedIngredients.length
  ) {
    return { error: "Add between 1 and 40 unique ingredients, each no longer than 100 characters." };
  }

  return {
    value: { hotelName, name, mealType, description, ingredients, instructions },
  };
}

module.exports = parseMenuPayload;
