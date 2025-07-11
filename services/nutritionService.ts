// Basic nutrition database for common ingredients
// Values are per 100g unless otherwise specified

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface IngredientNutrition extends NutritionData {
  name: string;
  commonUnits: string[];
  density?: number; // g/ml for liquids
}

// Basic ingredient database
const INGREDIENT_DATABASE: Record<string, IngredientNutrition> = {
  // Proteins
  'chicken breast': {
    name: 'Chicken Breast',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    commonUnits: ['g', 'oz', 'piece']
  },
  'salmon': {
    name: 'Salmon',
    calories: 208,
    protein: 20,
    carbs: 0,
    fat: 12,
    fiber: 0,
    commonUnits: ['g', 'oz', 'fillet']
  },
  'eggs': {
    name: 'Eggs',
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    fiber: 0,
    commonUnits: ['g', 'piece', 'large']
  },
  'ground beef': {
    name: 'Ground Beef (80/20)',
    calories: 254,
    protein: 17,
    carbs: 0,
    fat: 20,
    fiber: 0,
    commonUnits: ['g', 'oz', 'lb']
  },
  'tofu': {
    name: 'Tofu',
    calories: 76,
    protein: 8,
    carbs: 1.9,
    fat: 4.8,
    fiber: 0.3,
    commonUnits: ['g', 'oz', 'block']
  },

  // Grains & Starches
  'rice': {
    name: 'White Rice (cooked)',
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    fiber: 0.4,
    commonUnits: ['g', 'cup']
  },
  'brown rice': {
    name: 'Brown Rice (cooked)',
    calories: 112,
    protein: 2.6,
    carbs: 23,
    fat: 0.9,
    fiber: 1.8,
    commonUnits: ['g', 'cup']
  },
  'quinoa': {
    name: 'Quinoa (cooked)',
    calories: 120,
    protein: 4.4,
    carbs: 22,
    fat: 1.9,
    fiber: 2.8,
    commonUnits: ['g', 'cup']
  },
  'pasta': {
    name: 'Pasta (cooked)',
    calories: 131,
    protein: 5,
    carbs: 25,
    fat: 1.1,
    fiber: 1.8,
    commonUnits: ['g', 'cup']
  },
  'bread': {
    name: 'Whole Wheat Bread',
    calories: 247,
    protein: 13,
    carbs: 41,
    fat: 4.2,
    fiber: 6,
    commonUnits: ['g', 'slice']
  },
  'oats': {
    name: 'Oats (dry)',
    calories: 389,
    protein: 17,
    carbs: 66,
    fat: 6.9,
    fiber: 10.6,
    commonUnits: ['g', 'cup']
  },

  // Vegetables
  'broccoli': {
    name: 'Broccoli',
    calories: 34,
    protein: 2.8,
    carbs: 7,
    fat: 0.4,
    fiber: 2.6,
    commonUnits: ['g', 'cup', 'head']
  },
  'spinach': {
    name: 'Spinach',
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    fiber: 2.2,
    commonUnits: ['g', 'cup', 'bunch']
  },
  'carrots': {
    name: 'Carrots',
    calories: 41,
    protein: 0.9,
    carbs: 10,
    fat: 0.2,
    fiber: 2.8,
    commonUnits: ['g', 'cup', 'medium']
  },
  'bell pepper': {
    name: 'Bell Pepper',
    calories: 31,
    protein: 1,
    carbs: 7,
    fat: 0.3,
    fiber: 2.5,
    commonUnits: ['g', 'cup', 'medium']
  },
  'onion': {
    name: 'Onion',
    calories: 40,
    protein: 1.1,
    carbs: 9.3,
    fat: 0.1,
    fiber: 1.7,
    commonUnits: ['g', 'cup', 'medium']
  },
  'tomato': {
    name: 'Tomato',
    calories: 18,
    protein: 0.9,
    carbs: 3.9,
    fat: 0.2,
    fiber: 1.2,
    commonUnits: ['g', 'cup', 'medium']
  },

  // Fruits
  'banana': {
    name: 'Banana',
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    fiber: 2.6,
    commonUnits: ['g', 'medium', 'large']
  },
  'apple': {
    name: 'Apple',
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    fiber: 2.4,
    commonUnits: ['g', 'medium', 'large']
  },
  'berries': {
    name: 'Mixed Berries',
    calories: 57,
    protein: 0.7,
    carbs: 14,
    fat: 0.3,
    fiber: 2.4,
    commonUnits: ['g', 'cup']
  },
  'avocado': {
    name: 'Avocado',
    calories: 160,
    protein: 2,
    carbs: 9,
    fat: 15,
    fiber: 7,
    commonUnits: ['g', 'medium', 'half']
  },

  // Dairy & Alternatives
  'milk': {
    name: 'Milk (2%)',
    calories: 50,
    protein: 3.3,
    carbs: 4.8,
    fat: 2,
    fiber: 0,
    commonUnits: ['ml', 'cup'],
    density: 1.03
  },
  'greek yogurt': {
    name: 'Greek Yogurt (plain)',
    calories: 59,
    protein: 10,
    carbs: 3.6,
    fat: 0.4,
    fiber: 0,
    commonUnits: ['g', 'cup']
  },
  'cheese': {
    name: 'Cheddar Cheese',
    calories: 403,
    protein: 25,
    carbs: 1.3,
    fat: 33,
    fiber: 0,
    commonUnits: ['g', 'oz', 'slice']
  },
  'butter': {
    name: 'Butter',
    calories: 717,
    protein: 0.9,
    carbs: 0.1,
    fat: 81,
    fiber: 0,
    commonUnits: ['g', 'tbsp']
  },

  // Oils & Fats
  'olive oil': {
    name: 'Olive Oil',
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
    fiber: 0,
    commonUnits: ['ml', 'tbsp', 'tsp'],
    density: 0.92
  },
  'coconut oil': {
    name: 'Coconut Oil',
    calories: 862,
    protein: 0,
    carbs: 0,
    fat: 100,
    fiber: 0,
    commonUnits: ['ml', 'tbsp', 'tsp'],
    density: 0.92
  },

  // Nuts & Seeds
  'almonds': {
    name: 'Almonds',
    calories: 579,
    protein: 21,
    carbs: 22,
    fat: 50,
    fiber: 12,
    commonUnits: ['g', 'oz', 'cup']
  },
  'walnuts': {
    name: 'Walnuts',
    calories: 654,
    protein: 15,
    carbs: 14,
    fat: 65,
    fiber: 7,
    commonUnits: ['g', 'oz', 'cup']
  },
  'chia seeds': {
    name: 'Chia Seeds',
    calories: 486,
    protein: 17,
    carbs: 42,
    fat: 31,
    fiber: 34,
    commonUnits: ['g', 'tbsp']
  },

  // Legumes
  'black beans': {
    name: 'Black Beans (cooked)',
    calories: 132,
    protein: 8.9,
    carbs: 24,
    fat: 0.5,
    fiber: 8.7,
    commonUnits: ['g', 'cup']
  },
  'chickpeas': {
    name: 'Chickpeas (cooked)',
    calories: 164,
    protein: 8.9,
    carbs: 27,
    fat: 2.6,
    fiber: 7.6,
    commonUnits: ['g', 'cup']
  },
  'lentils': {
    name: 'Lentils (cooked)',
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    fiber: 7.9,
    commonUnits: ['g', 'cup']
  }
};

