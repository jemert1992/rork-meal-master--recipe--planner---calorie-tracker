// User profile types
export type DietType = 'any' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'gluten-free' | 'dairy-free';

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
}

export interface DayMealPlan {
  breakfast?: MealItem;
  lunch?: MealItem;
  dinner?: MealItem;
  snacks?: MealItem[];
}

export interface MealPlan {
  [date: string]: DayMealPlan;
}

// Food log types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLogItem {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  time: string;
  mealType: MealType;
}

export interface DayFoodLog {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: FoodLogItem[];
}

export interface FoodLog {
  [date: string]: DayFoodLog;
}

// Grocery list types
export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
}