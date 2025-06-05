import { Recipe } from '@/types';

// TheMealDB API base URL
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// TheMealDB meal type
type MealDBMeal = {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string | null;
  strIngredient1?: string;
  strIngredient2?: string;
  strIngredient3?: string;
  strIngredient4?: string;
  strIngredient5?: string;
  strIngredient6?: string;
  strIngredient7?: string;
  strIngredient8?: string;
  strIngredient9?: string;
  strIngredient10?: string;
  strIngredient11?: string;
  strIngredient12?: string;
  strIngredient13?: string;
  strIngredient14?: string;
  strIngredient15?: string;
  strIngredient16?: string;
  strIngredient17?: string;
  strIngredient18?: string;
  strIngredient19?: string;
  strIngredient20?: string;
  strMeasure1?: string;
  strMeasure2?: string;
  strMeasure3?: string;
  strMeasure4?: string;
  strMeasure5?: string;
  strMeasure6?: string;
  strMeasure7?: string;
  strMeasure8?: string;
  strMeasure9?: string;
  strMeasure10?: string;
  strMeasure11?: string;
  strMeasure12?: string;
  strMeasure13?: string;
  strMeasure14?: string;
  strMeasure15?: string;
  strMeasure16?: string;
  strMeasure17?: string;
  strMeasure18?: string;
  strMeasure19?: string;
  strMeasure20?: string;
};

// TheMealDB API response type
type MealDBResponse = {
  meals: MealDBMeal[] | null;
};

// TheMealDB category type
type MealDBCategory = {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
};

// TheMealDB categories response type
type MealDBCategoriesResponse = {
  categories: MealDBCategory[];
};

// Type guard for meal type
function isValidMealType(type: string | undefined): type is 'breakfast' | 'lunch' | 'dinner' | undefined {
  return type === undefined || type === 'breakfast' || type === 'lunch' || type === 'dinner';
}

/**
 * Convert a MealDB meal to our app's Recipe format
 */
