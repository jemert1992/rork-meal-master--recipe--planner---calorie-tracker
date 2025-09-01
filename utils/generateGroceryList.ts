import { MealPlan, Recipe, GroceryItem, MealItem } from '@/types';

type UnitKind = 'mass' | 'volume' | 'count' | 'unknown';

type UnitDef = { canonical: string; kind: UnitKind; toBase: number };

const UNIT_MAP: Record<string, UnitDef> = {
  // mass base: g
  g: { canonical: 'g', kind: 'mass', toBase: 1 },
  gram: { canonical: 'g', kind: 'mass', toBase: 1 },
  grams: { canonical: 'g', kind: 'mass', toBase: 1 },
  kg: { canonical: 'kg', kind: 'mass', toBase: 1000 },
  kilogram: { canonical: 'kg', kind: 'mass', toBase: 1000 },
  kilograms: { canonical: 'kg', kind: 'mass', toBase: 1000 },
  lb: { canonical: 'lb', kind: 'mass', toBase: 453.592 },
  pound: { canonical: 'lb', kind: 'mass', toBase: 453.592 },
  pounds: { canonical: 'lb', kind: 'mass', toBase: 453.592 },
  oz: { canonical: 'oz', kind: 'mass', toBase: 28.3495 },
  ounce: { canonical: 'oz', kind: 'mass', toBase: 28.3495 },
  ounces: { canonical: 'oz', kind: 'mass', toBase: 28.3495 },
  // volume base: ml
  ml: { canonical: 'ml', kind: 'volume', toBase: 1 },
  milliliter: { canonical: 'ml', kind: 'volume', toBase: 1 },
  milliliters: { canonical: 'ml', kind: 'volume', toBase: 1 },
  l: { canonical: 'l', kind: 'volume', toBase: 1000 },
  liter: { canonical: 'l', kind: 'volume', toBase: 1000 },
  liters: { canonical: 'l', kind: 'volume', toBase: 1000 },
  cup: { canonical: 'cup', kind: 'volume', toBase: 240 },
  cups: { canonical: 'cup', kind: 'volume', toBase: 240 },
  tbsp: { canonical: 'tbsp', kind: 'volume', toBase: 15 },
  tablespoon: { canonical: 'tbsp', kind: 'volume', toBase: 15 },
  tablespoons: { canonical: 'tbsp', kind: 'volume', toBase: 15 },
  tsp: { canonical: 'tsp', kind: 'volume', toBase: 5 },
  teaspoon: { canonical: 'tsp', kind: 'volume', toBase: 5 },
  teaspoons: { canonical: 'tsp', kind: 'volume', toBase: 5 },
  'fl oz': { canonical: 'fl oz', kind: 'volume', toBase: 29.5735 },
  pinch: { canonical: 'pinch', kind: 'count', toBase: 1 },
  dash: { canonical: 'dash', kind: 'count', toBase: 1 },
  slice: { canonical: 'slice', kind: 'count', toBase: 1 },
  slices: { canonical: 'slice', kind: 'count', toBase: 1 },
  piece: { canonical: 'piece', kind: 'count', toBase: 1 },
  pieces: { canonical: 'piece', kind: 'count', toBase: 1 },
  clove: { canonical: 'clove', kind: 'count', toBase: 1 },
  cloves: { canonical: 'clove', kind: 'count', toBase: 1 },
  bunch: { canonical: 'bunch', kind: 'count', toBase: 1 },
  bunches: { canonical: 'bunch', kind: 'count', toBase: 1 },
};

const toBaseUnits = (qty: number, unit: string): { baseQty: number; kind: UnitKind; canonical: string } => {
  const key = unit.toLowerCase();
  const def = UNIT_MAP[key];
  if (!def) {
    return { baseQty: qty, kind: unit ? 'unknown' : 'count', canonical: unit };
  }
  return { baseQty: qty * def.toBase, kind: def.kind, canonical: def.canonical };
};

const formatFromBase = (baseQty: number, kind: UnitKind): { quantity: number; unit: string } => {
  if (kind === 'mass') {
    if (baseQty >= 1000) return { quantity: baseQty / 1000, unit: 'kg' };
    return { quantity: baseQty, unit: 'g' };
  }
  if (kind === 'volume') {
    if (baseQty >= 1000) return { quantity: baseQty / 1000, unit: 'l' };
    return { quantity: baseQty, unit: 'ml' };
  }
  return { quantity: baseQty, unit: '' };
};

/**
 * Extracts quantity and unit from an ingredient string
 * Supports: 1, 1.5, 1/2, 1 1/2, and simple units (incl. multiword 'fl oz')
 */
