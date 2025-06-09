import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, RecipeFilters, RecipeCollection } from '@/types';
import { mockRecipes } from '@/constants/mockData';
import * as recipeApiService from '@/services/recipeApiService';

// Helper function to validate recipe mealType
function validateRecipe(recipe: any): Recipe {
  const validMealTypes = ['breakfast', 'lunch', 'dinner'] as const;
  const mealType = recipe.mealType && validMealTypes.includes(recipe.mealType) 
    ? recipe.mealType 
    : undefined;
  
  // Determine complexity based on prep time and ingredients count
  let complexity: 'simple' | 'complex' | undefined = undefined;
  if (recipe.prepTime && recipe.ingredients) {
    const prepTimeMinutes = parseInt(recipe.prepTime.split(' ')[0]);
    const ingredientsCount = recipe.ingredients.length;
    
    if (prepTimeMinutes <= 15 && ingredientsCount <= 5) {
      complexity = 'simple';
    } else if (prepTimeMinutes >= 30 || ingredientsCount >= 8) {
      complexity = 'complex';
    } else {
      complexity = 'simple';
    }
  }
  
  // Extract dietary preferences from tags
  const dietaryPreferences: Recipe['dietaryPreferences'] = [];
  const dietaryTags = [
    'vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free', 
    'dairy-free', 'low-carb', 'high-protein'
  ];
  
  if (recipe.tags) {
    recipe.tags.forEach((tag: string) => {
      if (dietaryTags.includes(tag)) {
        dietaryPreferences.push(tag as any);
      }
    });
  }
  
  // Extract fitness goals from tags
  const fitnessGoals: Recipe['fitnessGoals'] = [];
  const fitnessTags = [
    'weight-loss', 'muscle-gain', 'general-health', 
    'heart-health', 'energy-boost'
  ];
  
  if (recipe.tags) {
    recipe.tags.forEach((tag: string) => {
      if (fitnessTags.includes(tag)) {
        fitnessGoals.push(tag as any);
      }
    });
  }
  
  return {
    ...recipe,
    mealType,
    complexity,
    dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : undefined,
    fitnessGoals: fitnessGoals.length > 0 ? fitnessGoals : undefined
  };
}

// Featured recipe collections
const defaultCollections: RecipeCollection[] = [
  {
    id: 'quick-meals',
    name: 'Quick & Easy',
    description: 'Ready in 15 minutes or less',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    recipeIds: []
  },
  {
    id: 'high-protein',
    name: 'High Protein',
    description: 'Build muscle with these protein-packed recipes',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    recipeIds: []
  },
  {
    id: 'weight-loss',
    name: 'Weight Loss',
    description: 'Healthy, satisfying meals under 400 calories',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    recipeIds: []
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    description: 'Delicious meat-free recipes',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    recipeIds: []
  }
];

interface RecipeState {
  recipes: Recipe[];
  favoriteRecipeIds: string[];
  collections: RecipeCollection[];
  isLoading: boolean;
  hasLoadedFromApi: boolean;
  offlineRecipes: Recipe[];
  apiSources: {
    useMealDB: boolean;
    useSpoonacular: boolean;
    useEdamam: boolean;
    useFirebase: boolean;
  };
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  loadRecipesFromApi: () => Promise<void>;
  searchRecipes: (query: string) => Promise<Recipe[]>;
  getRecipeById: (id: string) => Promise<Recipe | null>;
  setApiSource: (source: string, enabled: boolean) => void;
  filterRecipes: (filters: RecipeFilters) => Recipe[];
  addToCollection: (collectionId: string, recipeId: string) => void;
  removeFromCollection: (collectionId: string, recipeId: string) => void;
  createCollection: (collection: Omit<RecipeCollection, 'recipeIds'>) => void;
  deleteCollection: (id: string) => void;
  updateCollection: (collection: RecipeCollection) => void;
  getCollection: (id: string) => RecipeCollection | undefined;
  cacheRecipesOffline: (count?: number) => void;
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: mockRecipes.map(validateRecipe),
      favoriteRecipeIds: [],
      collections: defaultCollections,
      isLoading: false,
      hasLoadedFromApi: false,
      offlineRecipes: [],
      apiSources: {
        useMealDB: true,
        useSpoonacular: false,
        useEdamam: false,
        useFirebase: false,
      },
      
      addRecipe: (recipe) => {
        set((state) => ({
          recipes: [...state.recipes, validateRecipe(recipe)],
        }));
      },
      
      updateRecipe: (recipe) => {
        set((state) => ({
          recipes: state.recipes.map((r) => (r.id === recipe.id ? validateRecipe(recipe) : r)),
        }));
      },
      
