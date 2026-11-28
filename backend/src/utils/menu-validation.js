const mealTypes = ["Breakfast", "Lunch", "Tea time", "Dinner", "Barbecue", "Other"];

function parseMenuPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Enter valid menu details." };
  }

  const hotelName = typeof payload.hotelName === "string" ? payload.hotelName.trim().replace(/\s+/g, " ") : "";
  const mealType = payload.mealType;
  const description = typeof payload.description === "string" ? payload.description.trim() : "";
  const instructions = typeof payload.instructions === "string" ? payload.instructions.trim() : "";
  const ingredients = Array.isArray(payload.ingredients)
    ? payload.ingredients.map((ingredient) =>
        typeof ingredient === "string" ? ingredient.trim().replace(/\s+/g, " ") : "",
      )
    : [];
  const normalizedIngredients = ingredients.map((ingredient) => ingredient.toLocaleLowerCase("en"));
  const isRecipeList = Array.isArray(payload.recipeNames);
  const recipeNames = isRecipeList
    ? payload.recipeNames.map((name) => typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "")
    : [typeof payload.name === "string" ? payload.name.trim().replace(/\s+/g, " ") : ""];
  const normalizedRecipeNames = recipeNames.map((name) => name.toLocaleLowerCase("en"));

  if (!hotelName || hotelName.length > 100) {
    return { error: "Hotel name must be between 1 and 100 characters." };
  }
  if (!mealTypes.includes(mealType)) {
    return { error: "Choose a valid meal type." };
  }
  if (
    recipeNames.length === 0 ||
    recipeNames.some((name) => !name || name.length > 100) ||
    new Set(normalizedRecipeNames).size !== normalizedRecipeNames.length
  ) {
    return { error: "Add at least one unique recipe name, each no longer than 100 characters." };
  }
  if (description.length > 500) {
    return { error: "Menu description must be 500 characters or fewer." };
  }

  if (isRecipeList) {
    return { value: { hotelName, mealType, recipeNames, description } };
  }

  if (!instructions || instructions.length > 5000) {
    return { error: "Preparation instructions are required for legacy recipe entries." };
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
    value: {
      hotelName,
      mealType,
      name: recipeNames[0],
      description,
      ingredients,
      instructions,
    },
  };
}

module.exports = parseMenuPayload;
