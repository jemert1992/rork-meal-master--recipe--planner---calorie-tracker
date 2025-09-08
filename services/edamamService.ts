import { Recipe } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeIngredientList } from '@/utils/ingredientParser';

// Edamam Recipe Search API configuration
const EDAMAM_API_URL = 'https://api.edamam.com/api/recipes/v2';
// Prefer Expo public env vars, fallback to AsyncStorage
const ENV_APP_ID = (process.env.EXPO_PUBLIC_EDAMAM_APP_ID ?? '').trim();
const ENV_APP_KEY = (process.env.EXPO_PUBLIC_EDAMAM_APP_KEY ?? '').trim();

let EDAMAM_APP_ID = ENV_APP_ID || 'YOUR_EDAMAM_APP_ID';
let EDAMAM_APP_KEY = ENV_APP_KEY || 'YOUR_EDAMAM_APP_KEY';

// Initialize API credentials from AsyncStorage (env takes precedence)
const initializeCredentials = async () => {
  try {
    const storedAppId = await AsyncStorage.getItem('edamam_app_id');
    const storedAppKey = await AsyncStorage.getItem('edamam_app_key');

    if (ENV_APP_ID) EDAMAM_APP_ID = ENV_APP_ID; else if (storedAppId) EDAMAM_APP_ID = storedAppId;
    if (ENV_APP_KEY) EDAMAM_APP_KEY = ENV_APP_KEY; else if (storedAppKey) EDAMAM_APP_KEY = storedAppKey;

    return {
      appId: EDAMAM_APP_ID !== 'YOUR_EDAMAM_APP_ID' && EDAMAM_APP_ID.length > 0,
      appKey: EDAMAM_APP_KEY !== 'YOUR_EDAMAM_APP_KEY' && EDAMAM_APP_KEY.length > 0,
    };
  } catch (error) {
    console.error('Error loading Edamam credentials:', error);
    return { appId: false, appKey: false };
  }
};

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

// Edamam Recipe API response types
interface EdamamRecipeResponse {
  from: number;
  to: number;
  count: number;
  _links: {
    next?: {
      href: string;
    };
  };
  hits: Array<{
    recipe: EdamamRecipe;
    _links: {
      self: {
        href: string;
        title: string;
      };
    };
  }>;
}

interface EdamamRecipe {
  uri: string;
  label: string;
  image: string;
  source: string;
  url: string;
  yield: number;
  dietLabels: string[];
  healthLabels: string[];
  cautions: string[];
  ingredientLines: string[];
  ingredients: Array<{
    text: string;
    quantity: number;
    measure: string;
    food: string;
    weight: number;
    foodCategory: string;
    foodId: string;
    image: string;
  }>;
  calories: number;
  totalWeight: number;
  totalTime: number;
  cuisineType: string[];
  mealType: string[];
  dishType: string[];
  totalNutrients: {
    [key: string]: {
      label: string;
      quantity: number;
      unit: string;
    };
  };
  totalDaily: {
    [key: string]: {
      label: string;
      quantity: number;
      unit: string;
    };
  };
  digest: Array<{
    label: string;
    tag: string;
    schemaOrgTag: string;
    total: number;
    hasRDI: boolean;
    daily: number;
    unit: string;
    sub?: {
      label: string;
      tag: string;
      schemaOrgTag: string;
      total: number;
      hasRDI: boolean;
      daily: number;
      unit: string;
    }[];
  }>;
}

/**
 * Convert an Edamam recipe to our app's Recipe format
 */
