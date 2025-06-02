export type Recipe = {
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
};

export type MealItem = {
  recipeId?: string;
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type DailyMeals = {
  breakfast?: MealItem;
  lunch?: MealItem;
  dinner?: MealItem;
  snacks?: MealItem[];
};

export type MealPlan = {
  [date: string]: DailyMeals;
};

export type FoodEntry = {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  time: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
};

export type DailyLog = {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: FoodEntry[];
};

export type FoodLog = {
  [date: string]: DailyLog;
};

export type GroceryItem = {
  id: string;
  name: string;
  category: string;
  checked: boolean;
};

export type DietType = 'any' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten-free' | 'dairy-free' | 'low-carb';