import { Recipe } from '@/types';
import { mockRecipes } from '@/constants/mockData';
import * as edamamService from '@/services/edamamService';
import { normalizeIngredientList } from '@/utils/ingredientParser';

// API configuration
const MEALDB_API_URL = 'https://www.themealdb.com/api/json/v1/1';
const SPOONACULAR_API_URL = 'https://api.spoonacular.com';
const SPOONACULAR_API_KEY = '802ab87547244544b1e9a9dc02f63a2b'; // Updated with the provided API key

// Interface for API sources configuration
interface ApiSourcesConfig {
  useMealDB: boolean;
  useSpoonacular: boolean;
  useEdamam: boolean;
  useFirebase: boolean;
}

// Type guard for meal type
function isValidMealType(type: string | undefined): type is 'breakfast' | 'lunch' | 'dinner' | undefined {
  return type === undefined || type === 'breakfast' || type === 'lunch' || type === 'dinner';
}

// Function to convert string to valid meal type
function toValidMealType(value: string | undefined): 'breakfast' | 'lunch' | 'dinner' | undefined {
  if (isValidMealType(value)) {
    return value;
  }
  return undefined;
}

/**
 * validateRecipe
 * Ensures required Recipe fields are present and normalized so downstream generators never crash.
 * - Coerces mealType into a valid value or undefined
 * - Guarantees numeric nutrition fields are numbers (falls back to estimates when missing)
 * - Derives complexity and preference tags when possible
 */
export function validateRecipe(recipe: any): Recipe {
  const coerceString = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
  const coerceNumber = (v: unknown, fallback: number): number => (typeof v === 'number' && !isNaN(v) ? v : fallback);
  const coerceStringArray = (arr: unknown): string[] =>
    Array.isArray(arr) ? arr.map((x) => coerceString(x, '')).map((s) => s.trim()).filter((s) => s.length > 0) : [];

  const id = coerceString(recipe.id, `local-${Math.random().toString(36).slice(2)}`);
  const name = coerceString(recipe.name, 'Untitled Recipe');
  const prepTime = coerceString(recipe.prepTime, '15 min');
  const cookTime = recipe.cookTime ? coerceString(recipe.cookTime, undefined as unknown as string) : undefined;
  const servings = Math.max(1, coerceNumber(recipe.servings, 2));

  const { strings: ingredientsStrings, parsed } = normalizeIngredientList(recipe.ingredients);
  const ingredients = ingredientsStrings.length > 0 ? ingredientsStrings : ['Ingredients unavailable'];

  let instructions = coerceStringArray(recipe.instructions);
  if (instructions.length === 0 && ingredients.length > 0) {
    instructions = ingredients.map((ing) => `Use ${ing}`);
  }

  const rawTags = coerceStringArray(recipe.tags).map((t) => t.toLowerCase());

  const parseMinutes = (timeStr: string): number => {
    const m = (timeStr || '').match(/(\d+(?:\.\d+)?)/);
    return m ? Math.round(parseFloat(m[1])) : 15;
  };

  const ingredientsCount = ingredients.length;
  const prepTimeMinutes = parseMinutes(prepTime);
  let complexity: 'simple' | 'complex' | undefined = undefined;
  if (prepTimeMinutes <= 15 && ingredientsCount <= 5) {
    complexity = 'simple';
  } else if (prepTimeMinutes >= 30 || ingredientsCount >= 8) {
    complexity = 'complex';
  } else {
    complexity = 'simple';
  }

  const dietaryPreferences: Recipe['dietaryPreferences'] = [];
  const dietaryTags = [
    'vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free',
    'dairy-free', 'low-carb', 'high-protein'
  ];
  rawTags.forEach((tag: string) => {
    if (dietaryTags.includes(tag)) dietaryPreferences.push(tag as any);
  });

  const fitnessGoals: Recipe['fitnessGoals'] = [];
  const fitnessTags = [
    'weight-loss', 'muscle-gain', 'general-health',
    'heart-health', 'energy-boost'
  ];
  rawTags.forEach((tag: string) => {
    if (fitnessTags.includes(tag)) fitnessGoals.push(tag as any);
  });

  const calories = coerceNumber(recipe.calories, Math.floor(Math.random() * 300) + 200);
  const protein = coerceNumber(recipe.protein, Math.floor(Math.random() * 20) + 10);
  const carbs = coerceNumber(recipe.carbs, Math.floor(Math.random() * 30) + 20);
  const fat = coerceNumber(recipe.fat, Math.floor(Math.random() * 15) + 5);
  const fiber = recipe.fiber !== undefined ? coerceNumber(recipe.fiber, 0) : Math.floor(Math.random() * 5) + 1;

  return {
    id,
    name,
    image: recipe.image ? coerceString(recipe.image, undefined as unknown as string) : undefined,
    prepTime,
    cookTime,
    servings,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    ingredients,
    parsedIngredients: parsed,
    instructions,
    tags: rawTags,
    mealType: toValidMealType(recipe.mealType),
    complexity,
    dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : undefined,
    fitnessGoals: fitnessGoals.length > 0 ? fitnessGoals : undefined,
    source: recipe.source ? coerceString(recipe.source) : recipe.source,
  };
}