const convertEdamamToRecipe = (edamamRecipe: EdamamRecipe): Recipe => {
  // Extract recipe ID from URI
  const uriParts = edamamRecipe.uri.split('#');
  const recipeId = uriParts[uriParts.length - 1];
  
  // Extract instructions from ingredientLines if available
  // Note: Edamam doesn't provide step-by-step instructions, just ingredient lines
  const instructions = edamamRecipe.ingredientLines.map(line => line.trim());
  
  // Extract tags from various Edamam fields
  const tags: string[] = [
    ...edamamRecipe.dietLabels.map(label => label.toLowerCase()),
    ...edamamRecipe.healthLabels.map(label => label.toLowerCase().replace(/_/g, '-')),
    ...(edamamRecipe.cuisineType || []).map(cuisine => cuisine.toLowerCase()),
    ...(edamamRecipe.dishType || []).map(dish => dish.toLowerCase()),
  ];
  
  // Determine meal type based on Edamam's mealType field
  let mealType: 'breakfast' | 'lunch' | 'dinner' | undefined = undefined;
  
  if (edamamRecipe.mealType && edamamRecipe.mealType.length > 0) {
    const mealTypeStr = edamamRecipe.mealType[0].toLowerCase();
    
    if (mealTypeStr.includes('breakfast') || mealTypeStr.includes('brunch')) {
      mealType = 'breakfast';
    } else if (mealTypeStr.includes('lunch')) {
      mealType = 'lunch';
    } else if (mealTypeStr.includes('dinner') || mealTypeStr.includes('main course')) {
      mealType = 'dinner';
    }
  } else if (edamamRecipe.dishType && edamamRecipe.dishType.length > 0) {
    // Try to determine meal type from dish type
    const dishType = edamamRecipe.dishType[0].toLowerCase();
    
    if (dishType.includes('breakfast') || dishType.includes('brunch')) {
      mealType = 'breakfast';
    } else if (dishType.includes('main course') || dishType.includes('main dish')) {
      // Default main courses to dinner unless they're clearly lunch items
      const isLunchItem = edamamRecipe.label.toLowerCase().includes('sandwich') || 
                          edamamRecipe.label.toLowerCase().includes('salad') ||
                          edamamRecipe.label.toLowerCase().includes('soup');
      
      mealType = isLunchItem ? 'lunch' : 'dinner';
    } else if (dishType.includes('salad') || dishType.includes('soup') || dishType.includes('sandwich')) {
      mealType = 'lunch';
    }
  }
  
  // Ensure mealType is one of the valid types
  const validMealType = toValidMealType(mealType);
  
  // Determine complexity based on total time and number of ingredients
  const complexity: 'simple' | 'complex' = 
    (edamamRecipe.totalTime <= 30 && edamamRecipe.ingredientLines.length <= 8) 
      ? 'simple' 
      : 'complex';
  
  // Extract dietary preferences
  const dietaryPreferences: Recipe['dietaryPreferences'] = [];
  
  // Map Edamam health labels to our dietary preferences
  if (edamamRecipe.healthLabels.includes('VEGAN')) {
    dietaryPreferences.push('vegan');
    dietaryPreferences.push('vegetarian'); // Vegan is also vegetarian
  } else if (edamamRecipe.healthLabels.includes('VEGETARIAN')) {
    dietaryPreferences.push('vegetarian');
  }
  
  if (edamamRecipe.healthLabels.includes('KETO_FRIENDLY')) {
    dietaryPreferences.push('keto');
  }
  
  if (edamamRecipe.healthLabels.includes('PALEO')) {
    dietaryPreferences.push('paleo');
  }
  
  if (edamamRecipe.healthLabels.includes('GLUTEN_FREE')) {
    dietaryPreferences.push('gluten-free');
  }
  
  if (edamamRecipe.healthLabels.includes('DAIRY_FREE')) {
    dietaryPreferences.push('dairy-free');
  }
  
  if (edamamRecipe.dietLabels.includes('LOW_CARB')) {
    dietaryPreferences.push('low-carb');
  }
  
  // Check for high-protein based on nutrition data
  const proteinContent = edamamRecipe.totalNutrients.PROCNT?.quantity || 0;
  if (proteinContent >= 20) { // 20g or more of protein per serving is considered high-protein
    dietaryPreferences.push('high-protein');
  }
  
  // Extract fitness goals
  const fitnessGoals: Recipe['fitnessGoals'] = [];
  
  // Determine fitness goals based on nutrition data and dietary preferences
  const calories = edamamRecipe.calories / edamamRecipe.yield; // Calories per serving
  
  // Weight loss: low calorie, high protein
  if (calories < 400 && proteinContent >= 15) {
    fitnessGoals.push('weight-loss');
  }
  
  // Muscle gain: high protein, moderate to high calories
  if (proteinContent >= 25 && calories >= 400) {
    fitnessGoals.push('muscle-gain');
  }
  
  // Heart health: low saturated fat, high in healthy fats
  const fatContent = edamamRecipe.totalNutrients.FAT?.quantity || 0;
  const saturatedFatContent = edamamRecipe.totalNutrients.FASAT?.quantity || 0;
  
  if (saturatedFatContent < 5 && fatContent >= 10 && edamamRecipe.healthLabels.includes('MEDITERRANEAN')) {
    fitnessGoals.push('heart-health');
  }
  
  // Energy boost: complex carbs, moderate protein
  const carbContent = edamamRecipe.totalNutrients.CHOCDF?.quantity || 0;
  
  if (carbContent >= 30 && proteinContent >= 10) {
    fitnessGoals.push('energy-boost');
  }
  
  // If no specific fitness goal is identified, default to general health
  if (fitnessGoals.length === 0) {
    fitnessGoals.push('general-health');
  }
  
  // Extract nutrition data
  const protein = Math.round(edamamRecipe.totalNutrients.PROCNT?.quantity / edamamRecipe.yield) || 0;
  const carbs = Math.round(edamamRecipe.totalNutrients.CHOCDF?.quantity / edamamRecipe.yield) || 0;
  const fat = Math.round(edamamRecipe.totalNutrients.FAT?.quantity / edamamRecipe.yield) || 0;
  const fiber = Math.round(edamamRecipe.totalNutrients.FIBTG?.quantity / edamamRecipe.yield) || 0;
  
  const normalized = normalizeIngredientList(edamamRecipe.ingredientLines);
  return {
    id: `edamam-${recipeId}`,
    name: edamamRecipe.label,
    image: edamamRecipe.image,
    prepTime: `${Math.round(edamamRecipe.totalTime / 3)} min`,
    cookTime: `${Math.round(edamamRecipe.totalTime * 2 / 3)} min`,
    servings: Math.round(edamamRecipe.yield),
    calories: Math.round(edamamRecipe.calories / edamamRecipe.yield),
    protein,
    carbs,
    fat,
    fiber,
    ingredients: normalized.strings.length > 0 ? normalized.strings : ['Ingredients unavailable'],
    parsedIngredients: normalized.parsed,
    instructions,
    tags,
    mealType: validMealType,
    complexity,
    dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : undefined,
    fitnessGoals: fitnessGoals.length > 0 ? fitnessGoals : undefined,
    source: 'Edamam'
  };
};

