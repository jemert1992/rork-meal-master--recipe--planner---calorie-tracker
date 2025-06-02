import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '@/types';
import { mockRecipes } from '@/constants/mockData';
import { loadInitialRecipes, searchMealsByName, getMealById } from '@/services/mealDbService';

interface RecipeState {
  recipes: Recipe[];
  favoriteRecipeIds: string[];
  isLoading: boolean;
  hasLoadedFromApi: boolean;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  loadRecipesFromApi: () => Promise<void>;
  searchRecipes: (query: string) => Promise<Recipe[]>;
  getRecipeById: (id: string) => Promise<Recipe | null>;
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: mockRecipes,
      favoriteRecipeIds: [],
      isLoading: false,
      hasLoadedFromApi: false,
      
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
      
      loadRecipesFromApi: async () => {
        // Skip if we've already loaded from API
        if (get().hasLoadedFromApi) return;
        
        set({ isLoading: true });
        
        try {
          const apiRecipes = await loadInitialRecipes(30);
          
          if (apiRecipes.length > 0) {
            set((state) => ({
              recipes: [...apiRecipes, ...mockRecipes],
              hasLoadedFromApi: true,
            }));
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
          const searchResults = await searchMealsByName(query);
          return searchResults;
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
      },
    }),
    {
      name: 'recipe-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);