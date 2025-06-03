import { Recipe } from '@/types';
import { mockRecipes } from '@/constants/mockData';

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