      deleteRecipe: (id) => {
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
        }));
      },
      
      toggleFavorite: (id) => {
        set((state) => {
          if (state.favoriteRecipeIds.includes(id)) {
            return {
              favoriteRecipeIds: state.favoriteRecipeIds.filter((recipeId) => recipeId !== id),
            };
          } else {
            return {
              favoriteRecipeIds: [...state.favoriteRecipeIds, id],
            };
          }
        });
      },
      
      isFavorite: (id) => {
        return get().favoriteRecipeIds.includes(id);
      },
      
      setApiSource: (source, enabled) => {
        set((state) => ({
          apiSources: {
            ...state.apiSources,
            [source]: enabled,
          },
        }));
      },
      
      loadRecipesFromApi: async () => {
        set({ isLoading: true });
        
        try {
          const { apiSources } = get();
          
          // If no API sources are enabled, default to MealDB
          const useDefaultSource = !Object.values(apiSources).some(Boolean);
          
          if (useDefaultSource) {
            set((state) => ({
              apiSources: {
                ...state.apiSources,
                useMealDB: true,
              }
            }));
            
            const apiRecipes = await recipeApiService.loadInitialRecipesFromAllSources(50, {
              useMealDB: true,
              useSpoonacular: false,
              useEdamam: false,
              useFirebase: false
            });
            
            if (apiRecipes.length > 0) {
              const validatedRecipes = apiRecipes.map(validateRecipe);
              
              // Update collections with new recipes
              const updatedCollections = get().collections.map(collection => {
                const newRecipeIds = [...collection.recipeIds];
                
                if (collection.id === 'quick-meals') {
                  validatedRecipes
                    .filter(r => r.complexity === 'simple')
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                } else if (collection.id === 'high-protein') {
                  validatedRecipes
                    .filter(r => r.dietaryPreferences?.includes('high-protein'))
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                } else if (collection.id === 'weight-loss') {
                  validatedRecipes
                    .filter(r => r.calories < 400)
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                } else if (collection.id === 'vegetarian') {
                  validatedRecipes
                    .filter(r => r.dietaryPreferences?.includes('vegetarian'))
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                }
                
                return {
                  ...collection,
                  recipeIds: newRecipeIds
                };
              });
              
              set((state) => ({
                recipes: [...validatedRecipes, ...state.recipes.filter(r => !validatedRecipes.some(ar => ar.id === r.id))],
                hasLoadedFromApi: true,
                collections: updatedCollections
              }));
              
              // Cache recipes offline
              get().cacheRecipesOffline(100);
            }
          } else {
            const apiRecipes = await recipeApiService.loadInitialRecipesFromAllSources(50, apiSources);
            
            if (apiRecipes.length > 0) {
              const validatedRecipes = apiRecipes.map(validateRecipe);
              
              // Update collections with new recipes
              const updatedCollections = get().collections.map(collection => {
                const newRecipeIds = [...collection.recipeIds];
                
                if (collection.id === 'quick-meals') {
                  validatedRecipes
                    .filter(r => r.complexity === 'simple')
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                } else if (collection.id === 'high-protein') {
                  validatedRecipes
                    .filter(r => r.dietaryPreferences?.includes('high-protein'))
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                } else if (collection.id === 'weight-loss') {
                  validatedRecipes
                    .filter(r => r.calories < 400)
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                } else if (collection.id === 'vegetarian') {
                  validatedRecipes
                    .filter(r => r.dietaryPreferences?.includes('vegetarian'))
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                }
                
                return {
                  ...collection,
                  recipeIds: newRecipeIds
                };
              });
              
              set((state) => ({
                recipes: [...validatedRecipes, ...state.recipes.filter(r => !validatedRecipes.some(ar => ar.id === r.id))],
                hasLoadedFromApi: true,
                collections: updatedCollections
              }));
              
              // Cache recipes offline
              get().cacheRecipesOffline(100);
            }
          }
        } catch (error) {
          console.error('Failed to load recipes from API:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      searchRecipes: async (query) => {
        if (!query.trim()) return [];
        
        try {
          const { apiSources } = get();
          
          // If no API sources are enabled, default to MealDB
          const useDefaultSource = !Object.values(apiSources).some(Boolean);
          
          if (useDefaultSource) {
            return await recipeApiService.searchRecipesFromAllSources(query, 20, {
              useMealDB: true,
              useSpoonacular: false,
              useEdamam: false,
              useFirebase: false
            });
          } else {
            return await recipeApiService.searchRecipesFromAllSources(query, 20, apiSources);
          }
        } catch (error) {
          console.error('Error searching recipes:', error);
          return [];
        }
      },
      
      getRecipeById: async (id) => {
        // First check if we already have the recipe in our store
        const existingRecipe = get().recipes.find(r => r.id === id);
        if (existingRecipe) return existingRecipe;
        
        // Then check offline cache
        const offlineRecipe = get().offlineRecipes.find(r => r.id === id);
        if (offlineRecipe) return offlineRecipe;
        
        try {
          // If not, fetch it from the appropriate API
          const recipe = await recipeApiService.getRecipeByIdFromSource(id);
          
          // If found, add it to our store
          if (recipe) {
            get().addRecipe(recipe);
          }
          
          return recipe;
        } catch (error) {
          console.error('Error getting recipe by ID:', error);
          return null;
        }
      },
      
      filterRecipes: (filters) => {
        let filteredRecipes = get().recipes;
        
        if (filters.mealType) {
          filteredRecipes = filteredRecipes.filter(recipe => recipe.mealType === filters.mealType);
        }
        
        if (filters.complexity) {
          filteredRecipes = filteredRecipes.filter(recipe => recipe.complexity === filters.complexity);
        }
        
        if (filters.dietaryPreference) {
          filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.dietaryPreferences?.includes(filters.dietaryPreference as any) ||
            recipe.tags.includes(filters.dietaryPreference)
          );
        }
        
        if (filters.fitnessGoal) {
          filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.fitnessGoals?.includes(filters.fitnessGoal as any) ||
            recipe.tags.includes(filters.fitnessGoal)
          );
        }
        
        if (filters.searchQuery && filters.searchQuery.trim() !== '') {
          const query = filters.searchQuery.toLowerCase();
          filteredRecipes = filteredRecipes.filter(recipe => 
            recipe.name.toLowerCase().includes(query) ||
            recipe.tags.some(tag => tag.toLowerCase().includes(query)) ||
            recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(query))
          );
        }
        
        if (filters.favorite) {
          filteredRecipes = filteredRecipes.filter(recipe => 
            get().favoriteRecipeIds.includes(recipe.id)
          );
        }
        
        return filteredRecipes;
      },
      
      addToCollection: (collectionId, recipeId) => {
        set((state) => ({
          collections: state.collections.map(collection => 
            collection.id === collectionId
              ? { 
                  ...collection, 
                  recipeIds: collection.recipeIds.includes(recipeId)
                    ? collection.recipeIds
                    : [...collection.recipeIds, recipeId]
                }
              : collection
          )
        }));
      },
      
      removeFromCollection: (collectionId, recipeId) => {
        set((state) => ({
          collections: state.collections.map(collection => 
            collection.id === collectionId
              ? { 
                  ...collection, 
                  recipeIds: collection.recipeIds.filter(id => id !== recipeId)
                }
              : collection
          )
        }));
      },
      
      createCollection: (collection) => {
        const newCollection: RecipeCollection = {
          ...collection,
          recipeIds: []
        };
        
        set((state) => ({
          collections: [...state.collections, newCollection]
        }));
      },
      
      deleteCollection: (id) => {
        set((state) => ({
          collections: state.collections.filter(collection => collection.id !== id)
        }));
      },
      
      updateCollection: (collection) => {
        set((state) => ({
          collections: state.collections.map(c => 
            c.id === collection.id ? collection : c
          )
        }));
      },
      
      getCollection: (id) => {
        return get().collections.find(collection => collection.id === id);
      },
      
      cacheRecipesOffline: (count = 100) => {
        const allRecipes = get().recipes;
        
        // Select a diverse set of recipes to cache
        const breakfastRecipes = allRecipes.filter(r => r.mealType === 'breakfast').slice(0, Math.floor(count / 3));
        const lunchRecipes = allRecipes.filter(r => r.mealType === 'lunch').slice(0, Math.floor(count / 3));
        const dinnerRecipes = allRecipes.filter(r => r.mealType === 'dinner').slice(0, Math.floor(count / 3));
        
        // Fill remaining slots with other recipes
        const remainingCount = count - breakfastRecipes.length - lunchRecipes.length - dinnerRecipes.length;
        const otherRecipes = allRecipes
          .filter(r => !breakfastRecipes.includes(r) && !lunchRecipes.includes(r) && !dinnerRecipes.includes(r))
          .slice(0, remainingCount);
        
        const recipesToCache = [...breakfastRecipes, ...lunchRecipes, ...dinnerRecipes, ...otherRecipes];
        
        set({ offlineRecipes: recipesToCache });
      }
    }),
    {
      name: 'recipe-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);