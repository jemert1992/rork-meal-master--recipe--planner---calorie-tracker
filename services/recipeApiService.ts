import { Recipe } from '@/types';
import { searchMealsByName, getRandomMeals, getMealById } from './mealDbService';

// API source configuration type
export type ApiSources = {
  useMealDB: boolean;
  useSpoonacular: boolean;
  useEdamam: boolean;
};

/**
 * Load initial recipes from all configured API sources
 */
export const loadInitialRecipesFromAllSources = async (
  count: number = 100,
  sources: ApiSources
): Promise<Recipe[]> => {
  try {
    const recipes: Recipe[] = [];
    
    // Load from MealDB if enabled
    if (sources.useMealDB) {
      const mealDbRecipes = await getRandomMeals(Math.min(count, 50));
      recipes.push(...mealDbRecipes);
    }
    
    // Load from Spoonacular if enabled
    if (sources.useSpoonacular) {
      // Spoonacular implementation would go here
      // For now, we'll just log that it's not implemented
      console.log('Spoonacular API integration not implemented yet');
    }
    
    // Load from Edamam if enabled
    if (sources.useEdamam) {
      // Edamam implementation would go here
      // For now, we'll just log that it's not implemented
      console.log('Edamam API integration not implemented yet');
    }
    
    return recipes;
  } catch (error) {
    console.error('Error loading recipes from APIs:', error);
    return [];
  }
};

/**
 * Search recipes from all configured API sources
 */
export const searchRecipesFromAllSources = async (
  query: string,
  count: number = 20,
  sources: ApiSources
): Promise<Recipe[]> => {
  try {
    const recipes: Recipe[] = [];
    
    // Search from MealDB if enabled
    if (sources.useMealDB) {
      const mealDbRecipes = await searchMealsByName(query);
      recipes.push(...mealDbRecipes);
    }
    
    // Search from Spoonacular if enabled
    if (sources.useSpoonacular) {
      // Spoonacular implementation would go here
      console.log('Spoonacular API search not implemented yet');
    }
    
    // Search from Edamam if enabled
    if (sources.useEdamam) {
      // Edamam implementation would go here
      console.log('Edamam API search not implemented yet');
    }
    
    // Limit the number of results
    return recipes.slice(0, count);
  } catch (error) {
    console.error('Error searching recipes from APIs:', error);
    return [];
  }
};

/**
 * Get a recipe by ID from the appropriate API source
 */
export const getRecipeByIdFromSource = async (id: string): Promise<Recipe | null> => {
  try {
    // Check if it's a MealDB ID (doesn't have a prefix)
    if (!id.includes('_')) {
      return await getMealById(id);
    }
    
    // For Spoonacular IDs
    if (id.startsWith('spoonacular_')) {
      // Spoonacular implementation would go here
      console.log('Spoonacular API getById not implemented yet');
      return null;
    }
    
    // For Edamam IDs
    if (id.startsWith('edamam_')) {
      // Edamam implementation would go here
      console.log('Edamam API getById not implemented yet');
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting recipe by ID:', error);
    return null;
  }
};