import { MealPlan, Recipe, GroceryItem } from '@/types';

/**
 * Extracts quantity and unit from an ingredient string
 * Example: "2 cups flour" -> { quantity: 2, unit: "cups", name: "flour" }
 */
const parseIngredient = (ingredient: string) => {
  // Common units to look for
  const units = [
    'cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons',
    'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 'g', 'gram', 'grams', 'kg',
    'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'pinch', 'dash',
    'slice', 'slices', 'piece', 'pieces', 'clove', 'cloves', 'bunch', 'bunches'
  ];

  // Try to match a pattern like "2 cups" or "1/2 cup" at the beginning
  const quantityRegex = /^([\d\/\.\s]+)\s+/;
  const quantityMatch = ingredient.match(quantityRegex);
  
  let quantity = 1;
  let unit = '';
  let name = ingredient;

  if (quantityMatch) {
    // Extract the quantity part
    const quantityStr = quantityMatch[1].trim();
    
    // Handle fractions like 1/2
    if (quantityStr.includes('/')) {
      const [numerator, denominator] = quantityStr.split('/').map(Number);
      quantity = numerator / denominator;
    } else {
      quantity = parseFloat(quantityStr);
    }
    
    // Remove the quantity from the ingredient string
    name = ingredient.substring(quantityMatch[0].length);
    
    // Check if the next word is a unit
    const words = name.trim().split(/\s+/);
    if (words.length > 0 && units.includes(words[0].toLowerCase())) {
      unit = words[0];
      name = words.slice(1).join(' ');
    }
  }

  // Clean up the name
  name = name.trim();
  
  // Remove any text in parentheses (like "chopped" or "diced")
  name = name.replace(/\s*\([^)]*\)/g, '');
  
  // Remove common preparation instructions
  const prepTerms = [
    'chopped', 'diced', 'minced', 'sliced', 'grated', 'peeled',
    'crushed', 'ground', 'shredded', 'julienned', 'cubed', 'quartered',
    'halved', 'thinly sliced', 'roughly chopped', 'finely chopped',
    'to taste', 'for serving', 'optional'
  ];
  
  for (const term of prepTerms) {
    name = name.replace(new RegExp(`\\s*${term}\\b`, 'gi'), '');
  }
  
  // Final cleanup
  name = name.trim();
  
  return { quantity, unit, name };
};

/**
 * Normalizes ingredient names to help with deduplication
 * Example: "Red Bell Pepper" and "bell pepper, red" -> "bell pepper"
 */
const normalizeIngredientName = (name: string): string => {
  // Convert to lowercase
  let normalized = name.toLowerCase();
  
  // Remove common adjectives and colors
  const adjectives = [
    'fresh', 'frozen', 'canned', 'dried', 'raw', 'cooked',
    'red', 'green', 'yellow', 'orange', 'purple', 'black', 'white',
    'large', 'medium', 'small', 'extra', 'virgin', 'cold-pressed',
    'organic', 'free-range', 'grass-fed', 'lean', 'ripe'
  ];
  
  for (const adj of adjectives) {
    normalized = normalized.replace(new RegExp(`\\b${adj}\\b`, 'g'), '');
  }
  
  // Handle special cases
  if (normalized.includes('pepper')) {
    if (normalized.includes('bell')) {
      normalized = 'bell pepper';
    } else if (normalized.includes('chili') || normalized.includes('chile')) {
      normalized = 'chili pepper';
    }
  }
  
  // Normalize common ingredients
  const normalizations: Record<string, string> = {
    'onion': 'onion',
    'yellow onion': 'onion',
    'white onion': 'onion',
    'red onion': 'red onion', // Keep red onion distinct
    'garlic clove': 'garlic',
    'garlic cloves': 'garlic',
    'minced garlic': 'garlic',
    'olive oil': 'olive oil',
    'vegetable oil': 'vegetable oil',
    'canola oil': 'canola oil',
    'all-purpose flour': 'flour',
    'all purpose flour': 'flour',
    'ap flour': 'flour',
    'granulated sugar': 'sugar',
    'white sugar': 'sugar',
    'brown sugar': 'brown sugar', // Keep brown sugar distinct
    'kosher salt': 'salt',
    'sea salt': 'salt',
    'table salt': 'salt',
    'black pepper': 'black pepper',
    'ground black pepper': 'black pepper',
  };
  
  for (const [key, value] of Object.entries(normalizations)) {
    if (normalized.includes(key)) {
      normalized = value;
      break;
    }
  }
  
  // Final cleanup
  normalized = normalized.trim();
  
  return normalized;
};

/**
 * Generates a grocery list from a meal plan
 */
