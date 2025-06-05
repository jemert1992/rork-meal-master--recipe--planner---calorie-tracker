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
  ingredients: string[];
  instructions: string[];
  tags: string[];
  mealType?: 'breakfast' | 'lunch' | 'dinner';
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
}

export interface SnackItem {
  id: string;
  name: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  description: string;
}