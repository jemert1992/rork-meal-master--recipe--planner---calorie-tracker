import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { Recipe, RecipeIngredient, FirestoreRecipe, DietType, MealType } from '@/types';

// Firebase configuration
// Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection references
const recipesCollection = collection(db, 'recipes');

// Helper function to convert Firestore data to Recipe type
export const convertFirestoreDataToRecipe = (docId: string, data: DocumentData): Recipe => {
  return {
    id: docId,
    name: data.name,
    image: data.image_url || '',
    prepTime: `${data.tags.prep_time} min`,
    cookTime: data.cook_time ? `${data.cook_time} min` : '0 min',
    servings: data.tags.servings || 1,
    calories: data.nutrition.calories,
    protein: data.nutrition.protein,
    carbs: data.nutrition.carbs,
    fat: data.nutrition.fat,
    fiber: data.nutrition.fiber,
    ingredients: data.ingredients.map((ing: RecipeIngredient) => 
      `${ing.quantity} ${ing.unit} ${ing.name}`.trim()
    ),
    instructions: data.steps,
    tags: Object.values(data.tags).filter((tag: unknown) => typeof tag === 'string') as string[],
    mealType: data.tags.meal_type,
    complexity: data.tags.complexity,
    dietaryPreferences: Array.isArray(data.tags.diet) ? data.tags.diet : [data.tags.diet].filter(Boolean),
    fitnessGoals: Array.isArray(data.tags.goal) ? data.tags.goal : [data.tags.goal].filter(Boolean),
    source: data.source || 'Zestora'
  };
};

// Helper function to convert Recipe to Firestore data
export const convertRecipeToFirestoreData = (recipe: Recipe) => {
  // Parse ingredients into structured format
  const ingredients = recipe.ingredients.map(ingredient => {
    const parts = ingredient.split(' ');
    const quantity = parseFloat(parts[0]) || 1;
    const unit = isNaN(parseFloat(parts[0])) ? '' : (parts[1] || '');
    const name = isNaN(parseFloat(parts[0])) 
      ? ingredient 
      : parts.slice(unit ? 2 : 1).join(' ');
    
    return {
      quantity,
      unit,
      name
    };
  });

  return {
    name: recipe.name,
    ingredients,
    steps: recipe.instructions,
    nutrition: {
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      fiber: recipe.fiber || 0
    },
    tags: {
      meal_type: recipe.mealType,
      complexity: recipe.complexity,
      diet: recipe.dietaryPreferences || [],
      goal: recipe.fitnessGoals || [],
      prep_time: parseInt(recipe.prepTime.split(' ')[0]),
      servings: recipe.servings
    },
    image_url: recipe.image,
    source: recipe.source || 'Zestora',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  };
};

// Function to check if a recipe is a duplicate
export const isDuplicateRecipe = async (recipe: Recipe): Promise<boolean> => {
  // Check for exact name match (case-insensitive)
  const nameQuery = query(
    recipesCollection,
    where('name', '==', recipe.name.toLowerCase())
  );
  
  const nameQuerySnapshot = await getDocs(nameQuery);
  if (!nameQuerySnapshot.empty) return true;
  
  // Check for similar ingredients and name
  // This is a more complex check that would ideally be done in a Cloud Function
  // For now, we'll just check for exact name match
  
  return false;
};