/**
 * Check if Edamam API credentials are configured
 */
export const checkEdamamCredentials = async (): Promise<boolean> => {
  const { appId, appKey } = await initializeCredentials();
  return appId && appKey;
};

/**
 * Search for recipes using Edamam API
 */
export const searchRecipesByQuery = async (query: string, limit: number = 20): Promise<Recipe[]> => {
  try {
    // Initialize credentials
    await initializeCredentials();
    
    // Check if credentials are available
    if (EDAMAM_APP_ID === 'YOUR_EDAMAM_APP_ID' || EDAMAM_APP_KEY === 'YOUR_EDAMAM_APP_KEY') {
      console.warn('Edamam API not configured; skipping request.');
      return [];
    }
    
    // Construct the API URL with query parameters
    const url = new URL(EDAMAM_API_URL);
    url.searchParams.append('type', 'public');
    url.searchParams.append('q', query);
    url.searchParams.append('app_id', EDAMAM_APP_ID);
    url.searchParams.append('app_key', EDAMAM_APP_KEY);
    url.searchParams.append('random', 'true'); // Get random results for more diversity
    
    // Add fields parameter to get all necessary data
    url.searchParams.append('field', 'uri');
    url.searchParams.append('field', 'label');
    url.searchParams.append('field', 'image');
    url.searchParams.append('field', 'source');
    url.searchParams.append('field', 'url');
    url.searchParams.append('field', 'yield');
    url.searchParams.append('field', 'dietLabels');
    url.searchParams.append('field', 'healthLabels');
    url.searchParams.append('field', 'cautions');
    url.searchParams.append('field', 'ingredientLines');
    url.searchParams.append('field', 'ingredients');
    url.searchParams.append('field', 'calories');
    url.searchParams.append('field', 'totalWeight');
    url.searchParams.append('field', 'totalTime');
    url.searchParams.append('field', 'cuisineType');
    url.searchParams.append('field', 'mealType');
    url.searchParams.append('field', 'dishType');
    url.searchParams.append('field', 'totalNutrients');
    url.searchParams.append('field', 'totalDaily');
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status} ${response.statusText}`);
    }
    
    const data: EdamamRecipeResponse = await response.json();
    
    if (!data.hits || data.hits.length === 0) {
      return [];
    }
    
    // Convert Edamam recipes to our app's Recipe format
    const recipes = data.hits.map(hit => convertEdamamToRecipe(hit.recipe));
    
    // Limit the number of results
    return recipes.slice(0, limit);
  } catch (error) {
    console.error('Error searching recipes from Edamam:', error);
    return [];
  }
};

/**
 * Get a recipe by ID from Edamam
 */
export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  try {
    // Initialize credentials
    await initializeCredentials();
    
    // Check if credentials are available
    if (EDAMAM_APP_ID === 'YOUR_EDAMAM_APP_ID' || EDAMAM_APP_KEY === 'YOUR_EDAMAM_APP_KEY') {
      console.warn('Edamam API not configured; skipping request.');
      return null;
    }
    
    // Construct the API URL with the recipe ID
    const url = new URL(`${EDAMAM_API_URL}/${id}`);
    url.searchParams.append('type', 'public');
    url.searchParams.append('app_id', EDAMAM_APP_ID);
    url.searchParams.append('app_key', EDAMAM_APP_KEY);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status} ${response.statusText}`);
    }
    
    const data: EdamamRecipe = await response.json();
    
    // Convert Edamam recipe to our app's Recipe format
    return convertEdamamToRecipe(data);
  } catch (error) {
    console.error('Error getting recipe from Edamam by ID:', error);
    return null;
  }
};