// Unit conversion factors (to grams)
const UNIT_CONVERSIONS: Record<string, number> = {
  // Weight
  'g': 1,
  'kg': 1000,
  'oz': 28.35,
  'lb': 453.59,
  
  // Volume (approximate for common ingredients)
  'ml': 1, // Assuming density of 1 for most liquids
  'l': 1000,
  'cup': 240, // ml, varies by ingredient
  'tbsp': 15, // ml
  'tsp': 5, // ml
  
  // Common portions (approximate)
  'slice': 25, // bread slice
  'piece': 50, // average piece
  'medium': 150, // medium fruit/vegetable
  'large': 200, // large fruit/vegetable
  'small': 100, // small fruit/vegetable
  'head': 500, // head of broccoli/lettuce
  'bunch': 100, // bunch of greens
  'fillet': 150, // fish fillet
  'block': 400, // tofu block
  'half': 75, // half avocado
};

export function findIngredient(name: string): IngredientNutrition | null {
  const normalizedName = name.toLowerCase().trim();
  
  // Direct match
  if (INGREDIENT_DATABASE[normalizedName]) {
    return INGREDIENT_DATABASE[normalizedName];
  }
  
  // Partial match
  for (const [key, ingredient] of Object.entries(INGREDIENT_DATABASE)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return ingredient;
    }
  }
  
  return null;
}

export function convertToGrams(quantity: number, unit: string, ingredient?: IngredientNutrition): number {
  const normalizedUnit = unit.toLowerCase().trim();
  
  // Direct conversion
  if (UNIT_CONVERSIONS[normalizedUnit]) {
    let grams = quantity * UNIT_CONVERSIONS[normalizedUnit];
    
    // Adjust for liquid density if applicable
    if (ingredient?.density && ['ml', 'l', 'cup', 'tbsp', 'tsp'].includes(normalizedUnit)) {
      grams *= ingredient.density;
    }
    
    return grams;
  }
  
  // Default to treating as grams
  return quantity;
}

export function calculateNutrition(
  ingredientName: string, 
  quantity: number, 
  unit: string
): NutritionData | null {
  const ingredient = findIngredient(ingredientName);
  if (!ingredient) return null;
  
  const grams = convertToGrams(quantity, unit, ingredient);
  const factor = grams / 100; // Nutrition data is per 100g
  
  return {
    calories: Math.round(ingredient.calories * factor),
    protein: Math.round((ingredient.protein * factor) * 10) / 10,
    carbs: Math.round((ingredient.carbs * factor) * 10) / 10,
    fat: Math.round((ingredient.fat * factor) * 10) / 10,
    fiber: Math.round((ingredient.fiber * factor) * 10) / 10,
  };
}

export function getIngredientSuggestions(query: string): string[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (normalizedQuery.length < 2) return [];
  
  const suggestions: string[] = [];
  
  for (const [key, ingredient] of Object.entries(INGREDIENT_DATABASE)) {
    if (key.includes(normalizedQuery) || ingredient.name.toLowerCase().includes(normalizedQuery)) {
      suggestions.push(ingredient.name);
    }
  }
  
  return suggestions.slice(0, 10); // Limit to 10 suggestions
}

export function getCommonUnits(ingredientName: string): string[] {
  const ingredient = findIngredient(ingredientName);
  return ingredient?.commonUnits || ['g', 'oz', 'cup'];
}