const convertMealToRecipe = (meal: MealDBMeal): Recipe => {
  // Extract ingredients and measures
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}` as keyof MealDBMeal] as string;
    const measure = meal[`strMeasure${i}` as keyof MealDBMeal] as string;
    
    if (ingredient && ingredient.trim() !== '' && measure && measure.trim() !== '') {
      ingredients.push(`${measure.trim()} ${ingredient.trim()}`);
    } else if (ingredient && ingredient.trim() !== '') {
      ingredients.push(ingredient.trim());
    }
  }

  // Extract instructions
  const instructionsText = meal.strInstructions || '';
  const instructions = instructionsText
    .split('\\r\n')
    .join('\n')
    .split('\r\n')
    .join('\n')
    .split('\n\n')
    .join('\n')
    .split('\n')
    .filter(step => step.trim() !== '')
    .map(step => step.trim());

  // Extract tags
  const tags = meal.strTags 
    ? meal.strTags.split(',').map(tag => tag.trim().toLowerCase())
    : [];
  
  // Add category and area as tags if they exist
  if (meal.strCategory && !tags.includes(meal.strCategory.toLowerCase())) {
    tags.push(meal.strCategory.toLowerCase());
  }
  
  if (meal.strArea && !tags.includes(meal.strArea.toLowerCase())) {
    tags.push(meal.strArea.toLowerCase());
  }

  // Dessert-related tags and categories
  const dessertTags = [
    'dessert', 'sweet', 'cake', 'cookie', 'pie', 'pudding', 'ice cream', 
    'chocolate', 'candy', 'pastry', 'biscuit', 'brownie', 'custard', 
    'tart', 'cheesecake', 'mousse', 'frosting', 'icing', 'glaze'
  ];
  
  // Check if it's a dessert
  const isDessert = 
    tags.some(tag => dessertTags.includes(tag)) || 
    meal.strCategory?.toLowerCase() === 'dessert' ||
    meal.strCategory?.toLowerCase() === 'sweets';
  
  // Determine meal type based on tags and category
  let mealType: 'breakfast' | 'lunch' | 'dinner' | undefined = undefined;
  
  // If it's a dessert, don't assign a meal type
  if (isDessert) {
    mealType = undefined;
  } else {
    // Breakfast-related tags
    const breakfastTags = [
      'breakfast', 'brunch', 'morning', 'oatmeal', 'cereal', 'pancake', 
      'waffle', 'egg', 'toast', 'smoothie', 'yogurt', 'muffin', 'bagel',
      'croissant', 'granola', 'porridge'
    ];
    
    // Lunch-related tags
    const lunchTags = [
      'lunch', 'salad', 'sandwich', 'soup', 'light', 'wrap', 'bowl', 
      'taco', 'quesadilla', 'burger', 'roll', 'pita', 'flatbread', 
      'hummus', 'falafel'
    ];
    
    // Dinner-related tags
    const dinnerTags = [
      'dinner', 'supper', 'main course', 'entree', 'roast', 'stew', 
      'curry', 'pasta', 'chicken', 'beef', 'pork', 'fish', 'seafood', 
      'casserole', 'grill', 'bake', 'hearty', 'substantial'
    ];
    
    // Check for breakfast-related tags
    if (tags.some(tag => breakfastTags.includes(tag)) || 
        meal.strCategory?.toLowerCase() === 'breakfast') {
      mealType = 'breakfast';
    }
    // Check for lunch-related tags
    else if (tags.some(tag => lunchTags.includes(tag))) {
      mealType = 'lunch';
    }
    // Check for dinner-related tags
    else if (tags.some(tag => dinnerTags.includes(tag))) {
      mealType = 'dinner';
    }
    // Default to lunch for most recipes if no specific meal type is identified
    // This is safer than defaulting to dinner, as lunch can be more versatile
    else {
      // Check if it's a side dish, appetizer, or starter
      const sideOrAppetizer = tags.some(tag => 
        ['side', 'side dish', 'appetizer', 'starter', 'snack'].includes(tag)
      );
      
      if (sideOrAppetizer) {
        // Side dishes and appetizers can be either lunch or dinner, default to lunch
        mealType = 'lunch';
      } else {
        // For main dishes with protein, default to dinner
        const hasProtein = ingredients.some(ingredient => 
          /\b(chicken|beef|pork|lamb|fish|seafood|shrimp|turkey|meat)\b/i.test(ingredient)
        );
        
        mealType = hasProtein ? 'dinner' : 'lunch';
      }
    }
  }

  // Ensure mealType is one of the valid types
  if (!isValidMealType(mealType)) {
    mealType = undefined;
  }

  // Generate random nutrition info since MealDB doesn't provide it
  const calories = Math.floor(Math.random() * 400) + 200; // 200-600 calories
  const protein = Math.floor(Math.random() * 30) + 10; // 10-40g protein
  const carbs = Math.floor(Math.random() * 50) + 20; // 20-70g carbs
  const fat = Math.floor(Math.random() * 20) + 5; // 5-25g fat

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
    prepTime: `${Math.floor(Math.random() * 20) + 5} min`, // Random prep time
    cookTime: `${Math.floor(Math.random() * 40) + 10} min`, // Random cook time
    servings: Math.floor(Math.random() * 4) + 2, // 2-6 servings
    calories,
    protein,
    carbs,
    fat,
    ingredients,
    instructions,
    tags,
    mealType,
  };
};

/**
 * Search for meals by name
 */
export const searchMealsByName = async (query: string): Promise<Recipe[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    const data: MealDBResponse = await response.json();
    
    if (!data.meals) return [];
    
    return data.meals.map(convertMealToRecipe);
  } catch (error) {
    console.error('Error searching meals:', error);
    return [];
  }
};

/**
 * Get a meal by ID
 */
export const getMealById = async (id: string): Promise<Recipe | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/lookup.php?i=${id}`);
    const data: MealDBResponse = await response.json();
    
    if (!data.meals || data.meals.length === 0) return null;
    
    return convertMealToRecipe(data.meals[0]);
  } catch (error) {
    console.error('Error getting meal by ID:', error);
    return null;
  }
};