const parseIngredient = (ingredient: string) => {
  const input = ingredient.trim();
  const mixedFraction = /^(\d+)\s+(\d+\/\d+)/; // 1 1/2
  const fractionOnly = /^(\d+\/\d+)/; // 1/2
  const numberOnly = /^(\d+(?:\.\d+)?)/; // 1 or 1.5

  let rest = input;
  let quantity = 1;

  const mf = rest.match(mixedFraction);
  if (mf) {
    const whole = parseFloat(mf[1]);
    const [n, d] = mf[2].split('/').map(Number);
    quantity = whole + n / d;
    rest = rest.slice(mf[0].length).trim();
  } else {
    const fo = rest.match(fractionOnly);
    if (fo) {
      const [n, d] = fo[1].split('/').map(Number);
      quantity = n / d;
      rest = rest.slice(fo[0].length).trim();
    } else {
      const no = rest.match(numberOnly);
      if (no) {
        quantity = parseFloat(no[1]);
        rest = rest.slice(no[0].length).trim();
      }
    }
  }

  // Try multi-word unit first (e.g., 'fl oz')
  let unit = '';
  const twoWords = rest.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
  if (UNIT_MAP[twoWords]) {
    unit = twoWords;
    rest = rest.split(/\s+/).slice(2).join(' ');
  } else {
    const firstWord = rest.split(/\s+/)[0]?.toLowerCase() ?? '';
    if (UNIT_MAP[firstWord]) {
      unit = firstWord;
      rest = rest.split(/\s+/).slice(1).join(' ');
    }
  }

  let name = rest.trim();
  name = name.replace(/\s*\([^)]*\)/g, '');
  const prepTerms = [
    'chopped', 'diced', 'minced', 'sliced', 'grated', 'peeled',
    'crushed', 'ground', 'shredded', 'julienned', 'cubed', 'quartered',
    'halved', 'thinly sliced', 'roughly chopped', 'finely chopped',
    'to taste', 'for serving', 'optional'
  ];
  for (const term of prepTerms) {
    name = name.replace(new RegExp(`\s*${term}\b`, 'gi'), '');
  }
  name = name.replace(/,\s*$/,'').trim();

  return { quantity, unit, name };
};

/**
 * Normalizes ingredient names to help with deduplication
 */
const normalizeIngredientName = (name: string): string => {
  let normalized = name.toLowerCase();
  const adjectives = [
    'fresh', 'frozen', 'canned', 'dried', 'raw', 'cooked',
    'red', 'green', 'yellow', 'orange', 'purple', 'black', 'white',
    'large', 'medium', 'small', 'extra', 'virgin', 'cold-pressed',
    'organic', 'free-range', 'grass-fed', 'lean', 'ripe'
  ];
  for (const adj of adjectives) {
    normalized = normalized.replace(new RegExp(`\b${adj}\b`, 'g'), '');
  }
  if (normalized.includes('pepper')) {
    if (normalized.includes('bell')) normalized = 'bell pepper';
    else if (normalized.includes('chili') || normalized.includes('chile')) normalized = 'chili pepper';
  }
  const normalizations: Record<string, string> = {
    'yellow onion': 'onion',
    'white onion': 'onion',
    'garlic clove': 'garlic',
    'garlic cloves': 'garlic',
    'minced garlic': 'garlic',
    'all-purpose flour': 'flour',
    'all purpose flour': 'flour',
    'ap flour': 'flour',
    'granulated sugar': 'sugar',
    'white sugar': 'sugar',
    'ground black pepper': 'black pepper',
  };
  for (const [key, value] of Object.entries(normalizations)) {
    if (normalized.includes(key)) { normalized = value; break; }
  }
  return normalized.trim();
};

