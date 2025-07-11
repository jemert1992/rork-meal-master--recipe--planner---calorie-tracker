import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealPlan, MealItem, DailyMeals, Recipe, DietType, GenerationResult } from '@/types';
import { mockMealPlan } from '@/constants/mockData';
import * as firebaseService from '@/services/firebaseService';

interface MealPlanState {
  mealPlan: MealPlan;
  weeklyUsedRecipeIds: Set<string>;
  alternativeRecipes: Record<string, Record<string, Recipe[]>>;
  isLoadingAlternatives: boolean;
  lastGenerationError: string | null;
  generationSuggestions: string[];
  addMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner', meal: MealItem) => void;
  removeMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => void;
  clearDay: (date: string) => void;
  generateMealPlan: (date: string, recipes: Recipe[], specificMealType?: 'breakfast' | 'lunch' | 'dinner') => Promise<GenerationResult>;
  generateAllMealsForDay: (date: string, recipes: Recipe[]) => Promise<GenerationResult>;
  generateWeeklyMealPlan: (startDate: string, endDate: string) => Promise<GenerationResult>;
  isRecipeSuitable: (recipe: Recipe, dietType?: DietType, allergies?: string[], excludedIngredients?: string[]) => boolean;
  getUsedRecipeIds: () => Set<string>;
  getWeeklyUsedRecipeIds: () => Set<string>;
  updateWeeklyUsedRecipeIds: (startDate: string, endDate: string) => void;
  validateDailyMealPlan: (dailyMeals: DailyMeals, calorieGoal: number) => { 
    isValid: boolean; 
    issues: string[]; 
    totalCalories: number;
    calorieDeviation: number;
  };
  isRecipeUsedInMealPlan: (recipeId: string) => boolean;
  swapMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner', newRecipeId: string) => Promise<boolean>;
  getAlternativeRecipes: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner', currentRecipeId: string) => Promise<Recipe[]>;
  clearAlternativeRecipes: () => void;
  clearGenerationError: () => void;
}