// Function to load initial recipes from all enabled API sources
/**
 * loadInitialRecipesFromAllSources
 * Fetches from enabled sources in parallel; never blocks UI and degrades gracefully.
 * Fallbacks: if all sources fail/empty, returns mockRecipes.
 */
export const loadInitialRecipesFromAllSources = async (
  limit: number = 20,
  sources: ApiSourcesConfig
): Promise<Recipe[]> => {
  try {
    const tasks: Array<Promise<Recipe[] | null>> = [];
    if (sources.useMealDB) tasks.push(loadRecipesFromMealDB(limit).catch(() => null));
    if (sources.useSpoonacular) tasks.push(loadRecipesFromSpoonacular(limit).catch(() => null));
    if (sources.useEdamam) tasks.push(edamamService.loadInitialRecipes(limit).catch(() => null));
    // Firebase placeholder – keep non-blocking
    if (sources.useFirebase) tasks.push(Promise.resolve([]));

    const settled = await Promise.allSettled(tasks);
    const recipes: Recipe[] = settled.flatMap((r) => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [])).filter(Boolean) as Recipe[];

    if (recipes.length === 0) {
      console.warn('No recipes loaded from APIs, using mock data');
      return mockRecipes.map(validateRecipe);
    }

    return recipes.map(validateRecipe);
  } catch (error) {
    console.error('Error loading recipes from APIs:', error);
    return mockRecipes.map(validateRecipe);
  }
};

// Function to search recipes from all enabled API sources
/**
 * searchRecipesFromAllSources
 * Runs enabled source searches in parallel. Falls back to mock search if all empty/fail.
 */
export const searchRecipesFromAllSources = async (
  query: string,
  limit: number = 20,
  sources: ApiSourcesConfig
): Promise<Recipe[]> => {
  try {
    const tasks: Array<Promise<Recipe[] | null>> = [];
    if (sources.useMealDB) tasks.push(searchRecipesFromMealDB(query).catch(() => null));
    if (sources.useSpoonacular) tasks.push(searchRecipesFromSpoonacular(query, limit).catch(() => null));
    if (sources.useEdamam) tasks.push(edamamService.searchRecipesByQuery(query, limit).catch(() => null));
    if (sources.useFirebase) tasks.push(Promise.resolve([]));

    const settled = await Promise.allSettled(tasks);
    const recipes: Recipe[] = settled.flatMap((r) => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [])).filter(Boolean) as Recipe[];

    if (recipes.length === 0) {
      console.warn('No recipes found from APIs, searching mock data');
      const mockSearchResults = mockRecipes.filter(recipe => 
        recipe.name.toLowerCase().includes(query.toLowerCase()) ||
        recipe.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase())) ||
        recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(query.toLowerCase()))
      );
      return mockSearchResults.slice(0, limit).map(validateRecipe);
    }

    return recipes.slice(0, limit).map(validateRecipe);
  } catch (error) {
    console.error('Error searching recipes from APIs:', error);
    const mockSearchResults = mockRecipes.filter(recipe => 
      recipe.name.toLowerCase().includes(query.toLowerCase()) ||
      recipe.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase())) ||
      recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(query.toLowerCase()))
    );
    return mockSearchResults.slice(0, limit).map(validateRecipe);
  }
};

