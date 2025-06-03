import { Recipe } from '@/types';
import { mockRecipes } from '@/constants/mockData';

// API configuration
const MEALDB_API_URL = 'https://www.themealdb.com/api/json/v1/1';

// Interface for API sources configuration
interface ApiSourcesConfig {
  useMealDB: boolean;
  useSpoonacular: boolean;
  useEdamam: boolean;
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
    
    // If no recipes were loaded from APIs, return mock data
    if (recipes.length === 0) {
      console.warn('No recipes loaded from APIs, using mock data');
      return [...mockRecipes];
    }
    
    return recipes;
  } catch (error) {
    console.error('Error loading recipes from APIs:', error);
    return [...mockRecipes];
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
    
    // If no recipes were found from APIs, search mock data
    if (recipes.length === 0) {
      console.warn('No recipes found from APIs, searching mock data');
      const mockSearchResults = mockRecipes.filter(recipe => 
        recipe.name.toLowerCase().includes(query.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(query.toLowerCase()))
      );
      return mockSearchResults.slice(0, limit);
    }
    
    return recipes.slice(0, limit);
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
      return await getRecipeFromMealDBById(mealDbId);
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
    
    // If it's not from an API, check mock data
    const mockRecipe = mockRecipes.find(recipe => recipe.id === id);
    if (mockRecipe) {
      return mockRecipe;
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
  
  // Add default tags based on meal type
  if (!tags.some(tag => ['breakfast', 'lunch', 'dinner', 'snack'].includes(tag))) {
    // Default to dinner if no meal type is specified
    tags.push('dinner');
  }
  
  // Estimate nutrition data (MealDB doesn't provide this)
  // These are very rough estimates and should be replaced with actual data if available
  const estimatedCalories = Math.floor(Math.random() * 300) + 200; // Random between 200-500
  const estimatedProtein = Math.floor(Math.random() * 20) + 10; // Random between 10-30g
  const estimatedCarbs = Math.floor(Math.random() * 30) + 20; // Random between 20-50g
  const estimatedFat = Math.floor(Math.random() * 15) + 5; // Random between 5-20g
  
  return {
    id: `mealdb-${meal.idMeal}`,
    name: meal.strMeal,
    image: meal.strMealThumb,
    prepTime: '15 min', // MealDB doesn't provide prep time
    cookTime: '30 min', // MealDB doesn't provide cook time
    servings: 4, // MealDB doesn't provide servings
    calories: estimatedCalories,
    protein: estimatedProtein,
    carbs: estimatedCarbs,
    fat: estimatedFat,
    ingredients,
    instructions,
    tags,
  };
};