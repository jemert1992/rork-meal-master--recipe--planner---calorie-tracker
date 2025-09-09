export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type DietType = 'any' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo' | 'gluten-free' | 'dairy-free' | 'low-carb';

export type FitnessGoal = 'weight-loss' | 'muscle-gain' | 'general-health' | 'heart-health' | 'energy-boost' | 'high-protein';

export type DietaryPreference = 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten-free' | 'dairy-free' | 'low-carb' | 'high-protein';

export type Recipe = {
  id: string;
  name: string;
  image?: string;
  prepTime: string;
  cookTime?: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  ingredients: string[];
  parsedIngredients?: RecipeIngredient[];
  instructions: string[];
  tags: string[];
  mealType?: MealType;
  complexity?: 'simple' | 'intermediate' | 'complex';
  dietaryPreferences?: Array<'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten-free' | 'dairy-free' | 'low-carb' | 'high-protein'>;
  fitnessGoals?: Array<FitnessGoal>;
  source?: string;
};

export type RecipeCategory = {
  id: string;
  name: string;
  count: number;
  image: string;
};

export type RecipeIngredient = {
  name: string;
  quantity?: number;
  unit?: string;
};

export type FirestoreRecipe = {
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
    meal_type?: MealType;
    complexity?: 'simple' | 'intermediate' | 'complex';
    diet?: string[];
    goal?: string[];
    prep_time: number;
    servings: number;
  };
  image_url?: string;
  source?: string;
  created_at: any;
  updated_at: any;
};

export type MealItem = {
  recipeId?: string;
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  ingredients?: CustomIngredient[];
  servings?: number;
  notes?: string;
  isLeftover?: boolean;
  leftoverSource?: { date: string; mealType: MealType };
  plannedLeftoverTarget?: { date: string; mealType: MealType };
  repurposeSuggestion?: string;
  batchPrep?: boolean;
};

export type CustomIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
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
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  quantity: number;
  unit: string;
  recipeId?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  time?: string;
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

export type FoodItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  quantity: number;
  unit: string;
  recipeId?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  time?: string;
};

export type GroceryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  recipeIds: string[];
};

export type GroceryList = {
  items: GroceryItem[];
  lastGenerated: string;
  startDate: string;
  endDate: string;
};

export type UserProfile = {
  id?: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  height?: number;
  heightUnit?: 'cm' | 'ft';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  dietaryPreferences?: string[];
  dietType?: DietType;
  allergies?: string[];
  excludedIngredients?: string[];
  preferredCuisines?: string[];
  excludedCuisines?: string[];
  strictNoDuplicates?: boolean;
  requireDailyPlantBased?: boolean;
  // Complexity preferences
  preferSimpleMeals?: boolean; // bias toward simple for all meals
  noComplexMeals?: boolean; // strict filter out complex meals
  breakfastSimpleBiasStrong?: boolean; // heavily bias simple for breakfast
  // Batch prep & leftovers
  preferBatchPrep?: boolean;
  planLeftovers?: boolean;
  maxLeftoverGapDays?: number;
  // Breakfast repeats
  breakfastRepeatMode?: 'no-repeat' | 'repeat' | 'alternate';
  // Lunch repeats
  lunchRepeatMode?: 'no-repeat' | 'repeat' | 'alternate';
  fitnessGoals?: FitnessGoal[];
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  fiberGoal?: number;
  waterGoal?: number;
  mealReminders?: boolean;
  waterReminders?: boolean;
  autoGenerateMeals?: boolean;
  theme?: 'light' | 'dark' | 'system';
  onboardingCompleted?: boolean;
  completedOnboarding?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type RecipeCollection = {
  id: string;
  name: string;
  description: string;
  image: string;
  recipeIds: string[];
};

export type RecipeFilters = {
  mealType?: MealType;
  complexity?: 'simple' | 'complex';
  dietaryPreference?: string;
  fitnessGoal?: string;
  searchQuery?: string;
  favorite?: boolean;
  excludeIds?: string[];
};

export type PaginationState = {
  lastDoc: any;
  hasMore: boolean;
  loading: boolean;
};

export type GenerationResult = {
  success: boolean;
  generatedMeals: string[];
  error: string | null;
  suggestions: string[];
};

export type SnackItem = {
  id: string;
  name: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  description: string;
};