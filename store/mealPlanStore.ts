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
      
      isRecipeSuitable: (recipe, dietType = 'any', allergies = [], excludedIngredients = []) => {
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
        try {
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
          
          // Create a copy of recipes to avoid modifying the original
          let availableRecipes = [...recipes];
          
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
            availableRecipes = [...recipes];
            console.warn("Not enough recipes matching dietary preferences. Using all available recipes.");
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
                recipeTags.some(tag => mealTypeTags[mealType]?.includes(tag));
              
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
                     recipeTags.some(tag => mealTypeTags[mealType]?.includes(tag));
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
          
          // Calculate remaining calories for snacks
          let remainingCalories = snackCalories;
          if (breakfast) remainingCalories += (breakfastCalories - breakfast.calories);
          if (lunch) remainingCalories += (lunchCalories - lunch.calories);
          if (dinner) remainingCalories += (dinnerCalories - dinner.calories);
          
          // Determine how many snacks to add based on remaining calories
          // Aim for 100-300 calories per snack
          const avgSnackCalories = 200;
          const targetSnackCount = Math.max(1, Math.min(3, Math.round(remainingCalories / avgSnackCalories)));
          
          // Generate snacks
          const snacks: MealItem[] = [];
          const snackCaloriesPerItem = remainingCalories / targetSnackCount;
          
          for (let i = 0; i < targetSnackCount && availableRecipes.length > 0; i++) {
            // Try to find a snack with appropriate calories
            const snackRecipes = availableRecipes.filter(recipe => {
              // Normalize tags by converting to lowercase
              const recipeTags = recipe.tags.map(tag => tag.toLowerCase());
              
              return Math.abs(recipe.calories - snackCaloriesPerItem) < snackCaloriesPerItem * 0.3 &&
                (recipeTags.includes('snack') || recipeTags.includes('dessert') || 
                 recipeTags.includes('appetizer'));
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
            
            // Fix TypeScript error by checking if selectedSnackRecipe exists
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
          
          // Update the meal plan
          set((state) => ({
            mealPlan: {
              ...state.mealPlan,
              [date]: newDayPlan
            }
          }));
        } catch (error) {
          console.error("Error generating meal plan:", error);
          throw error;
        }
      }
    }),
    {
      name: 'meal-plan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);