// Function to get a recipe by ID from the appropriate source
export const getRecipeByIdFromSource = async (id: string): Promise<Recipe | null> => {
  try {
    // Check if it's a MealDB ID (they start with 'mealdb-')
    if (id.startsWith('mealdb-')) {
      const mealDbId = id.replace('mealdb-', '');
      try {
        const recipe = await getRecipeFromMealDBById(mealDbId);
        return recipe ? validateRecipe(recipe) : null;
      } catch (error) {
        console.error('Error getting recipe from MealDB:', error);
        // Fallback to mock data
        const mockRecipe = mockRecipes.find(recipe => recipe.id === id);
        return mockRecipe ? validateRecipe(mockRecipe) : null;
      }
    }
    
    // Check if it's a Spoonacular ID (they start with 'spoon-')
    if (id.startsWith('spoon-')) {
      const spoonacularId = id.replace('spoon-', '');
      try {
        const recipe = await getRecipeFromSpoonacularById(spoonacularId);
        return recipe ? validateRecipe(recipe) : null;
      } catch (error) {
        console.error('Error getting recipe from Spoonacular:', error);
        // Fallback to mock data
        const mockRecipe = mockRecipes.find(recipe => recipe.id === id);
        return mockRecipe ? validateRecipe(mockRecipe) : null;
      }
    }
    
    // Check if it's an Edamam ID (they start with 'edamam-')
    if (id.startsWith('edamam-')) {
      const edamamId = id.replace('edamam-', '');
      try {
        const recipe = await edamamService.getRecipeById(edamamId);
        return recipe ? validateRecipe(recipe) : null;
      } catch (error) {
        console.error('Error getting recipe from Edamam:', error);
        // Fallback to mock data
        const mockRecipe = mockRecipes.find(recipe => recipe.id === id);
        return mockRecipe ? validateRecipe(mockRecipe) : null;
      }
    }
    
    // Check if it's a Firebase ID (they start with 'firebase-')
    if (id.startsWith('firebase-')) {
      // Placeholder for future implementation
      console.log('Firebase API getById not implemented yet');
      // Fallback to mock data
      const mockRecipe = mockRecipes.find(recipe => recipe.id === id);
      return mockRecipe ? validateRecipe(mockRecipe) : null;
    }
    
    // If it's not from an API, check mock data
    const mockRecipe = mockRecipes.find(recipe => recipe.id === id);
    if (mockRecipe) {
      return validateRecipe(mockRecipe);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting recipe by ID:', error);
    // Fallback to mock data
    const mockRecipe = mockRecipes.find(recipe => recipe.id === id);
    return mockRecipe ? validateRecipe(mockRecipe) : null;
  }
};

// Helper function to load recipes from MealDB
const loadRecipesFromMealDB = async (limit: number = 20): Promise<Recipe[]> => {
  try {
    // MealDB doesn't have a "get random recipes" endpoint with a limit
    // So we'll fetch a few random recipes individually
    const recipes: Recipe[] = [];
    const fetchPromises = [];
    
    for (let i = 0; i < Math.min(limit, 10); i++) {
      fetchPromises.push(fetchRandomMealDBRecipe());
    }
    
    const results = await Promise.allSettled(fetchPromises);
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        recipes.push(result.value);
      }
    });
    
    return recipes;
  } catch (error) {
    console.error('Error loading recipes from MealDB:', error);
    throw new Error('Failed to load recipes from MealDB');
  }
};

// Helper function to search recipes from MealDB
const searchRecipesFromMealDB = async (query: string): Promise<Recipe[]> => {
  try {
    const response = await fetch(`${MEALDB_API_URL}/search.php?s=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`MealDB API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.meals) return [];
    
    return data.meals.map((meal: any) => convertMealDBToRecipe(meal));
  } catch (error) {
    console.error('Error searching recipes from MealDB:', error);
    throw new Error('Failed to search recipes from MealDB');
  }
};

