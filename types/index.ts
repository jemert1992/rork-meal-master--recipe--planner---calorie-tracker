// User profile types
export type DietType = 'any' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'gluten-free' | 'dairy-free' | 'low-carb';

export interface UserProfile {
  name?: string;
  dietType?: DietType;
  allergies?: string[];
  calorieGoal?: number;
  proteinGoal?: number;
  carbGoal?: number;
  fatGoal?: number;
  waterGoal?: number;
  height?: number;
  weight?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
}

// Recipe types
export interface Recipe {
  id: string;
  name: string;
  image?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  source?: string;
}

// Meal plan types
export interface MealItem {
  recipeId?: string;
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface DailyMeals {
  breakfast?: MealItem;
  lunch?: MealItem;
  dinner?: MealItem;
}

export interface MealPlan {
  [date: string]: DailyMeals;
}

// Food log types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  time: string;
  mealType: MealType;
}

export interface DailyLog {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: FoodEntry[];
}

export interface FoodLog {
  [date: string]: DailyLog;
}

// Grocery list types
export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
}

// Snack types
export interface SnackItem {
  id: string;
  name: string;
  image?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  tags: string[];
  ingredients?: string[];
  description?: string;
  isFavorite?: boolean;
}