// Function to validate recipe completeness
export const validateRecipeCompleteness = (recipe: Recipe): { isValid: boolean, missingFields: string[] } => {
  const missingFields: string[] = [];
  
  if (!recipe.name) missingFields.push('name');
  if (!recipe.ingredients || recipe.ingredients.length === 0) missingFields.push('ingredients');
  if (!recipe.instructions || recipe.instructions.length === 0) missingFields.push('instructions');
  if (recipe.calories === undefined) missingFields.push('calories');
  if (recipe.protein === undefined) missingFields.push('protein');
  if (recipe.carbs === undefined) missingFields.push('carbs');
  if (recipe.fat === undefined) missingFields.push('fat');
  if (!recipe.mealType) missingFields.push('mealType');
  if (!recipe.complexity) missingFields.push('complexity');
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

// Function to add a recipe to Firestore
export const addRecipeToFirestore = async (recipe: Recipe): Promise<string | null> => {
  try {
    // Validate recipe completeness
    const validation = validateRecipeCompleteness(recipe);
    if (!validation.isValid) {
      console.warn(`Recipe "${recipe.name}" is incomplete. Missing fields: ${validation.missingFields.join(', ')}`);
      // Add anyway but mark for review
      const firestoreData = {
        ...convertRecipeToFirestoreData(recipe),
        needs_review: true,
        missing_fields: validation.missingFields
      };
      const docRef = await addDoc(recipesCollection, firestoreData);
      return docRef.id;
    }
    
    // Check for duplicates
    const isDuplicate = await isDuplicateRecipe(recipe);
    if (isDuplicate) {
      console.warn(`Recipe "${recipe.name}" is a duplicate and was not added.`);
      return null;
    }
    
    // Add to Firestore
    const firestoreData = convertRecipeToFirestoreData(recipe);
    const docRef = await addDoc(recipesCollection, firestoreData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding recipe to Firestore:', error);
    return null;
  }
};

// Function to update a recipe in Firestore
export const updateRecipeInFirestore = async (id: string, recipe: Recipe): Promise<boolean> => {
  try {
    const docRef = doc(recipesCollection, id);
    const firestoreData = {
      ...convertRecipeToFirestoreData(recipe),
      updated_at: serverTimestamp()
    };
    await updateDoc(docRef, firestoreData);
    return true;
  } catch (error) {
    console.error('Error updating recipe in Firestore:', error);
    return false;
  }
};

// Function to delete a recipe from Firestore
export const deleteRecipeFromFirestore = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(recipesCollection, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting recipe from Firestore:', error);
    return false;
  }
};

// Function to get a recipe by ID from Firestore
export const getRecipeFromFirestore = async (id: string): Promise<Recipe | null> => {
  try {
    const docRef = doc(recipesCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as DocumentData;
      return convertFirestoreDataToRecipe(docSnap.id, data);
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting recipe from Firestore:', error);
    return null;
  }
};

// Function to get recipes from Firestore with filters
export const getRecipesFromFirestore = async (
  filters: {
    mealType?: MealType;
    complexity?: 'simple' | 'complex';
    dietaryPreference?: string;
    fitnessGoal?: string;
    searchQuery?: string;
    excludeIds?: string[];
  } = {},
  pageSize: number = 20,
  lastDoc?: any
): Promise<{ recipes: Recipe[], lastDoc: any }> => {
  try {
    const constraints: QueryConstraint[] = [];
    
    // Add filters
    if (filters.mealType) {
      constraints.push(where('tags.meal_type', '==', filters.mealType));
    }
    
    if (filters.complexity) {
      constraints.push(where('tags.complexity', '==', filters.complexity));
    }
    
    if (filters.dietaryPreference) {
      constraints.push(where('tags.diet', 'array-contains', filters.dietaryPreference));
    }
    
    if (filters.fitnessGoal) {
      constraints.push(where('tags.goal', 'array-contains', filters.fitnessGoal));
    }
    
    // Add pagination
    constraints.push(orderBy('created_at', 'desc'));
    constraints.push(limit(pageSize));
    
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    // Create query
    const q = query(recipesCollection, ...constraints);
    
    // Execute query
    const querySnapshot = await getDocs(q);
    
    // Extract recipes
    const recipes: Recipe[] = [];
    querySnapshot.forEach(doc => {
      recipes.push(convertFirestoreDataToRecipe(doc.id, doc.data()));
    });
    
    // Handle search query (client-side filtering)
    let filteredRecipes = recipes;
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const searchLower = filters.searchQuery.toLowerCase();
      filteredRecipes = recipes.filter(recipe => 
        recipe.name.toLowerCase().includes(searchLower) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter out excluded IDs if provided
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      filteredRecipes = filteredRecipes.filter(recipe => !filters.excludeIds?.includes(recipe.id));
    }
    
    // Get last document for pagination
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return {
      recipes: filteredRecipes,
      lastDoc: lastVisible
    };
  } catch (error) {
    console.error('Error getting recipes from Firestore:', error);
    return { recipes: [], lastDoc: null };
  }
};

// Function to get recipes for meal planning with advanced filtering
export const getRecipesForMealPlan = async (
  mealType: MealType,
  filters: {
    dietType?: DietType;
    allergies?: string[];
    excludedIngredients?: string[];
    fitnessGoal?: string;
    complexity?: 'simple' | 'complex';
    calorieRange?: { min: number; max: number };
    excludeIds?: string[];
  } = {},
  recipeLimit: number = 10
): Promise<Recipe[]> => {
  try {
    const constraints: QueryConstraint[] = [];
    
    // Filter by meal type
    if (mealType) {
      constraints.push(where('tags.meal_type', '==', mealType));
    }
    
    // Filter by diet type if specified
    if (filters.dietType && filters.dietType !== 'any') {
      constraints.push(where('tags.diet', 'array-contains', filters.dietType));
    }
    
    // Filter by fitness goal if specified
    if (filters.fitnessGoal) {
      constraints.push(where('tags.goal', 'array-contains', filters.fitnessGoal));
    }
    
    // Filter by complexity if specified
    if (filters.complexity) {
      constraints.push(where('tags.complexity', '==', filters.complexity));
    }
    
    // Add ordering and limit
    constraints.push(orderBy('created_at', 'desc'));
    constraints.push(limit(recipeLimit * 2)); // Get more than needed to allow for filtering
    
    // Create query
    const q = query(recipesCollection, ...constraints);
    
    // Execute query
    const querySnapshot = await getDocs(q);
    
    // Extract recipes
    let recipes: Recipe[] = [];
    querySnapshot.forEach(doc => {
      recipes.push(convertFirestoreDataToRecipe(doc.id, doc.data()));
    });
    
    // Client-side filtering for allergies and excluded ingredients
    if ((filters.allergies && filters.allergies.length > 0) || 
        (filters.excludedIngredients && filters.excludedIngredients.length > 0)) {
      const combinedExclusions = [
        ...(filters.allergies || []), 
        ...(filters.excludedIngredients || [])
      ];
      
      if (combinedExclusions.length > 0) {
        recipes = recipes.filter(recipe => {
          // Check if any ingredient contains an excluded term
          for (const ingredient of recipe.ingredients) {
            const lowerIngredient = ingredient.toLowerCase();
            for (const exclusion of combinedExclusions) {
              if (lowerIngredient.includes(exclusion.toLowerCase())) {
                return false;
              }
            }
          }
          return true;
        });
      }
    }
    
    // Filter by calorie range if specified
    if (filters.calorieRange) {
      recipes = recipes.filter(recipe => 
        recipe.calories >= filters.calorieRange!.min && 
        recipe.calories <= filters.calorieRange!.max
      );
    }
    
    // Filter out excluded IDs if provided
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      recipes = recipes.filter(recipe => !filters.excludeIds?.includes(recipe.id));
    }
    
    // Randomize the results to get variety
    recipes = recipes.sort(() => 0.5 - Math.random());
    
    // Return limited number of recipes
    return recipes.slice(0, recipeLimit);
  } catch (error) {
    console.error('Error getting recipes for meal plan:', error);
    return [];
  }
};

// Function to get alternative recipes for meal swapping
export const getAlternativeRecipes = async (
  mealType: MealType,
  currentRecipeId: string,
  filters: {
    dietType?: DietType;
    allergies?: string[];
    excludedIngredients?: string[];
    fitnessGoal?: string;
    calorieRange?: { min: number; max: number };
    excludeIds?: string[];
  } = {},
  limit: number = 5
): Promise<Recipe[]> => {
  try {
    // Make sure we exclude the current recipe
    const excludeIds = [...(filters.excludeIds || []), currentRecipeId];
    
    // Get alternative recipes
    return await getRecipesForMealPlan(
      mealType,
      {
        ...filters,
        excludeIds
      },
      limit
    );
  } catch (error) {
    console.error('Error getting alternative recipes:', error);
    return [];
  }
};

// Function to import recipes in bulk to Firestore
export const importRecipesToFirestore = async (recipes: Recipe[]): Promise<{ added: number, duplicates: number, errors: number }> => {
  let added = 0;
  let duplicates = 0;
  let errors = 0;
  
  for (const recipe of recipes) {
    try {
      // Check for duplicates
      const isDuplicate = await isDuplicateRecipe(recipe);
      if (isDuplicate) {
        duplicates++;
        continue;
      }
      
      // Validate recipe completeness
      const validation = validateRecipeCompleteness(recipe);
      const firestoreData = {
        ...convertRecipeToFirestoreData(recipe),
        needs_review: !validation.isValid,
        missing_fields: validation.isValid ? [] : validation.missingFields,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      // Add to Firestore
      await addDoc(recipesCollection, firestoreData);
      added++;
    } catch (error) {
      console.error(`Error importing recipe "${recipe.name}":`, error);
      errors++;
    }
  }
  
  return { added, duplicates, errors };
};

// Function to search recipes in Firestore
export const searchRecipesInFirestore = async (searchTerm: string, pageSize: number = 20): Promise<Recipe[]> => {
  try {
    // Firestore doesn't support full-text search natively
    // For a simple implementation, we'll get a batch of recipes and filter client-side
    // For production, consider using Algolia, Elasticsearch, or Firebase Extensions
    
    const q = query(
      recipesCollection,
      orderBy('created_at', 'desc'),
      limit(100) // Get more than needed to allow for filtering
    );
    
    const querySnapshot = await getDocs(q);
    
    // Extract and filter recipes
    const recipes: Recipe[] = [];
    const searchLower = searchTerm.toLowerCase();
    
    querySnapshot.forEach(doc => {
      const data = doc.data() as DocumentData;
      const name = data.name?.toLowerCase() || '';
      const ingredients = data.ingredients?.map((ing: RecipeIngredient) => ing.name.toLowerCase()) || [];
      const tags = Object.values(data.tags || {})
        .filter((tag): tag is string => typeof tag === 'string')
        .map(tag => tag.toLowerCase());
      
      // Check if recipe matches search query
      if (
        name.includes(searchLower) ||
        ingredients.some((ing: string) => ing.includes(searchLower)) ||
        tags.some(tag => tag.includes(searchLower))
      ) {
        recipes.push(convertFirestoreDataToRecipe(doc.id, data));
      }
    });
    
    // Use slice to limit the number of results
    return recipes.slice(0, pageSize);
  } catch (error) {
    console.error('Error searching recipes in Firestore:', error);
    return [];
  }
};