/**
 * Get meals by first letter
 */
export const getMealsByFirstLetter = async (letter: string): Promise<Recipe[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/search.php?f=${letter.charAt(0)}`);
    const data: MealDBResponse = await response.json();
    
    if (!data.meals) return [];
    
    return data.meals.map(convertMealToRecipe);
  } catch (error) {
    console.error('Error getting meals by letter:', error);
    return [];
  }
};

/**
 * Get all meal categories
 */
export const getMealCategories = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories.php`);
    const data: MealDBCategoriesResponse = await response.json();
    
    if (!data.categories) return [];
    
    return data.categories.map(category => category.strCategory);
  } catch (error) {
    console.error('Error getting meal categories:', error);
    return [];
  }
};

/**
 * Get meals by category
 */
export const getMealsByCategory = async (category: string): Promise<Recipe[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
    const data: MealDBResponse = await response.json();
    
    if (!data.meals) return [];
    
    // The filter endpoint only returns basic meal info, so we need to fetch full details for each meal
    const recipes: Recipe[] = [];
    
    // Limit to 10 meals to avoid too many requests
    const mealsToFetch = data.meals.slice(0, 10);
    
    for (const meal of mealsToFetch) {
      const recipe = await getMealById(meal.idMeal);
      if (recipe) recipes.push(recipe);
    }
    
    return recipes;
  } catch (error) {
    console.error('Error getting meals by category:', error);
    return [];
  }
};

/**
 * Get random meals
 */
export const getRandomMeals = async (count: number = 10): Promise<Recipe[]> => {
  try {
    const recipes: Recipe[] = [];
    const fetchedIds = new Set<string>();
    
    // We can only fetch one random meal at a time from the API
    // So we'll make multiple requests to get the desired count
    for (let i = 0; i < count; i++) {
      const response = await fetch(`${API_BASE_URL}/random.php`);
      const data: MealDBResponse = await response.json();
      
      if (data.meals && data.meals.length > 0) {
        const meal = data.meals[0];
        
        // Avoid duplicates
        if (!fetchedIds.has(meal.idMeal)) {
          fetchedIds.add(meal.idMeal);
          recipes.push(convertMealToRecipe(meal));
        } else {
          // If we got a duplicate, try again
          i--;
        }
      }
    }
    
    return recipes;
  } catch (error) {
    console.error('Error getting random meals:', error);
    return [];
  }
};

/**
 * Load initial recipes for the app
 * This will fetch a mix of random recipes and recipes from popular categories
 */
export const loadInitialRecipes = async (count: number = 20): Promise<Recipe[]> => {
  try {
    // Get some random recipes
    const randomRecipes = await getRandomMeals(Math.floor(count / 2));
    
    // Get some recipes from popular categories
    const popularCategories = ['Chicken', 'Beef', 'Seafood', 'Vegetarian', 'Breakfast'];
    let categoryRecipes: Recipe[] = [];
    
    for (const category of popularCategories) {
      if (categoryRecipes.length < Math.ceil(count / 2)) {
        const recipes = await getMealsByCategory(category);
        // Take a few recipes from each category
        categoryRecipes = [...categoryRecipes, ...recipes.slice(0, 2)];
      }
    }
    
    // Combine and shuffle the recipes
    const allRecipes = [...randomRecipes, ...categoryRecipes];
    
    // Shuffle array
    for (let i = allRecipes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allRecipes[i], allRecipes[j]] = [allRecipes[j], allRecipes[i]];
    }
    
    return allRecipes.slice(0, count);
  } catch (error) {
    console.error('Error loading initial recipes:', error);
    return [];
  }
};