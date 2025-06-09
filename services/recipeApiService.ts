import { Recipe } from '@/types';
import { mockRecipes } from '@/constants/mockData';

// API configuration
const MEALDB_API_URL = 'https://www.themealdb.com/api/json/v1/1';

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

// Function to validate a Recipe object
function validateRecipe(recipe: any): Recipe {
  // Determine complexity based on prep time and ingredients count
  let complexity: 'simple' | 'complex' | undefined = undefined;
  if (recipe.prepTime && recipe.ingredients) {
    const prepTimeMinutes = parseInt(recipe.prepTime.split(' ')[0]);
    const ingredientsCount = recipe.ingredients.length;
    
    if (prepTimeMinutes <= 15 && ingredientsCount <= 5) {
      complexity = 'simple';
    } else if (prepTimeMinutes >= 30 || ingredientsCount >= 8) {
      complexity = 'complex';
    } else {
      complexity = 'simple';
    }
  }
  
  // Extract dietary preferences from tags
  const dietaryPreferences: Recipe['dietaryPreferences'] = [];
  const dietaryTags = [
    'vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free', 
    'dairy-free', 'low-carb', 'high-protein'
  ];
  
  if (recipe.tags) {
    recipe.tags.forEach((tag: string) => {
      if (dietaryTags.includes(tag)) {
        dietaryPreferences.push(tag as any);
      }
    });
  }
  
  // Extract fitness goals from tags
  const fitnessGoals: Recipe['fitnessGoals'] = [];
  const fitnessTags = [
    'weight-loss', 'muscle-gain', 'general-health', 
    'heart-health', 'energy-boost'
  ];
  
  if (recipe.tags) {
    recipe.tags.forEach((tag: string) => {
      if (fitnessTags.includes(tag)) {
        fitnessGoals.push(tag as any);
      }
    });
  }
  
  return {
    ...recipe,
    mealType: toValidMealType(recipe.mealType),
    complexity,
    dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : undefined,
    fitnessGoals: fitnessGoals.length > 0 ? fitnessGoals : undefined,
    fiber: recipe.fiber || Math.floor(Math.random() * 5) + 1 // Add estimated fiber if not present
  };
}

