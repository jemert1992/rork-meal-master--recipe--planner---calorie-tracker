import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealPlan, MealItem, DailyMeals, Recipe, DietType } from '@/types';
import { mockMealPlan } from '@/constants/mockData';
import { useUserStore } from '@/store/userStore';

interface MealPlanState {
  mealPlan: MealPlan;
  addMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | string, meal: MealItem) => void;
  removeMeal: (date: string, mealType: string, index?: number) => void;
  addSnack: (date: string, snack: MealItem) => void;
  removeSnack: (date: string, index: number) => void;
  clearDay: (date: string) => void;
  generateMealPlan: (date: string, recipes: Recipe[]) => Promise<void>;
  isRecipeSuitable: (recipe: Recipe, dietType?: DietType, allergies?: string[], excludedIngredients?: string[]) => boolean;
  getUsedRecipeIds: () => Set<string>;
  validateDailyMealPlan: (dailyMeals: DailyMeals, calorieGoal: number) => { 
    isValid: boolean; 
    issues: string[]; 
    totalCalories: number;
    calorieDeviation: number;
  };
}

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      mealPlan: mockMealPlan,
      
      addMeal: (date, mealType, meal) => {
        set((state) => {
          const dayPlan = state.mealPlan[date] || {};
          
          // Create a new object to avoid TypeScript errors with dynamic keys
          const updatedDayPlan: DailyMeals = { ...dayPlan };
          
          // Handle standard meal types
          if (mealType === 'breakfast' || mealType === 'lunch' || mealType === 'dinner') {
            updatedDayPlan[mealType] = meal;
          } 
          // Handle snacks separately
          else if (mealType === 'snack') {
            const currentSnacks = updatedDayPlan.snacks || [];
            updatedDayPlan.snacks = [...currentSnacks, meal];
          }
          
          return {
            mealPlan: {
              ...state.mealPlan,
              [date]: updatedDayPlan,
            },
          };
        });
      },
      
      removeMeal: (date, mealType, index) => {
        set((state) => {
          const dayPlan = state.mealPlan[date];
          if (!dayPlan) return state;
          
          const updatedDayPlan: DailyMeals = { ...dayPlan };
          
          if (mealType === 'snacks' && typeof index === 'number') {
            const updatedSnacks = [...(dayPlan.snacks || [])];
            updatedSnacks.splice(index, 1);
            updatedDayPlan.snacks = updatedSnacks;
          } 
          else if (mealType === 'breakfast' || mealType === 'lunch' || mealType === 'dinner') {
            // Use type assertion to tell TypeScript this is a valid key
            delete updatedDayPlan[mealType as keyof DailyMeals];
          }
          
          return {
            mealPlan: {
              ...state.mealPlan,
              [date]: updatedDayPlan,
            },
          };
        });
      },
      
      addSnack: (date, snack) => {
        set((state) => {
          const dayPlan = state.mealPlan[date] || {};
          const currentSnacks = dayPlan.snacks || [];
          return {
            mealPlan: {
              ...state.mealPlan,
              [date]: {
                ...dayPlan,
                snacks: [...currentSnacks, snack],
              },
            },
          };
        });
      },
      
      removeSnack: (date, index) => {
        set((state) => {
          const dayPlan = state.mealPlan[date];
          if (!dayPlan || !dayPlan.snacks) return state;
          
          const updatedSnacks = [...dayPlan.snacks];
          updatedSnacks.splice(index, 1);
          return {
            mealPlan: {
              ...state.mealPlan,
              [date]: {
                ...dayPlan,
                snacks: updatedSnacks,
              },
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
          
          // Check snacks
          if (dayPlan.snacks && dayPlan.snacks.length > 0) {
            dayPlan.snacks.forEach(snack => {
              if (snack.recipeId) usedRecipeIds.add(snack.recipeId);
            });
          }
        });
        
        return usedRecipeIds;
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
        
        // Check if snacks are present
        if (!dailyMeals.snacks || dailyMeals.snacks.length === 0) {
          issues.push("No snacks included");
        } else {
          // Check if snacks have valid calorie data
          dailyMeals.snacks.forEach((snack, index) => {
            if (snack.calories === undefined || snack.calories === null) {
              issues.push(`Snack ${index + 1} is missing calorie data`);
            } else {
              totalCalories += snack.calories;
            }
          });
          
          // Check if we have the right number of snacks (1-2)
          if (dailyMeals.snacks.length > 2) {
            issues.push(`Too many snacks (${dailyMeals.snacks.length}), maximum is 2`);
          }
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
      
      generateMealPlan: async (date, recipes) => {
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
          breakfast: 0.25, // 25% of daily calories
          lunch: 0.35,     // 35% of daily calories
          dinner: 0.3,     // 30% of daily calories
          snacks: 0.1      // 10% of daily calories
        };
        
        // Calculate target calories per meal
        const breakfastCalories = Math.round(calorieGoal * mealSplit.breakfast);
        const lunchCalories = Math.round(calorieGoal * mealSplit.lunch);
        const dinnerCalories = Math.round(calorieGoal * mealSplit.dinner);
        const snackCalories = Math.round(calorieGoal * mealSplit.snacks);
        
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
          breakfast: ['breakfast', 'brunch', 'morning', 'oatmeal', 'cereal', 'pancake', 'waffle', 'egg'],
          lunch: ['lunch', 'salad', 'sandwich', 'soup', 'light', 'wrap', 'bowl'],
          dinner: ['dinner', 'main', 'supper', 'entree', 'roast', 'stew', 'curry', 'pasta']
        };
        
        // Improved recipe matching function with calorie targeting
        const getRecipeForMeal = (mealType: string, targetCalories: number): Recipe | null => {
          // Find recipes with matching tags and close to target calories
          const matchingRecipes = availableRecipes.filter(recipe => {
            // Normalize tags by converting to lowercase
            const recipeTags = recipe.tags.map(tag => tag.toLowerCase());
            
            // Check if any tag matches the meal type or related tags
            const tagMatches = 
              recipeTags.includes(mealType.toLowerCase()) || 
              recipeTags.some(tag => mealTypeTags[mealType]?.some(mealTag => 
                tag.includes(mealTag) || mealTag.includes(tag)
              ));
            
            // Check if calories are within 20% of target
            const calorieMatches = 
              recipe.calories >= targetCalories * 0.8 &&
              recipe.calories <= targetCalories * 1.2;
            
            return tagMatches && calorieMatches;
          });
          
          if (matchingRecipes.length > 0) {
            // Sort by how close they are to the target calories
            matchingRecipes.sort((a, b) => 
              Math.abs(a.calories - targetCalories) - Math.abs(b.calories - targetCalories)
            );
            
            // Get the closest match
            const selectedRecipe = matchingRecipes[0];
            
            // Remove the selected recipe from available recipes
            const index = availableRecipes.findIndex(r => r.id === selectedRecipe.id);
            if (index !== -1) {
              availableRecipes.splice(index, 1);
            }
            
            return selectedRecipe;
          }
          
          // If no matching recipe with target calories, just find one with matching tags
          const tagMatchingRecipes = availableRecipes.filter(recipe => {
            // Normalize tags by converting to lowercase
            const recipeTags = recipe.tags.map(tag => tag.toLowerCase());
            
            // Check if any tag matches the meal type or related tags
            return recipeTags.includes(mealType.toLowerCase()) || 
                   recipeTags.some(tag => mealTypeTags[mealType]?.some(mealTag => 
                     tag.includes(mealTag) || mealTag.includes(tag)
                   ));
          });
          
          if (tagMatchingRecipes.length > 0) {
            // Sort by how close they are to the target calories
            tagMatchingRecipes.sort((a, b) => 
              Math.abs(a.calories - targetCalories) - Math.abs(b.calories - targetCalories)
            );
            
            // Get the closest match
            const selectedRecipe = tagMatchingRecipes[0];
            
            // Remove the selected recipe from available recipes
            const index = availableRecipes.findIndex(r => r.id === selectedRecipe.id);
            if (index !== -1) {
              availableRecipes.splice(index, 1);
            }
            
            return selectedRecipe;
          }
          
          // If no matching recipe found, just use the first available recipe
          // that's closest to the target calories
          if (availableRecipes.length > 0) {
            // Sort by how close they are to the target calories
            availableRecipes.sort((a, b) => 
              Math.abs(a.calories - targetCalories) - Math.abs(b.calories - targetCalories)
            );
            
            const selectedRecipe = availableRecipes[0];
            availableRecipes.splice(0, 1);
            return selectedRecipe;
          }
          
          return null;
        };
        
        // Generate meals for each type with target calories
        const breakfast = getRecipeForMeal('breakfast', breakfastCalories);
        const lunch = getRecipeForMeal('lunch', lunchCalories);
        const dinner = getRecipeForMeal('dinner', dinnerCalories);
        
        // Calculate actual calories from main meals
        let actualMainMealCalories = 0;
        if (breakfast) actualMainMealCalories += breakfast.calories;
        if (lunch) actualMainMealCalories += lunch.calories;
        if (dinner) actualMainMealCalories += dinner.calories;
        
        // Calculate target main meal calories
        const targetMainMealCalories = breakfastCalories + lunchCalories + dinnerCalories;
        
        // Calculate remaining calories for snacks, adjusting for any deviation in main meals
        const remainingCalories = calorieGoal - actualMainMealCalories;
        
        // Determine how many snacks to add based on remaining calories
        // Aim for 100-300 calories per snack, with 1-2 snacks total
        const minSnackCalories = 100;
        const maxSnackCalories = 300;
        const avgSnackCalories = 200;
        
        // Calculate how many snacks we can fit
        const maxSnacks = Math.min(2, Math.floor(remainingCalories / minSnackCalories));
        const targetSnackCount = Math.max(1, Math.min(maxSnacks, Math.round(remainingCalories / avgSnackCalories)));
        
        // Generate snacks
        const snacks: MealItem[] = [];
        const snackCaloriesPerItem = remainingCalories / targetSnackCount;
        
        for (let i = 0; i < targetSnackCount && availableRecipes.length > 0; i++) {
          // Try to find a snack with appropriate calories
          const snackRecipes = availableRecipes.filter(recipe => {
            // Normalize tags by converting to lowercase
            const recipeTags = recipe.tags.map(tag => tag.toLowerCase());
            
            // Look for snack-appropriate recipes within calorie range
            return recipe.calories >= minSnackCalories && 
                   recipe.calories <= maxSnackCalories &&
                   (recipeTags.includes('snack') || recipeTags.includes('dessert') || 
                    recipeTags.includes('appetizer') || recipeTags.includes('side'));
          });
          
          let selectedSnackRecipe: Recipe | undefined;
          
          if (snackRecipes.length > 0) {
            // Sort by how close they are to the target calories
            snackRecipes.sort((a, b) => 
              Math.abs(a.calories - snackCaloriesPerItem) - Math.abs(b.calories - snackCaloriesPerItem)
            );
            
            selectedSnackRecipe = snackRecipes[0];
            
            // Remove from available recipes
            const availableIndex = availableRecipes.findIndex(r => r.id === selectedSnackRecipe.id);
            if (availableIndex !== -1) {
              availableRecipes.splice(availableIndex, 1);
            }
          } else if (availableRecipes.length > 0) {
            // Sort by how close they are to the target calories
            availableRecipes.sort((a, b) => 
              Math.abs(a.calories - snackCaloriesPerItem) - Math.abs(b.calories - snackCaloriesPerItem)
            );
            
            selectedSnackRecipe = availableRecipes[0];
            availableRecipes.splice(0, 1);
          }
          
          // Add type guard to fix TypeScript error
          if (selectedSnackRecipe) {
            snacks.push({
              recipeId: selectedSnackRecipe.id,
              name: selectedSnackRecipe.name,
              calories: selectedSnackRecipe.calories || 0,
              protein: selectedSnackRecipe.protein || 0,
              carbs: selectedSnackRecipe.carbs || 0,
              fat: selectedSnackRecipe.fat || 0
            });
          }
        }
        
        // Create the meal plan
        const newDayPlan: DailyMeals = {};
        
        if (breakfast) {
          newDayPlan.breakfast = {
            recipeId: breakfast.id,
            name: breakfast.name,
            calories: breakfast.calories,
            protein: breakfast.protein,
            carbs: breakfast.carbs,
            fat: breakfast.fat
          };
        }
        
        if (lunch) {
          newDayPlan.lunch = {
            recipeId: lunch.id,
            name: lunch.name,
            calories: lunch.calories,
            protein: lunch.protein,
            carbs: lunch.carbs,
            fat: lunch.fat
          };
        }
        
        if (dinner) {
          newDayPlan.dinner = {
            recipeId: dinner.id,
            name: dinner.name,
            calories: dinner.calories,
            protein: dinner.protein,
            carbs: dinner.carbs,
            fat: dinner.fat
          };
        }
        
        if (snacks.length > 0) {
          newDayPlan.snacks = snacks;
        }
        
        // Validate the generated meal plan
        const validation = get().validateDailyMealPlan(newDayPlan, calorieGoal);
        
        if (!validation.isValid) {
          console.warn(`Generated meal plan has issues: ${validation.issues.join(', ')}`);
          console.log(`Total calories: ${validation.totalCalories} (${validation.calorieDeviation.toFixed(1)}% deviation from goal ${calorieGoal})`);
        } else {
          console.log(`Successfully generated meal plan with ${validation.totalCalories} calories (${validation.calorieDeviation.toFixed(1)}% deviation from goal ${calorieGoal})`);
        }
        
        // Update the meal plan even if there are issues
        // The user can manually adjust if needed
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