// Helper function to get a recipe by ID from MealDB
const getRecipeFromMealDBById = async (id: string): Promise<Recipe | null> => {
  try {
    const response = await fetch(`${MEALDB_API_URL}/lookup.php?i=${id}`);
    
    if (!response.ok) {
      throw new Error(`MealDB API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.meals || data.meals.length === 0) return null;
    
    return convertMealDBToRecipe(data.meals[0]);
  } catch (error) {
    console.error('Error getting recipe from MealDB by ID:', error);
    throw new Error('Failed to get recipe from MealDB');
  }
};

// Helper function to fetch a random recipe from MealDB
const fetchRandomMealDBRecipe = async (): Promise<Recipe | null> => {
  try {
    const response = await fetch(`${MEALDB_API_URL}/random.php`);
    
    if (!response.ok) {
      throw new Error(`MealDB API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.meals || data.meals.length === 0) return null;
    
    return convertMealDBToRecipe(data.meals[0]);
  } catch (error) {
    console.error('Error fetching random recipe from MealDB:', error);
    return null;
  }
};

// Helper function to convert MealDB format to our Recipe format
const convertMealDBToRecipe = (meal: any): Recipe => {
  // Extract ingredients and measurements
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim() !== '') {
      if (measure && measure.trim() !== '') {
        ingredients.push(`${measure.trim()} ${ingredient.trim()}`);
      } else {
        ingredients.push(ingredient.trim());
      }
    }
  }
  
  // Normalize ingredient list for validation and parsing
  const normalized = normalizeIngredientList(ingredients);

  // Extract instructions
  const instructionsText = meal.strInstructions || '';
  const instructions = instructionsText
    .split(/\r\n|\r|\n/)
    .filter((step: string) => step.trim() !== '')
    .map((step: string) => step.trim());
  
  // Extract tags
  const tagsString = meal.strTags || '';
  const tags = tagsString
    .split(',')
    .filter((tag: string) => tag.trim() !== '')
    .map((tag: string) => tag.trim().toLowerCase());
  
  // Add meal category as a tag if not already included
  if (meal.strCategory && !tags.includes(meal.strCategory.toLowerCase())) {
    tags.push(meal.strCategory.toLowerCase());
  }
  
  // Add meal area (cuisine) as a tag if not already included
  if (meal.strArea && !tags.includes(meal.strArea.toLowerCase())) {
    tags.push(meal.strArea.toLowerCase());
  }
  
  // Dessert-related tags and categories
  const dessertTags = [
    'dessert', 'sweet', 'cake', 'cookie', 'pie', 'pudding', 'ice cream', 
    'chocolate', 'candy', 'pastry', 'biscuit', 'brownie', 'custard', 
    'tart', 'cheesecake', 'mousse', 'frosting', 'icing', 'glaze'
  ];
  
  // Check if it's a dessert
  const isDessert = 
    tags.some((tag: string) => dessertTags.includes(tag)) || 
    meal.strCategory?.toLowerCase() === 'dessert' ||
    meal.strCategory?.toLowerCase() === 'sweets';
  
  // Determine meal type based on tags and category
  let mealType: 'breakfast' | 'lunch' | 'dinner' | undefined = undefined;
  
  // If it's a dessert, don't assign a meal type
  if (isDessert) {
    mealType = undefined;
  } else {
    // Breakfast-related tags
    const breakfastTags = [
      'breakfast', 'brunch', 'morning', 'oatmeal', 'cereal', 'pancake', 
      'waffle', 'egg', 'toast', 'smoothie', 'yogurt', 'muffin', 'bagel',
      'croissant', 'granola', 'porridge'
    ];
    
    // Lunch-related tags
    const lunchTags = [
      'lunch', 'salad', 'sandwich', 'soup', 'light', 'wrap', 'bowl', 
      'taco', 'quesadilla', 'burger', 'roll', 'pita', 'flatbread', 
      'hummus', 'falafel'
    ];
    
    // Dinner-related tags
    const dinnerTags = [
      'dinner', 'supper', 'main course', 'entree', 'roast', 'stew', 
      'curry', 'pasta', 'chicken', 'beef', 'pork', 'fish', 'seafood', 
      'casserole', 'grill', 'bake', 'hearty', 'substantial'
    ];
    
    // Check for breakfast-related tags
    if (tags.some((tag: string) => breakfastTags.includes(tag)) || 
        meal.strCategory?.toLowerCase() === 'breakfast') {
      mealType = 'breakfast';
    }
    // Check for lunch-related tags
    else if (tags.some((tag: string) => lunchTags.includes(tag))) {
      mealType = 'lunch';
    }
    // Check for dinner-related tags
    else if (tags.some((tag: string) => dinnerTags.includes(tag))) {
      mealType = 'dinner';
    }
    // Default to lunch for most recipes if no specific meal type is identified
    // This is safer than defaulting to dinner, as lunch can be more versatile
    else {
      // Check if it's a side dish, appetizer, or starter
      const sideOrAppetizer = tags.some((tag: string) => 
        ['side', 'side dish', 'appetizer', 'starter', 'snack'].includes(tag)
      );
      
      if (sideOrAppetizer) {
        // Side dishes and appetizers can be either lunch or dinner, default to lunch
        mealType = 'lunch';
      } else {
        // For main dishes with protein, default to dinner
        const hasProtein = normalized.strings.some((ingredient: string) => 
          /\b(chicken|beef|pork|lamb|fish|seafood|shrimp|turkey|meat)\b/i.test(ingredient)
        );
        
        mealType = hasProtein ? 'dinner' : 'lunch';
      }
    }
  }
  
  // Ensure mealType is one of the valid types using our helper function
  const validMealType = toValidMealType(mealType);
  
  // Determine complexity based on ingredients count and estimated prep time
  const complexity: 'simple' | 'complex' = 
    (normalized.strings?.length ?? 0) <= 7 ? 'simple' : 'complex';
  
  // Extract dietary preferences
  const dietaryPreferences: Recipe['dietaryPreferences'] = [];
  
  // Check for vegetarian
  const meatIngredients = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'meat', 'fish', 'seafood', 'shrimp', 'bacon'];
  const isVegetarian = !normalized.strings.some((ingredient: string) => 
    meatIngredients.some((meat: string) => ingredient.toLowerCase().includes(meat))
  );
  
  if (isVegetarian) {
    dietaryPreferences.push('vegetarian');
    
    // Check for vegan (vegetarian but also no dairy or eggs)
    const nonVeganIngredients = ['milk', 'cheese', 'cream', 'yogurt', 'butter', 'egg', 'honey'];
    const isVegan = !normalized.strings.some((ingredient: string) => 
      nonVeganIngredients.some((nonVegan: string) => ingredient.toLowerCase().includes(nonVegan))
    );
    
    if (isVegan) {
      dietaryPreferences.push('vegan');
    }
  }
  
  // Check for low-carb
  const highCarbIngredients = ['pasta', 'rice', 'bread', 'potato', 'sugar', 'flour', 'corn'];
  const isLowCarb = !normalized.strings.some((ingredient: string) => 
    highCarbIngredients.some((carb: string) => ingredient.toLowerCase().includes(carb))
  );
  
  if (isLowCarb) {
    dietaryPreferences.push('low-carb');
    
    // Check for keto (low-carb and high-fat)
    const highFatIngredients = ['oil', 'butter', 'cream', 'cheese', 'avocado', 'nuts'];
    const isKeto = normalized.strings.some((ingredient: string) => 
      highFatIngredients.some((fat: string) => ingredient.toLowerCase().includes(fat))
    );
    
    if (isKeto) {
      dietaryPreferences.push('keto');
    }
  }
  
  // Check for high-protein
  const highProteinIngredients = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'seafood', 'egg', 'tofu', 'lentil', 'bean', 'quinoa'];
  const isHighProtein = normalized.strings.some((ingredient: string) => 
    highProteinIngredients.some((protein: string) => ingredient.toLowerCase().includes(protein))
  );
  
  if (isHighProtein) {
    dietaryPreferences.push('high-protein');
  }
  
  // Extract fitness goals
  const fitnessGoals: Recipe['fitnessGoals'] = [];
  
  // Weight loss recipes are typically low-calorie, high-protein, and low-fat
  if (isHighProtein && isLowCarb) {
    fitnessGoals.push('weight-loss');
  }
  
  // Muscle gain recipes are typically high-protein and calorie-dense
  if (isHighProtein && !isLowCarb) {
    fitnessGoals.push('muscle-gain');
  }
  
  // Heart health recipes are typically low in saturated fat and sodium
  const heartHealthyIngredients = ['olive oil', 'fish', 'nuts', 'seeds', 'avocado', 'whole grain', 'oat'];
  const isHeartHealthy = normalized.strings.some((ingredient: string) => 
    heartHealthyIngredients.some((healthy: string) => ingredient.toLowerCase().includes(healthy))
  );
  
  if (isHeartHealthy) {
    fitnessGoals.push('heart-health');
  }
  
  // Energy boost recipes typically include complex carbs and protein
  const energyBoostIngredients = ['oat', 'banana', 'nut', 'seed', 'quinoa', 'sweet potato'];
  const isEnergyBoost = normalized.strings.some((ingredient: string) => 
    energyBoostIngredients.some((energy: string) => ingredient.toLowerCase().includes(energy))
  );
  
  if (isEnergyBoost) {
    fitnessGoals.push('energy-boost');
  }
  
  // If no specific fitness goal is identified, default to general health
  if (fitnessGoals.length === 0) {
    fitnessGoals.push('general-health');
  }
  
  // Estimate nutrition data (MealDB doesn't provide this)
  // These are very rough estimates and should be replaced with actual data if available
  const estimatedCalories = Math.floor(Math.random() * 300) + 200; // Random between 200-500
  const estimatedProtein = Math.floor(Math.random() * 20) + 10; // Random between 10-30g
  const estimatedCarbs = Math.floor(Math.random() * 30) + 20; // Random between 20-50g
  const estimatedFat = Math.floor(Math.random() * 15) + 5; // Random between 5-20g
  const estimatedFiber = Math.floor(Math.random() * 5) + 1; // Random between 1-6g
  
  return {
    id: `mealdb-${meal.idMeal}`,
    name: meal.strMeal,
    image: meal.strMealThumb,
    prepTime: `${Math.floor(Math.random() * 20) + 5} min`,
    cookTime: `${Math.floor(Math.random() * 40) + 10} min`,
    servings: Math.floor(Math.random() * 4) + 2,
    calories: estimatedCalories,
    protein: estimatedProtein,
    carbs: estimatedCarbs,
    fat: estimatedFat,
    fiber: estimatedFiber,
    ingredients: normalized.strings.length > 0 ? normalized.strings : ['Ingredients unavailable'],
    parsedIngredients: normalized.parsed,
    instructions,
    tags,
    mealType: validMealType,
    complexity,
    dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : undefined,
    fitnessGoals: fitnessGoals.length > 0 ? fitnessGoals : undefined,
    source: 'MealDB'
  };
};