// Function to load initial recipes from all enabled API sources
export const loadInitialRecipesFromAllSources = async (
  limit: number = 20,
  sources: ApiSourcesConfig
): Promise<Recipe[]> => {
  try {
    const recipes: Recipe[] = [];
    
    // Load from MealDB if enabled
    if (sources.useMealDB) {
      try {
        const mealDbRecipes = await loadRecipesFromMealDB(limit);
        recipes.push(...mealDbRecipes);
      } catch (error) {
        console.error('Error loading recipes from MealDB:', error);
      }
    }
    
    // Load from Spoonacular if enabled (not implemented yet)
    if (sources.useSpoonacular) {
      // Placeholder for future implementation
      console.log('Spoonacular API not implemented yet');
    }
    
    // Load from Edamam if enabled (not implemented yet)
    if (sources.useEdamam) {
      // Placeholder for future implementation
      console.log('Edamam API not implemented yet');
    }
    
    // Load from Firebase if enabled (not implemented yet)
    if (sources.useFirebase) {
      // Placeholder for future implementation
      console.log('Firebase API not implemented yet');
    }
    
    // If no recipes were loaded from APIs, return mock data
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
export const searchRecipesFromAllSources = async (
  query: string,
  limit: number = 20,
  sources: ApiSourcesConfig
): Promise<Recipe[]> => {
  try {
    const recipes: Recipe[] = [];
    
    // Search from MealDB if enabled
    if (sources.useMealDB) {
      try {
        const mealDbRecipes = await searchRecipesFromMealDB(query);
        recipes.push(...mealDbRecipes);
      } catch (error) {
        console.error('Error searching recipes from MealDB:', error);
      }
    }
    
    // Search from Spoonacular if enabled (not implemented yet)
    if (sources.useSpoonacular) {
      // Placeholder for future implementation
      console.log('Spoonacular API search not implemented yet');
    }
    
    // Search from Edamam if enabled (not implemented yet)
    if (sources.useEdamam) {
      // Placeholder for future implementation
      console.log('Edamam API search not implemented yet');
    }
    
    // Search from Firebase if enabled (not implemented yet)
    if (sources.useFirebase) {
      // Placeholder for future implementation
      console.log('Firebase API search not implemented yet');
    }
    
    // If no recipes were found from APIs, search mock data
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
    return [];
  }
};

// Function to get a recipe by ID from the appropriate source
export const getRecipeByIdFromSource = async (id: string): Promise<Recipe | null> => {
  try {
    // Check if it's a MealDB ID (they start with 'mealdb-')
    if (id.startsWith('mealdb-')) {
      const mealDbId = id.replace('mealdb-', '');
      const recipe = await getRecipeFromMealDBById(mealDbId);
      return recipe ? validateRecipe(recipe) : null;
    }
    
    // Check if it's a Spoonacular ID (they start with 'spoon-')
    if (id.startsWith('spoon-')) {
      // Placeholder for future implementation
      console.log('Spoonacular API getById not implemented yet');
      return null;
    }
    
    // Check if it's an Edamam ID (they start with 'edamam-')
    if (id.startsWith('edamam-')) {
      // Placeholder for future implementation
      console.log('Edamam API getById not implemented yet');
      return null;
    }
    
    // Check if it's a Firebase ID (they start with 'firebase-')
    if (id.startsWith('firebase-')) {
      // Placeholder for future implementation
      console.log('Firebase API getById not implemented yet');
      return null;
    }
    
    // If it's not from an API, check mock data
    const mockRecipe = mockRecipes.find(recipe => recipe.id === id);
    if (mockRecipe) {
      return validateRecipe(mockRecipe);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting recipe by ID:', error);
    return null;
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
    
    const results = await Promise.all(fetchPromises);
    results.forEach(recipe => {
      if (recipe) recipes.push(recipe);
    });
    
    return recipes;
  } catch (error) {
    console.error('Error loading recipes from MealDB:', error);
    return [];
  }
};

// Helper function to search recipes from MealDB
const searchRecipesFromMealDB = async (query: string): Promise<Recipe[]> => {
  try {
    const response = await fetch(`${MEALDB_API_URL}/search.php?s=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (!data.meals) return [];
    
    return data.meals.map((meal: any) => convertMealDBToRecipe(meal));
  } catch (error) {
    console.error('Error searching recipes from MealDB:', error);
    return [];
  }
};

// Helper function to get a recipe by ID from MealDB
const getRecipeFromMealDBById = async (id: string): Promise<Recipe | null> => {
  try {
    const response = await fetch(`${MEALDB_API_URL}/lookup.php?i=${id}`);
    const data = await response.json();
    
    if (!data.meals || data.meals.length === 0) return null;
    
    return convertMealDBToRecipe(data.meals[0]);
  } catch (error) {
    console.error('Error getting recipe from MealDB by ID:', error);
    return null;
  }
};

// Helper function to fetch a random recipe from MealDB
const fetchRandomMealDBRecipe = async (): Promise<Recipe | null> => {
  try {
    const response = await fetch(`${MEALDB_API_URL}/random.php`);
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
        const hasProtein = ingredients.some(ingredient => 
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
    ingredients.length <= 7 ? 'simple' : 'complex';
  
  // Extract dietary preferences
  const dietaryPreferences: Recipe['dietaryPreferences'] = [];
  
  // Check for vegetarian
  const meatIngredients = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'meat', 'fish', 'seafood', 'shrimp', 'bacon'];
  const isVegetarian = !ingredients.some(ingredient => 
    meatIngredients.some(meat => ingredient.toLowerCase().includes(meat))
  );
  
  if (isVegetarian) {
    dietaryPreferences.push('vegetarian');
    
    // Check for vegan (vegetarian but also no dairy or eggs)
    const nonVeganIngredients = ['milk', 'cheese', 'cream', 'yogurt', 'butter', 'egg', 'honey'];
    const isVegan = !ingredients.some(ingredient => 
      nonVeganIngredients.some(nonVegan => ingredient.toLowerCase().includes(nonVegan))
    );
    
    if (isVegan) {
      dietaryPreferences.push('vegan');
    }
  }
  
  // Check for low-carb
  const highCarbIngredients = ['pasta', 'rice', 'bread', 'potato', 'sugar', 'flour', 'corn'];
  const isLowCarb = !ingredients.some(ingredient => 
    highCarbIngredients.some(carb => ingredient.toLowerCase().includes(carb))
  );
  
  if (isLowCarb) {
    dietaryPreferences.push('low-carb');
    
    // Check for keto (low-carb and high-fat)
    const highFatIngredients = ['oil', 'butter', 'cream', 'cheese', 'avocado', 'nuts'];
    const isKeto = ingredients.some(ingredient => 
      highFatIngredients.some(fat => ingredient.toLowerCase().includes(fat))
    );
    
    if (isKeto) {
      dietaryPreferences.push('keto');
    }
  }
  
  // Check for high-protein
  const highProteinIngredients = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'seafood', 'egg', 'tofu', 'lentil', 'bean', 'quinoa'];
  const isHighProtein = ingredients.some(ingredient => 
    highProteinIngredients.some(protein => ingredient.toLowerCase().includes(protein))
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
  const isHeartHealthy = ingredients.some(ingredient => 
    heartHealthyIngredients.some(healthy => ingredient.toLowerCase().includes(healthy))
  );
  
  if (isHeartHealthy) {
    fitnessGoals.push('heart-health');
  }
  
  // Energy boost recipes typically include complex carbs and protein
  const energyBoostIngredients = ['oat', 'banana', 'nut', 'seed', 'quinoa', 'sweet potato'];
  const isEnergyBoost = ingredients.some(ingredient => 
    energyBoostIngredients.some(energy => ingredient.toLowerCase().includes(energy))
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
    prepTime: `${Math.floor(Math.random() * 20) + 5} min`, // Random prep time
    cookTime: `${Math.floor(Math.random() * 40) + 10} min`, // Random cook time
    servings: Math.floor(Math.random() * 4) + 2, // 2-6 servings
    calories: estimatedCalories,
    protein: estimatedProtein,
    carbs: estimatedCarbs,
    fat: estimatedFat,
    fiber: estimatedFiber,
    ingredients,
    instructions,
    tags,
    mealType: validMealType,
    complexity,
    dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : undefined,
    fitnessGoals: fitnessGoals.length > 0 ? fitnessGoals : undefined,
    source: 'MealDB'
  };
};