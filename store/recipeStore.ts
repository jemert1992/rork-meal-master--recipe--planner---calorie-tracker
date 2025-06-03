import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '@/types';
import { mockRecipes } from '@/constants/mockData';
import { loadInitialRecipes, searchMealsByName, getMealById } from '@/services/mealDbService';
import { loadInitialRecipesFromAllSources, searchRecipesFromAllSources } from '@/services/recipeApiService';

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
        useSpoonacular: false,
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
        // Skip if we've already loaded from API
        if (get().hasLoadedFromApi && get().recipes.length > mockRecipes.length) return;
        
        set({ isLoading: true });
        
        try {
          const { apiSources } = get();
          
          // If no API sources are enabled, default to MealDB
          const useDefaultSource = !Object.values(apiSources).some(Boolean);
          
          if (useDefaultSource) {
            const mealDbRecipes = await loadInitialRecipes(30);
            
            if (mealDbRecipes.length > 0) {
              set((state) => ({
                recipes: [...mealDbRecipes, ...mockRecipes],
                hasLoadedFromApi: true,
              }));
            }
          } else {
            const apiRecipes = await loadInitialRecipesFromAllSources(30, apiSources);
            
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
            return await searchMealsByName(query);
          } else {
            return await searchRecipesFromAllSources(query, 20, apiSources);
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
        
        // If not, fetch it from the API
        // Check if it's a MealDB ID (doesn't have a prefix)
        if (!id.includes('_')) {
          try {
            const recipe = await getMealById(id);
            
            // If found, add it to our store
            if (recipe) {
              get().addRecipe(recipe);
            }
            
            return recipe;
          } catch (error) {
            console.error('Error getting recipe by ID:', error);
            return null;
          }
        }
        
        // For other API sources, we'd need to implement specific fetching logic
        // This would depend on how IDs are structured for each API
        console.warn(`Fetching recipe details for ID ${id} from other APIs not implemented yet`);
        return null;
      },
    }),
    {
      name: 'recipe-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);