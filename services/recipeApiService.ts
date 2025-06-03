import { Recipe } from '@/types';
import { mockRecipes } from '@/constants/mockData';
import { loadInitialRecipes, searchMealsByName } from '@/services/mealDbService';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch recipes from the API
 * This is a mock implementation that returns the mock data
 */
export const fetchRecipes = async (): Promise<Recipe[]> => {
  // Simulate API delay
  await delay(1000);
  
  // Return mock data
  return mockRecipes;
};

/**
 * Search recipes by name or tags
 */
export const searchRecipes = async (query: string): Promise<Recipe[]> => {
  // Simulate API delay
  await delay(500);
  
  // Normalize query
  const normalizedQuery = query.toLowerCase().trim();
  
  // Search in mock data
  return mockRecipes.filter(recipe => {
    // Search in name
    if (recipe.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }
    
    // Search in tags
    if (recipe.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))) {
      return true;
    }
    
    // Search in ingredients
    if (recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(normalizedQuery))) {
      return true;
    }
    
    return false;
  });
};

/**
 * Get recipe by ID
 */
export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  // Simulate API delay
  await delay(300);
  
  // Find recipe in mock data
  const recipe = mockRecipes.find(recipe => recipe.id === id);
  
  return recipe || null;
};

/**
 * Get recipes by category
 */
export const getRecipesByCategory = async (category: string): Promise<Recipe[]> => {
  // Simulate API delay
  await delay(500);
  
  // Filter recipes by category
  return mockRecipes.filter(recipe => recipe.tags.includes(category));
};

/**
 * Get recipes by diet type
 */
export const getRecipesByDietType = async (dietType: string): Promise<Recipe[]> => {
  // Simulate API delay
  await delay(500);
  
  // Map diet type to relevant tags
  const dietTags: Record<string, string[]> = {
    'vegetarian': ['vegetarian'],
    'vegan': ['vegan'],
    'keto': ['keto', 'low-carb'],
    'paleo': ['paleo'],
    'gluten-free': ['gluten-free'],
    'dairy-free': ['dairy-free'],
    'low-carb': ['low-carb']
  };
  
  const relevantTags = dietTags[dietType] || [];
  
  if (relevantTags.length === 0) {
    return mockRecipes; // Return all recipes if no specific diet type
  }
  
  // Filter recipes by relevant tags
  return mockRecipes.filter(recipe => 
    relevantTags.some(tag => recipe.tags.includes(tag))
  );
};

/**
 * Get random recipes
 */
export const getRandomRecipes = async (count: number = 5): Promise<Recipe[]> => {
  // Simulate API delay
  await delay(500);
  
  // Shuffle array
  const shuffled = [...mockRecipes].sort(() => 0.5 - Math.random());
  
  // Get first n elements
  return shuffled.slice(0, count);
};

/**
 * Load initial recipes from all sources
 * This combines recipes from different APIs based on enabled sources
 */
export const loadInitialRecipesFromAllSources = async (
  count: number = 20,
  sources: { useMealDB: boolean; useSpoonacular: boolean; useEdamam: boolean }
): Promise<Recipe[]> => {
  try {
    let recipes: Recipe[] = [];
    
    // Load from MealDB if enabled
    if (sources.useMealDB) {
      const mealDbRecipes = await loadInitialRecipes(Math.ceil(count / 2));
      recipes = [...recipes, ...mealDbRecipes];
    }
    
    // Load from Spoonacular if enabled (mock implementation)
    if (sources.useSpoonacular) {
      // Simulate API delay
      await delay(800);
      
      // Get random recipes from mock data to simulate Spoonacular
      const spoonacularRecipes = mockRecipes
        .slice(0, Math.ceil(count / 3))
        .map(recipe => ({
          ...recipe,
          id: `spoonacular_${recipe.id}`, // Add prefix to avoid ID conflicts
        }));
      
      recipes = [...recipes, ...spoonacularRecipes];
    }
    
    // Load from Edamam if enabled (mock implementation)
    if (sources.useEdamam) {
      // Simulate API delay
      await delay(600);
      
      // Get random recipes from mock data to simulate Edamam
      const edamamRecipes = mockRecipes
        .slice(0, Math.ceil(count / 4))
        .map(recipe => ({
          ...recipe,
          id: `edamam_${recipe.id}`, // Add prefix to avoid ID conflicts
        }));
      
      recipes = [...recipes, ...edamamRecipes];
    }
    
    // If no sources were enabled or no recipes were found, return some mock recipes
    if (recipes.length === 0) {
      return mockRecipes.slice(0, count);
    }
    
    // Shuffle and limit to requested count
    const shuffled = recipes.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  } catch (error) {
    console.error('Error loading recipes from all sources:', error);
    return mockRecipes.slice(0, count); // Fallback to mock data
  }
};

/**
 * Search recipes from all sources
 */
export const searchRecipesFromAllSources = async (
  query: string,
  count: number = 20,
  sources: { useMealDB: boolean; useSpoonacular: boolean; useEdamam: boolean }
): Promise<Recipe[]> => {
  try {
    let results: Recipe[] = [];
    
    // Search from MealDB if enabled
    if (sources.useMealDB) {
      const mealDbResults = await searchMealsByName(query);
      results = [...results, ...mealDbResults];
    }
    
    // Search from Spoonacular if enabled (mock implementation)
    if (sources.useSpoonacular) {
      // Simulate API delay
      await delay(600);
      
      // Search in mock data to simulate Spoonacular
      const normalizedQuery = query.toLowerCase().trim();
      const spoonacularResults = mockRecipes
        .filter(recipe => 
          recipe.name.toLowerCase().includes(normalizedQuery) ||
          recipe.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)) ||
          recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(normalizedQuery))
        )
        .map(recipe => ({
          ...recipe,
          id: `spoonacular_${recipe.id}`, // Add prefix to avoid ID conflicts
        }));
      
      results = [...results, ...spoonacularResults];
    }
    
    // Search from Edamam if enabled (mock implementation)
    if (sources.useEdamam) {
      // Simulate API delay
      await delay(500);
      
      // Search in mock data to simulate Edamam
      const normalizedQuery = query.toLowerCase().trim();
      const edamamResults = mockRecipes
        .filter(recipe => 
          recipe.name.toLowerCase().includes(normalizedQuery) ||
          recipe.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
        )
        .map(recipe => ({
          ...recipe,
          id: `edamam_${recipe.id}`, // Add prefix to avoid ID conflicts
        }));
      
      results = [...results, ...edamamResults];
    }
    
    // If no sources were enabled or no results were found, return empty array
    if (results.length === 0) {
      return [];
    }
    
    // Remove duplicates (based on name)
    const uniqueResults: Recipe[] = [];
    const seenNames = new Set<string>();
    
    for (const recipe of results) {
      if (!seenNames.has(recipe.name.toLowerCase())) {
        seenNames.add(recipe.name.toLowerCase());
        uniqueResults.push(recipe);
      }
    }
    
    // Limit to requested count
    return uniqueResults.slice(0, count);
  } catch (error) {
    console.error('Error searching recipes from all sources:', error);
    return []; // Return empty array on error
  }
};