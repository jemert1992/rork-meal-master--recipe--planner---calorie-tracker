export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

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

export interface FirestoreRecipe {
  name: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  tags: {
    meal_type?: 'breakfast' | 'lunch' | 'dinner';
    complexity?: 'simple' | 'complex';
    diet?: ('vegan' | 'vegetarian' | 'keto' | 'paleo' | 'gluten-free' | 'dairy-free' | 'low-carb' | 'high-protein')[];
    goal?: ('weight-loss' | 'muscle-gain' | 'general-health' | 'heart-health' | 'energy-boost')[];
    prep_time: number;
    servings: number;
  };
  image_url: string;
  source?: string;
  created_at?: any;
  updated_at?: any;
  needs_review?: boolean;
  missing_fields?: string[];
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

export type DietType = 'any' | 'vegetarian' | 'vegan' | 'keto' | 'gluten-free' | 'dairy-free' | 'low-carb';

export interface UserProfile {
  name: string;
  age?: number;
  weight?: number;
  height?: number;
  dietType?: DietType;
  allergies?: string[];
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  fitnessGoals?: ('weight-loss' | 'muscle-gain' | 'general-health' | 'heart-health' | 'energy-boost')[];
  completedOnboarding?: boolean;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  dietaryPreferences?: string[];
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

export interface PaginationState {
  lastDoc: any;
  hasMore: boolean;
  loading: boolean;
}