export const generateGroceryList = (mealPlan: MealPlan, recipes: Recipe[]): GroceryItem[] => {
  type Agg = {
    totalBase: number;
    kind: UnitKind;
    sampleUnit: string;
    originalName: string;
    category: string;
    recipeIds: Set<string>;
  };
  const ingredientMap: Record<string, Agg> = {};

  const classify = (name: string): string => {
    if (/\b(apple|banana|berry|berries|orange|fruit|grape|melon|pear|peach|plum|mango)\b/i.test(name)) return 'Fruits';
    if (/\b(vegetable|carrot|onion|potato|tomato|lettuce|spinach|kale|broccoli|cauliflower|pepper|cucumber|zucchini|squash|garlic|ginger)\b/i.test(name)) return 'Vegetables';
    if (/\b(beef|chicken|pork|turkey|lamb|meat|steak|ground|sausage|bacon)\b/i.test(name)) return 'Meat';
    if (/\b(fish|salmon|tuna|shrimp|seafood|cod|tilapia)\b/i.test(name)) return 'Seafood';
    if (/\b(milk|cheese|yogurt|cream|butter|dairy)\b/i.test(name)) return 'Dairy';
    if (/\b(bread|bagel|roll|bun|tortilla|pita|naan|bakery)\b/i.test(name)) return 'Bakery';
    if (/\b(rice|pasta|noodle|grain|quinoa|couscous|cereal|oat|flour)\b/i.test(name)) return 'Grains';
    if (/\b(bean|lentil|chickpea|legume|tofu|tempeh)\b/i.test(name)) return 'Legumes';
    if (/\b(oil|vinegar|sauce|condiment|ketchup|mustard|mayo|dressing)\b/i.test(name)) return 'Condiments';
    if (/\b(spice|herb|salt|pepper|oregano|basil|thyme|cumin|paprika|cinnamon)\b/i.test(name)) return 'Spices';
    if (/\b(sugar|honey|syrup|sweetener)\b/i.test(name)) return 'Baking';
    if (/\b(nut|seed|almond|walnut|peanut|cashew)\b/i.test(name)) return 'Nuts & Seeds';
    if (/\b(can|canned|jar|preserved)\b/i.test(name)) return 'Canned Goods';
    if (/\b(frozen)\b/i.test(name)) return 'Frozen';
    if (/\b(snack|chip|cracker|pretzel)\b/i.test(name)) return 'Snacks';
    if (/\b(juice|soda|beverage|drink|water|coffee|tea)\b/i.test(name)) return 'Beverages';
    return 'Other';
  };

  const upsert = (nameRaw: string, factor: number, recipeId?: string) => {
    const { quantity, unit, name } = parseIngredient(nameRaw);
    const normalizedName = normalizeIngredientName(name);
    const { baseQty, kind } = toBaseUnits(quantity * factor, unit);

    const category = classify(name);
    if (!ingredientMap[normalizedName]) {
      ingredientMap[normalizedName] = {
        totalBase: baseQty,
        kind,
        sampleUnit: unit,
        originalName: normalizedName,
        category,
        recipeIds: new Set<string>(),
      };
    } else {
      if (ingredientMap[normalizedName].kind !== kind && kind !== 'unknown') {
        ingredientMap[normalizedName].kind = 'count';
      }
      ingredientMap[normalizedName].totalBase += baseQty;
    }
    if (recipeId) ingredientMap[normalizedName].recipeIds.add(recipeId);
  };

  Object.values(mealPlan).forEach((day) => {
    (['breakfast', 'lunch', 'dinner'] as Array<keyof typeof day>).forEach((mealType) => {
      const meal = day[mealType] as MealItem | undefined;
      if (!meal) return;
      if (meal.recipeId) {
        const recipe = recipes.find((r) => r.id === meal.recipeId);
        if (recipe) {
          const factor = (meal.servings ?? 1) / Math.max(1, recipe.servings);
          recipe.ingredients.forEach((ingredientStr) => upsert(ingredientStr, factor, recipe.id));
        }
      } else if (meal.ingredients && meal.ingredients.length > 0) {
        const factor = meal.servings ?? 1;
        meal.ingredients.forEach((ci) => {
          const line = `${ci.quantity} ${ci.unit} ${ci.name}`.trim();
          upsert(line, factor);
        });
      }
    });
    const snacks = day.snacks ?? [];
    snacks.forEach((meal) => {
      if (meal.recipeId) {
        const recipe = recipes.find((r) => r.id === meal.recipeId);
        if (recipe) {
          const factor = (meal.servings ?? 1) / Math.max(1, recipe.servings);
          recipe.ingredients.forEach((ingredientStr) => upsert(ingredientStr, factor, recipe.id));
        }
      } else if (meal.ingredients && meal.ingredients.length > 0) {
        const factor = meal.servings ?? 1;
        meal.ingredients.forEach((ci) => {
          const line = `${ci.quantity} ${ci.unit} ${ci.name}`.trim();
          upsert(line, factor);
        });
      }
    });
  });

  const groceryList: GroceryItem[] = Object.entries(ingredientMap).map(([normalizedName, agg]) => {
    const { quantity, unit } = formatFromBase(agg.totalBase, agg.kind);
    const qtyRounded = Math.round((quantity + Number.EPSILON) * 100) / 100;
    const nameWithQty = unit ? `${normalizedName} (${qtyRounded} ${unit})` : `${normalizedName} (${qtyRounded})`;

    return {
      id: `${normalizedName}-${Math.random().toString(36).slice(2, 9)}`,
      name: nameWithQty,
      quantity: qtyRounded,
      unit,
      category: agg.category,
      checked: false,
      recipeIds: Array.from(agg.recipeIds),
    };
  });

  return groceryList.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
};