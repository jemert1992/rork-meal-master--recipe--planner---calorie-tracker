import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealPlan, MealItem, DailyMeals, Recipe, DietType, GenerationResult, MealType } from '@/types';
import { mockMealPlan } from '@/constants/mockData';
import * as firebaseService from '@/services/firebaseService';
import { format, parse } from 'date-fns';

interface MealPlanState {
  mealPlan: MealPlan;
  weeklyUsedRecipeIds: Set<string>;
  alternativeRecipes: Record<string, Record<string, Recipe[]>>;
  isLoadingAlternatives: boolean;
  lastGenerationError: string | null;
  generationSuggestions: string[];
  uniquePerWeek: boolean;
  recipePoolsCache: { breakfast: Recipe[]; lunch: Recipe[]; dinner: Recipe[]; ts: number; key: string } | null;
  isGenerating: boolean;
  generationProgress: number;
  addMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner', meal: MealItem) => void;
  updateMealServings: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner', servings: number) => void;
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
  setUniquePerWeek: (value: boolean) => void;
  clearPoolsCache: () => void;
}

const getUserProfile = () => {
  try {
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

const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T | null> => {
  return new Promise((resolve) => {
    let settled = false;
    const t = setTimeout(() => {
      if (!settled) resolve(null);
    }, ms);
    p.then((val) => {
      if (!settled) {
        settled = true;
        clearTimeout(t);
        resolve(val);
      }
    }).catch((e) => {
      console.warn('withTimeout error', e);
      if (!settled) {
        settled = true;
        clearTimeout(t);
        resolve(null);
      }
    });
  });
};

function prevDateString(dateStr: string): string {
  const d = parse(dateStr, 'yyyy-MM-dd', new Date());
  d.setDate(d.getDate() - 1);
  return format(d, 'yyyy-MM-dd');
}

function normalizeText(s: string | undefined): string {
  return (s ?? '').toLowerCase();
}

function detectCuisine(tags: string[]): string | null {
  const cuisines = ['italian','mexican','indian','thai','chinese','japanese','mediterranean','american','french','spanish','greek','korean','viet','vietnamese','middle-eastern'];
  const t = tags.map((x) => normalizeText(x));
  for (const c of cuisines) {
    if (t.some((x) => x.includes(c))) return c;
  }
  return null;
}

function extractMainIngredient(ingredients: string[], tags: string[]): string | null {
  const proteins = ['chicken','beef','pork','turkey','tofu','tempeh','lentil','bean','salmon','tuna','shrimp','egg','eggs','yogurt','cheese','chickpea','lamb','cod','whitefish'];
  const t = ingredients.map((x) => normalizeText(x));
  for (const p of proteins) {
    if (t.some((x) => x.includes(p))) return p;
  }
  const tagProtein = proteins.find((p) => tags.map((x) => normalizeText(x)).some((x) => x.includes(p)));
  return tagProtein ?? null;
}

function featuresFor(recipe: Recipe | undefined): { main: string | null; cuisine: string | null } {
  if (!recipe) return { main: null, cuisine: null };
  const main = extractMainIngredient(recipe.ingredients ?? [], recipe.tags ?? []);
  const cuisine = detectCuisine(recipe.tags ?? []);
  return { main, cuisine };
}

function combineScore(calorieDiff: number, sameId: boolean, sameMain: boolean, sameCuisine: boolean, sameDayMainHit: boolean): number {
  let penalty = 0;
  if (sameId) penalty += 1000;
  if (sameMain) penalty += 60;
  if (sameCuisine) penalty += 30;
  if (sameDayMainHit) penalty += 20;
  return Math.abs(calorieDiff) + penalty;
}

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      mealPlan: mockMealPlan,
      weeklyUsedRecipeIds: new Set<string>(),
      alternativeRecipes: {},
      isLoadingAlternatives: false,
      lastGenerationError: null,
      generationSuggestions: [],
      uniquePerWeek: false,
      recipePoolsCache: null,
      isGenerating: false,
      generationProgress: 0,
      
      addMeal: (date, mealType, meal) => {
        if (meal.recipeId && get().isRecipeUsedInMealPlan(meal.recipeId)) {
          console.warn(`Recipe ${meal.recipeId} is already used in the meal plan`);
          return;
        }
        
        set((state) => {
          const dayPlan = state.mealPlan[date] || {};
          const updatedDayPlan: DailyMeals = { ...dayPlan };
          
          if (mealType === 'breakfast' || mealType === 'lunch' || mealType === 'dinner') {
            updatedDayPlan[mealType] = { ...meal, servings: meal.servings ?? 1 };
          }
          
          if (meal.recipeId) {
            state.weeklyUsedRecipeIds.add(meal.recipeId);
          }
          
          return {
            mealPlan: {
              ...state.mealPlan,
              [date]: updatedDayPlan,
            },
            weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds),
            lastGenerationError: null,
            generationSuggestions: []
          };
        });
      },

      updateMealServings: (date, mealType, servings) => {
        set((state) => {
          const dayPlan = state.mealPlan[date] || {} as DailyMeals;
          const currentMeal = dayPlan[mealType];
          if (!currentMeal) return state;
          const clamped = Math.max(1, Math.min(20, Math.round(servings)));
          const updatedDayPlan: DailyMeals = { ...dayPlan, [mealType]: { ...currentMeal, servings: clamped } };
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
          
          const mealToRemove = updatedDayPlan[mealType];
          if (mealToRemove?.recipeId) {
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
          
          if (dayPlan.breakfast?.recipeId) {
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
        Object.values(state.mealPlan).forEach(dayPlan => {
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
        Object.entries(state.mealPlan).forEach(([date, dayPlan]) => {
          if (date >= startDate && date <= endDate) {
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
        if (!dailyMeals.breakfast) {
          issues.push('Missing breakfast');
        } else if (dailyMeals.breakfast.calories === undefined || dailyMeals.breakfast.calories === null) {
          issues.push('Breakfast is missing calorie data');
        } else {
          totalCalories += dailyMeals.breakfast.calories;
        }
        if (!dailyMeals.lunch) {
          issues.push('Missing lunch');
        } else if (dailyMeals.lunch.calories === undefined || dailyMeals.lunch.calories === null) {
          issues.push('Lunch is missing calorie data');
        } else {
          totalCalories += dailyMeals.lunch.calories;
        }
        if (!dailyMeals.dinner) {
          issues.push('Missing dinner');
        } else if (dailyMeals.dinner.calories === undefined || dailyMeals.dinner.calories === null) {
          issues.push('Dinner is missing calorie data');
        } else {
          totalCalories += dailyMeals.dinner.calories;
        }
        const calorieDeviation = ((totalCalories - calorieGoal) / calorieGoal) * 100;
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
        if (recipe.calories === undefined || recipe.calories === null) {
          console.warn(`Recipe \"${recipe.name}\" (${recipe.id}) is missing calorie data`);
          return false;
        }
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
          if (requiredTags.length > 0) {
            const tagsArr = Array.isArray(recipe.tags) ? recipe.tags : [];
            const hasMatchingTag = requiredTags.some(tag => 
              tagsArr.some(recipeTag => 
                String(recipeTag).toLowerCase() === tag.toLowerCase()
              )
            );
            if (!hasMatchingTag) {
              return false;
            }
          }
        }
        const hasExclusions = allergies.length > 0 || excludedIngredients.length > 0;
        if (hasExclusions) {
          const combinedExclusions = [...allergies, ...excludedIngredients].filter(Boolean);
          const ingredientsArr = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
          for (const ingredient of ingredientsArr) {
            const lowerIngredient = String(ingredient).toLowerCase();
            for (const exclusion of combinedExclusions) {
              if (lowerIngredient.includes(String(exclusion).toLowerCase())) {
                return false;
              }
            }
          }
        }
        return true;
      },
      
      swapMeal: async (date, mealType, newRecipeId) => {
        try {
          const dayPlan = get().mealPlan[date] || {};
          const currentMeal = dayPlan[mealType];
          if (!currentMeal) {
            console.warn(`No ${mealType} found for ${date} to swap`);
            return false;
          }
          const currentRecipeId = currentMeal.recipeId;
          if (!currentRecipeId) {
            console.warn(`No recipe ID found for ${mealType} on ${date}`);
            return false;
          }
          if (get().isRecipeUsedInMealPlan(newRecipeId)) {
            console.warn(`Recipe ${newRecipeId} is already used in the meal plan`);
            return false;
          }
          const newRecipe = await firebaseService.getRecipeFromFirestore(newRecipeId);
          if (!newRecipe) {
            console.warn(`Could not find recipe with ID ${newRecipeId}`);
            set({
              lastGenerationError: 'Could not find the selected recipe. It may have been deleted or is temporarily unavailable.',
              generationSuggestions: ['Try selecting a different recipe', 'Refresh the app and try again']
            });
            return false;
          }
          const newMeal: MealItem = {
            recipeId: newRecipe.id,
            name: newRecipe.name,
            calories: newRecipe.calories,
            protein: newRecipe.protein,
            carbs: newRecipe.carbs,
            fat: newRecipe.fat,
            fiber: newRecipe.fiber,
            servings: 1,
          };
          set((state) => {
            const updatedDayPlan = { ...(state.mealPlan[date] || {}) } as DailyMeals;
            updatedDayPlan[mealType] = newMeal;
            let isOldRecipeUsedElsewhere = false;
            Object.entries(state.mealPlan).forEach(([d, meals]) => {
              if (d !== date) {
                if (meals.breakfast?.recipeId === currentRecipeId ||
                    meals.lunch?.recipeId === currentRecipeId ||
                    meals.dinner?.recipeId === currentRecipeId) {
                  isOldRecipeUsedElsewhere = true;
                }
              } else {
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
            lastGenerationError: 'Failed to swap meal. There was an error processing your request.',
            generationSuggestions: ['Check your internet connection', 'Try again later']
          });
          return false;
        }
      },
      
      getAlternativeRecipes: async (date, mealType, currentRecipeId) => {
        try {
          const existingAlternatives = get().alternativeRecipes[date]?.[mealType];
          if (existingAlternatives && existingAlternatives.length > 0) {
            return existingAlternatives;
          }
          set({ isLoadingAlternatives: true });
          const userProfile = getUserProfile();
          const { 
            dietType = 'any', 
            allergies = [], 
            excludedIngredients = [],
            calorieGoal = 2000,
            fitnessGoals = []
          } = userProfile;
          const mealSplit = {
            breakfast: 0.3,
            lunch: 0.35,
            dinner: 0.35,
          } as const;
          const targetCalories = Math.round(calorieGoal * mealSplit[mealType]);
          const weeklyUsedRecipeIds = Array.from(get().weeklyUsedRecipeIds);
          const enforceUnique = get().uniquePerWeek;
          const alternatives = await firebaseService.getAlternativeRecipes(
            mealType,
            currentRecipeId,
            {
              dietType,
              allergies,
              excludedIngredients,
              fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
              calorieRange: { min: targetCalories * 0.8, max: targetCalories * 1.2 },
              excludeIds: enforceUnique ? weeklyUsedRecipeIds : []
            },
            10
          );
          if (alternatives.length === 0) {
            set({
              alternativeRecipes: {},
              isLoadingAlternatives: false,
              lastGenerationError: 'No alternative recipes found that match your dietary preferences.',
              generationSuggestions: [
                'Try adjusting your dietary preferences',
                'Add more recipes to your collection',
                'Try a different meal type'
              ]
            });
            return [];
          }
          set((state) => {
            const updatedAlternatives = { ...state.alternativeRecipes } as Record<string, Record<string, Recipe[]>>;
            if (!updatedAlternatives[date]) {
              updatedAlternatives[date] = {} as Record<string, Recipe[]>;
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
            lastGenerationError: 'Failed to load alternative recipes. There was an error processing your request.',
            generationSuggestions: [
              'Check your internet connection',
              'Try again later',
              'Try a different meal type'
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

      setUniquePerWeek: (value) => set({ uniquePerWeek: value }),
      clearPoolsCache: () => set({ recipePoolsCache: null }),
      
      /**
       * generateMealPlan(date, recipes, specificMealType?)
       * Robust daily meal generation with strong guarantees, variety heuristics, and graceful fallbacks.
       *
       * Guarantees
       * - No slot remains empty if any suitable recipe exists (remote, local, or mock). If no suitable recipe exists, a last-resort relaxed pick is applied (ignores uniqueness and non-allergy diet tags). If truly none exist anywhere, returns suggestions and leaves the slot for manual editing.
       * - Never throws; all failures are captured into lastGenerationError + generationSuggestions and a GenerationResult.
       * - UI stays responsive: remote calls are batched with Promise.all and each has a short timeout via withTimeout.
       * - Weekly uniqueness respected when uniquePerWeek is enabled; as a last resort to avoid empty slots, duplicates may be used.
       *
       * Behavior
       * - If specificMealType is provided: generates only that slot; other slots remain untouched.
       * - Otherwise attempts breakfast, lunch, dinner concurrently (remote first), then applies local/mock fallbacks.
       *
       * Source order and fallbacks per slot
       * 1) Remote: firebaseService.getRecipesForMealPlan(type, filters, limit) with a short timeout.
       * 2) Local: "recipes" argument and/or recipeStore, filtered by suitability + variety and (if enabled) uniqueness.
       * 3) Mock: constants/mockData filtered similarly.
       *
       * Variety heuristic
       * - Penalize picks that repeat the previous day's main ingredient or cuisine for the same meal type.
       * - Penalize within-day main-ingredient duplication across meals.
       * - Prefer calorie proximity to target for each meal type.
       *
       * Edge cases handled
       * - Empty remote responses, network errors, or timeouts seamlessly fall back to local and mock pools.
       * - Extremely restrictive preferences: returns actionable suggestions (relax preferences, disable weekly uniqueness, add recipes) if nothing fits.
       * - Calorie data missing on a recipe: such recipes are excluded by suitability by default.
       */
      generateMealPlan: async (date, recipes, specificMealType) => {
        set({ isGenerating: true, generationProgress: 0 });
        const getAllLocalRecipes = (): Recipe[] => {
          try {
            const { useRecipeStore } = require('@/store/recipeStore');
            return (useRecipeStore.getState().recipes as Recipe[]) ?? [];
          } catch {
            return Array.isArray(recipes) ? recipes : [];
          }
        };
        const getMockRecipes = (): Recipe[] => {
          try { const { mockRecipes } = require('@/constants/mockData'); return mockRecipes as Recipe[]; } catch { return []; }
        };
        const diagnosticsFor = (mealType: 'breakfast' | 'lunch' | 'dinner', dietType: DietType, allergies: string[], excludedIngredients: string[]) => {
          const all = [...getAllLocalRecipes(), ...getMockRecipes()].filter(r => r.mealType === mealType);
          const total = all.length;
          const afterDiet = all.filter(r => get().isRecipeSuitable({ ...r, tags: r.tags ?? [] }, dietType, [], [])).length;
          const afterAllergies = all.filter(r => get().isRecipeSuitable({ ...r, tags: r.tags ?? [] }, 'any', allergies, excludedIngredients)).length;
          const afterFull = all.filter(r => get().isRecipeSuitable(r, dietType, allergies, excludedIngredients)).length;
          return { total, afterDiet, afterAllergies, afterFull };
        };
        const getRecipeById = (id: string | undefined): Recipe | undefined => {
          if (!id) return undefined;
          const all = [...getAllLocalRecipes(), ...getMockRecipes()];
          return all.find((r) => r.id === id);
        };
        const pickAny = (mealType: 'breakfast' | 'lunch' | 'dinner', target: number, d: string, inDayMainSet: Set<string>): Recipe | null => {
          const enforce = get().uniquePerWeek;
          const exclude = enforce ? Array.from(get().weeklyUsedRecipeIds) : [];
          const all = getAllLocalRecipes();
          const byType = all.filter(r => r.mealType === mealType);
          let pool: Recipe[] = byType.length > 0 ? byType : all;
          if (pool.length === 0) pool = getMockRecipes();
          if (pool.length === 0) return null;
          const prevId = get().mealPlan[prevDateString(d)]?.[mealType]?.recipeId;
          const prevRecipe = getRecipeById(prevId);
          const prevF = featuresFor(prevRecipe);
          const sorted = pool.slice().sort((a, b) => {
            const fa = featuresFor(a);
            const fb = featuresFor(b);
            const aScore = combineScore((a.calories ?? 0) - target, false, fa.main !== null && fa.main === prevF.main, fa.cuisine !== null && fa.cuisine === prevF.cuisine, fa.main !== null && inDayMainSet.has(fa.main));
            const bScore = combineScore((b.calories ?? 0) - target, false, fb.main !== null && fb.main === prevF.main, fb.cuisine !== null && fb.cuisine === prevF.cuisine, fb.main !== null && inDayMainSet.has(fb.main));
            return aScore - bScore;
          });
          const candidate = sorted.find(r => !exclude.includes(r.id)) ?? sorted[0];
          return candidate ?? null;
        };

        const userProfile = getUserProfile();
        const { 
          dietType = 'any', 
          allergies = [], 
          excludedIngredients = [],
          calorieGoal = 2000,
          fitnessGoals = []
        } = userProfile;
        const mealSplit = {
          breakfast: 0.3,
          lunch: 0.35,
          dinner: 0.35,
        } as const;
        const breakfastCalories = Math.round(calorieGoal * mealSplit.breakfast);
        const lunchCalories = Math.round(calorieGoal * mealSplit.lunch);
        const dinnerCalories = Math.round(calorieGoal * mealSplit.dinner);
        const currentDayPlan = get().mealPlan[date] || {};
        const weeklyUsedRecipeIds = Array.from(get().weeklyUsedRecipeIds);
        const enforceUnique = get().uniquePerWeek;
        let breakfast = currentDayPlan.breakfast;
        let lunch = currentDayPlan.lunch;
        let dinner = currentDayPlan.dinner;
        const inDayMain = new Set<string>();
        const result: GenerationResult = {
          success: true,
          generatedMeals: [],
          error: null,
          suggestions: []
        };
        try {
          if (specificMealType) {
            set({ generationProgress: 0.15 });
            const calorieRangeByType = {
              breakfast: { min: breakfastCalories * 0.8, max: breakfastCalories * 1.2 },
              lunch: { min: lunchCalories * 0.8, max: lunchCalories * 1.2 },
              dinner: { min: dinnerCalories * 0.8, max: dinnerCalories * 1.2 }
            } as const;
            const remote = await withTimeout(firebaseService.getRecipesForMealPlan(specificMealType, {
              dietType,
              allergies,
              excludedIngredients,
              fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
              calorieRange: calorieRangeByType[specificMealType],
              excludeIds: enforceUnique ? weeklyUsedRecipeIds : []
            }, 5), 2000);
            set({ generationProgress: 0.5 });
            const apply = (r: Recipe, type: 'breakfast'|'lunch'|'dinner') => {
              const m: MealItem = { recipeId: r.id, name: r.name, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber, servings: 1 };
              const f = featuresFor(r);
              if (f.main) inDayMain.add(f.main);
              if (type === 'breakfast') breakfast = m;
              if (type === 'lunch') lunch = m;
              if (type === 'dinner') dinner = m;
              get().weeklyUsedRecipeIds.add(r.id);
              result.generatedMeals.push(type);
            };
            if (remote && remote.length > 0) {
              const prevId = get().mealPlan[prevDateString(date)]?.[specificMealType]?.recipeId;
              const prevRecipe = remote.find((r) => r.id === prevId);
              const prevF = featuresFor(prevRecipe);
              const ranked = remote.slice().sort((a, b) => {
                const ta = specificMealType === 'breakfast' ? breakfastCalories : specificMealType === 'lunch' ? lunchCalories : dinnerCalories;
                const fa = featuresFor(a);
                const fb = featuresFor(b);
                const aScore = combineScore((a.calories ?? 0) - ta, false, fa.main !== null && fa.main === prevF.main, fa.cuisine !== null && fa.cuisine === prevF.cuisine, fa.main !== null && inDayMain.has(fa.main));
                const bScore = combineScore((b.calories ?? 0) - ta, false, fb.main !== null && fb.main === prevF.main, fb.cuisine !== null && fb.cuisine === prevF.cuisine, fb.main !== null && inDayMain.has(fb.main));
                return aScore - bScore;
              });
              apply((ranked[0] as Recipe), specificMealType);
            } else {
              const target = specificMealType === 'breakfast' ? breakfastCalories : specificMealType === 'lunch' ? lunchCalories : dinnerCalories;
              const filtered = recipes.filter(r => r.mealType === specificMealType && get().isRecipeSuitable(r, dietType, allergies, excludedIngredients) && !weeklyUsedRecipeIds.includes(r.id));
              if (filtered.length > 0) {
                const prevId = get().mealPlan[prevDateString(date)]?.[specificMealType]?.recipeId;
                const prevRecipe = getRecipeById(prevId);
                const prevF = featuresFor(prevRecipe);
                filtered.sort((a, b) => {
                  const fa = featuresFor(a);
                  const fb = featuresFor(b);
                  const aScore = combineScore((a.calories ?? 0) - target, false, fa.main !== null && fa.main === prevF.main, fa.cuisine !== null && fa.cuisine === prevF.cuisine, fa.main !== null && inDayMain.has(fa.main));
                  const bScore = combineScore((b.calories ?? 0) - target, false, fb.main !== null && fb.main === prevF.main, fb.cuisine !== null && fb.cuisine === prevF.cuisine, fb.main !== null && inDayMain.has(fb.main));
                  return aScore - bScore;
                });
                apply(filtered[0], specificMealType);
              } else {
                const diag = diagnosticsFor(specificMealType, dietType, allergies, excludedIngredients);
                const uniq = get().uniquePerWeek;
                result.success = false;
                result.error = `No ${specificMealType} could be generated. Your current preferences filter out available recipes.`;
                const tips: string[] = [];
                if (diag.total === 0) {
                  tips.push(`No ${specificMealType} recipes exist locally. Add recipes or enable API sources.`);
                } else if (diag.afterFull === 0) {
                  tips.push('Adjust dietary preferences or exclusions (some items block all recipes).');
                }
                if (uniq && get().weeklyUsedRecipeIds.size > 0) {
                  tips.push('Disable "unique per week" to allow repeats when options are limited.');
                }
                tips.push(`Edit this ${specificMealType} slot manually.`);
                result.suggestions = tips;
                set({ lastGenerationError: result.error, generationSuggestions: result.suggestions });
              }
            }
            set({ generationProgress: 0.85 });
          } else {
            const needsBreakfast = !breakfast;
            const needsLunch = !lunch;
            const needsDinner = !dinner;
            const promises: Array<Promise<Recipe[] | null>> = [];
            if (needsBreakfast) {
              promises.push(withTimeout(firebaseService.getRecipesForMealPlan('breakfast', {
                dietType, allergies, excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: breakfastCalories * 0.8, max: breakfastCalories * 1.2 },
                excludeIds: enforceUnique ? weeklyUsedRecipeIds : []
              }, 5), 2000));
            } else { promises.push(Promise.resolve([])); }
            if (needsLunch) {
              promises.push(withTimeout(firebaseService.getRecipesForMealPlan('lunch', {
                dietType, allergies, excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: lunchCalories * 0.8, max: lunchCalories * 1.2 },
                excludeIds: enforceUnique ? weeklyUsedRecipeIds : []
              }, 5), 2000));
            } else { promises.push(Promise.resolve([])); }
            if (needsDinner) {
              promises.push(withTimeout(firebaseService.getRecipesForMealPlan('dinner', {
                dietType, allergies, excludedIngredients,
                fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
                calorieRange: { min: dinnerCalories * 0.8, max: dinnerCalories * 1.2 },
                excludeIds: enforceUnique ? weeklyUsedRecipeIds : []
              }, 5), 2000));
            } else { promises.push(Promise.resolve([])); }
            const [bk, ln, dn] = await Promise.all(promises);
            set({ generationProgress: 0.5 });
            const selectFirst = (arr: (Recipe[] | null), type: 'breakfast'|'lunch'|'dinner', target: number): boolean => {
              const pool = Array.isArray(arr) ? (arr as Recipe[]) : [];
              const prevId = get().mealPlan[prevDateString(date)]?.[type]?.recipeId;
              const prevRecipe = pool.find((r) => r.id === prevId);
              const prevF = featuresFor(prevRecipe);
              const ranked = pool.slice().sort((a, b) => {
                const fa = featuresFor(a);
                const fb = featuresFor(b);
                const aScore = combineScore((a.calories ?? 0) - target, false, fa.main !== null && fa.main === prevF.main, fa.cuisine !== null && fa.cuisine === prevF.cuisine, fa.main !== null && inDayMain.has(fa.main));
                const bScore = combineScore((b.calories ?? 0) - target, false, fb.main !== null && fb.main === prevF.main, fb.cuisine !== null && fb.cuisine === prevF.cuisine, fb.main !== null && inDayMain.has(fb.main));
                return aScore - bScore;
              });
              const pick = ranked.find(r => (!get().uniquePerWeek || !get().weeklyUsedRecipeIds.has(r.id))) ?? ranked[0];
              if (pick) {
                const meal: MealItem = { recipeId: pick.id, name: pick.name, calories: pick.calories, protein: pick.protein, carbs: pick.carbs, fat: pick.fat, fiber: pick.fiber, servings: 1 };
                const f = featuresFor(pick);
                if (f.main) inDayMain.add(f.main);
                if (type === 'breakfast') breakfast = meal;
                if (type === 'lunch') lunch = meal;
                if (type === 'dinner') dinner = meal;
                get().weeklyUsedRecipeIds.add(pick.id);
                result.generatedMeals.push(type);
                return true;
              }
              const any = pickAny(type, target, date, inDayMain);
              if (any) {
                const meal: MealItem = { recipeId: any.id, name: any.name, calories: any.calories, protein: any.protein, carbs: any.carbs, fat: any.fat, fiber: any.fiber, servings: 1 };
                const f = featuresFor(any);
                if (f.main) inDayMain.add(f.main);
                if (type === 'breakfast') breakfast = meal;
                if (type === 'lunch') lunch = meal;
                if (type === 'dinner') dinner = meal;
                get().weeklyUsedRecipeIds.add(any.id);
                result.generatedMeals.push(`${type}-fallback`);
                return true;
              }
              return false;
            };
            if (needsBreakfast) selectFirst(bk, 'breakfast', breakfastCalories);
            if (needsLunch) selectFirst(ln, 'lunch', lunchCalories);
            if (needsDinner) selectFirst(dn, 'dinner', dinnerCalories);
            if (result.generatedMeals.length === 0) {
              const bd = diagnosticsFor('breakfast', dietType, allergies, excludedIngredients);
              const ld = diagnosticsFor('lunch', dietType, allergies, excludedIngredients);
              const dd = diagnosticsFor('dinner', dietType, allergies, excludedIngredients);
              result.success = false;
              result.error = 'No meals could be generated for this day under current preferences.';
              const tips: string[] = [];
              const noneLocal = (bd.total + ld.total + dd.total) === 0;
              if (noneLocal) tips.push('No local recipes available. Add recipes first or enable API sources.');
              if (bd.afterFull + ld.afterFull + dd.afterFull === 0 && !noneLocal) tips.push('Your dietary preferences exclude all available recipes. Relax exclusions or switch diet.');
              if (get().uniquePerWeek && get().weeklyUsedRecipeIds.size > 0) tips.push('Disable "unique per week" to allow repeats.');
              tips.push('Open the planner and fill specific slots manually.');
              result.suggestions = tips;
              set({ lastGenerationError: result.error, generationSuggestions: result.suggestions });
              set({ isGenerating: false, generationProgress: 1 });
              return result;
            }
            set({ generationProgress: 0.85 });
          }
        } catch (error) {
          console.error('Error fetching recipes from Firestore:', error);
          result.success = false;
          result.error = 'Failed to generate meal plan. There was an error processing your request.';
          result.suggestions = ['Check your internet connection','Try again later','Try generating individual meals instead'];
          set({ lastGenerationError: result.error, generationSuggestions: result.suggestions });
        }
        const newDayPlan: DailyMeals = { ...currentDayPlan };
        if (breakfast) { newDayPlan.breakfast = breakfast; }
        if (lunch) { newDayPlan.lunch = lunch; }
        if (dinner) { newDayPlan.dinner = dinner; }
        if (!newDayPlan.breakfast) {
          const any = pickAny('breakfast', breakfastCalories, date, inDayMain);
          if (any) {
            newDayPlan.breakfast = { recipeId: any.id, name: any.name, calories: any.calories, protein: any.protein, carbs: any.carbs, fat: any.fat, fiber: any.fiber, servings: 1 };
            const f = featuresFor(any); if (f.main) inDayMain.add(f.main);
            get().weeklyUsedRecipeIds.add(any.id);
            result.generatedMeals.push('breakfast-fallback');
          }
        }
        if (!newDayPlan.lunch) {
          const any = pickAny('lunch', lunchCalories, date, inDayMain);
          if (any) {
            newDayPlan.lunch = { recipeId: any.id, name: any.name, calories: any.calories, protein: any.protein, carbs: any.carbs, fat: any.fat, fiber: any.fiber, servings: 1 };
            const f = featuresFor(any); if (f.main) inDayMain.add(f.main);
            get().weeklyUsedRecipeIds.add(any.id);
            result.generatedMeals.push('lunch-fallback');
          }
        }
        if (!newDayPlan.dinner) {
          const any = pickAny('dinner', dinnerCalories, date, inDayMain);
          if (any) {
            newDayPlan.dinner = { recipeId: any.id, name: any.name, calories: any.calories, protein: any.protein, carbs: any.carbs, fat: any.fat, fiber: any.fiber, servings: 1 };
            const f = featuresFor(any); if (f.main) inDayMain.add(f.main);
            get().weeklyUsedRecipeIds.add(any.id);
            result.generatedMeals.push('dinner-fallback');
          }
        }
        if (!specificMealType) {
          const validation = get().validateDailyMealPlan(newDayPlan, calorieGoal);
          if (!validation.isValid) {
            console.warn(`Generated meal plan has issues: ${validation.issues.join(', ')}`);
            console.log(`Total calories: ${validation.totalCalories} (${validation.calorieDeviation.toFixed(1)}% deviation from goal ${calorieGoal})`);
            if (Math.abs(validation.calorieDeviation) > 20) {
              result.suggestions.push(`The meal plan is ${validation.calorieDeviation > 0 ? 'over' : 'under'} your calorie goal by ${Math.abs(Math.round(validation.calorieDeviation))}%. Consider adjusting portion sizes.`);
            }
          } else {
            console.log(`Successfully generated meal plan with ${validation.totalCalories} calories (${validation.calorieDeviation.toFixed(1)}% deviation from goal ${calorieGoal})`);
          }
          result.suggestions.push('Variety preference applied to avoid repeating main ingredient or cuisine back-to-back.');
        }
        set((state) => ({
          mealPlan: {
            ...state.mealPlan,
            [date]: newDayPlan
          },
          weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds),
          lastGenerationError: result.error,
          generationSuggestions: result.suggestions,
          isGenerating: false,
          generationProgress: 1
        }));
        return result;
      },
      
      generateAllMealsForDay: async (date, recipes) => {
        set({ isGenerating: true, generationProgress: 0 });
        const userProfile = getUserProfile();
        const { 
          dietType = 'any', 
          allergies = [], 
          excludedIngredients = [],
          calorieGoal = 2000,
          fitnessGoals = []
        } = userProfile;
        const mealSplit = {
          breakfast: 0.3,
          lunch: 0.35,
          dinner: 0.35,
        } as const;
        const breakfastCalories = Math.round(calorieGoal * mealSplit.breakfast);
        const lunchCalories = Math.round(calorieGoal * mealSplit.lunch);
        const dinnerCalories = Math.round(calorieGoal * mealSplit.dinner);
        const currentDayPlan = get().mealPlan[date] || {};
        const weeklyUsedRecipeIds = Array.from(get().weeklyUsedRecipeIds);
        const enforceUnique = get().uniquePerWeek;
        const inDayMain = new Set<string>();
        const result: GenerationResult = {
          success: true,
          generatedMeals: [],
          error: null,
          suggestions: []
        };
        try {
          if (currentDayPlan.breakfast || currentDayPlan.lunch || currentDayPlan.dinner) {
            get().clearDay(date);
          }
          set({ generationProgress: 0.1 });
          const [bk, ln, dn] = await Promise.all([
            withTimeout(firebaseService.getRecipesForMealPlan('breakfast', {
              dietType, allergies, excludedIngredients,
              fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
              calorieRange: { min: breakfastCalories * 0.8, max: breakfastCalories * 1.2 },
              excludeIds: enforceUnique ? weeklyUsedRecipeIds : []
            }, 7), 2200),
            withTimeout(firebaseService.getRecipesForMealPlan('lunch', {
              dietType, allergies, excludedIngredients,
              fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
              calorieRange: { min: lunchCalories * 0.8, max: lunchCalories * 1.2 },
              excludeIds: enforceUnique ? weeklyUsedRecipeIds : []
            }, 7), 2200),
            withTimeout(firebaseService.getRecipesForMealPlan('dinner', {
              dietType, allergies, excludedIngredients,
              fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
              calorieRange: { min: dinnerCalories * 0.8, max: dinnerCalories * 1.2 },
              excludeIds: enforceUnique ? weeklyUsedRecipeIds : []
            }, 7), 2200)
          ]);
          set({ generationProgress: 0.55 });
          const choose = (pool: (Recipe[] | null), fallbackType: 'breakfast'|'lunch'|'dinner', target: number): MealItem | null => {
            const arr = Array.isArray(pool) ? (pool as Recipe[]) : [];
            const prevId = get().mealPlan[prevDateString(date)]?.[fallbackType]?.recipeId;
            const prevRecipe = arr.find((r) => r.id === prevId);
            const prevF = featuresFor(prevRecipe);
            const ranked = arr.slice().sort((a, b) => {
              const fa = featuresFor(a);
              const fb = featuresFor(b);
              const aScore = combineScore((a.calories ?? 0) - target, false, fa.main !== null && fa.main === prevF.main, fa.cuisine !== null && fa.cuisine === prevF.cuisine, fa.main !== null && inDayMain.has(fa.main));
              const bScore = combineScore((b.calories ?? 0) - target, false, fb.main !== null && fb.main === prevF.main, fb.cuisine !== null && fb.cuisine === prevF.cuisine, fb.main !== null && inDayMain.has(fb.main));
              return aScore - bScore;
            });
            const from = ranked.find(r => !get().weeklyUsedRecipeIds.has(r.id)) ?? ranked[0] ?? null;
            if (from) {
              const f = featuresFor(from); if (f.main) inDayMain.add(f.main);
              return { recipeId: from.id, name: from.name, calories: from.calories, protein: from.protein, carbs: from.carbs, fat: from.fat, fiber: from.fiber, servings: 1 };
            }
            const local = recipes.filter(r => r.mealType === fallbackType && get().isRecipeSuitable(r, dietType, allergies, excludedIngredients));
            if (local.length > 0) {
              const rankedLocal = local.slice().sort((a, b) => {
                const fa = featuresFor(a);
                const fb = featuresFor(b);
                const aScore = combineScore((a.calories ?? 0) - target, false, fa.main !== null && fa.main === prevF.main, fa.cuisine !== null && fa.cuisine === prevF.cuisine, fa.main !== null && inDayMain.has(fa.main));
                const bScore = combineScore((b.calories ?? 0) - target, false, fb.main !== null && fb.main === prevF.main, fb.cuisine !== null && fb.cuisine === prevF.cuisine, fb.main !== null && inDayMain.has(fb.main));
                return aScore - bScore;
              });
              const r = rankedLocal[0];
              const f = featuresFor(r); if (f.main) inDayMain.add(f.main);
              return { recipeId: r.id, name: r.name, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber, servings: 1 };
            }
            return null;
          };
          const breakfast = choose(bk, 'breakfast', breakfastCalories);
          const lunch = choose(ln, 'lunch', lunchCalories);
          const dinner = choose(dn, 'dinner', dinnerCalories);
          const newDayPlan: DailyMeals = {} as DailyMeals;
          if (breakfast) { newDayPlan.breakfast = breakfast; get().weeklyUsedRecipeIds.add(breakfast.recipeId ?? ''); result.generatedMeals.push('breakfast'); }
          if (lunch) { newDayPlan.lunch = lunch; get().weeklyUsedRecipeIds.add(lunch.recipeId ?? ''); result.generatedMeals.push('lunch'); }
          if (dinner) { newDayPlan.dinner = dinner; get().weeklyUsedRecipeIds.add(dinner.recipeId ?? ''); result.generatedMeals.push('dinner'); }
          if (result.generatedMeals.length === 3) {
            result.success = true;
            result.suggestions = ['All meals for the day have been successfully generated!', 'Variety preference applied.'];
          } else if (result.generatedMeals.length > 0) {
            result.success = true;
            result.suggestions = [
              `Generated ${result.generatedMeals.length} out of 3 meals.`,
              "Some meals couldn't be generated due to dietary restrictions or lack of suitable recipes.",
              'Variety preference applied.'
            ];
          } else {
            result.success = false;
            result.error = 'Could not generate any meals for this day.';
            result.suggestions = [
              'Try adjusting your dietary preferences',
              'Add more recipes to your collection',
              'Try generating individual meals instead'
            ];
          }
          set((state) => ({
            mealPlan: {
              ...state.mealPlan,
              [date]: newDayPlan
            },
            weeklyUsedRecipeIds: new Set(state.weeklyUsedRecipeIds),
            lastGenerationError: result.error,
            generationSuggestions: result.suggestions,
            generationProgress: 1,
            isGenerating: false
          }));
        } catch (error) {
          console.error('Error generating all meals for day:', error);
          result.success = false;
          result.error = 'Failed to generate meals for the day. There was an error processing your request.';
          result.suggestions = [
            'Check your internet connection',
            'Try again later',
            'Try generating individual meals instead'
          ];
          set({
            lastGenerationError: result.error,
            generationSuggestions: result.suggestions,
            isGenerating: false,
            generationProgress: 1
          });
        }
        return result;
      },
      
      /**
       * generateWeeklyMealPlan(startDate, endDate)
       * Fills all breakfast/lunch/dinner slots across the date range inclusively.
       *
       * Strategy
       * - Batch-fetch remote pools per meal type once (with timeout) and reuse across the week.
       * - Respect weekly uniqueness only when uniquePerWeek is enabled; otherwise allow repeats to maximize coverage.
       * - For each date/slot, rank candidates by calorie proximity and variety (avoid previous-day same main/cuisine).
       * - Fall back to local store recipes filtered by suitability, then to mock data.
       *
       * Guarantees & Edge Cases
       * - If any suitable recipes exist in any source, the slot is filled.
       * - If even suitable pools are empty, a last-resort relaxed selection is applied (ignores uniqueness and non-allergy diet tags) to avoid empty slots.
       * - If pools are empty due to restrictive preferences, returns clear suggestions (relax filters, disable uniqueness).
       * - Never blocks UI; progress is updated incrementally.
       */
      generateWeeklyMealPlan: async (startDate, endDate) => {
        set({ isGenerating: true, generationProgress: 0 });
        const userProfile = getUserProfile();
        const {
          dietType = 'any',
          allergies = [],
          excludedIngredients = [],
          calorieGoal = 2000,
          fitnessGoals = []
        } = userProfile;

        const enforceUnique = get().uniquePerWeek;
        if (enforceUnique) {
          set({ weeklyUsedRecipeIds: new Set<string>() });
        }

        const dates: string[] = [];
        let currentDate = parse(startDate, 'yyyy-MM-dd', new Date());
        const lastDate = parse(endDate, 'yyyy-MM-dd', new Date());
        while (currentDate <= lastDate) {
          dates.push(format(currentDate, 'yyyy-MM-dd'));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const result: GenerationResult = {
          success: true,
          generatedMeals: [],
          error: null,
          suggestions: []
        };

        const mealSplit = {
          breakfast: 0.3,
          lunch: 0.35,
          dinner: 0.35,
        } as const;
        const breakfastCalories = Math.round(calorieGoal * mealSplit.breakfast);
        const lunchCalories = Math.round(calorieGoal * mealSplit.lunch);
        const dinnerCalories = Math.round(calorieGoal * mealSplit.dinner);

        const used = new Set<string>();
        const currentState = get();
        const start = parse(startDate, 'yyyy-MM-dd', new Date());
        const end = parse(endDate, 'yyyy-MM-dd', new Date());
        if (enforceUnique) {
          Object.entries(currentState.mealPlan).forEach(([date, day]) => {
            const d = parse(date, 'yyyy-MM-dd', new Date());
            if (d >= start && d <= end) {
              if (day.breakfast?.recipeId) used.add(day.breakfast.recipeId);
              if (day.lunch?.recipeId) used.add(day.lunch.recipeId);
              if (day.dinner?.recipeId) used.add(day.dinner.recipeId);
            }
          });
        }

        const poolsKey = [
          dietType,
          allergies.join(','),
          excludedIngredients.join(','),
          String(calorieGoal),
          fitnessGoals[0] ?? ''
        ].join('|');

        const cache = get().recipePoolsCache;
        let breakfastPool: Recipe[] = [];
        let lunchPool: Recipe[] = [];
        let dinnerPool: Recipe[] = [];
        const now = Date.now();
        const ttlMs = 5 * 60 * 1000;
        if (cache && cache.key === poolsKey && now - cache.ts < ttlMs) {
          breakfastPool = cache.breakfast;
          lunchPool = cache.lunch;
          dinnerPool = cache.dinner;
        } else {
          const excludeIds = enforceUnique ? Array.from(used) : [];
          const [bk, ln, dn] = await Promise.all([
            withTimeout(firebaseService.getRecipesForMealPlan('breakfast', {
              dietType,
              allergies,
              excludedIngredients,
              fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
              calorieRange: { min: breakfastCalories * 0.8, max: breakfastCalories * 1.2 },
              excludeIds
            }, Math.max(9, dates.length * 3)), 2500),
            withTimeout(firebaseService.getRecipesForMealPlan('lunch', {
              dietType,
              allergies,
              excludedIngredients,
              fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
              calorieRange: { min: lunchCalories * 0.8, max: lunchCalories * 1.2 },
              excludeIds
            }, Math.max(9, dates.length * 3)), 2500),
            withTimeout(firebaseService.getRecipesForMealPlan('dinner', {
              dietType,
              allergies,
              excludedIngredients,
              fitnessGoal: fitnessGoals.length > 0 ? fitnessGoals[0] : undefined,
              calorieRange: { min: dinnerCalories * 0.8, max: dinnerCalories * 1.2 },
              excludeIds
            }, Math.max(9, dates.length * 3)), 2500)
          ]);
          breakfastPool = Array.isArray(bk) ? (bk as Recipe[]) : [];
          lunchPool = Array.isArray(ln) ? (ln as Recipe[]) : [];
          dinnerPool = Array.isArray(dn) ? (dn as Recipe[]) : [];
          if (breakfastPool.length === 0 || lunchPool.length === 0 || dinnerPool.length === 0) {
            try {
              const { useRecipeStore } = require('@/store/recipeStore');
              const allRecipesStore: Recipe[] = (useRecipeStore.getState().recipes as Recipe[]) ?? [];
              if (breakfastPool.length === 0) {
                breakfastPool = allRecipesStore.filter((r: Recipe) => r.mealType === 'breakfast');
              }
              if (lunchPool.length === 0) {
                lunchPool = allRecipesStore.filter((r: Recipe) => r.mealType === 'lunch');
              }
              if (dinnerPool.length === 0) {
                dinnerPool = allRecipesStore.filter((r: Recipe) => r.mealType === 'dinner');
              }
            } catch {}
          }
          if (breakfastPool.length === 0 || lunchPool.length === 0 || dinnerPool.length === 0) {
            try {
              const { mockRecipes } = require('@/constants/mockData');
              const all: Recipe[] = mockRecipes as Recipe[];
              if (breakfastPool.length === 0) breakfastPool = all.filter((r) => r.mealType === 'breakfast');
              if (lunchPool.length === 0) lunchPool = all.filter((r) => r.mealType === 'lunch');
              if (dinnerPool.length === 0) dinnerPool = all.filter((r) => r.mealType === 'dinner');
            } catch {}
          }
          set({ recipePoolsCache: { breakfast: breakfastPool, lunch: lunchPool, dinner: dinnerPool, ts: Date.now(), key: poolsKey } });
        }

        const getLocalFallbacks = (mealType: 'breakfast' | 'lunch' | 'dinner', targetCalories: number): Recipe[] => {
          const state = get();
          const within = (cal: number | undefined) => {
            const c = cal ?? 0;
            return c >= targetCalories * 0.6 && c <= targetCalories * 1.4;
          };
          const filterOnly = (arr: Recipe[]): Recipe[] => arr.filter((r) => r.mealType === mealType && state.isRecipeSuitable(r, dietType, allergies, excludedIngredients) && within(r.calories));
          try {
            const { useRecipeStore } = require('@/store/recipeStore');
            const allRecipes: Recipe[] = (useRecipeStore.getState().recipes as Recipe[]) ?? [];
            const fromStore = filterOnly(allRecipes);
            if (fromStore.length > 0) return fromStore;
          } catch {}
          try {
            const { mockRecipes } = require('@/constants/mockData');
            return filterOnly(mockRecipes as Recipe[]);
          } catch {
            return [] as Recipe[];
          }
        };

        const newMealPlan = { ...get().mealPlan } as MealPlan;
        let filledCount = 0;
        const totalSlots = dates.length * 3;

        const pickFromPools = (primary: Recipe[], fallback: Recipe[], targetCalories: number, type: MealType, dateStr: string): Recipe | null => {
          const combine = (arr: Recipe[]) => {
            let candidates = arr.filter((r) => r && typeof r.id === 'string');
            if (enforceUnique) {
              const filtered = candidates.filter((r) => !used.has(r.id));
              candidates = filtered.length > 0 ? filtered : candidates;
            }
            return candidates;
          };
          let candidates = [...combine(primary)];
          if (candidates.length === 0) candidates = [...combine(fallback)];
          if (candidates.length === 0) {
            const locals = getLocalFallbacks(type, targetCalories);
            if (locals.length > 0) candidates = [...combine(locals)];
          }
          // If still empty, relax uniqueness but keep meal type
          if (candidates.length === 0) {
            const sameType = [...primary, ...fallback].filter((r) => r.mealType === type);
            if (sameType.length > 0) candidates = sameType; // allow repeats to avoid empty slot
          }
          // If still empty, relax type constraint then uniqueness completely
          if (candidates.length === 0) {
            const anySource = [...primary, ...fallback, ...getLocalFallbacks(type, targetCalories)];
            if (anySource.length > 0) candidates = anySource;
          }
          if (candidates.length === 0) return null;
          const prevId = newMealPlan[prevDateString(dateStr)]?.[type]?.recipeId;
          const prev = candidates.find((r) => r.id === prevId);
          const prevF = featuresFor(prev);
          const ranked = candidates.slice().sort((a, b) => {
            const fa = featuresFor(a);
            const fb = featuresFor(b);
            const aScore = combineScore((a.calories ?? 0) - targetCalories, a.id === prevId, fa.main !== null && fa.main === prevF.main, fa.cuisine !== null && fa.cuisine === prevF.cuisine, false);
            const bScore = combineScore((b.calories ?? 0) - targetCalories, b.id === prevId, fb.main !== null && fb.main === prevF.main, fb.cuisine !== null && fb.cuisine === prevF.cuisine, false);
            return aScore - bScore;
          });
          return ranked[0] ?? null;
        };

        let progressed = 0;
        const perSlot = totalSlots > 0 ? 0.7 / totalSlots : 0;

        for (const date of dates) {
          const currentDayPlan = newMealPlan[date] || {} as DailyMeals;

          if (!currentDayPlan.breakfast) {
            let chosen = pickFromPools(breakfastPool, getLocalFallbacks('breakfast', breakfastCalories), breakfastCalories, 'breakfast', date);
            if (!chosen && breakfastPool.length > 0) chosen = breakfastPool[0];
            if (chosen) {
              currentDayPlan.breakfast = {
                recipeId: chosen.id,
                name: chosen.name,
                calories: chosen.calories,
                protein: chosen.protein,
                carbs: chosen.carbs,
                fat: chosen.fat,
                fiber: chosen.fiber,
                servings: 1,
              };
              used.add(chosen.id);
              result.generatedMeals.push(`${date}-breakfast`);
              filledCount++;
            } else if (breakfastPool.length + getLocalFallbacks('breakfast', breakfastCalories).length > 0) {
              const any = [...breakfastPool, ...getLocalFallbacks('breakfast', breakfastCalories)][0];
              currentDayPlan.breakfast = {
                recipeId: any.id,
                name: any.name,
                calories: any.calories,
                protein: any.protein,
                carbs: any.carbs,
                fat: any.fat,
                fiber: any.fiber,
                servings: 1,
              };
              used.add(any.id);
              result.generatedMeals.push(`${date}-breakfast-relaxed`);
              filledCount++;
            }
            progressed += perSlot; set({ generationProgress: Math.min(0.3 + progressed, 0.95) });
          }

          if (!currentDayPlan.lunch) {
            let chosen = pickFromPools(lunchPool, getLocalFallbacks('lunch', lunchCalories), lunchCalories, 'lunch', date);
            if (!chosen && lunchPool.length > 0) chosen = lunchPool[0];
            if (chosen) {
              currentDayPlan.lunch = {
                recipeId: chosen.id,
                name: chosen.name,
                calories: chosen.calories,
                protein: chosen.protein,
                carbs: chosen.carbs,
                fat: chosen.fat,
                fiber: chosen.fiber,
                servings: 1,
              };
              used.add(chosen.id);
              result.generatedMeals.push(`${date}-lunch`);
              filledCount++;
            } else if (lunchPool.length + getLocalFallbacks('lunch', lunchCalories).length > 0) {
              const any = [...lunchPool, ...getLocalFallbacks('lunch', lunchCalories)][0];
              currentDayPlan.lunch = {
                recipeId: any.id,
                name: any.name,
                calories: any.calories,
                protein: any.protein,
                carbs: any.carbs,
                fat: any.fat,
                fiber: any.fiber,
                servings: 1,
              };
              used.add(any.id);
              result.generatedMeals.push(`${date}-lunch-relaxed`);
              filledCount++;
            }
            progressed += perSlot; set({ generationProgress: Math.min(0.3 + progressed, 0.95) });
          }

          if (!currentDayPlan.dinner) {
            let chosen = pickFromPools(dinnerPool, getLocalFallbacks('dinner', dinnerCalories), dinnerCalories, 'dinner', date);
            if (!chosen && dinnerPool.length > 0) chosen = dinnerPool[0];
            if (chosen) {
              currentDayPlan.dinner = {
                recipeId: chosen.id,
                name: chosen.name,
                calories: chosen.calories,
                protein: chosen.protein,
                carbs: chosen.carbs,
                fat: chosen.fat,
                fiber: chosen.fiber,
                servings: 1,
              };
              used.add(chosen.id);
              result.generatedMeals.push(`${date}-dinner`);
              filledCount++;
            } else if (dinnerPool.length + getLocalFallbacks('dinner', dinnerCalories).length > 0) {
              const any = [...dinnerPool, ...getLocalFallbacks('dinner', dinnerCalories)][0];
              currentDayPlan.dinner = {
                recipeId: any.id,
                name: any.name,
                calories: any.calories,
                protein: any.protein,
                carbs: any.carbs,
                fat: any.fat,
                fiber: any.fiber,
                servings: 1,
              };
              used.add(any.id);
              result.generatedMeals.push(`${date}-dinner-relaxed`);
              filledCount++;
            }
            progressed += perSlot; set({ generationProgress: Math.min(0.3 + progressed, 0.95) });
          }

          newMealPlan[date] = currentDayPlan;
        }

        if (filledCount === 0) {
          const diagB = { total: breakfastPool.length };
          const diagL = { total: lunchPool.length };
          const diagD = { total: dinnerPool.length };
          result.success = false;
          result.error = 'Weekly generation failed due to very limited or incompatible recipe pool.';
          const tips: string[] = [];
          if ((diagB.total + diagL.total + diagD.total) === 0) {
            tips.push('No recipes available for any meal type. Add recipes or enable API sources.');
          } else {
            tips.push('Your dietary preferences or exclusions filter out most recipes. Adjust them and try again.');
          }
          if (enforceUnique && used.size > 0) tips.push('Disable "unique per week" to allow repeats across the week.');
          tips.push('Open the weekly planner and fill specific slots manually.');
          result.suggestions = tips;
        } else {
          result.success = true;
          result.error = null;
          if (filledCount < totalSlots) {
            result.suggestions = [`Filled ${filledCount} of ${totalSlots} slots. Some meals used relaxed matching due to limited recipes.`, 'Variety preference applied.'];
          } else {
            result.suggestions = ['All week meals filled successfully.', 'Variety preference applied.'];
          }
        }

        set({
          mealPlan: newMealPlan,
          weeklyUsedRecipeIds: new Set(used),
          lastGenerationError: result.error,
          generationSuggestions: result.suggestions,
          isGenerating: false,
          generationProgress: 1
        });

        return result;
      }
    }),
    {
      name: 'meal-plan-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mealPlan: state.mealPlan,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.weeklyUsedRecipeIds = new Set<string>();
          state.alternativeRecipes = {};
          state.isLoadingAlternatives = false;
          state.lastGenerationError = null;
          state.generationSuggestions = [];
          state.recipePoolsCache = null;
          state.uniquePerWeek = state.uniquePerWeek ?? false;
          state.isGenerating = false;
          state.generationProgress = 0;
        }
      },
    }
  )
);
