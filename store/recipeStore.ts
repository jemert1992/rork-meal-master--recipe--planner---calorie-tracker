import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe, RecipeFilters, RecipeCollection, PaginationState } from '@/types';
import { mockRecipes } from '@/constants/mockData';
import * as recipeApiService from '@/services/recipeApiService';
import * as firebaseService from '@/services/firebaseService';

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
    fitnessGoals: fitnessGoals.length > 0 ? fitnessGoals : undefined,
    fiber: recipe.fiber || Math.floor(Math.random() * 5) + 1 // Add estimated fiber if not present
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
  },
  {
    id: 'desserts',
    name: 'Desserts & Snacks',
    description: 'Sweet treats and snacks for any time of day',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
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
  useFirestore: boolean;
  pagination: PaginationState;
  apiSources: {
    useMealDB: boolean;
    useSpoonacular: boolean;
    useEdamam: boolean;
    useFirebase: boolean;
  };
  addRecipe: (recipe: Recipe) => Promise<string | null>;
  updateRecipe: (recipe: Recipe) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  loadRecipesFromApi: (useCache?: boolean) => Promise<void>;
  loadMoreRecipes: (filters?: RecipeFilters) => Promise<void>;
  searchRecipes: (query: string) => Promise<Recipe[]>;
  getRecipeById: (id: string) => Promise<Recipe | null>;
  setApiSource: (source: string, enabled: boolean) => void;
  setUseFirestore: (useFirestore: boolean) => void;
  filterRecipes: (filters: RecipeFilters) => Promise<Recipe[]>;
  addToCollection: (collectionId: string, recipeId: string) => void;
  removeFromCollection: (collectionId: string, recipeId: string) => void;
  createCollection: (collection: Omit<RecipeCollection, 'recipeIds'>) => void;
  deleteCollection: (id: string) => void;
  updateCollection: (collection: RecipeCollection) => void;
  getCollection: (id: string) => RecipeCollection | undefined;
  cacheRecipesOffline: (count?: number) => void;
  importRecipesToFirestore: (recipes: Recipe[]) => Promise<{ added: number, duplicates: number, errors: number }>;
  getRecipesByDietType: (dietType: string, limit?: number) => Promise<Recipe[]>;
  getRecipesByMealType: (mealType: 'breakfast' | 'lunch' | 'dinner', limit?: number) => Promise<Recipe[]>;
  getRecipesByComplexity: (complexity: 'simple' | 'complex', limit?: number) => Promise<Recipe[]>;
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
      useFirestore: false,
      pagination: {
        lastDoc: null,
        hasMore: true,
        loading: false
      },
      apiSources: {
        useMealDB: true,
        useSpoonacular: true,
        useEdamam: false,
        useFirebase: false,
      },
      
      addRecipe: async (recipe) => {
        const validatedRecipe = validateRecipe(recipe);
        
        if (get().useFirestore) {
          // Add to Firestore
          const recipeId = await firebaseService.addRecipeToFirestore(validatedRecipe);
          
          if (recipeId) {
            // Update local state
            set((state) => ({
              recipes: [...state.recipes, { ...validatedRecipe, id: recipeId }],
            }));
            return recipeId;
          }
          return null;
        } else {
          // Add to local state only
          const newRecipe = {
            ...validatedRecipe,
            id: `local-${Date.now()}`
          };
          
          set((state) => ({
            recipes: [...state.recipes, newRecipe],
          }));
          
          return newRecipe.id;
        }
      },
      
      updateRecipe: async (recipe) => {
        const validatedRecipe = validateRecipe(recipe);
        
        if (get().useFirestore && !recipe.id.startsWith('local-')) {
          // Update in Firestore
          const success = await firebaseService.updateRecipeInFirestore(recipe.id, validatedRecipe);
          
          if (success) {
            // Update local state
            set((state) => ({
              recipes: state.recipes.map((r) => (r.id === recipe.id ? validatedRecipe : r)),
            }));
            return true;
          }
          return false;
        } else {
          // Update local state only
          set((state) => ({
            recipes: state.recipes.map((r) => (r.id === recipe.id ? validatedRecipe : r)),
          }));
          
          return true;
        }
      },
      
      deleteRecipe: async (id) => {
        if (get().useFirestore && !id.startsWith('local-')) {
          // Delete from Firestore
          const success = await firebaseService.deleteRecipeFromFirestore(id);
          
          if (success) {
            // Update local state
            set((state) => ({
              recipes: state.recipes.filter((r) => r.id !== id),
              favoriteRecipeIds: state.favoriteRecipeIds.filter((recipeId) => recipeId !== id),
              collections: state.collections.map(collection => ({
                ...collection,
                recipeIds: collection.recipeIds.filter(recipeId => recipeId !== id)
              }))
            }));
            return true;
          }
          return false;
        } else {
          // Delete from local state only
          set((state) => ({
            recipes: state.recipes.filter((r) => r.id !== id),
            favoriteRecipeIds: state.favoriteRecipeIds.filter((recipeId) => recipeId !== id),
            collections: state.collections.map(collection => ({
              ...collection,
              recipeIds: collection.recipeIds.filter(recipeId => recipeId !== id)
            }))
          }));
          
          return true;
        }
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
      
      setUseFirestore: (useFirestore) => {
        set({ useFirestore });
      },
      
      loadRecipesFromApi: async (useCache = true) => {
        set({ isLoading: true });
        
        try {
          // Check if we should use cached recipes
          if (useCache && get().offlineRecipes.length > 0) {
            set((state) => ({
              recipes: [...state.offlineRecipes],
              isLoading: false
            }));
            return;
          }
          
          if (get().useFirestore) {
            // Load from Firestore
            const { recipes, lastDoc } = await firebaseService.getRecipesFromFirestore({}, 50);
            
            if (recipes.length > 0) {
              // Update collections with new recipes
              const updatedCollections = get().collections.map(collection => {
                const newRecipeIds = [...collection.recipeIds];
                
                if (collection.id === 'quick-meals') {
                  recipes
                    .filter(r => r.complexity === 'simple')
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                } else if (collection.id === 'high-protein') {
                  recipes
                    .filter(r => r.dietaryPreferences?.includes('high-protein'))
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                } else if (collection.id === 'weight-loss') {
                  recipes
                    .filter(r => r.calories < 400)
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                } else if (collection.id === 'vegetarian') {
                  recipes
                    .filter(r => r.dietaryPreferences?.includes('vegetarian'))
                    .slice(0, 20)
                    .forEach(r => {
                      if (!newRecipeIds.includes(r.id)) {
                        newRecipeIds.push(r.id);
                      }
                    });
                } else if (collection.id === 'desserts') {
                  recipes
                    .filter(r => !r.mealType && r.tags.some(tag => 
                      ['dessert', 'sweet', 'snack', 'treat'].includes(tag.toLowerCase())
                    ))
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
                recipes: [...recipes, ...state.recipes.filter(r => !recipes.some(ar => ar.id === r.id))],
                hasLoadedFromApi: true,
                collections: updatedCollections,
                pagination: {
                  lastDoc,
                  hasMore: recipes.length >= 50,
                  loading: false
                }
              }));
              
              // Cache recipes offline
              get().cacheRecipesOffline(100);
            }
          } else {
            // Load from external APIs
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
                  } else if (collection.id === 'desserts') {
                    validatedRecipes
                      .filter(r => !r.mealType && r.tags.some(tag => 
                        ['dessert', 'sweet', 'snack', 'treat'].includes(tag.toLowerCase())
                      ))
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
                  } else if (collection.id === 'desserts') {
                    validatedRecipes
                      .filter(r => !r.mealType && r.tags.some(tag => 
                        ['dessert', 'sweet', 'snack', 'treat'].includes(tag.toLowerCase())
                      ))
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
          }
        } catch (error) {
          console.error('Failed to load recipes from API:', error);
          
          // Fallback to offline recipes if available
          if (get().offlineRecipes.length > 0) {
            set((state) => ({
              recipes: [...state.offlineRecipes],
              isLoading: false
            }));
          }
        } finally {
          set({ isLoading: false });
        }
      },
      
      loadMoreRecipes: async (filters = {}) => {
        const { pagination } = get();
        
        if (!pagination.hasMore || pagination.loading) return;
        
        set(state => ({
          pagination: {
            ...state.pagination,
            loading: true
          }
        }));
        
        try {
          if (get().useFirestore) {
            // Load more from Firestore
            const { recipes, lastDoc } = await firebaseService.getRecipesFromFirestore(
              filters,
              20,
              pagination.lastDoc
            );
            
            set(state => ({
              recipes: [...state.recipes, ...recipes.filter(r => !state.recipes.some(sr => sr.id === r.id))],
              pagination: {
                lastDoc,
                hasMore: recipes.length >= 20,
                loading: false
              }
            }));
          } else {
            // For external APIs, we don't have true pagination
            // So we'll just load more random recipes
            const { apiSources } = get();
            const apiRecipes = await recipeApiService.loadInitialRecipesFromAllSources(20, apiSources);
            
            if (apiRecipes.length > 0) {
              const validatedRecipes = apiRecipes.map(validateRecipe);
              
              set(state => ({
                recipes: [...state.recipes, ...validatedRecipes.filter(r => !state.recipes.some(sr => sr.id === r.id))],
                pagination: {
                  ...state.pagination,
                  loading: false,
                  hasMore: false // Set to false since we can't reliably paginate external APIs
                }
              }));
            } else {
              set(state => ({
                pagination: {
                  ...state.pagination,
                  loading: false,
                  hasMore: false
                }
              }));
            }
          }
        } catch (error) {
          console.error('Error loading more recipes:', error);
          set(state => ({
            pagination: {
              ...state.pagination,
              loading: false
            }
          }));
        }
      },
      
      searchRecipes: async (query) => {
        if (!query.trim()) return [];
        
        try {
          if (get().useFirestore) {
            // Search in Firestore
            return await firebaseService.searchRecipesInFirestore(query);
          } else {
            // Search in external APIs
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
          }
        } catch (error) {
          console.error('Error searching recipes:', error);
          
          // Fallback to local search if API search fails
          const localResults = get().recipes.filter(recipe => 
            recipe.name.toLowerCase().includes(query.toLowerCase()) ||
            recipe.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase())) ||
            recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(query.toLowerCase()))
          );
          
          return localResults.slice(0, 20);
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
          if (get().useFirestore && !id.startsWith('mealdb-') && !id.startsWith('spoon-') && !id.startsWith('edamam-') && !id.startsWith('local-')) {
            // Get from Firestore
            return await firebaseService.getRecipeFromFirestore(id);
          } else {
            // Get from external API
            const recipe = await recipeApiService.getRecipeByIdFromSource(id);
            
            // If found, add it to our store
            if (recipe) {
              const validatedRecipe = validateRecipe(recipe);
              set((state) => ({
                recipes: [...state.recipes, validatedRecipe]
              }));
              return validatedRecipe;
            }
            
            return null;
          }
        } catch (error) {
          console.error('Error getting recipe by ID:', error);
          return null;
        }
      },
      
      filterRecipes: async (filters) => {
        if (get().useFirestore) {
          // Filter in Firestore
          const { recipes } = await firebaseService.getRecipesFromFirestore(filters, 50);
          
          // Apply favorite filter client-side
          if (filters.favorite) {
            return recipes.filter(recipe => 
              get().favoriteRecipeIds.includes(recipe.id)
            );
          }
          
          return recipes;
        } else {
          // Filter client-side
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
              recipe.tags.includes(filters.dietaryPreference!)
            );
          }
          
          if (filters.fitnessGoal) {
            filteredRecipes = filteredRecipes.filter(recipe => 
              recipe.fitnessGoals?.includes(filters.fitnessGoal as any) ||
              recipe.tags.includes(filters.fitnessGoal!)
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
        }
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
        const breakfastRecipes = allRecipes.filter(r => r.mealType === 'breakfast').slice(0, Math.floor(count / 4));
        const lunchRecipes = allRecipes.filter(r => r.mealType === 'lunch').slice(0, Math.floor(count / 4));
        const dinnerRecipes = allRecipes.filter(r => r.mealType === 'dinner').slice(0, Math.floor(count / 4));
        const dessertRecipes = allRecipes.filter(r => !r.mealType && r.tags.some(tag => 
          ['dessert', 'sweet', 'snack', 'treat'].includes(tag.toLowerCase())
        )).slice(0, Math.floor(count / 4));
        
        // Fill remaining slots with other recipes
        const remainingCount = count - breakfastRecipes.length - lunchRecipes.length - dinnerRecipes.length - dessertRecipes.length;
        const otherRecipes = allRecipes
          .filter(r => 
            !breakfastRecipes.includes(r) && 
            !lunchRecipes.includes(r) && 
            !dinnerRecipes.includes(r) &&
            !dessertRecipes.includes(r)
          )
          .slice(0, remainingCount);
        
        const recipesToCache = [...breakfastRecipes, ...lunchRecipes, ...dinnerRecipes, ...dessertRecipes, ...otherRecipes];
        
        set({ offlineRecipes: recipesToCache });
      },
      
      importRecipesToFirestore: async (recipes) => {
        if (!get().useFirestore) {
          console.warn('Firestore is not enabled. Enable it first with setUseFirestore(true).');
          return { added: 0, duplicates: 0, errors: 0 };
        }
        
        try {
          // Validate recipes
          const validatedRecipes = recipes.map(validateRecipe);
          
          // Import to Firestore
          const result = await firebaseService.importRecipesToFirestore(validatedRecipes);
          
          // Refresh recipes from Firestore
          await get().loadRecipesFromApi(false);
          
          return result;
        } catch (error) {
          console.error('Error importing recipes to Firestore:', error);
          return { added: 0, duplicates: 0, errors: recipes.length };
        }
      },
      
      getRecipesByDietType: async (dietType, limit = 20) => {
        try {
          if (get().useFirestore) {
            // Get from Firestore
            const { recipes } = await firebaseService.getRecipesFromFirestore(
              { dietaryPreference: dietType },
              limit
            );
            return recipes;
          } else {
            // Filter from local recipes
            const filteredRecipes = get().recipes.filter(recipe => 
              recipe.dietaryPreferences?.includes(dietType as any) ||
              recipe.tags.includes(dietType)
            );
            
            // If we don't have enough recipes locally, try to get more from APIs
            if (filteredRecipes.length < limit && get().apiSources.useEdamam) {
              try {
                const edamamRecipes = await import('@/services/edamamService')
                  .then(module => module.getRecipesByDietType(dietType, limit));
                
                // Combine and deduplicate
                const combinedRecipes = [
                  ...filteredRecipes,
                  ...edamamRecipes.filter(r => !filteredRecipes.some(fr => fr.id === r.id))
                ];
                
                return combinedRecipes.slice(0, limit);
              } catch (error) {
                console.error('Error getting recipes by diet type from Edamam:', error);
                return filteredRecipes.slice(0, limit);
              }
            }
            
            return filteredRecipes.slice(0, limit);
          }
        } catch (error) {
          console.error('Error getting recipes by diet type:', error);
          return [];
        }
      },
      
      getRecipesByMealType: async (mealType, limit = 20) => {
        try {
          if (get().useFirestore) {
            // Get from Firestore
            const { recipes } = await firebaseService.getRecipesFromFirestore(
              { mealType },
              limit
            );
            return recipes;
          } else {
            // Filter from local recipes
            const filteredRecipes = get().recipes.filter(recipe => recipe.mealType === mealType);
            
            // If we don't have enough recipes locally, try to get more from APIs
            if (filteredRecipes.length < limit && get().apiSources.useEdamam) {
              try {
                const edamamRecipes = await import('@/services/edamamService')
                  .then(module => module.getRecipesByMealType(mealType, limit));
                
                // Combine and deduplicate
                const combinedRecipes = [
                  ...filteredRecipes,
                  ...edamamRecipes.filter(r => !filteredRecipes.some(fr => fr.id === r.id))
                ];
                
                return combinedRecipes.slice(0, limit);
              } catch (error) {
                console.error('Error getting recipes by meal type from Edamam:', error);
                return filteredRecipes.slice(0, limit);
              }
            }
            
            return filteredRecipes.slice(0, limit);
          }
        } catch (error) {
          console.error('Error getting recipes by meal type:', error);
          return [];
        }
      },
      
      getRecipesByComplexity: async (complexity, limit = 20) => {
        try {
          if (get().useFirestore) {
            // Get from Firestore
            const { recipes } = await firebaseService.getRecipesFromFirestore(
              { complexity },
              limit
            );
            return recipes;
          } else {
            // Filter from local recipes
            const filteredRecipes = get().recipes.filter(recipe => recipe.complexity === complexity);
            return filteredRecipes.slice(0, limit);
          }
        } catch (error) {
          console.error('Error getting recipes by complexity:', error);
          return [];
        }
      }
    }),
    {
      name: 'recipe-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);