/**
 * Get random recipes from Edamam
 */
export const getRandomRecipes = async (limit: number = 20): Promise<Recipe[]> => {
  try {
    // Initialize credentials
    await initializeCredentials();
    
    // Check if credentials are available
    if (EDAMAM_APP_ID === 'YOUR_EDAMAM_APP_ID' || EDAMAM_APP_KEY === 'YOUR_EDAMAM_APP_KEY') {
      console.warn('Edamam API not configured; skipping request.');
      return [];
    }
    
    // Edamam doesn't have a direct "random recipes" endpoint
    // So we'll search for common ingredients with the random parameter
    const commonIngredients = [
      'chicken', 'beef', 'fish', 'pasta', 'rice', 
      'potato', 'tomato', 'salad', 'soup', 'bread'
    ];
    
    // Pick a random ingredient to search for
    const randomIngredient = commonIngredients[Math.floor(Math.random() * commonIngredients.length)];
    
    // Search for recipes with the random ingredient
    return await searchRecipesByQuery(randomIngredient, limit);
  } catch (error) {
    console.error('Error getting random recipes from Edamam:', error);
    return [];
  }
};

/**
 * Get recipes by meal type from Edamam
 */
export const getRecipesByMealType = async (mealType: 'breakfast' | 'lunch' | 'dinner', limit: number = 20): Promise<Recipe[]> => {
  try {
    // Initialize credentials
    await initializeCredentials();
    
    // Check if credentials are available
    if (EDAMAM_APP_ID === 'YOUR_EDAMAM_APP_ID' || EDAMAM_APP_KEY === 'YOUR_EDAMAM_APP_KEY') {
      console.warn('Edamam API not configured; skipping request.');
      return [];
    }
    
    // Construct the API URL with query parameters
    const url = new URL(EDAMAM_API_URL);
    url.searchParams.append('type', 'public');
    url.searchParams.append('app_id', EDAMAM_APP_ID);
    url.searchParams.append('app_key', EDAMAM_APP_KEY);
    url.searchParams.append('random', 'true'); // Get random results for more diversity
    
    // Map our meal types to Edamam meal types
    let edamamMealType = '';
    if (mealType === 'breakfast') {
      edamamMealType = 'Breakfast';
    } else if (mealType === 'lunch') {
      edamamMealType = 'Lunch';
    } else if (mealType === 'dinner') {
      edamamMealType = 'Dinner';
    }
    
    url.searchParams.append('mealType', edamamMealType);
    
    // Add fields parameter to get all necessary data
    url.searchParams.append('field', 'uri');
    url.searchParams.append('field', 'label');
    url.searchParams.append('field', 'image');
    url.searchParams.append('field', 'source');
    url.searchParams.append('field', 'url');
    url.searchParams.append('field', 'yield');
    url.searchParams.append('field', 'dietLabels');
    url.searchParams.append('field', 'healthLabels');
    url.searchParams.append('field', 'cautions');
    url.searchParams.append('field', 'ingredientLines');
    url.searchParams.append('field', 'ingredients');
    url.searchParams.append('field', 'calories');
    url.searchParams.append('field', 'totalWeight');
    url.searchParams.append('field', 'totalTime');
    url.searchParams.append('field', 'cuisineType');
    url.searchParams.append('field', 'mealType');
    url.searchParams.append('field', 'dishType');
    url.searchParams.append('field', 'totalNutrients');
    url.searchParams.append('field', 'totalDaily');
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status} ${response.statusText}`);
    }
    
    const data: EdamamRecipeResponse = await response.json();
    
    if (!data.hits || data.hits.length === 0) {
      return [];
    }
    
    // Convert Edamam recipes to our app's Recipe format
    const recipes = data.hits.map(hit => convertEdamamToRecipe(hit.recipe));
    
    // Limit the number of results
    return recipes.slice(0, limit);
  } catch (error) {
    console.error(`Error getting ${mealType} recipes from Edamam:`, error);
    return [];
  }
};

/**
 * Get recipes by diet type from Edamam
 */
export const getRecipesByDietType = async (dietType: string, limit: number = 20): Promise<Recipe[]> => {
  try {
    // Initialize credentials
    await initializeCredentials();
    
    // Check if credentials are available
    if (EDAMAM_APP_ID === 'YOUR_EDAMAM_APP_ID' || EDAMAM_APP_KEY === 'YOUR_EDAMAM_APP_KEY') {
      console.warn('Edamam API not configured; skipping request.');
      return [];
    }
    
    // Construct the API URL with query parameters
    const url = new URL(EDAMAM_API_URL);
    url.searchParams.append('type', 'public');
    url.searchParams.append('app_id', EDAMAM_APP_ID);
    url.searchParams.append('app_key', EDAMAM_APP_KEY);
    url.searchParams.append('random', 'true'); // Get random results for more diversity
    
    // Map our diet types to Edamam health labels
    let edamamHealthLabel = '';
    if (dietType === 'vegetarian') {
      edamamHealthLabel = 'vegetarian';
    } else if (dietType === 'vegan') {
      edamamHealthLabel = 'vegan';
    } else if (dietType === 'gluten-free') {
      edamamHealthLabel = 'gluten-free';
    } else if (dietType === 'dairy-free') {
      edamamHealthLabel = 'dairy-free';
    } else if (dietType === 'keto') {
      edamamHealthLabel = 'keto-friendly';
    } else if (dietType === 'paleo') {
      edamamHealthLabel = 'paleo';
    } else if (dietType === 'low-carb') {
      url.searchParams.append('diet', 'low-carb');
    }
    
    if (edamamHealthLabel) {
      url.searchParams.append('health', edamamHealthLabel);
    }
    
    // Add fields parameter to get all necessary data
    url.searchParams.append('field', 'uri');
    url.searchParams.append('field', 'label');
    url.searchParams.append('field', 'image');
    url.searchParams.append('field', 'source');
    url.searchParams.append('field', 'url');
    url.searchParams.append('field', 'yield');
    url.searchParams.append('field', 'dietLabels');
    url.searchParams.append('field', 'healthLabels');
    url.searchParams.append('field', 'cautions');
    url.searchParams.append('field', 'ingredientLines');
    url.searchParams.append('field', 'ingredients');
    url.searchParams.append('field', 'calories');
    url.searchParams.append('field', 'totalWeight');
    url.searchParams.append('field', 'totalTime');
    url.searchParams.append('field', 'cuisineType');
    url.searchParams.append('field', 'mealType');
    url.searchParams.append('field', 'dishType');
    url.searchParams.append('field', 'totalNutrients');
    url.searchParams.append('field', 'totalDaily');
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status} ${response.statusText}`);
    }
    
    const data: EdamamRecipeResponse = await response.json();
    
    if (!data.hits || data.hits.length === 0) {
      return [];
    }
    
    // Convert Edamam recipes to our app's Recipe format
    const recipes = data.hits.map(hit => convertEdamamToRecipe(hit.recipe));
    
    // Limit the number of results
    return recipes.slice(0, limit);
  } catch (error) {
    console.error(`Error getting ${dietType} recipes from Edamam:`, error);
    return [];
  }
};

