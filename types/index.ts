// User types
export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  dietaryPreferences?: DietaryPreference[];
  allergies?: string[];
  excludedIngredients?: string[];
  dietType?: DietType;
  fitnessGoals?: FitnessGoal[];
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  completedOnboarding?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Recipe types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | undefined;
export type Complexity = 'simple' | 'complex' | undefined;
export type DietaryPreference = 
  | 'vegan' 
  | 'vegetarian' 
  | 'keto' 
  | 'paleo' 
  | 'gluten-free' 
  | 'dairy-free' 
  | 'low-carb'
  | 'high-protein';

export type DietType = 
  | 'any'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'paleo'
  | 'gluten-free'
  | 'dairy-free'
  | 'low-carb';

export type FitnessGoal = 
  | 'high-protein' 
  | 'weight-loss' 
  | 'muscle-gain' 
  | 'general-health' 
  | 'heart-health' 
  | 'energy-boost';

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
  mealType: MealType;
  complexity: Complexity;
  dietaryPreferences?: DietaryPreference[];
  fitnessGoals?: FitnessGoal[];
  source?: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
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
    fiber: number;
  };
  tags: {
    meal_type: MealType;
    complexity: Complexity;
    diet: DietaryPreference[];
    goal: FitnessGoal[];
    prep_time: number;
    servings: number;
  };
  image_url: string;
  source?: string;
  created_at: any;
  updated_at: any;
}

// Meal Plan types
export interface MealPlan {
  [date: string]: DailyMeals;
}

export interface DailyMeals {
  breakfast?: MealItem;
  lunch?: MealItem;
  dinner?: MealItem;
}

export interface MealItem {
  recipeId?: string;
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  customFood?: boolean;
}

// Recipe Filters
export interface RecipeFilters {
  mealType?: MealType;
  complexity?: 'simple' | 'complex';
  dietaryPreference?: string;
  fitnessGoal?: string;
  searchQuery?: string;
  favorite?: boolean;
  excludeIds?: string[];
}

// Pagination State
export interface PaginationState {
  lastDoc: any;
  hasMore: boolean;
  loading: boolean;
}

// Recipe Collection
export interface RecipeCollection {
  id: string;
  name: string;
  description: string;
  image: string;
  recipeIds: string[];
}

// Food Log types
export interface FoodLogEntry {
  id: string;
  date: string;
  mealType: MealType | 'snack';
  recipe?: Recipe;
  customFood?: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servings: number;
  };
  timestamp: string;
}

// Grocery List types
export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'other';
  recipeId?: string;
}

export interface GroceryList {
  id: string;
  name: string;
  items: GroceryItem[];
  createdAt: string;
  updatedAt: string;
}