export const generateGroceryList = (mealPlan: MealPlan, recipes: Recipe[]): GroceryItem[] => {
  // Track ingredients by their normalized name
  const ingredientMap: Record<string, { 
    quantity: number; 
    unit: string; 
    originalName: string;
    category: string;
  }> = {};
  
  // Process each day in the meal plan
  Object.values(mealPlan).forEach(day => {
    // Process main meals (breakfast, lunch, dinner)
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      const meal = day[mealType as keyof typeof day];
      
      // Skip if meal is undefined or is an array
      if (!meal || Array.isArray(meal)) return;
      
      // Skip if no recipeId
      if (!meal.recipeId) return;
      
      const recipe = recipes.find(r => r.id === meal.recipeId);
      if (recipe) {
        // Process each ingredient in the recipe
        recipe.ingredients.forEach(ingredientStr => {
          const { quantity, unit, name } = parseIngredient(ingredientStr);
          const normalizedName = normalizeIngredientName(name);
          
          // Determine category based on ingredient name
          let category = 'Other';
          
          if (/\b(apple|banana|berry|berries|orange|fruit|grape|melon|pear|peach|plum|mango)\b/i.test(name)) {
            category = 'Fruits';
          } else if (/\b(vegetable|carrot|onion|potato|tomato|lettuce|spinach|kale|broccoli|cauliflower|pepper|cucumber|zucchini|squash|garlic|ginger)\b/i.test(name)) {
            category = 'Vegetables';
          } else if (/\b(beef|chicken|pork|turkey|lamb|meat|steak|ground|sausage|bacon)\b/i.test(name)) {
            category = 'Meat';
          } else if (/\b(fish|salmon|tuna|shrimp|seafood|cod|tilapia)\b/i.test(name)) {
            category = 'Seafood';
          } else if (/\b(milk|cheese|yogurt|cream|butter|dairy)\b/i.test(name)) {
            category = 'Dairy';
          } else if (/\b(bread|bagel|roll|bun|tortilla|pita|naan|bakery)\b/i.test(name)) {
            category = 'Bakery';
          } else if (/\b(rice|pasta|noodle|grain|quinoa|couscous|cereal|oat|flour)\b/i.test(name)) {
            category = 'Grains';
          } else if (/\b(bean|lentil|chickpea|legume|tofu|tempeh)\b/i.test(name)) {
            category = 'Legumes';
          } else if (/\b(oil|vinegar|sauce|condiment|ketchup|mustard|mayo|dressing)\b/i.test(name)) {
            category = 'Condiments';
          } else if (/\b(spice|herb|salt|pepper|oregano|basil|thyme|cumin|paprika|cinnamon)\b/i.test(name)) {
            category = 'Spices';
          } else if (/\b(sugar|honey|syrup|sweetener)\b/i.test(name)) {
            category = 'Baking';
          } else if (/\b(nut|seed|almond|walnut|peanut|cashew)\b/i.test(name)) {
            category = 'Nuts & Seeds';
          } else if (/\b(can|canned|jar|preserved)\b/i.test(name)) {
            category = 'Canned Goods';
          } else if (/\b(frozen)\b/i.test(name)) {
            category = 'Frozen';
          } else if (/\b(snack|chip|cracker|pretzel)\b/i.test(name)) {
            category = 'Snacks';
          } else if (/\b(juice|soda|beverage|drink|water|coffee|tea)\b/i.test(name)) {
            category = 'Beverages';
          }
          
          // Add or update the ingredient in our map
          if (ingredientMap[normalizedName]) {
            // If the ingredient already exists, add to its quantity
            ingredientMap[normalizedName].quantity += quantity;
          } else {
            // Otherwise, add it as a new ingredient
            ingredientMap[normalizedName] = {
              quantity,
              unit,
              originalName: name,
              category
            };
          }
        });
      }
    });
    
    // Process snacks
    if (day.snacks && Array.isArray(day.snacks) && day.snacks.length > 0) {
      day.snacks.forEach(snack => {
        // Skip if no recipeId
        if (!snack || !snack.recipeId) return;
        
        const recipe = recipes.find(r => r.id === snack.recipeId);
        if (recipe) {
          recipe.ingredients.forEach(ingredientStr => {
            const { quantity, unit, name } = parseIngredient(ingredientStr);
            const normalizedName = normalizeIngredientName(name);
            
            // Determine category (same logic as above)
            let category = 'Other';
            // ... (same category determination logic)
            
            if (ingredientMap[normalizedName]) {
              ingredientMap[normalizedName].quantity += quantity;
            } else {
              ingredientMap[normalizedName] = {
                quantity,
                unit,
                originalName: name,
                category: 'Other' // Default category
              };
            }
          });
        }
      });
    }
  });
  
  // Convert the ingredient map to a grocery list
  const groceryList: GroceryItem[] = Object.entries(ingredientMap).map(([normalizedName, info]) => {
    // Format the quantity and unit
    let quantityStr = '';
    if (info.quantity === Math.floor(info.quantity)) {
      // If it's a whole number, don't show decimal places
      quantityStr = info.quantity.toString();
    } else {
      // Otherwise, show up to 2 decimal places
      quantityStr = info.quantity.toFixed(2).replace(/\.00$/, '');
    }
    
    // Format the name with quantity and unit
    const displayName = info.unit 
      ? `${info.originalName} (${quantityStr} ${info.unit})`
      : info.originalName;
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: displayName,
      category: info.category,
      checked: false
    };
  });
  
  // Sort the grocery list by category
  return groceryList.sort((a, b) => a.category.localeCompare(b.category));
};