/**
 * Load initial recipes for the app
 * This will fetch a mix of recipes from different meal types and diet types
 */
export const loadInitialRecipes = async (count: number = 20): Promise<Recipe[]> => {
  try {
    // Initialize credentials
    await initializeCredentials();
    
    // Check if credentials are available
    if (EDAMAM_APP_ID === 'YOUR_EDAMAM_APP_ID' || EDAMAM_APP_KEY === 'YOUR_EDAMAM_APP_KEY') {
      console.warn('Edamam API not configured; skipping request.');
      return [];
    }
    
    const recipes: Recipe[] = [];
    
    // Get some breakfast recipes
    const breakfastRecipes = await getRecipesByMealType('breakfast', Math.floor(count / 3));
    recipes.push(...breakfastRecipes);
    
    // Get some lunch recipes
    const lunchRecipes = await getRecipesByMealType('lunch', Math.floor(count / 3));
    recipes.push(...lunchRecipes);
    
    // Get some dinner recipes
    const dinnerRecipes = await getRecipesByMealType('dinner', Math.floor(count / 3));
    recipes.push(...dinnerRecipes);
    
    // If we still need more recipes, get some random ones
    if (recipes.length < count) {
      const randomRecipes = await getRandomRecipes(count - recipes.length);
      recipes.push(...randomRecipes);
    }
    
    // Shuffle the recipes for more diversity
    for (let i = recipes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [recipes[i], recipes[j]] = [recipes[j], recipes[i]];
    }
    
    return recipes.slice(0, count);
  } catch (error) {
    console.error('Error loading initial recipes from Edamam:', error);
    return [];
  }
};