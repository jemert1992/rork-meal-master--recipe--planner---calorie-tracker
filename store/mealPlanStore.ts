import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealPlan, MealItem, DailyMeals, Recipe, DietType } from '@/types';
import { mockMealPlan } from '@/constants/mockData';
import { useUserStore } from '@/store/userStore';

interface MealPlanState {
  mealPlan: MealPlan;
  addMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner', meal: MealItem) => void;
  removeMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => void;
  clearDay: (date: string) => void;
  generateMealPlan: (date: string, recipes: Recipe[], specificMealType?: 'breakfast' | 'lunch' | 'dinner') => Promise<void>;
  isRecipeSuitable: (recipe: Recipe, dietType?: DietType, allergies?: string[], excludedIngredients?: string[]) => boolean;
  getUsedRecipeIds: () => Set<string>;
  validateDailyMealPlan: (dailyMeals: DailyMeals, calorieGoal: number) => { 
    isValid: boolean; 
    issues: string[]; 
    totalCalories: number;
    calorieDeviation: number;
  };
  isRecipeUsedInMealPlan: (recipeId: string) => boolean;
}

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      mealPlan: mockMealPlan,
      
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
          
          return {
            mealPlan: {
              ...state.mealPlan,
              [date]: updatedDayPlan,
            },
          };
        });
      },
      
      removeMeal: (date, mealType) => {
        set((state) => {
          const dayPlan = state.mealPlan[date];
          if (!dayPlan) return state;
          
          const updatedDayPlan: DailyMeals = { ...dayPlan };
          
          if (mealType === 'breakfast' || mealType === 'lunch' || mealType === 'dinner') {
            delete updatedDayPlan[mealType];
          }
          
          return {
            mealPlan: {
              ...state.mealPlan,
              [date]: updatedDayPlan,
            },
          };
        });
      },
      
      clearDay: (date) => {
        set((state) => {
          const { [date]: _, ...restOfMealPlan } = state.mealPlan;
          return {
            mealPlan: restOfMealPlan,
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
          if (requiredTags.length > 0 && !requiredTags.some(tag => 
            recipe.tags.some(recipeTag => 
              recipeTag.toLowerCase() === tag.toLowerCase()
            )
          )) {
            return false;
          }
        }
        
        // Check for allergies and excluded ingredients
        if (allergies.length > 0 || excludedIngredients.length > 0) {
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
      
      generateMealPlan: async (date, recipes, specificMealType) => {
        if (recipes.length < 3) {
          throw new Error("Not enough recipes available");
        }
        
        // Get user profile for personalization
        const userProfile = useUserStore.getState().profile;
        const { 
          dietType = 'any', 
          allergies = [], 
          excludedIngredients = [],
          calorieGoal = 2000,
          proteinGoal,
          carbsGoal,
          fatGoal
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
        
        // Validate recipe data before using
        const validRecipes = recipes.filter(recipe => {
          // Check if recipe has valid calorie data
          if (recipe.calories === undefined || recipe.calories === null) {
            console.warn(`Recipe "${recipe.name}" (${recipe.id}) is missing calorie data and will be excluded`);
            return false;
          }
          
          // Check if recipe has valid macronutrient data
          if (recipe.protein === undefined || recipe.carbs === undefined || recipe.fat === undefined) {
            console.warn(`Recipe "${recipe.name}" (${recipe.id}) is missing macronutrient data`);
            // Still include it, but log the warning
          }
          
          return true;
        });
        
        if (validRecipes.length < 3) {
          throw new Error("Not enough valid recipes with calorie data available");
        }
        
        // Create a copy of recipes to avoid modifying the original
        let availableRecipes = [...validRecipes];
        
        // Get already used recipe IDs to avoid duplicates across all days
        const usedRecipeIds = get().getUsedRecipeIds();
        
        // Filter out already used recipes to avoid duplicates
        const uniqueRecipes = availableRecipes.filter(recipe => !usedRecipeIds.has(recipe.id));
        
        // If we have enough unique recipes, use them; otherwise, use all recipes
        if (uniqueRecipes.length >= 3) {
          availableRecipes = uniqueRecipes;
          console.log(`Using ${uniqueRecipes.length} unique recipes`);
        } else {
          console.warn("Not enough unique recipes available. Some meals may be repeated.");
        }
        
        // Filter recipes based on user preferences
        availableRecipes = availableRecipes.filter(recipe => 
          get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients)
        );
        
        // If we don't have enough suitable recipes, use all recipes
        if (availableRecipes.length < 3) {
          console.warn("Not enough recipes matching dietary preferences. Using all available recipes.");
          availableRecipes = [...validRecipes];
          
          // If still not enough, throw error
          if (availableRecipes.length < 3) {
            throw new Error("Not enough valid recipes available after filtering");
          }
        }
        
        // Define tags that match each meal type
        const mealTypeTags: Record<string, string[]> = {
          breakfast: ['breakfast', 'brunch', 'morning', 'oatmeal', 'cereal', 'pancake', 'waffle', 'egg', 'toast', 'smoothie', 'yogurt'],
          lunch: ['lunch', 'salad', 'sandwich', 'soup', 'light', 'wrap', 'bowl', 'taco', 'quesadilla', 'burger'],
          dinner: ['dinner', 'main', 'supper', 'entree', 'roast', 'stew', 'curry', 'pasta', 'chicken', 'beef', 'pork', 'fish', 'seafood', 'casserole']
        };
        
        // Define excluded tags for each meal type
        const excludedTags: Record<string, string[]> = {
          breakfast: ['dessert', 'cake', 'cookie', 'pie', 'pudding', 'ice cream', 'candy'],
          lunch: ['dessert', 'cake', 'cookie', 'pie', 'pudding', 'ice cream', 'candy', 'breakfast'],
          dinner: ['dessert', 'cake', 'cookie', 'pie', 'pudding', 'ice cream', 'candy', 'breakfast']
        };
        
        // Improved recipe matching function with calorie targeting and meal type appropriateness
        const getRecipeForMeal = (mealType: string, targetCalories: number): Recipe | null => {
          // First, check if any recipes have the explicit meal type tag or are categorized for this meal
          const typeSpecificRecipes = availableRecipes.filter(recipe => {
            // Check if recipe has the meal type tag
            const hasTypeTag = recipe.tags.some(tag => 
              tag.toLowerCase() === mealType.toLowerCase()
            );
            
            // Check if recipe is explicitly categorized for this meal type
            const isExplicitlyTyped = recipe.mealType === mealType;
            
            // Check if recipe has any excluded tags for this meal type
            const hasExcludedTag = recipe.tags.some(tag => 
              excludedTags[mealType].some(excludedTag => 
                tag.toLowerCase().includes(excludedTag.toLowerCase())
              )
            );
            
            // Only include if it has the right type and doesn't have excluded tags
            return (hasTypeTag || isExplicitlyTyped) && !hasExcludedTag;
          });
          
          // If we have type-specific recipes, prioritize those that are close to target calories
          if (typeSpecificRecipes.length > 0) {
            // Sort by how close they are to the target calories
            typeSpecificRecipes.sort((a, b) => {
              const aCalories = a.calories || 0;
              const bCalories = b.calories || 0;
              return Math.abs(aCalories - targetCalories) - Math.abs(bCalories - targetCalories);
            });
            
            // Get the closest match
            const selectedRecipe = typeSpecificRecipes[0];
            
            // Remove the selected recipe from available recipes
            const index = availableRecipes.findIndex(r => r.id === selectedRecipe.id);
            if (index !== -1) {
              availableRecipes.splice(index, 1);
            }
            
            return selectedRecipe;
          }
          
          // If no explicit meal type recipes, look for recipes with related tags
          const tagMatchingRecipes = availableRecipes.filter(recipe => {
            // Check if any tag matches the related tags for this meal type
            const hasRelatedTag = recipe.tags.some(tag => 
              mealTypeTags[mealType].some(mealTag => 
                tag.toLowerCase().includes(mealTag.toLowerCase()) || 
                mealTag.toLowerCase().includes(tag.toLowerCase())
              )
            );
            
            // Check if recipe has any excluded tags for this meal type
            const hasExcludedTag = recipe.tags.some(tag => 
              excludedTags[mealType].some(excludedTag => 
                tag.toLowerCase().includes(excludedTag.toLowerCase())
              )
            );
            
            // Only include if it has related tags and doesn't have excluded tags
            return hasRelatedTag && !hasExcludedTag;
          });
          
          if (tagMatchingRecipes.length > 0) {
            // Sort by how close they are to the target calories
            tagMatchingRecipes.sort((a, b) => {
              const aCalories = a.calories || 0;
              const bCalories = b.calories || 0;
              return Math.abs(aCalories - targetCalories) - Math.abs(bCalories - targetCalories);
            });
            
            // Get the closest match
            const selectedRecipe = tagMatchingRecipes[0];
            
            // Remove the selected recipe from available recipes
            const index = availableRecipes.findIndex(r => r.id === selectedRecipe.id);
            if (index !== -1) {
              availableRecipes.splice(index, 1);
            }
            
            return selectedRecipe;
          }
          
          // If no matching recipe found, filter out recipes with excluded tags
          const appropriateRecipes = availableRecipes.filter(recipe => 
            !recipe.tags.some(tag => 
              excludedTags[mealType].some(excludedTag => 
                tag.toLowerCase().includes(excludedTag.toLowerCase())
              )
            )
          );
          
          // If we have appropriate recipes, use those
          if (appropriateRecipes.length > 0) {
            // Sort by how close they are to the target calories
            appropriateRecipes.sort((a, b) => {
              const aCalories = a.calories || 0;
              const bCalories = b.calories || 0;
              return Math.abs(aCalories - targetCalories) - Math.abs(bCalories - targetCalories);
            });
            
            const selectedRecipe = appropriateRecipes[0];
            
            // Remove the selected recipe from available recipes
            const index = availableRecipes.findIndex(r => r.id === selectedRecipe.id);
            if (index !== -1) {
              availableRecipes.splice(index, 1);
            }
            
            return selectedRecipe;
          }
          
          // If no appropriate recipes found, just use the first available recipe
          // that's closest to the target calories
          if (availableRecipes.length > 0) {
            // Sort by how close they are to the target calories
            availableRecipes.sort((a, b) => {
              const aCalories = a.calories || 0;
              const bCalories = b.calories || 0;
              return Math.abs(aCalories - targetCalories) - Math.abs(bCalories - targetCalories);
            });
            
            const selectedRecipe = availableRecipes[0];
            availableRecipes.splice(0, 1);
            return selectedRecipe;
          }
          
          return null;
        };
        
        // Get the current day plan
        const currentDayPlan = get().mealPlan[date] || {};
        
        // Generate meals for each type with target calories
        // Only generate meals that don't already exist or if specifically requested
        let breakfast = currentDayPlan.breakfast;
        let lunch = currentDayPlan.lunch;
        let dinner = currentDayPlan.dinner;
        
        // If a specific meal type is provided, only generate that meal
        if (specificMealType) {
          // Generate only the specified meal type
          if (specificMealType === 'breakfast') {
            const breakfastRecipe = getRecipeForMeal('breakfast', breakfastCalories);
            if (breakfastRecipe) {
              breakfast = {
                recipeId: breakfastRecipe.id,
                name: breakfastRecipe.name,
                calories: breakfastRecipe.calories,
                protein: breakfastRecipe.protein,
                carbs: breakfastRecipe.carbs,
                fat: breakfastRecipe.fat
              };
            }
          } else if (specificMealType === 'lunch') {
            const lunchRecipe = getRecipeForMeal('lunch', lunchCalories);
            if (lunchRecipe) {
              lunch = {
                recipeId: lunchRecipe.id,
                name: lunchRecipe.name,
                calories: lunchRecipe.calories,
                protein: lunchRecipe.protein,
                carbs: lunchRecipe.carbs,
                fat: lunchRecipe.fat
              };
            }
          } else if (specificMealType === 'dinner') {
            const dinnerRecipe = getRecipeForMeal('dinner', dinnerCalories);
            if (dinnerRecipe) {
              dinner = {
                recipeId: dinnerRecipe.id,
                name: dinnerRecipe.name,
                calories: dinnerRecipe.calories,
                protein: dinnerRecipe.protein,
                carbs: dinnerRecipe.carbs,
                fat: dinnerRecipe.fat
              };
            }
          }
        } else {
          // Generate all missing meals
          if (!breakfast) {
            const breakfastRecipe = getRecipeForMeal('breakfast', breakfastCalories);
            if (breakfastRecipe) {
              breakfast = {
                recipeId: breakfastRecipe.id,
                name: breakfastRecipe.name,
                calories: breakfastRecipe.calories,
                protein: breakfastRecipe.protein,
                carbs: breakfastRecipe.carbs,
                fat: breakfastRecipe.fat
              };
            }
          }
          
          if (!lunch) {
            const lunchRecipe = getRecipeForMeal('lunch', lunchCalories);
            if (lunchRecipe) {
              lunch = {
                recipeId: lunchRecipe.id,
                name: lunchRecipe.name,
                calories: lunchRecipe.calories,
                protein: lunchRecipe.protein,
                carbs: lunchRecipe.carbs,
                fat: lunchRecipe.fat
              };
            }
          }
          
          if (!dinner) {
            const dinnerRecipe = getRecipeForMeal('dinner', dinnerCalories);
            if (dinnerRecipe) {
              dinner = {
                recipeId: dinnerRecipe.id,
                name: dinnerRecipe.name,
                calories: dinnerRecipe.calories,
                protein: dinnerRecipe.protein,
                carbs: dinnerRecipe.carbs,
                fat: dinnerRecipe.fat
              };
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
          } else {
            console.log(`Successfully generated meal plan with ${validation.totalCalories} calories (${validation.calorieDeviation.toFixed(1)}% deviation from goal ${calorieGoal})`);
          }
        }
        
        // Update the meal plan
        set((state) => ({
          mealPlan: {
            ...state.mealPlan,
            [date]: newDayPlan
          }
        }));
      }
    }),
    {
      name: 'meal-plan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);