// Helper function to get user profile without causing circular dependencies
const getUserProfile = () => {
  try {
    // Import dynamically to avoid circular dependencies
    const { useUserStore } = require('@/store/userStore');
    return useUserStore.getState().profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      dietType: 'any',
      allergies: [],
      excludedIngredients: [],
      calorieGoal: 2000,
      fitnessGoals: []
    };
  }
};

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      mealPlan: mockMealPlan,
      weeklyUsedRecipeIds: new Set<string>(),
      alternativeRecipes: {},
      isLoadingAlternatives: false,
      lastGenerationError: null,
      generationSuggestions: [],
      
      addMeal: (date, mealType, meal) => {
        // Check if the recipe is already used in the meal plan
        if (meal.recipeId && get().isRecipeUsedInMealPlan(meal.recipeId)) {
          console.warn(`Recipe ${meal.recipeId} is already used in the meal plan`);
          return;
        }
        
        set((state) => {
          const dayPlan = state.mealPlan[date] || {};
          
          // Create a new object to avoid TypeScript errors with dynamic keys
          const updatedDayPlan: DailyMeals = { ...dayPlan };
          
          // Handle standard meal types
          if (mealType === 'breakfast' || mealType === 'lunch' || mealType === 'dinner') {
            updatedDayPlan[mealType] = meal;
          }
          
          // Update weekly used recipe IDs if this is a new recipe
          if (meal.recipeId) {
            state.weeklyUsedRecipeIds.add(meal.recipeId);
          }
          
          return {
            mealPlan: {
              ...state.mealPlan,
              [date]: updatedDayPlan,
            },
            weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds),
            // Clear any previous generation errors when adding a meal
            lastGenerationError: null,
            generationSuggestions: []
          };
        });
      },
      
      removeMeal: (date, mealType) => {
        set((state) => {
          const dayPlan = state.mealPlan[date];
          if (!dayPlan) return state;
          
          const updatedDayPlan: DailyMeals = { ...dayPlan };
          
          // Remove the recipe ID from weekly used IDs if it's being removed
          const mealToRemove = updatedDayPlan[mealType];
          if (mealToRemove?.recipeId) {
            // Check if this recipe is used elsewhere in the meal plan before removing from weeklyUsedRecipeIds
            let isUsedElsewhere = false;
            Object.entries(state.mealPlan).forEach(([d, meals]) => {
              if (d !== date) {
                if (meals.breakfast?.recipeId === mealToRemove.recipeId ||
                    meals.lunch?.recipeId === mealToRemove.recipeId ||
                    meals.dinner?.recipeId === mealToRemove.recipeId) {
                  isUsedElsewhere = true;
                }
              }
            });
            
            // Only remove from weeklyUsedRecipeIds if not used elsewhere
            if (!isUsedElsewhere) {
              state.weeklyUsedRecipeIds.delete(mealToRemove.recipeId);
            }
          }
          
          if (mealType === 'breakfast' || mealType === 'lunch' || mealType === 'dinner') {
            delete updatedDayPlan[mealType];
          }
          
          return {
            mealPlan: {
              ...state.mealPlan,
              [date]: updatedDayPlan,
            },
            weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds)
          };
        });
      },
      
      clearDay: (date) => {
        set((state) => {
          const dayPlan = state.mealPlan[date];
          if (!dayPlan) return state;
          
          // Remove recipe IDs from weekly used IDs if they're being cleared
          if (dayPlan.breakfast?.recipeId) {
            // Check if this recipe is used elsewhere in the meal plan before removing
            let isBreakfastUsedElsewhere = false;
            Object.entries(state.mealPlan).forEach(([d, meals]) => {
              if (d !== date) {
                if (meals.breakfast?.recipeId === dayPlan.breakfast?.recipeId ||
                    meals.lunch?.recipeId === dayPlan.breakfast?.recipeId ||
                    meals.dinner?.recipeId === dayPlan.breakfast?.recipeId) {
                  isBreakfastUsedElsewhere = true;
                }
              }
            });
            
            if (!isBreakfastUsedElsewhere) {
              state.weeklyUsedRecipeIds.delete(dayPlan.breakfast.recipeId);
            }
          }
          
          if (dayPlan.lunch?.recipeId) {
            // Check if this recipe is used elsewhere in the meal plan before removing
            let isLunchUsedElsewhere = false;
            Object.entries(state.mealPlan).forEach(([d, meals]) => {
              if (d !== date) {
                if (meals.breakfast?.recipeId === dayPlan.lunch?.recipeId ||
                    meals.lunch?.recipeId === dayPlan.lunch?.recipeId ||
                    meals.dinner?.recipeId === dayPlan.lunch?.recipeId) {
                  isLunchUsedElsewhere = true;
                }
              }
            });
            
            if (!isLunchUsedElsewhere) {
              state.weeklyUsedRecipeIds.delete(dayPlan.lunch.recipeId);
            }
          }
          
          if (dayPlan.dinner?.recipeId) {
            // Check if this recipe is used elsewhere in the meal plan before removing
            let isDinnerUsedElsewhere = false;
            Object.entries(state.mealPlan).forEach(([d, meals]) => {
              if (d !== date) {
                if (meals.breakfast?.recipeId === dayPlan.dinner?.recipeId ||
                    meals.lunch?.recipeId === dayPlan.dinner?.recipeId ||
                    meals.dinner?.recipeId === dayPlan.dinner?.recipeId) {
                  isDinnerUsedElsewhere = true;
                }
              }
            });
            
            if (!isDinnerUsedElsewhere) {
              state.weeklyUsedRecipeIds.delete(dayPlan.dinner.recipeId);
            }
          }
          
          const { [date]: _, ...restOfMealPlan } = state.mealPlan;
          return {
            mealPlan: restOfMealPlan,
            weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds)
          };
        });
      },
      
      getUsedRecipeIds: () => {
        const state = get();
        const usedRecipeIds = new Set<string>();
        
        // Iterate through all days in the meal plan
        Object.values(state.mealPlan).forEach(dayPlan => {
          // Check main meals (breakfast, lunch, dinner)
          if (dayPlan.breakfast?.recipeId) usedRecipeIds.add(dayPlan.breakfast.recipeId);
          if (dayPlan.lunch?.recipeId) usedRecipeIds.add(dayPlan.lunch.recipeId);
          if (dayPlan.dinner?.recipeId) usedRecipeIds.add(dayPlan.dinner.recipeId);
        });
        
        return usedRecipeIds;
      },
      
      getWeeklyUsedRecipeIds: () => {
        return get().weeklyUsedRecipeIds;
      },
      
      updateWeeklyUsedRecipeIds: (startDate, endDate) => {
        const state = get();
        const weeklyUsedRecipeIds = new Set<string>();
        
        // Iterate through all days in the meal plan within the date range
        Object.entries(state.mealPlan).forEach(([date, dayPlan]) => {
          if (date >= startDate && date <= endDate) {
            // Check main meals (breakfast, lunch, dinner)
            if (dayPlan.breakfast?.recipeId) weeklyUsedRecipeIds.add(dayPlan.breakfast.recipeId);
            if (dayPlan.lunch?.recipeId) weeklyUsedRecipeIds.add(dayPlan.lunch.recipeId);
            if (dayPlan.dinner?.recipeId) weeklyUsedRecipeIds.add(dayPlan.dinner.recipeId);
          }
        });
        
        set({ weeklyUsedRecipeIds });
      },
      
      isRecipeUsedInMealPlan: (recipeId: string) => {
        const usedRecipeIds = get().getUsedRecipeIds();
        return usedRecipeIds.has(recipeId);
      },
      
      validateDailyMealPlan: (dailyMeals, calorieGoal) => {
        const issues: string[] = [];
        let totalCalories = 0;
        
        // Check if all required meals are present
        if (!dailyMeals.breakfast) {
          issues.push("Missing breakfast");
        } else if (dailyMeals.breakfast.calories === undefined || dailyMeals.breakfast.calories === null) {
          issues.push("Breakfast is missing calorie data");
        } else {
          totalCalories += dailyMeals.breakfast.calories;
        }
        
        if (!dailyMeals.lunch) {
          issues.push("Missing lunch");
        } else if (dailyMeals.lunch.calories === undefined || dailyMeals.lunch.calories === null) {
          issues.push("Lunch is missing calorie data");
        } else {
          totalCalories += dailyMeals.lunch.calories;
        }
        
        if (!dailyMeals.dinner) {
          issues.push("Missing dinner");
        } else if (dailyMeals.dinner.calories === undefined || dailyMeals.dinner.calories === null) {
          issues.push("Dinner is missing calorie data");
        } else {
          totalCalories += dailyMeals.dinner.calories;
        }
        
        // Calculate deviation from calorie goal
        const calorieDeviation = ((totalCalories - calorieGoal) / calorieGoal) * 100;
        
        // Check if total calories are within ±10% of goal
        if (Math.abs(calorieDeviation) > 10) {
          issues.push(`Total calories (${totalCalories}) deviate by ${calorieDeviation.toFixed(1)}% from goal (${calorieGoal})`);
        }
        
        return {
          isValid: issues.length === 0,
          issues,
          totalCalories,
          calorieDeviation
        };
      },
      
      isRecipeSuitable: (recipe, dietType = 'any', allergies = [], excludedIngredients = []) => {
        // Validate recipe has required nutrition data
        if (recipe.calories === undefined || recipe.calories === null) {
          console.warn(`Recipe "${recipe.name}" (${recipe.id}) is missing calorie data`);
          return false;
        }
        
        // Check if recipe matches diet type
        if (dietType !== 'any') {
          const dietTags: Record<DietType, string[]> = {
            'any': [],
            'vegetarian': ['vegetarian'],
            'vegan': ['vegan'],
            'pescatarian': ['pescatarian'],
            'keto': ['keto', 'low-carb'],
            'paleo': ['paleo'],
            'gluten-free': ['gluten-free'],
            'dairy-free': ['dairy-free'],
            'low-carb': ['low-carb']
          };
          
          const requiredTags = dietTags[dietType];
          // Check if there are required tags for this diet type
          if (requiredTags.length > 0) {
            const hasMatchingTag = requiredTags.some(tag => 
              recipe.tags.some(recipeTag => 
                recipeTag.toLowerCase() === tag.toLowerCase()
              )
            );
            
            if (!hasMatchingTag) {
              return false;
            }
          }
        }
        
        // Check for allergies and excluded ingredients
        const hasExclusions = allergies.length > 0 || excludedIngredients.length > 0;
        if (hasExclusions) {
          const combinedExclusions = [...allergies, ...excludedIngredients];
          
          // Check if any ingredient contains an excluded term
          for (const ingredient of recipe.ingredients) {
            const lowerIngredient = ingredient.toLowerCase();
            for (const exclusion of combinedExclusions) {
              if (lowerIngredient.includes(exclusion.toLowerCase())) {
                return false;
              }
            }
          }
        }
        
        return true;
      },
      
      swapMeal: async (date, mealType, newRecipeId) => {
        try {
          // Get the current meal plan for the day
          const dayPlan = get().mealPlan[date] || {};
          
          // Get the current meal
          const currentMeal = dayPlan[mealType];
          
          // If there's no current meal, we can't swap
          if (!currentMeal) {
            console.warn(`No ${mealType} found for ${date} to swap`);
            return false;
          }
          
          // Get the current recipe ID
          const currentRecipeId = currentMeal.recipeId;
          
          // If there's no current recipe ID, we can't swap
          if (!currentRecipeId) {
            console.warn(`No recipe ID found for ${mealType} on ${date}`);
            return false;
          }
          
          // Check if the new recipe ID is already used in the meal plan
          if (get().isRecipeUsedInMealPlan(newRecipeId)) {
            console.warn(`Recipe ${newRecipeId} is already used in the meal plan`);
            return false;
          }
          
          // Get the new recipe details
          const newRecipe = await firebaseService.getRecipeFromFirestore(newRecipeId);
          
          // If we couldn't get the new recipe, we can't swap
          if (!newRecipe) {
            console.warn(`Could not find recipe with ID ${newRecipeId}`);
            set({
              lastGenerationError: "Could not find the selected recipe. It may have been deleted or is temporarily unavailable.",
              generationSuggestions: ["Try selecting a different recipe", "Refresh the app and try again"]
            });
            return false;
          }
          
          // Create the new meal item
          const newMeal: MealItem = {
            recipeId: newRecipe.id,
            name: newRecipe.name,
            calories: newRecipe.calories,
            protein: newRecipe.protein,
            carbs: newRecipe.carbs,
            fat: newRecipe.fat,
            fiber: newRecipe.fiber
          };
          
          // Update the meal plan
          set((state) => {
            const updatedDayPlan = { ...(state.mealPlan[date] || {}) };
            updatedDayPlan[mealType] = newMeal;
            
            // Remove the old recipe ID from weekly used IDs if it's not used elsewhere
            let isOldRecipeUsedElsewhere = false;
            Object.entries(state.mealPlan).forEach(([d, meals]) => {
              if (d !== date) {
                if (meals.breakfast?.recipeId === currentRecipeId ||
                    meals.lunch?.recipeId === currentRecipeId ||
                    meals.dinner?.recipeId === currentRecipeId) {
                  isOldRecipeUsedElsewhere = true;
                }
              } else {
                // Check other meal types on the same day
                if (mealType !== 'breakfast' && meals.breakfast?.recipeId === currentRecipeId) {
                  isOldRecipeUsedElsewhere = true;
                }
                if (mealType !== 'lunch' && meals.lunch?.recipeId === currentRecipeId) {
                  isOldRecipeUsedElsewhere = true;
                }
                if (mealType !== 'dinner' && meals.dinner?.recipeId === currentRecipeId) {
                  isOldRecipeUsedElsewhere = true;
                }
              }
            });
            
            if (!isOldRecipeUsedElsewhere) {
              state.weeklyUsedRecipeIds.delete(currentRecipeId);
            }
            
            // Add the new recipe ID to weekly used IDs
            state.weeklyUsedRecipeIds.add(newRecipeId);
            
            return {
              mealPlan: {
                ...state.mealPlan,
                [date]: updatedDayPlan
              },
              weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds),
              lastGenerationError: null,
              generationSuggestions: []
            };
          });
          
          return true;
        } catch (error) {
          console.error('Error swapping meal:', error);
          set({
            lastGenerationError: "Failed to swap meal. There was an error processing your request.",
            generationSuggestions: ["Check your internet connection", "Try again later"]
          });
          return false;
        }
      },
      
      getAlternativeRecipes: async (date, mealType, currentRecipeId) => {
        try {
          // Check if we already have alternatives for this meal
          const existingAlternatives = get().alternativeRecipes[date]?.[mealType];
          if (existingAlternatives && existingAlternatives.length > 0) {
            return existingAlternatives;
          }
          
          // Set loading state
          set({ isLoadingAlternatives: true });
          
          // Get user profile for personalization
          const userProfile = getUserProfile();
          const { 
            dietType = 'any', 
            allergies = [], 
            excludedIngredients = [],
            calorieGoal = 2000,
            fitnessGoals = []
          } = userProfile;
          
          // Define meal split percentages for calorie distribution
          const mealSplit = {
            breakfast: 0.3, // 30% of daily calories
            lunch: 0.35,    // 35% of daily calories
            dinner: 0.35,   // 35% of daily calories
          };
          
          // Calculate target calories per meal
          const targetCalories = Math.round(calorieGoal * mealSplit[mealType]);
          
          // Get already used recipe IDs to avoid duplicates
          const weeklyUsedRecipeIds = Array.from(get().weeklyUsedRecipeIds);
          
          // Get alternative recipes
          const alternatives = await firebaseService.getAlternativeRecipes(
            mealType,
            currentRecipeId,
            {
              dietType,
              allergies,
              excludedIngredients,
              fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
              calorieRange: { min: targetCalories * 0.8, max: targetCalories * 1.2 },
              excludeIds: weeklyUsedRecipeIds
            },
            10 // Get up to 10 alternatives
          );
          
          // If no alternatives found, set error message
          if (alternatives.length === 0) {
            set({
              alternativeRecipes: {},
              isLoadingAlternatives: false,
              lastGenerationError: "No alternative recipes found that match your dietary preferences.",
              generationSuggestions: [
                "Try adjusting your dietary preferences",
                "Add more recipes to your collection",
                "Try a different meal type"
              ]
            });
            return [];
          }
          
          // Store the alternatives in the state
          set((state) => {
            const updatedAlternatives = { ...state.alternativeRecipes };
            
            if (!updatedAlternatives[date]) {
              updatedAlternatives[date] = {};
            }
            
            updatedAlternatives[date][mealType] = alternatives;
            
            return {
              alternativeRecipes: updatedAlternatives,
              isLoadingAlternatives: false,
              lastGenerationError: null,
              generationSuggestions: []
            };
          });
          
          return alternatives;
        } catch (error) {
          console.error('Error getting alternative recipes:', error);
          set({ 
            isLoadingAlternatives: false,
            lastGenerationError: "Failed to load alternative recipes. There was an error processing your request.",
            generationSuggestions: [
              "Check your internet connection",
              "Try again later",
              "Try a different meal type"
            ]
          });
          return [];
        }
      },
      
      clearAlternativeRecipes: () => {
        set({ alternativeRecipes: {} });
      },
      
      clearGenerationError: () => {
        set({ 
          lastGenerationError: null,
          generationSuggestions: []
        });
      },
      
      generateMealPlan: async (date, recipes, specificMealType) => {
        // Get user profile for personalization
        const userProfile = getUserProfile();
        const { 
          dietType = 'any', 
          allergies = [], 
          excludedIngredients = [],
          calorieGoal = 2000,
          fitnessGoals = []
        } = userProfile;
        
        // Define meal split percentages for calorie distribution
        const mealSplit = {
          breakfast: 0.3, // 30% of daily calories
          lunch: 0.35,    // 35% of daily calories
          dinner: 0.35,   // 35% of daily calories
        };
        
        // Calculate target calories per meal
        const breakfastCalories = Math.round(calorieGoal * mealSplit.breakfast);
        const lunchCalories = Math.round(calorieGoal * mealSplit.lunch);
        const dinnerCalories = Math.round(calorieGoal * mealSplit.dinner);
        
        // Get the current day plan
        const currentDayPlan = get().mealPlan[date] || {};
        
        // Get already used recipe IDs to avoid duplicates
        const weeklyUsedRecipeIds = Array.from(get().weeklyUsedRecipeIds);
        
        // Generate meals for each type with target calories
        // Only generate meals that don't already exist or if specifically requested
        let breakfast = currentDayPlan.breakfast;
        let lunch = currentDayPlan.lunch;
        let dinner = currentDayPlan.dinner;
        
        // Track generation results
        const result: GenerationResult = {
          success: true,
          generatedMeals: [],
          error: null,
          suggestions: []
        };
        
        try {
          // If a specific meal type is provided, only generate that meal
          if (specificMealType) {
            // Generate only the specified meal type
            if (specificMealType === 'breakfast') {
              // Use Firestore to get suitable breakfast recipes
              const breakfastRecipes = await firebaseService.getRecipesForMealPlan('breakfast', {
                dietType,
                allergies,
                excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: breakfastCalories * 0.8, max: breakfastCalories * 1.2 },
                excludeIds: weeklyUsedRecipeIds
              }, 5);
              
              if (breakfastRecipes.length > 0) {
                const breakfastRecipe = breakfastRecipes[0];
                breakfast = {
                  recipeId: breakfastRecipe.id,
                  name: breakfastRecipe.name,
                  calories: breakfastRecipe.calories,
                  protein: breakfastRecipe.protein,
                  carbs: breakfastRecipe.carbs,
                  fat: breakfastRecipe.fat,
                  fiber: breakfastRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(breakfastRecipe.id);
                result.generatedMeals.push('breakfast');
              } else {
                // Fallback to local recipes if no suitable recipes found in Firestore
                const filteredRecipes = recipes.filter(recipe => 
                  recipe.mealType === 'breakfast' && 
                  get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                  !weeklyUsedRecipeIds.includes(recipe.id)
                );
                
                if (filteredRecipes.length > 0) {
                  // Sort by how close they are to the target calories
                  filteredRecipes.sort((a, b) => {
                    return Math.abs(a.calories - breakfastCalories) - Math.abs(b.calories - breakfastCalories);
                  });
                  
                  const breakfastRecipe = filteredRecipes[0];
                  breakfast = {
                    recipeId: breakfastRecipe.id,
                    name: breakfastRecipe.name,
                    calories: breakfastRecipe.calories,
                    protein: breakfastRecipe.protein,
                    carbs: breakfastRecipe.carbs,
                    fat: breakfastRecipe.fat,
                    fiber: breakfastRecipe.fiber
                  };
                  
                  // Add to weekly used recipe IDs
                  get().weeklyUsedRecipeIds.add(breakfastRecipe.id);
                  result.generatedMeals.push('breakfast');
                } else {
                  // No suitable recipes found
                  result.success = false;
                  result.error = "No suitable breakfast recipes found that match your dietary preferences.";
                  result.suggestions = [
                    "Try adjusting your dietary preferences",
                    "Add more breakfast recipes to your collection",
                    "Try a different meal type"
                  ];
                  
                  // Set error state
                  set({
                    lastGenerationError: result.error,
                    generationSuggestions: result.suggestions
                  });
                }
              }
            } else if (specificMealType === 'lunch') {
              // Use Firestore to get suitable lunch recipes
              const lunchRecipes = await firebaseService.getRecipesForMealPlan('lunch', {
                dietType,
                allergies,
                excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: lunchCalories * 0.8, max: lunchCalories * 1.2 },
                excludeIds: weeklyUsedRecipeIds
              }, 5);
              
              if (lunchRecipes.length > 0) {
                const lunchRecipe = lunchRecipes[0];
                lunch = {
                  recipeId: lunchRecipe.id,
                  name: lunchRecipe.name,
                  calories: lunchRecipe.calories,
                  protein: lunchRecipe.protein,
                  carbs: lunchRecipe.carbs,
                  fat: lunchRecipe.fat,
                  fiber: lunchRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(lunchRecipe.id);
                result.generatedMeals.push('lunch');
              } else {
                // Fallback to local recipes if no suitable recipes found in Firestore
                const filteredRecipes = recipes.filter(recipe => 
                  recipe.mealType === 'lunch' && 
                  get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                  !weeklyUsedRecipeIds.includes(recipe.id)
                );
                
                if (filteredRecipes.length > 0) {
                  // Sort by how close they are to the target calories
                  filteredRecipes.sort((a, b) => {
                    return Math.abs(a.calories - lunchCalories) - Math.abs(b.calories - lunchCalories);
                  });
                  
                  const lunchRecipe = filteredRecipes[0];
                  lunch = {
                    recipeId: lunchRecipe.id,
                    name: lunchRecipe.name,
                    calories: lunchRecipe.calories,
                    protein: lunchRecipe.protein,
                    carbs: lunchRecipe.carbs,
                    fat: lunchRecipe.fat,
                    fiber: lunchRecipe.fiber
                  };
                  
                  // Add to weekly used recipe IDs
                  get().weeklyUsedRecipeIds.add(lunchRecipe.id);
                  result.generatedMeals.push('lunch');
                } else {
                  // No suitable recipes found
                  result.success = false;
                  result.error = "No suitable lunch recipes found that match your dietary preferences.";
                  result.suggestions = [
                    "Try adjusting your dietary preferences",
                    "Add more lunch recipes to your collection",
                    "Try a different meal type"
                  ];
                  
                  // Set error state
                  set({
                    lastGenerationError: result.error,
                    generationSuggestions: result.suggestions
                  });
                }
              }
            } else if (specificMealType === 'dinner') {
              // Use Firestore to get suitable dinner recipes
              const dinnerRecipes = await firebaseService.getRecipesForMealPlan('dinner', {
                dietType,
                allergies,
                excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: dinnerCalories * 0.8, max: dinnerCalories * 1.2 },
                excludeIds: weeklyUsedRecipeIds
              }, 5);
              
              if (dinnerRecipes.length > 0) {
                const dinnerRecipe = dinnerRecipes[0];
                dinner = {
                  recipeId: dinnerRecipe.id,
                  name: dinnerRecipe.name,
                  calories: dinnerRecipe.calories,
                  protein: dinnerRecipe.protein,
                  carbs: dinnerRecipe.carbs,
                  fat: dinnerRecipe.fat,
                  fiber: dinnerRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(dinnerRecipe.id);
                result.generatedMeals.push('dinner');
              } else {
                // Fallback to local recipes if no suitable recipes found in Firestore
                const filteredRecipes = recipes.filter(recipe => 
                  recipe.mealType === 'dinner' && 
                  get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                  !weeklyUsedRecipeIds.includes(recipe.id)
                );
                
                if (filteredRecipes.length > 0) {
                  // Sort by how close they are to the target calories
                  filteredRecipes.sort((a, b) => {
                    return Math.abs(a.calories - dinnerCalories) - Math.abs(b.calories - dinnerCalories);
                  });
                  
                  const dinnerRecipe = filteredRecipes[0];
                  dinner = {
                    recipeId: dinnerRecipe.id,
                    name: dinnerRecipe.name,
                    calories: dinnerRecipe.calories,
                    protein: dinnerRecipe.protein,
                    carbs: dinnerRecipe.carbs,
                    fat: dinnerRecipe.fat,
                    fiber: dinnerRecipe.fiber
                  };
                  
                  // Add to weekly used recipe IDs
                  get().weeklyUsedRecipeIds.add(dinnerRecipe.id);
                  result.generatedMeals.push('dinner');
                } else {
                  // No suitable recipes found
                  result.success = false;
                  result.error = "No suitable dinner recipes found that match your dietary preferences.";
                  result.suggestions = [
                    "Try adjusting your dietary preferences",
                    "Add more dinner recipes to your collection",
                    "Try a different meal type"
                  ];
                  
                  // Set error state
                  set({
                    lastGenerationError: result.error,
                    generationSuggestions: result.suggestions
                  });
                }
              }
            }
          } else {
            // Generate all missing meals
            if (!breakfast) {
              // Use Firestore to get suitable breakfast recipes
              const breakfastRecipes = await firebaseService.getRecipesForMealPlan('breakfast', {
                dietType,
                allergies,
                excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: breakfastCalories * 0.8, max: breakfastCalories * 1.2 },
                excludeIds: weeklyUsedRecipeIds
              }, 5);
              
              if (breakfastRecipes.length > 0) {
                const breakfastRecipe = breakfastRecipes[0];
                breakfast = {
                  recipeId: breakfastRecipe.id,
                  name: breakfastRecipe.name,
                  calories: breakfastRecipe.calories,
                  protein: breakfastRecipe.protein,
                  carbs: breakfastRecipe.carbs,
                  fat: breakfastRecipe.fat,
                  fiber: breakfastRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(breakfastRecipe.id);
                result.generatedMeals.push('breakfast');
              } else {
                // Fallback to local recipes if no suitable recipes found in Firestore
                const filteredRecipes = recipes.filter(recipe => 
                  recipe.mealType === 'breakfast' && 
                  get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                  !weeklyUsedRecipeIds.includes(recipe.id)
                );
                
                if (filteredRecipes.length > 0) {
                  // Sort by how close they are to the target calories
                  filteredRecipes.sort((a, b) => {
                    return Math.abs(a.calories - breakfastCalories) - Math.abs(b.calories - breakfastCalories);
                  });
                  
                  const breakfastRecipe = filteredRecipes[0];
                  breakfast = {
                    recipeId: breakfastRecipe.id,
                    name: breakfastRecipe.name,
                    calories: breakfastRecipe.calories,
                    protein: breakfastRecipe.protein,
                    carbs: breakfastRecipe.carbs,
                    fat: breakfastRecipe.fat,
                    fiber: breakfastRecipe.fiber
                  };
                  
                  // Add to weekly used recipe IDs
                  get().weeklyUsedRecipeIds.add(breakfastRecipe.id);
                  result.generatedMeals.push('breakfast');
                } else {
                  // No suitable breakfast recipes found, but continue with other meals
                  result.suggestions.push("No suitable breakfast recipes found. Try adding more breakfast recipes or adjusting your dietary preferences.");
                }
              }
            }
            
            if (!lunch) {
              // Use Firestore to get suitable lunch recipes
              const lunchRecipes = await firebaseService.getRecipesForMealPlan('lunch', {
                dietType,
                allergies,
                excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: lunchCalories * 0.8, max: lunchCalories * 1.2 },
                excludeIds: Array.from(get().weeklyUsedRecipeIds) // Get updated list
              }, 5);
              
              if (lunchRecipes.length > 0) {
                const lunchRecipe = lunchRecipes[0];
                lunch = {
                  recipeId: lunchRecipe.id,
                  name: lunchRecipe.name,
                  calories: lunchRecipe.calories,
                  protein: lunchRecipe.protein,
                  carbs: lunchRecipe.carbs,
                  fat: lunchRecipe.fat,
                  fiber: lunchRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(lunchRecipe.id);
                result.generatedMeals.push('lunch');
              } else {
                // Fallback to local recipes if no suitable recipes found in Firestore
                const filteredRecipes = recipes.filter(recipe => 
                  recipe.mealType === 'lunch' && 
                  get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                  !Array.from(get().weeklyUsedRecipeIds).includes(recipe.id)
                );
                
                if (filteredRecipes.length > 0) {
                  // Sort by how close they are to the target calories
                  filteredRecipes.sort((a, b) => {
                    return Math.abs(a.calories - lunchCalories) - Math.abs(b.calories - lunchCalories);
                  });
                  
                  const lunchRecipe = filteredRecipes[0];
                  lunch = {
                    recipeId: lunchRecipe.id,
                    name: lunchRecipe.name,
                    calories: lunchRecipe.calories,
                    protein: lunchRecipe.protein,
                    carbs: lunchRecipe.carbs,
                    fat: lunchRecipe.fat,
                    fiber: lunchRecipe.fiber
                  };
                  
                  // Add to weekly used recipe IDs
                  get().weeklyUsedRecipeIds.add(lunchRecipe.id);
                  result.generatedMeals.push('lunch');
                } else {
                  // No suitable lunch recipes found, but continue with other meals
                  result.suggestions.push("No suitable lunch recipes found. Try adding more lunch recipes or adjusting your dietary preferences.");
                }
              }
            }
            
            if (!dinner) {
              // Use Firestore to get suitable dinner recipes
              const dinnerRecipes = await firebaseService.getRecipesForMealPlan('dinner', {
                dietType,
                allergies,
                excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: dinnerCalories * 0.8, max: dinnerCalories * 1.2 },
                excludeIds: Array.from(get().weeklyUsedRecipeIds) // Get updated list
              }, 5);
              
              if (dinnerRecipes.length > 0) {
                const dinnerRecipe = dinnerRecipes[0];
                dinner = {
                  recipeId: dinnerRecipe.id,
                  name: dinnerRecipe.name,
                  calories: dinnerRecipe.calories,
                  protein: dinnerRecipe.protein,
                  carbs: dinnerRecipe.carbs,
                  fat: dinnerRecipe.fat,
                  fiber: dinnerRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(dinnerRecipe.id);
                result.generatedMeals.push('dinner');
              } else {
                // Fallback to local recipes if no suitable recipes found in Firestore
                const filteredRecipes = recipes.filter(recipe => 
                  recipe.mealType === 'dinner' && 
                  get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                  !Array.from(get().weeklyUsedRecipeIds).includes(recipe.id)
                );
                
                if (filteredRecipes.length > 0) {
                  // Sort by how close they are to the target calories
                  filteredRecipes.sort((a, b) => {
                    return Math.abs(a.calories - dinnerCalories) - Math.abs(b.calories - dinnerCalories);
                  });
                  
                  const dinnerRecipe = filteredRecipes[0];
                  dinner = {
                    recipeId: dinnerRecipe.id,
                    name: dinnerRecipe.name,
                    calories: dinnerRecipe.calories,
                    protein: dinnerRecipe.protein,
                    carbs: dinnerRecipe.carbs,
                    fat: dinnerRecipe.fat,
                    fiber: dinnerRecipe.fiber
                  };
                  
                  // Add to weekly used recipe IDs
                  get().weeklyUsedRecipeIds.add(dinnerRecipe.id);
                  result.generatedMeals.push('dinner');
                } else {
                  // No suitable dinner recipes found, but continue with other meals
                  result.suggestions.push("No suitable dinner recipes found. Try adding more dinner recipes or adjusting your dietary preferences.");
                }
              }
            }
            
            // Check if we generated any meals
            if (result.generatedMeals.length === 0) {
              result.success = false;
              result.error = "Could not generate any meals that match your dietary preferences.";
              result.suggestions = [
                "Try adjusting your dietary preferences",
                "Add more recipes to your collection",
                "Try generating individual meals instead"
              ];
              
              // Set error state
              set({
                lastGenerationError: result.error,
                generationSuggestions: result.suggestions
              });
              
              return result;
            }
          }
        } catch (error) {
          console.error('Error fetching recipes from Firestore:', error);
          
          // Set error state
          result.success = false;
          result.error = "Failed to generate meal plan. There was an error processing your request.";
          result.suggestions = [
            "Check your internet connection",
            "Try again later",
            "Try generating individual meals instead"
          ];
          
          set({
            lastGenerationError: result.error,
            generationSuggestions: result.suggestions
          });
          
          // Fallback to local recipes if Firestore fails
          if (specificMealType) {
            // Generate only the specified meal type
            if (specificMealType === 'breakfast' && !breakfast) {
              const filteredRecipes = recipes.filter(recipe => 
                recipe.mealType === 'breakfast' && 
                get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                !weeklyUsedRecipeIds.includes(recipe.id)
              );
              
              if (filteredRecipes.length > 0) {
                // Sort by how close they are to the target calories
                filteredRecipes.sort((a, b) => {
                  return Math.abs(a.calories - breakfastCalories) - Math.abs(b.calories - breakfastCalories);
                });
                
                const breakfastRecipe = filteredRecipes[0];
                breakfast = {
                  recipeId: breakfastRecipe.id,
                  name: breakfastRecipe.name,
                  calories: breakfastRecipe.calories,
                  protein: breakfastRecipe.protein,
                  carbs: breakfastRecipe.carbs,
                  fat: breakfastRecipe.fat,
                  fiber: breakfastRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(breakfastRecipe.id);
                result.generatedMeals.push('breakfast');
                result.success = true;
                result.error = null;
                result.suggestions = ["Using local recipes due to connection issues"];
                
                // Update error state
                set({
                  lastGenerationError: null,
                  generationSuggestions: result.suggestions
                });
              }
            } else if (specificMealType === 'lunch' && !lunch) {
              const filteredRecipes = recipes.filter(recipe => 
                recipe.mealType === 'lunch' && 
                get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                !weeklyUsedRecipeIds.includes(recipe.id)
              );
              
              if (filteredRecipes.length > 0) {
                // Sort by how close they are to the target calories
                filteredRecipes.sort((a, b) => {
                  return Math.abs(a.calories - lunchCalories) - Math.abs(b.calories - lunchCalories);
                });
                
                const lunchRecipe = filteredRecipes[0];
                lunch = {
                  recipeId: lunchRecipe.id,
                  name: lunchRecipe.name,
                  calories: lunchRecipe.calories,
                  protein: lunchRecipe.protein,
                  carbs: lunchRecipe.carbs,
                  fat: lunchRecipe.fat,
                  fiber: lunchRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(lunchRecipe.id);
                result.generatedMeals.push('lunch');
                result.success = true;
                result.error = null;
                result.suggestions = ["Using local recipes due to connection issues"];
                
                // Update error state
                set({
                  lastGenerationError: null,
                  generationSuggestions: result.suggestions
                });
              }
            } else if (specificMealType === 'dinner' && !dinner) {
              const filteredRecipes = recipes.filter(recipe => 
                recipe.mealType === 'dinner' && 
                get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                !weeklyUsedRecipeIds.includes(recipe.id)
              );
              
              if (filteredRecipes.length > 0) {
                // Sort by how close they are to the target calories
                filteredRecipes.sort((a, b) => {
                  return Math.abs(a.calories - dinnerCalories) - Math.abs(b.calories - dinnerCalories);
                });
                
                const dinnerRecipe = filteredRecipes[0];
                dinner = {
                  recipeId: dinnerRecipe.id,
                  name: dinnerRecipe.name,
                  calories: dinnerRecipe.calories,
                  protein: dinnerRecipe.protein,
                  carbs: dinnerRecipe.carbs,
                  fat: dinnerRecipe.fat,
                  fiber: dinnerRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(dinnerRecipe.id);
                result.generatedMeals.push('dinner');
                result.success = true;
                result.error = null;
                result.suggestions = ["Using local recipes due to connection issues"];
                
                // Update error state
                set({
                  lastGenerationError: null,
                  generationSuggestions: result.suggestions
                });
              }
            }
          } else {
            // Generate all missing meals
            let anyMealGenerated = false;
            
            if (!breakfast) {
              const filteredRecipes = recipes.filter(recipe => 
                recipe.mealType === 'breakfast' && 
                get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                !weeklyUsedRecipeIds.includes(recipe.id)
              );
              
              if (filteredRecipes.length > 0) {
                // Sort by how close they are to the target calories
                filteredRecipes.sort((a, b) => {
                  return Math.abs(a.calories - breakfastCalories) - Math.abs(b.calories - breakfastCalories);
                });
                
                const breakfastRecipe = filteredRecipes[0];
                breakfast = {
                  recipeId: breakfastRecipe.id,
                  name: breakfastRecipe.name,
                  calories: breakfastRecipe.calories,
                  protein: breakfastRecipe.protein,
                  carbs: breakfastRecipe.carbs,
                  fat: breakfastRecipe.fat,
                  fiber: breakfastRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(breakfastRecipe.id);
                result.generatedMeals.push('breakfast');
                anyMealGenerated = true;
              }
            }
            
            if (!lunch) {
              const filteredRecipes = recipes.filter(recipe => 
                recipe.mealType === 'lunch' && 
                get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                !Array.from(get().weeklyUsedRecipeIds).includes(recipe.id)
              );
              
              if (filteredRecipes.length > 0) {
                // Sort by how close they are to the target calories
                filteredRecipes.sort((a, b) => {
                  return Math.abs(a.calories - lunchCalories) - Math.abs(b.calories - lunchCalories);
                });
                
                const lunchRecipe = filteredRecipes[0];
                lunch = {
                  recipeId: lunchRecipe.id,
                  name: lunchRecipe.name,
                  calories: lunchRecipe.calories,
                  protein: lunchRecipe.protein,
                  carbs: lunchRecipe.carbs,
                  fat: lunchRecipe.fat,
                  fiber: lunchRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(lunchRecipe.id);
                result.generatedMeals.push('lunch');
                anyMealGenerated = true;
              }
            }
            
            if (!dinner) {
              const filteredRecipes = recipes.filter(recipe => 
                recipe.mealType === 'dinner' && 
                get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
                !Array.from(get().weeklyUsedRecipeIds).includes(recipe.id)
              );
              
              if (filteredRecipes.length > 0) {
                // Sort by how close they are to the target calories
                filteredRecipes.sort((a, b) => {
                  return Math.abs(a.calories - dinnerCalories) - Math.abs(b.calories - dinnerCalories);
                });
                
                const dinnerRecipe = filteredRecipes[0];
                dinner = {
                  recipeId: dinnerRecipe.id,
                  name: dinnerRecipe.name,
                  calories: dinnerRecipe.calories,
                  protein: dinnerRecipe.protein,
                  carbs: dinnerRecipe.carbs,
                  fat: dinnerRecipe.fat,
                  fiber: dinnerRecipe.fiber
                };
                
                // Add to weekly used recipe IDs
                get().weeklyUsedRecipeIds.add(dinnerRecipe.id);
                result.generatedMeals.push('dinner');
                anyMealGenerated = true;
              }
            }
            
            if (anyMealGenerated) {
              result.success = true;
              result.error = null;
              result.suggestions = ["Using local recipes due to connection issues"];
              
              // Update error state
              set({
                lastGenerationError: null,
                generationSuggestions: result.suggestions
              });
            }
          }
        }
        
        // Create the meal plan
        const newDayPlan: DailyMeals = {
          ...currentDayPlan
        };
        
        if (breakfast) {
          newDayPlan.breakfast = breakfast;
        }
        
        if (lunch) {
          newDayPlan.lunch = lunch;
        }
        
        if (dinner) {
          newDayPlan.dinner = dinner;
        }
        
        // Validate the generated meal plan if we're generating a full day
        if (!specificMealType) {
          const validation = get().validateDailyMealPlan(newDayPlan, calorieGoal);
          
          if (!validation.isValid) {
            console.warn(`Generated meal plan has issues: ${validation.issues.join(', ')}`);
            console.log(`Total calories: ${validation.totalCalories} (${validation.calorieDeviation.toFixed(1)}% deviation from goal ${calorieGoal})`);
            
            // Add validation issues to result suggestions
            if (Math.abs(validation.calorieDeviation) > 20) {
              result.suggestions.push(`The meal plan is ${validation.calorieDeviation > 0 ? 'over' : 'under'} your calorie goal by ${Math.abs(Math.round(validation.calorieDeviation))}%. Consider adjusting portion sizes.`);
            }
          } else {
            console.log(`Successfully generated meal plan with ${validation.totalCalories} calories (${validation.calorieDeviation.toFixed(1)}% deviation from goal ${calorieGoal})`);
          }
        }
        
        // Update the meal plan
        set((state) => ({
          mealPlan: {
            ...state.mealPlan,
            [date]: newDayPlan
          },
          weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds),
          lastGenerationError: result.error,
          generationSuggestions: result.suggestions
        }));
        
        return result;
      },
      
      generateAllMealsForDay: async (date, recipes) => {
        // Get user profile for personalization
        const userProfile = getUserProfile();
        const { 
          dietType = 'any', 
          allergies = [], 
          excludedIngredients = [],
          calorieGoal = 2000,
          fitnessGoals = []
        } = userProfile;
        
        // Define meal split percentages for calorie distribution
        const mealSplit = {
          breakfast: 0.3, // 30% of daily calories
          lunch: 0.35,    // 35% of daily calories
          dinner: 0.35,   // 35% of daily calories
        };
        
        // Calculate target calories per meal
        const breakfastCalories = Math.round(calorieGoal * mealSplit.breakfast);
        const lunchCalories = Math.round(calorieGoal * mealSplit.lunch);
        const dinnerCalories = Math.round(calorieGoal * mealSplit.dinner);
        
        // Get the current day plan
        const currentDayPlan = get().mealPlan[date] || {};
        
        // Get already used recipe IDs to avoid duplicates
        const weeklyUsedRecipeIds = Array.from(get().weeklyUsedRecipeIds);
        
        // Track generation results
        const result: GenerationResult = {
          success: true,
          generatedMeals: [],
          error: null,
          suggestions: []
        };
        
        try {
          // Clear existing meals for the day first
          if (currentDayPlan.breakfast || currentDayPlan.lunch || currentDayPlan.dinner) {
            get().clearDay(date);
          }
          
          let breakfast, lunch, dinner;
          
          // Generate breakfast
          const breakfastRecipes = await firebaseService.getRecipesForMealPlan('breakfast', {
            dietType,
            allergies,
            excludedIngredients,
            fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
            calorieRange: { min: breakfastCalories * 0.8, max: breakfastCalories * 1.2 },
            excludeIds: weeklyUsedRecipeIds
          }, 5);
          
          if (breakfastRecipes.length > 0) {
            const breakfastRecipe = breakfastRecipes[0];
            breakfast = {
              recipeId: breakfastRecipe.id,
              name: breakfastRecipe.name,
              calories: breakfastRecipe.calories,
              protein: breakfastRecipe.protein,
              carbs: breakfastRecipe.carbs,
              fat: breakfastRecipe.fat,
              fiber: breakfastRecipe.fiber
            };
            
            // Add to weekly used recipe IDs
            get().weeklyUsedRecipeIds.add(breakfastRecipe.id);
            result.generatedMeals.push('breakfast');
          } else {
            // Fallback to local recipes
            const filteredRecipes = recipes.filter(recipe => 
              recipe.mealType === 'breakfast' && 
              get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
              !weeklyUsedRecipeIds.includes(recipe.id)
            );
            
            if (filteredRecipes.length > 0) {
              filteredRecipes.sort((a, b) => {
                return Math.abs(a.calories - breakfastCalories) - Math.abs(b.calories - breakfastCalories);
              });
              
              const breakfastRecipe = filteredRecipes[0];
              breakfast = {
                recipeId: breakfastRecipe.id,
                name: breakfastRecipe.name,
                calories: breakfastRecipe.calories,
                protein: breakfastRecipe.protein,
                carbs: breakfastRecipe.carbs,
                fat: breakfastRecipe.fat,
                fiber: breakfastRecipe.fiber
              };
              
              get().weeklyUsedRecipeIds.add(breakfastRecipe.id);
              result.generatedMeals.push('breakfast');
            }
          }
          
          // Generate lunch
          const lunchRecipes = await firebaseService.getRecipesForMealPlan('lunch', {
            dietType,
            allergies,
            excludedIngredients,
            fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
            calorieRange: { min: lunchCalories * 0.8, max: lunchCalories * 1.2 },
            excludeIds: Array.from(get().weeklyUsedRecipeIds) // Get updated list
          }, 5);
          
          if (lunchRecipes.length > 0) {
            const lunchRecipe = lunchRecipes[0];
            lunch = {
              recipeId: lunchRecipe.id,
              name: lunchRecipe.name,
              calories: lunchRecipe.calories,
              protein: lunchRecipe.protein,
              carbs: lunchRecipe.carbs,
              fat: lunchRecipe.fat,
              fiber: lunchRecipe.fiber
            };
            
            get().weeklyUsedRecipeIds.add(lunchRecipe.id);
            result.generatedMeals.push('lunch');
          } else {
            // Fallback to local recipes
            const filteredRecipes = recipes.filter(recipe => 
              recipe.mealType === 'lunch' && 
              get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
              !Array.from(get().weeklyUsedRecipeIds).includes(recipe.id)
            );
            
            if (filteredRecipes.length > 0) {
              filteredRecipes.sort((a, b) => {
                return Math.abs(a.calories - lunchCalories) - Math.abs(b.calories - lunchCalories);
              });
              
              const lunchRecipe = filteredRecipes[0];
              lunch = {
                recipeId: lunchRecipe.id,
                name: lunchRecipe.name,
                calories: lunchRecipe.calories,
                protein: lunchRecipe.protein,
                carbs: lunchRecipe.carbs,
                fat: lunchRecipe.fat,
                fiber: lunchRecipe.fiber
              };
              
              get().weeklyUsedRecipeIds.add(lunchRecipe.id);
              result.generatedMeals.push('lunch');
            }
          }
          
          // Generate dinner
          const dinnerRecipes = await firebaseService.getRecipesForMealPlan('dinner', {
            dietType,
            allergies,
            excludedIngredients,
            fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
            calorieRange: { min: dinnerCalories * 0.8, max: dinnerCalories * 1.2 },
            excludeIds: Array.from(get().weeklyUsedRecipeIds) // Get updated list
          }, 5);
          
          if (dinnerRecipes.length > 0) {
            const dinnerRecipe = dinnerRecipes[0];
            dinner = {
              recipeId: dinnerRecipe.id,
              name: dinnerRecipe.name,
              calories: dinnerRecipe.calories,
              protein: dinnerRecipe.protein,
              carbs: dinnerRecipe.carbs,
              fat: dinnerRecipe.fat,
              fiber: dinnerRecipe.fiber
            };
            
            get().weeklyUsedRecipeIds.add(dinnerRecipe.id);
            result.generatedMeals.push('dinner');
          } else {
            // Fallback to local recipes
            const filteredRecipes = recipes.filter(recipe => 
              recipe.mealType === 'dinner' && 
              get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients) &&
              !Array.from(get().weeklyUsedRecipeIds).includes(recipe.id)
            );
            
            if (filteredRecipes.length > 0) {
              filteredRecipes.sort((a, b) => {
                return Math.abs(a.calories - dinnerCalories) - Math.abs(b.calories - dinnerCalories);
              });
              
              const dinnerRecipe = filteredRecipes[0];
              dinner = {
                recipeId: dinnerRecipe.id,
                name: dinnerRecipe.name,
                calories: dinnerRecipe.calories,
                protein: dinnerRecipe.protein,
                carbs: dinnerRecipe.carbs,
                fat: dinnerRecipe.fat,
                fiber: dinnerRecipe.fiber
              };
              
              get().weeklyUsedRecipeIds.add(dinnerRecipe.id);
              result.generatedMeals.push('dinner');
            }
          }
          
          // Check if we generated all meals
          if (result.generatedMeals.length === 3) {
            result.success = true;
            result.suggestions = ["All meals for the day have been successfully generated!"];
          } else if (result.generatedMeals.length > 0) {
            result.success = true;
            result.suggestions = [
              `Generated ${result.generatedMeals.length} out of 3 meals.`,
              "Some meals couldn't be generated due to dietary restrictions or lack of suitable recipes."
            ];
          } else {
            result.success = false;
            result.error = "Could not generate any meals for this day.";
            result.suggestions = [
              "Try adjusting your dietary preferences",
              "Add more recipes to your collection",
              "Try generating individual meals instead"
            ];
          }
          
          // Create the meal plan for the day
          const newDayPlan: DailyMeals = {};
          
          if (breakfast) {
            newDayPlan.breakfast = breakfast;
          }
          
          if (lunch) {
            newDayPlan.lunch = lunch;
          }
          
          if (dinner) {
            newDayPlan.dinner = dinner;
          }
          
          // Update the meal plan
          set((state) => ({
            mealPlan: {
              ...state.mealPlan,
              [date]: newDayPlan
            },
            weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds),
            lastGenerationError: result.error,
            generationSuggestions: result.suggestions
          }));
          
        } catch (error) {
          console.error('Error generating all meals for day:', error);
          result.success = false;
          result.error = "Failed to generate meals for the day. There was an error processing your request.";
          result.suggestions = [
            "Check your internet connection",
            "Try again later",
            "Try generating individual meals instead"
          ];
          
          set({
            lastGenerationError: result.error,
            generationSuggestions: result.suggestions
          });
        }
        
        return result;
      },
      
      generateWeeklyMealPlan: async (startDate, endDate) => {
        // Get user profile for personalization
        const userProfile = getUserProfile();
        const { 
          dietType = 'any', 
          allergies = [], 
          excludedIngredients = [],
          calorieGoal = 2000,
          fitnessGoals = []
        } = userProfile;
        
        // Reset weekly used recipe IDs
        set({ weeklyUsedRecipeIds: new Set<string>() });
        
        // Generate dates between startDate and endDate (inclusive)
        const dates: string[] = [];
        let currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        
        while (currentDate <= lastDate) {
          dates.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Track generation results
        const result: GenerationResult = {
          success: true,
          generatedMeals: [],
          error: null,
          suggestions: []
        };
        
        // Count successful and failed days
        let successfulDays = 0;
        let failedDays = 0;
        let partialDays = 0;
        
        // Generate meal plan for each date
        for (const date of dates) {
          try {
            // Get the current day plan
            const currentDayPlan = get().mealPlan[date] || {};
            
            // Define meal split percentages for calorie distribution
            const mealSplit = {
              breakfast: 0.3, // 30% of daily calories
              lunch: 0.35,    // 35% of daily calories
              dinner: 0.35,   // 35% of daily calories
            };
            
            // Calculate target calories per meal
            const breakfastCalories = Math.round(calorieGoal * mealSplit.breakfast);
            const lunchCalories = Math.round(calorieGoal * mealSplit.lunch);
            const dinnerCalories = Math.round(calorieGoal * mealSplit.dinner);
            
            // Get already used recipe IDs to avoid duplicates
            const weeklyUsedRecipeIds = Array.from(get().weeklyUsedRecipeIds);
            
            // Track meals generated for this day
            const dayMealsGenerated: string[] = [];
            
            // Generate breakfast if missing
            if (!currentDayPlan.breakfast) {
              // Use Firestore to get suitable breakfast recipes
              const breakfastRecipes = await firebaseService.getRecipesForMealPlan('breakfast', {
                dietType,
                allergies,
                excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: breakfastCalories * 0.8, max: breakfastCalories * 1.2 },
                excludeIds: weeklyUsedRecipeIds
              }, 5);
              
              if (breakfastRecipes.length > 0) {
                const breakfastRecipe = breakfastRecipes[0];
                const breakfast = {
                  recipeId: breakfastRecipe.id,
                  name: breakfastRecipe.name,
                  calories: breakfastRecipe.calories,
                  protein: breakfastRecipe.protein,
                  carbs: breakfastRecipe.carbs,
                  fat: breakfastRecipe.fat,
                  fiber: breakfastRecipe.fiber
                };
                
                // Add to meal plan
                set((state) => {
                  const dayPlan = state.mealPlan[date] || {};
                  const updatedDayPlan = { ...dayPlan, breakfast };
                  
                  // Add to weekly used recipe IDs
                  state.weeklyUsedRecipeIds.add(breakfastRecipe.id);
                  
                  return {
                    mealPlan: {
                      ...state.mealPlan,
                      [date]: updatedDayPlan
                    },
                    weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds)
                  };
                });
                
                dayMealsGenerated.push('breakfast');
                result.generatedMeals.push(`${date}-breakfast`);
              }
            } else {
              // Breakfast already exists
              dayMealsGenerated.push('breakfast');
            }
            
            // Generate lunch if missing
            if (!currentDayPlan.lunch) {
              // Use Firestore to get suitable lunch recipes
              const lunchRecipes = await firebaseService.getRecipesForMealPlan('lunch', {
                dietType,
                allergies,
                excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: lunchCalories * 0.8, max: lunchCalories * 1.2 },
                excludeIds: Array.from(get().weeklyUsedRecipeIds) // Get updated list
              }, 5);
              
              if (lunchRecipes.length > 0) {
                const lunchRecipe = lunchRecipes[0];
                const lunch = {
                  recipeId: lunchRecipe.id,
                  name: lunchRecipe.name,
                  calories: lunchRecipe.calories,
                  protein: lunchRecipe.protein,
                  carbs: lunchRecipe.carbs,
                  fat: lunchRecipe.fat,
                  fiber: lunchRecipe.fiber
                };
                
                // Add to meal plan
                set((state) => {
                  const dayPlan = state.mealPlan[date] || {};
                  const updatedDayPlan = { ...dayPlan, lunch };
                  
                  // Add to weekly used recipe IDs
                  state.weeklyUsedRecipeIds.add(lunchRecipe.id);
                  
                  return {
                    mealPlan: {
                      ...state.mealPlan,
                      [date]: updatedDayPlan
                    },
                    weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds)
                  };
                });
                
                dayMealsGenerated.push('lunch');
                result.generatedMeals.push(`${date}-lunch`);
              }
            } else {
              // Lunch already exists
              dayMealsGenerated.push('lunch');
            }
            
            // Generate dinner if missing
            if (!currentDayPlan.dinner) {
              // Use Firestore to get suitable dinner recipes
              const dinnerRecipes = await firebaseService.getRecipesForMealPlan('dinner', {
                dietType,
                allergies,
                excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: dinnerCalories * 0.8, max: dinnerCalories * 1.2 },
                excludeIds: Array.from(get().weeklyUsedRecipeIds) // Get updated list
              }, 5);
              
              if (dinnerRecipes.length > 0) {
                const dinnerRecipe = dinnerRecipes[0];
                const dinner = {
                  recipeId: dinnerRecipe.id,
                  name: dinnerRecipe.name,
                  calories: dinnerRecipe.calories,
                  protein: dinnerRecipe.protein,
                  carbs: dinnerRecipe.carbs,
                  fat: dinnerRecipe.fat,
                  fiber: dinnerRecipe.fiber
                };
                
                // Add to meal plan
                set((state) => {
                  const dayPlan = state.mealPlan[date] || {};
                  const updatedDayPlan = { ...dayPlan, dinner };
                  
                  // Add to weekly used recipe IDs
                  state.weeklyUsedRecipeIds.add(dinnerRecipe.id);
                  
                  return {
                    mealPlan: {
                      ...state.mealPlan,
                      [date]: updatedDayPlan
                    },
                    weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds)
                  };
                });
                
                dayMealsGenerated.push('dinner');
                result.generatedMeals.push(`${date}-dinner`);
              }
            } else {
              // Dinner already exists
              dayMealsGenerated.push('dinner');
            }
            
            // Check if all meals were generated for this day
            if (dayMealsGenerated.length === 3) {
              successfulDays++;
            } else if (dayMealsGenerated.length > 0) {
              partialDays++;
            } else {
              failedDays++;
            }
          } catch (error) {
            console.error(`Error generating meal plan for ${date}:`, error);
            failedDays++;
          }
        }
        
        // Update result based on generation statistics
        if (successfulDays === dates.length) {
          result.success = true;
          result.error = null;
          result.suggestions = ["All meals were successfully generated!"];
        } else if (successfulDays > 0 || partialDays > 0) {
          result.success = true;
          result.error = null;
          result.suggestions = [
            `Generated complete meal plans for ${successfulDays} of ${dates.length} days.`,
            `Generated partial meal plans for ${partialDays} of ${dates.length} days.`
          ];
          
          if (failedDays > 0) {
            result.suggestions.push(`Could not generate meals for ${failedDays} days. Try adding more recipes or adjusting your dietary preferences.`);
          }
        } else {
          result.success = false;
          result.error = "Failed to generate any meals for the week.";
          result.suggestions = [
            "Try adjusting your dietary preferences",
            "Add more recipes to your collection",
            "Try generating individual days instead"
          ];
        }
        
        // Update error state
        set({
          lastGenerationError: result.error,
          generationSuggestions: result.suggestions
        });
        
        return result;
      }
    }),
    {
      name: 'meal-plan-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mealPlan: state.mealPlan,
        // Don't persist Sets or complex objects that might cause issues
        // weeklyUsedRecipeIds will be recalculated on load
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure weeklyUsedRecipeIds is a proper Set after rehydration
          state.weeklyUsedRecipeIds = new Set<string>();
          state.alternativeRecipes = {};
          state.isLoadingAlternatives = false;
          state.lastGenerationError = null;
          state.generationSuggestions = [];
        }
      },
    }
  )
);