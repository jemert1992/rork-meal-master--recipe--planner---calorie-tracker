import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '@/types';
import { mockRecipes } from '@/constants/mockData';
import * as recipeApiService from '@/services/recipeApiService';

interface RecipeState {
  recipes: Recipe[];
  favoriteRecipeIds: string[];
  isLoading: boolean;
  hasLoadedFromApi: boolean;
  apiSources: {
    useMealDB: boolean;
    useSpoonacular: boolean;
    useEdamam: boolean;
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
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: mockRecipes,
      favoriteRecipeIds: [],
      isLoading: false,
      hasLoadedFromApi: false,
      apiSources: {
        useMealDB: true,
        useSpoonacular: false, // Disabled Spoonacular by default until implemented
        useEdamam: false,
      },
      
      addRecipe: (recipe) => {
        set((state) => ({
          recipes: [...state.recipes, recipe],
        }));
      },
      
      updateRecipe: (recipe) => {
        set((state) => ({
          recipes: state.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
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
              useEdamam: false
            });
            
            if (apiRecipes.length > 0) {
              set((state) => ({
                recipes: [...apiRecipes, ...mockRecipes],
                hasLoadedFromApi: true,
              }));
            }
          } else {
            const apiRecipes = await recipeApiService.loadInitialRecipesFromAllSources(50, apiSources);
            
            if (apiRecipes.length > 0) {
              set((state) => ({
                recipes: [...apiRecipes, ...mockRecipes],
                hasLoadedFromApi: true,
              }));
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
              useEdamam: false
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
    }),
    {
      name: 'recipe-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);