// Helper function to load recipes from Spoonacular
const loadRecipesFromSpoonacular = async (limit: number = 20): Promise<Recipe[]> => {
  try {
    // Spoonacular has a "get random recipes" endpoint with a limit
    const response = await fetch(
      `${SPOONACULAR_API_URL}/recipes/random?number=${limit}&apiKey=${SPOONACULAR_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.recipes || data.recipes.length === 0) {
      return [];
    }
    
    return data.recipes.map((recipe: any) => convertSpoonacularToRecipe(recipe));
  } catch (error) {
    console.error('Error loading recipes from Spoonacular:', error);
    throw new Error('Failed to load recipes from Spoonacular');
  }
};

// Helper function to search recipes from Spoonacular
const searchRecipesFromSpoonacular = async (query: string, limit: number = 20): Promise<Recipe[]> => {
  try {
    // First, search for recipes by query
    const searchResponse = await fetch(
      `${SPOONACULAR_API_URL}/recipes/complexSearch?query=${encodeURIComponent(query)}&number=${limit}&apiKey=${SPOONACULAR_API_KEY}`
    );
    
    if (!searchResponse.ok) {
      throw new Error(`Spoonacular API error: ${searchResponse.status} ${searchResponse.statusText}`);
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.results || searchData.results.length === 0) {
      return [];
    }
    
    // Then, get detailed information for each recipe
    const recipePromises = searchData.results.map(async (result: any) => {
      try {
        const detailResponse = await fetch(
          `${SPOONACULAR_API_URL}/recipes/${result.id}/information?includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
        );
        
        if (!detailResponse.ok) {
          throw new Error(`Spoonacular API error: ${detailResponse.status} ${detailResponse.statusText}`);
        }
        
        const detailData = await detailResponse.json();
        return convertSpoonacularToRecipe(detailData);
      } catch (error) {
        console.error(`Error getting details for recipe ${result.id}:`, error);
        return null;
      }
    });
    
    const recipes = await Promise.allSettled(recipePromises);
    return recipes
      .filter((result): result is PromiseFulfilledResult<Recipe> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  } catch (error) {
    console.error('Error searching recipes from Spoonacular:', error);
    throw new Error('Failed to search recipes from Spoonacular');
  }
};

