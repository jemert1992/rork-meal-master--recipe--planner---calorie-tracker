import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealPlan, MealItem, DailyMeals, Recipe } from '@/types';
import { mockMealPlan } from '@/constants/mockData';

interface MealPlanState {
  mealPlan: MealPlan;
  addMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | string, meal: MealItem) => void;
  removeMeal: (date: string, mealType: string, index?: number) => void;
  addSnack: (date: string, snack: MealItem) => void;
  removeSnack: (date: string, index: number) => void;
  clearDay: (date: string) => void;
  generateMealPlan: (date: string, recipes: Recipe[]) => Promise<void>;
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
      
      generateMealPlan: async (date, recipes) => {
        return new Promise((resolve, reject) => {
          try {
            if (recipes.length < 3) {
              reject(new Error("Not enough recipes available"));
              return;
            }
            
            // Create a copy of recipes to avoid modifying the original
            const availableRecipes = [...recipes];
            
            // Shuffle the recipes
            for (let i = availableRecipes.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [availableRecipes[i], availableRecipes[j]] = [availableRecipes[j], availableRecipes[i]];
            }
            
            // Find recipes for each meal type based on tags
            const findRecipeForMealType = (mealType: string): Recipe | null => {
              // Define tags that match each meal type
              const mealTypeTags: Record<string, string[]> = {
                breakfast: ['breakfast', 'brunch', 'morning'],
                lunch: ['lunch', 'salad', 'sandwich', 'light'],
                dinner: ['dinner', 'main', 'supper', 'entree']
              };
              
              // Try to find a recipe with matching tags
              const matchingRecipes = availableRecipes.filter(recipe => 
                recipe.tags.includes(mealType) || 
                recipe.tags.some(tag => mealTypeTags[mealType]?.includes(tag))
              );
              
              if (matchingRecipes.length > 0) {
                // Get a random matching recipe
                const selectedIndex = Math.floor(Math.random() * matchingRecipes.length);
                const selectedRecipe = matchingRecipes[selectedIndex];
                
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
            
            // Generate meals for each type
            const breakfast = findRecipeForMealType('breakfast');
            const lunch = findRecipeForMealType('lunch');
            const dinner = findRecipeForMealType('dinner');
            
            // Generate 1-2 snacks
            const snackCount = Math.floor(Math.random() * 2) + 1;
            const snacks: MealItem[] = [];
            
            for (let i = 0; i < snackCount && availableRecipes.length > 0; i++) {
              const snackRecipe = availableRecipes[0];
              availableRecipes.splice(0, 1);
              
              if (snackRecipe) {
                snacks.push({
                  recipeId: snackRecipe.id,
                  name: snackRecipe.name,
                  calories: snackRecipe.calories
                });
              }
            }
            
            // Create the meal plan
            const newDayPlan: DailyMeals = {};
            
            if (breakfast) {
              newDayPlan.breakfast = {
                recipeId: breakfast.id,
                name: breakfast.name,
                calories: breakfast.calories
              };
            }
            
            if (lunch) {
              newDayPlan.lunch = {
                recipeId: lunch.id,
                name: lunch.name,
                calories: lunch.calories
              };
            }
            
            if (dinner) {
              newDayPlan.dinner = {
                recipeId: dinner.id,
                name: dinner.name,
                calories: dinner.calories
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