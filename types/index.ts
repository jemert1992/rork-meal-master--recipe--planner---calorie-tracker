// Define the DietType type if it doesn't exist
export type DietType = 'any' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten-free' | 'dairy-free' | 'low-carb';

// Add other types as needed
export interface UserProfile {
  name?: string;
  dietType?: DietType;
  calorieGoal?: number;
  allergies?: string[];
  // Add other profile fields as needed
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
  summary?: string;
  instructions?: string;
  extendedIngredients?: Ingredient[];
  // Add other recipe fields as needed
}

export interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  // Add other ingredient fields as needed
}

export interface MealPlan {
  date: string;
  meals: Meal[];
  // Add other meal plan fields as needed
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipe: Recipe;
  // Add other meal fields as needed
}

export interface FoodLog {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  // Add other food log fields as needed
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  // Add other grocery item fields as needed
}

export interface NutritionGoals {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  // Add other nutrition goal fields as needed
}