// Helper function to get a recipe by ID from Spoonacular
const getRecipeFromSpoonacularById = async (id: string): Promise<Recipe | null> => {
  try {
    const response = await fetch(
      `${SPOONACULAR_API_URL}/recipes/${id}/information?includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Spoonacular API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return convertSpoonacularToRecipe(data);
  } catch (error) {
    console.error('Error getting recipe from Spoonacular by ID:', error);
    throw new Error('Failed to get recipe from Spoonacular');
  }
};

// Helper function to convert Spoonacular format to our Recipe format
const convertSpoonacularToRecipe = (recipe: any): Recipe => {
  // Extract ingredients
  const ingredientLines = recipe.extendedIngredients?.map((ingredient: any) => {
    const amount = ingredient.measures?.us?.amount || ingredient.amount || '';
    const unit = ingredient.measures?.us?.unitShort || ingredient.unit || '';
    const name = ingredient.originalName || ingredient.name || '';
    if (amount && unit) return `${amount} ${unit} ${name}`;
    if (amount) return `${amount} ${name}`;
    return name;
  }) || [];
  const normalized = normalizeIngredientList(ingredientLines);
  
  // Extract instructions
  let instructions: string[] = [];
  
  if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
    // Use analyzed instructions if available
    recipe.analyzedInstructions.forEach((instructionSet: any) => {
      instructionSet.steps.forEach((step: any) => {
        instructions.push(step.step);
      });
    });
  } else if (recipe.instructions) {
    // Otherwise, parse the instructions text
    instructions = recipe.instructions
      .split(/\r\n|\r|\n|\.|\./)
      .filter((step: string) => step.trim() !== '')
      .map((step: string) => step.trim());
  }
  
  // Extract tags
  const tags: string[] = [];
  
  // Add cuisines as tags
  if (recipe.cuisines && recipe.cuisines.length > 0) {
    recipe.cuisines.forEach((cuisine: string) => {
      tags.push(cuisine.toLowerCase());
    });
  }
  
  // Add dish types as tags
  if (recipe.dishTypes && recipe.dishTypes.length > 0) {
    recipe.dishTypes.forEach((dishType: string) => {
      tags.push(dishType.toLowerCase());
    });
  }
  
  // Add diets as tags
  if (recipe.diets && recipe.diets.length > 0) {
    recipe.diets.forEach((diet: string) => {
      tags.push(diet.toLowerCase());
    });
  }
  
  // Add occasions as tags
  if (recipe.occasions && recipe.occasions.length > 0) {
    recipe.occasions.forEach((occasion: string) => {
      tags.push(occasion.toLowerCase());
    });
  }
  
  // Determine meal type based on tags and dish types
  let mealType: 'breakfast' | 'lunch' | 'dinner' | undefined = undefined;
  
  // Check if it's a dessert
  const isDessert = 
    recipe.dishTypes?.some((type: string) => type.toLowerCase().includes('dessert')) ||
    tags.some((tag: string) => tag.includes('dessert') || tag.includes('sweet'));
  
  if (isDessert) {
    mealType = undefined; // Desserts don't have a specific meal type
  } else {
    // Check for breakfast
    const isBreakfast = 
      recipe.dishTypes?.some((type: string) => 
        type.toLowerCase().includes('breakfast') || 
        type.toLowerCase().includes('brunch') ||
        type.toLowerCase().includes('morning meal')
      ) ||
      tags.some((tag: string) => tag.includes('breakfast') || tag.includes('brunch'));
    
    if (isBreakfast) {
      mealType = 'breakfast';
    } 
    // Check for lunch
    else if (
      recipe.dishTypes?.some((type: string) => 
        type.toLowerCase().includes('lunch') || 
        type.toLowerCase().includes('main course') ||
        type.toLowerCase().includes('main dish') ||
        type.toLowerCase().includes('salad') ||
        type.toLowerCase().includes('soup')
      )
    ) {
      mealType = 'lunch';
    } 
    // Check for dinner
    else if (
      recipe.dishTypes?.some((type: string) => 
        type.toLowerCase().includes('dinner') || 
        type.toLowerCase().includes('main course') ||
        type.toLowerCase().includes('main dish')
      )
    ) {
      mealType = 'dinner';
    }
    // Default based on time to cook
    else {
      // If it's quick to make, it's more likely to be lunch
      // If it takes longer, it's more likely to be dinner
      mealType = recipe.readyInMinutes && recipe.readyInMinutes <= 30 ? 'lunch' : 'dinner';
    }
  }
  
  // Determine complexity based on ingredients count and preparation time
  const complexity: 'simple' | 'complex' = 
    (normalized.strings.length <= 7 && recipe.readyInMinutes && recipe.readyInMinutes <= 30) 
      ? 'simple' 
      : 'complex';
  
  // Extract dietary preferences
  const dietaryPreferences: Recipe['dietaryPreferences'] = [];
  
  // Map Spoonacular diets to our dietary preferences
  if (recipe.diets) {
    if (recipe.diets.includes('vegan')) {
      dietaryPreferences.push('vegan');
      dietaryPreferences.push('vegetarian'); // Vegan is also vegetarian
    } else if (recipe.diets.includes('vegetarian')) {
      dietaryPreferences.push('vegetarian');
    }
    
    if (recipe.diets.includes('ketogenic')) {
      dietaryPreferences.push('keto');
    }
    
    if (recipe.diets.includes('paleo')) {
      dietaryPreferences.push('paleo');
    }
    
    if (recipe.diets.includes('gluten free')) {
      dietaryPreferences.push('gluten-free');
    }
    
    if (recipe.diets.includes('dairy free')) {
      dietaryPreferences.push('dairy-free');
    }
    
    if (recipe.diets.includes('low carb')) {
      dietaryPreferences.push('low-carb');
    }
  }
  
  // Check for high-protein based on nutrition data
  if (recipe.nutrition && recipe.nutrition.nutrients) {
    const proteinData = recipe.nutrition.nutrients.find((nutrient: any) => 
      nutrient.name.toLowerCase() === 'protein'
    );
    
    if (proteinData && proteinData.amount >= 20) { // 20g or more of protein is considered high-protein
      dietaryPreferences.push('high-protein');
    }
  }
  
  // Extract fitness goals
  const fitnessGoals: Recipe['fitnessGoals'] = [];
  
  // Determine fitness goals based on nutrition data and dietary preferences
  if (recipe.nutrition && recipe.nutrition.nutrients) {
    const caloriesData = recipe.nutrition.nutrients.find((nutrient: any) => 
      nutrient.name.toLowerCase() === 'calories'
    );
    
    const proteinData = recipe.nutrition.nutrients.find((nutrient: any) => 
      nutrient.name.toLowerCase() === 'protein'
    );
    
    const fatData = recipe.nutrition.nutrients.find((nutrient: any) => 
      nutrient.name.toLowerCase() === 'fat'
    );
    
    // Weight loss: low calorie, high protein
    if (caloriesData && caloriesData.amount < 400 && proteinData && proteinData.amount >= 15) {
      fitnessGoals.push('weight-loss');
    }
    
    // Muscle gain: high protein, moderate to high calories
    if (proteinData && proteinData.amount >= 25 && caloriesData && caloriesData.amount >= 400) {
      fitnessGoals.push('muscle-gain');
    }
    
    // Heart health: low saturated fat, high in healthy fats
    const saturatedFatData = recipe.nutrition.nutrients.find((nutrient: any) => 
      nutrient.name.toLowerCase() === 'saturated fat'
    );
    
    if (
      saturatedFatData && saturatedFatData.amount < 5 && 
      fatData && fatData.amount >= 10 && 
      recipe.diets?.some((diet: string) => 
        diet.includes('mediterranean') || diet.includes('dash')
      )
    ) {
      fitnessGoals.push('heart-health');
    }
    
    // Energy boost: complex carbs, moderate protein
    const carbsData = recipe.nutrition.nutrients.find((nutrient: any) => 
      nutrient.name.toLowerCase() === 'carbohydrates'
    );
    
    if (carbsData && carbsData.amount >= 30 && proteinData && proteinData.amount >= 10) {
      fitnessGoals.push('energy-boost');
    }
  }
  
  // If no specific fitness goal is identified, default to general health
  if (fitnessGoals.length === 0) {
    fitnessGoals.push('general-health');
  }
  
  // Extract nutrition data
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  
  if (recipe.nutrition && recipe.nutrition.nutrients) {
    const caloriesData = recipe.nutrition.nutrients.find((nutrient: any) => 
      nutrient.name.toLowerCase() === 'calories'
    );
    if (caloriesData) {
      calories = Math.round(caloriesData.amount);
    }
    
    const proteinData = recipe.nutrition.nutrients.find((nutrient: any) => 
      nutrient.name.toLowerCase() === 'protein'
    );
    if (proteinData) {
      protein = Math.round(proteinData.amount);
    }
    
    const carbsData = recipe.nutrition.nutrients.find((nutrient: any) => 
      nutrient.name.toLowerCase() === 'carbohydrates'
    );
    if (carbsData) {
      carbs = Math.round(carbsData.amount);
    }
    
    const fatData = recipe.nutrition.nutrients.find((nutrient: any) => 
      nutrient.name.toLowerCase() === 'fat'
    );
    if (fatData) {
      fat = Math.round(fatData.amount);
    }
    
    const fiberData = recipe.nutrition.nutrients.find((nutrient: any) => 
      nutrient.name.toLowerCase() === 'fiber'
    );
    if (fiberData) {
      fiber = Math.round(fiberData.amount);
    }
  } else {
    // Estimate nutrition data if not available
    calories = Math.floor(Math.random() * 300) + 200; // Random between 200-500
    protein = Math.floor(Math.random() * 20) + 10; // Random between 10-30g
    carbs = Math.floor(Math.random() * 30) + 20; // Random between 20-50g
    fat = Math.floor(Math.random() * 15) + 5; // Random between 5-20g
    fiber = Math.floor(Math.random() * 5) + 1; // Random between 1-6g
  }
  
  return {
    id: `spoon-${recipe.id}`,
    name: recipe.title,
    image: recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    prepTime: recipe.preparationMinutes ? `${recipe.preparationMinutes} min` : `${Math.floor(Math.random() * 20) + 5} min`,
    cookTime: recipe.cookingMinutes ? `${recipe.cookingMinutes} min` : `${Math.floor(Math.random() * 40) + 10} min`,
    servings: recipe.servings || Math.floor(Math.random() * 4) + 2,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    ingredients: normalized.strings.length > 0 ? normalized.strings : ['Ingredients unavailable'],
    parsedIngredients: normalized.parsed,
    instructions,
    tags,
    mealType,
    complexity,
    dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : undefined,
    fitnessGoals: fitnessGoals.length > 0 ? fitnessGoals : undefined,
    source: 'Spoonacular'
  };
};