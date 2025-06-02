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
          if (requiredTags.length > 0 && !requiredTags.some(tag => recipe.tags.includes(tag))) {
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
        return new Promise((resolve, reject) => {
          try {
            if (recipes.length < 3) {
              reject(new Error("Not enough recipes available"));
              return;
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
            
            // Create a copy of recipes to avoid modifying the original
            let availableRecipes = [...recipes];
            
            // Filter recipes based on user preferences
            availableRecipes = availableRecipes.filter(recipe => 
              get().isRecipeSuitable(recipe, dietType, allergies, excludedIngredients)
            );
            
            // If we don't have enough suitable recipes, use all recipes
            if (availableRecipes.length < 3) {
              availableRecipes = [...recipes];
              console.warn("Not enough recipes matching dietary preferences. Using all available recipes.");
            }
            
            // Shuffle the recipes
            for (let i = availableRecipes.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [availableRecipes[i], availableRecipes[j]] = [availableRecipes[j], availableRecipes[i]];
            }
            
            // Calculate target calories per meal
            const breakfastCalories = Math.round(calorieGoal * 0.25); // 25% of daily calories
            const lunchCalories = Math.round(calorieGoal * 0.35);     // 35% of daily calories
            const dinnerCalories = Math.round(calorieGoal * 0.3);     // 30% of daily calories
            const snackCalories = Math.round(calorieGoal * 0.1);      // 10% of daily calories
            
            // Find recipes for each meal type based on tags and calories
            const findRecipeForMealType = (mealType: string, targetCalories: number): Recipe | null => {
              // Define tags that match each meal type
              const mealTypeTags: Record<string, string[]> = {
                breakfast: ['breakfast', 'brunch', 'morning'],
                lunch: ['lunch', 'salad', 'sandwich', 'light'],
                dinner: ['dinner', 'main', 'supper', 'entree']
              };
              
              // Try to find a recipe with matching tags and close to target calories
              const matchingRecipes = availableRecipes.filter(recipe => 
                (recipe.tags.includes(mealType) || 
                recipe.tags.some(tag => mealTypeTags[mealType]?.includes(tag))) &&
                // Allow some flexibility in calorie matching (±20%)
                recipe.calories >= targetCalories * 0.8 &&
                recipe.calories <= targetCalories * 1.2
              );
              
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
              const tagMatchingRecipes = availableRecipes.filter(recipe => 
                recipe.tags.includes(mealType) || 
                recipe.tags.some(tag => mealTypeTags[mealType]?.includes(tag))
              );
              
              if (tagMatchingRecipes.length > 0) {
                // Get a random matching recipe
                const selectedIndex = Math.floor(Math.random() * tagMatchingRecipes.length);
                const selectedRecipe = tagMatchingRecipes[selectedIndex];
                
                // Remove the selected recipe from available recipes
                const index = availableRecipes.findIndex(r => r.id === selectedRecipe.id);
                if (index !== -1) {
                  availableRecipes.splice(index, 1);
                }
                
                return selectedRecipe;
              }
              
              // If no matching recipe found, just use the first available recipe
              if (availableRecipes.length > 0) {
                const selectedRecipe = availableRecipes[0];
                availableRecipes.splice(0, 1);
                return selectedRecipe;
              }
              
              return null;
            };
            
            // Generate meals for each type with target calories
            const breakfast = findRecipeForMealType('breakfast', breakfastCalories);
            const lunch = findRecipeForMealType('lunch', lunchCalories);
            const dinner = findRecipeForMealType('dinner', dinnerCalories);
            
            // Generate 1-2 snacks
            const snackCount = Math.floor(Math.random() * 2) + 1;
            const snacks: MealItem[] = [];
            
            for (let i = 0; i < snackCount && availableRecipes.length > 0; i++) {
              // Try to find a snack with appropriate calories
              const snackRecipes = availableRecipes.filter(recipe => 
                recipe.calories <= snackCalories * 1.2 &&
                (recipe.tags.includes('snack') || recipe.tags.includes('dessert') || 
                 recipe.tags.includes('appetizer'))
              );
              
              let snackRecipe: Recipe | undefined;
              if (snackRecipes.length > 0) {
                const index = Math.floor(Math.random() * snackRecipes.length);
                snackRecipe = snackRecipes[index];
                // Remove from available recipes
                const availableIndex = availableRecipes.findIndex(r => r.id === snackRecipe.id);
                if (availableIndex !== -1) {
                  availableRecipes.splice(availableIndex, 1);
                }
              } else if (availableRecipes.length > 0) {
                snackRecipe = availableRecipes[0];
                availableRecipes.splice(0, 1);
              }
              
              if (snackRecipe) {
                snacks.push({
                  recipeId: snackRecipe.id,
                  name: snackRecipe.name,
                  calories: snackRecipe.calories,
                  protein: snackRecipe.protein,
                  carbs: snackRecipe.carbs,
                  fat: snackRecipe.fat
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
            
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      }
    }),
    {
      name: 'meal-plan-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);