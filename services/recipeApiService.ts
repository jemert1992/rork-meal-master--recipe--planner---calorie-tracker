import { Recipe } from '@/types';

// Spoonacular API base URL
const SPOONACULAR_API_BASE_URL = 'https://api.spoonacular.com/recipes';
// Spoonacular API key
const SPOONACULAR_API_KEY = '802ab87547244544b1e9a9dc02f63a2b';

// Edamam API base URL
const EDAMAM_API_BASE_URL = 'https://api.edamam.com/api/recipes/v2';
// You would need to get API ID and key from https://developer.edamam.com/edamam-recipe-api
const EDAMAM_APP_ID = 'YOUR_APP_ID_HERE';
const EDAMAM_APP_KEY = 'YOUR_APP_KEY_HERE';

/**
 * Convert a Spoonacular recipe to our app's Recipe format
 */
const convertSpoonacularRecipe = (recipe: any): Recipe => {
  // Extract ingredients
  const ingredients = recipe.extendedIngredients?.map((ingredient: any) => 
    `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
  ) || [];

  // Extract instructions
  const instructions = recipe.analyzedInstructions?.[0]?.steps?.map((step: any) => step.step) || [];

  // Extract tags
  const tags = [
    ...(recipe.diets || []),
    ...(recipe.dishTypes || []),
    ...(recipe.cuisines || []),
    recipe.vegetarian ? 'vegetarian' : '',
    recipe.vegan ? 'vegan' : '',
    recipe.glutenFree ? 'gluten-free' : '',
    recipe.dairyFree ? 'dairy-free' : '',
  ].filter(tag => tag !== '');

  return {
    id: `spoonacular_${recipe.id}`,
    name: recipe.title,
    image: recipe.image,
    prepTime: `${recipe.preparationMinutes || 15} min`,
    cookTime: `${recipe.cookingMinutes || 30} min`,
    servings: recipe.servings || 4,
    calories: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Calories')?.amount || 0),
    protein: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Protein')?.amount || 0),
    carbs: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Carbohydrates')?.amount || 0),
    fat: Math.round(recipe.nutrition?.nutrients?.find((n: any) => n.name === 'Fat')?.amount || 0),
    ingredients,
    instructions,
    tags,
  };
};

/**
 * Convert an Edamam recipe to our app's Recipe format
 */
const convertEdamamRecipe = (recipe: any): Recipe => {
  const recipeDetails = recipe.recipe;
  
  // Extract ingredients
  const ingredients = recipeDetails.ingredientLines || [];

  // Extract instructions (Edamam doesn't provide instructions, so we'll link to the source)
  const instructions = [
    `This recipe doesn't include detailed instructions.`,
    `Please visit the original recipe at: ${recipeDetails.url}`
  ];

  // Extract tags
  const tags = [
    ...(recipeDetails.dietLabels || []),
    ...(recipeDetails.healthLabels || []),
    ...(recipeDetails.cuisineType || []),
    ...(recipeDetails.mealType || []),
    ...(recipeDetails.dishType || []),
  ].map(tag => tag.toLowerCase());

  // Calculate nutrition per serving
  const servings = recipeDetails.yield || 4;
  const calories = Math.round((recipeDetails.calories || 0) / servings);
  const protein = Math.round((recipeDetails.totalNutrients?.PROCNT?.quantity || 0) / servings);
  const carbs = Math.round((recipeDetails.totalNutrients?.CHOCDF?.quantity || 0) / servings);
  const fat = Math.round((recipeDetails.totalNutrients?.FAT?.quantity || 0) / servings);

  return {
    id: `edamam_${encodeURIComponent(recipeDetails.uri)}`,
    name: recipeDetails.label,
    image: recipeDetails.image,
    prepTime: '15 min', // Edamam doesn't provide prep time
    cookTime: '30 min', // Edamam doesn't provide cook time
    servings,
    calories,
    protein,
    carbs,
    fat,
    ingredients,
    instructions,
    tags,
  };
};

/**
 * Search for recipes using Spoonacular API
 */
export const searchSpoonacularRecipes = async (query: string, count: number = 10): Promise<Recipe[]> => {
  if (!SPOONACULAR_API_KEY) {
    console.warn('Spoonacular API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${SPOONACULAR_API_BASE_URL}/complexSearch?query=${encodeURIComponent(query)}&number=${count}&addRecipeInformation=true&addRecipeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results.map(convertSpoonacularRecipe);
  } catch (error) {
    console.error('Error searching Spoonacular recipes:', error);
    return [];
  }
};

/**
 * Search for recipes using Edamam API
 */
export const searchEdamamRecipes = async (query: string, count: number = 10): Promise<Recipe[]> => {
  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY || 
      EDAMAM_APP_ID === 'YOUR_APP_ID_HERE' || 
      EDAMAM_APP_KEY === 'YOUR_APP_KEY_HERE') {
    console.warn('Edamam API credentials not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${EDAMAM_API_BASE_URL}?type=public&q=${encodeURIComponent(query)}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&random=true&field=uri&field=label&field=image&field=ingredientLines&field=calories&field=totalNutrients&field=dietLabels&field=healthLabels&field=cuisineType&field=mealType&field=dishType&field=yield&field=url`
    );
    
    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.hits.slice(0, count).map(convertEdamamRecipe);
  } catch (error) {
    console.error('Error searching Edamam recipes:', error);
    return [];
  }
};

