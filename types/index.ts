export interface Recipe {
  id: string;
  name: string;
  image: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  complexity?: 'simple' | 'complex';
  dietaryPreferences?: ('vegan' | 'vegetarian' | 'keto' | 'paleo' | 'gluten-free' | 'dairy-free' | 'low-carb' | 'high-protein')[];
  fitnessGoals?: ('weight-loss' | 'muscle-gain' | 'general-health' | 'heart-health' | 'energy-boost')[];
  source?: string;
}

export interface MealPlan {
  [date: string]: {
    breakfast?: Recipe | null;
    lunch?: Recipe | null;
    dinner?: Recipe | null;
    snacks?: SnackItem[];
  };
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

export interface FoodLogEntry {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  servingSize?: string;
}

export interface UserProfile {
  name: string;
  age?: number;
  weight?: number;
  height?: number;
  dietType?: 'any' | 'vegetarian' | 'vegan' | 'keto' | 'gluten-free' | 'dairy-free';
  allergies?: string[];
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  fitnessGoal?: 'weight-loss' | 'muscle-gain' | 'general-health' | 'heart-health' | 'energy-boost';
}

export interface SnackItem {
  id: string;
  name: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  tags: string[];
  description: string;
  complexity?: 'simple' | 'complex';
  dietaryPreferences?: ('vegan' | 'vegetarian' | 'keto' | 'paleo' | 'gluten-free' | 'dairy-free' | 'low-carb' | 'high-protein')[];
  fitnessGoals?: ('weight-loss' | 'muscle-gain' | 'general-health' | 'heart-health' | 'energy-boost')[];
}

export interface RecipeFilters {
  mealType?: 'breakfast' | 'lunch' | 'dinner' | null;
  complexity?: 'simple' | 'complex' | null;
  dietaryPreference?: string | null;
  fitnessGoal?: string | null;
  searchQuery?: string;
  favorite?: boolean;
}

export interface RecipeCategory {
  id: string;
  name: string;
  count: number;
  image: string;
}

export interface RecipeCollection {
  id: string;
  name: string;
  description: string;
  image: string;
  recipeIds: string[];
}