/**
 * Get random recipes from Spoonacular
 */
export const getRandomSpoonacularRecipes = async (count: number = 10): Promise<Recipe[]> => {
  if (!SPOONACULAR_API_KEY) {
    console.warn('Spoonacular API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${SPOONACULAR_API_BASE_URL}/random?number=${count}&addRecipeInformation=true&addRecipeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.recipes.map(convertSpoonacularRecipe);
  } catch (error) {
    console.error('Error getting random Spoonacular recipes:', error);
    return [];
  }
};

/**
 * Search for recipes across multiple APIs
 * This function will combine results from TheMealDB, Spoonacular, and Edamam
 */
export const searchRecipesFromAllSources = async (
  query: string, 
  count: number = 10,
  options: {
    useMealDB?: boolean;
    useSpoonacular?: boolean;
    useEdamam?: boolean;
  } = { useMealDB: true, useSpoonacular: false, useEdamam: false }
): Promise<Recipe[]> => {
  const { useMealDB, useSpoonacular, useEdamam } = options;
  
  // Import TheMealDB service dynamically to avoid circular dependencies
  const { searchMealsByName } = await import('@/services/mealDbService');
  
  // Calculate how many recipes to fetch from each source
  const sourcesCount = [useMealDB, useSpoonacular, useEdamam].filter(Boolean).length;
  if (sourcesCount === 0) return [];
  
  const perSourceCount = Math.ceil(count / sourcesCount);
  
  // Fetch recipes from each source in parallel
  const promises: Promise<Recipe[]>[] = [];
  
  if (useMealDB) {
    promises.push(searchMealsByName(query));
  }
  
  if (useSpoonacular) {
    promises.push(searchSpoonacularRecipes(query, perSourceCount));
  }
  
  if (useEdamam) {
    promises.push(searchEdamamRecipes(query, perSourceCount));
  }
  
  // Wait for all promises to resolve
  const results = await Promise.all(promises);
  
  // Combine and shuffle the results
  const allRecipes = results.flat();
  
  // Shuffle array
  for (let i = allRecipes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allRecipes[i], allRecipes[j]] = [allRecipes[j], allRecipes[i]];
  }
  
  return allRecipes.slice(0, count);
};

/**
 * Load initial recipes from multiple sources
 */
export const loadInitialRecipesFromAllSources = async (
  count: number = 30,
  options: {
    useMealDB?: boolean;
    useSpoonacular?: boolean;
    useEdamam?: boolean;
  } = { useMealDB: true, useSpoonacular: false, useEdamam: false }
): Promise<Recipe[]> => {
  const { useMealDB, useSpoonacular, useEdamam } = options;
  
  // Import TheMealDB service dynamically to avoid circular dependencies
  const { loadInitialRecipes: loadMealDBRecipes } = await import('@/services/mealDbService');
  
  // Calculate how many recipes to fetch from each source
  const sourcesCount = [useMealDB, useSpoonacular, useEdamam].filter(Boolean).length;
  if (sourcesCount === 0) return [];
  
  const perSourceCount = Math.ceil(count / sourcesCount);
  
  // Fetch recipes from each source in parallel
  const promises: Promise<Recipe[]>[] = [];
  
  if (useMealDB) {
    promises.push(loadMealDBRecipes(perSourceCount));
  }
  
  if (useSpoonacular) {
    promises.push(getRandomSpoonacularRecipes(perSourceCount));
  }
  
  if (useEdamam) {
    // For Edamam, we'll search for common food categories
    const categories = ['chicken', 'beef', 'vegetarian', 'breakfast', 'dessert'];
    const edamamPromises = categories.map(category => 
      searchEdamamRecipes(category, Math.ceil(perSourceCount / categories.length))
    );
    promises.push(Promise.all(edamamPromises).then(results => results.flat()));
  }
  
  // Wait for all promises to resolve
  const results = await Promise.all(promises);
  
  // Combine and shuffle the results
  const allRecipes = results.flat();
  
  // Shuffle array
  for (let i = allRecipes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allRecipes[i], allRecipes[j]] = [allRecipes[j], allRecipes[i]];
  }
  
  return allRecipes.slice(0, count);
};