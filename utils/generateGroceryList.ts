import { MealPlan, Recipe, GroceryItem, MealItem } from '@/types';

// Debug logs are verbose by design to help trace data issues across web and native
const log = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  console.log('[generateGroceryList]', ...args);
};

type UnitKind = 'mass' | 'volume' | 'count' | 'unknown';

type UnitDef = { canonical: string; kind: UnitKind; toBase: number };

// Base units: mass=g, volume=ml, count=1
const UNIT_MAP: Record<string, UnitDef> = {
  // mass
  mg: { canonical: 'mg', kind: 'mass', toBase: 0.001 },
  g: { canonical: 'g', kind: 'mass', toBase: 1 },
  gram: { canonical: 'g', kind: 'mass', toBase: 1 },
  grams: { canonical: 'g', kind: 'mass', toBase: 1 },
  kg: { canonical: 'kg', kind: 'mass', toBase: 1000 },
  kilogram: { canonical: 'kg', kind: 'mass', toBase: 1000 },
  kilograms: { canonical: 'kg', kind: 'mass', toBase: 1000 },
  lb: { canonical: 'lb', kind: 'mass', toBase: 453.592 },
  lbs: { canonical: 'lb', kind: 'mass', toBase: 453.592 },
  pound: { canonical: 'lb', kind: 'mass', toBase: 453.592 },
  pounds: { canonical: 'lb', kind: 'mass', toBase: 453.592 },
  oz: { canonical: 'oz', kind: 'mass', toBase: 28.3495 },
  ounce: { canonical: 'oz', kind: 'mass', toBase: 28.3495 },
  ounces: { canonical: 'oz', kind: 'mass', toBase: 28.3495 },

  // volume
  ml: { canonical: 'ml', kind: 'volume', toBase: 1 },
  milliliter: { canonical: 'ml', kind: 'volume', toBase: 1 },
  milliliters: { canonical: 'ml', kind: 'volume', toBase: 1 },
  l: { canonical: 'l', kind: 'volume', toBase: 1000 },
  liter: { canonical: 'l', kind: 'volume', toBase: 1000 },
  liters: { canonical: 'l', kind: 'volume', toBase: 1000 },
  cup: { canonical: 'cup', kind: 'volume', toBase: 240 },
  cups: { canonical: 'cup', kind: 'volume', toBase: 240 },
  c: { canonical: 'cup', kind: 'volume', toBase: 240 },
  tbsp: { canonical: 'tbsp', kind: 'volume', toBase: 15 },
  'tbsp.': { canonical: 'tbsp', kind: 'volume', toBase: 15 },
  tablespoon: { canonical: 'tbsp', kind: 'volume', toBase: 15 },
  tablespoons: { canonical: 'tbsp', kind: 'volume', toBase: 15 },
  tsp: { canonical: 'tsp', kind: 'volume', toBase: 5 },
  'tsp.': { canonical: 'tsp', kind: 'volume', toBase: 5 },
  teaspoon: { canonical: 'tsp', kind: 'volume', toBase: 5 },
  teaspoons: { canonical: 'tsp', kind: 'volume', toBase: 5 },
  tspn: { canonical: 'tsp', kind: 'volume', toBase: 5 },
  'fl oz': { canonical: 'fl oz', kind: 'volume', toBase: 29.5735 },
  floz: { canonical: 'fl oz', kind: 'volume', toBase: 29.5735 },
  pt: { canonical: 'pt', kind: 'volume', toBase: 473.176 },
  pint: { canonical: 'pt', kind: 'volume', toBase: 473.176 },
  qt: { canonical: 'qt', kind: 'volume', toBase: 946.353 },
  quart: { canonical: 'qt', kind: 'volume', toBase: 946.353 },
  gal: { canonical: 'gal', kind: 'volume', toBase: 3785.41 },
  gallon: { canonical: 'gal', kind: 'volume', toBase: 3785.41 },

  // count-like
  pinch: { canonical: 'pinch', kind: 'count', toBase: 1 },
  dashes: { canonical: 'dash', kind: 'count', toBase: 1 },
  dash: { canonical: 'dash', kind: 'count', toBase: 1 },
  slice: { canonical: 'slice', kind: 'count', toBase: 1 },
  slices: { canonical: 'slice', kind: 'count', toBase: 1 },
  piece: { canonical: 'piece', kind: 'count', toBase: 1 },
  pieces: { canonical: 'piece', kind: 'count', toBase: 1 },
  clove: { canonical: 'clove', kind: 'count', toBase: 1 },
  cloves: { canonical: 'clove', kind: 'count', toBase: 1 },
  bunch: { canonical: 'bunch', kind: 'count', toBase: 1 },
  bunches: { canonical: 'bunch', kind: 'count', toBase: 1 },
  stick: { canonical: 'stick', kind: 'count', toBase: 1 },
  sticks: { canonical: 'stick', kind: 'count', toBase: 1 },
  can: { canonical: 'can', kind: 'count', toBase: 1 },
  cans: { canonical: 'can', kind: 'count', toBase: 1 },
  pkg: { canonical: 'package', kind: 'count', toBase: 1 },
  package: { canonical: 'package', kind: 'count', toBase: 1 },
};

const toBaseUnits = (qty: number, unit: string): { baseQty: number; kind: UnitKind; canonical: string } => {
  const key = unit.trim().toLowerCase();
  const def = UNIT_MAP[key];
  if (!def) {
    return { baseQty: qty, kind: unit ? 'unknown' : 'count', canonical: unit };
  }
  return { baseQty: qty * def.toBase, kind: def.kind, canonical: def.canonical };
};

const formatFromBase = (baseQty: number, kind: UnitKind): { quantity: number; unit: string } => {
  if (kind === 'mass') {
    if (baseQty >= 1000) return { quantity: baseQty / 1000, unit: 'kg' };
    if (baseQty >= 1) return { quantity: baseQty, unit: 'g' };
    return { quantity: baseQty * 1000, unit: 'mg' };
  }
  if (kind === 'volume') {
    if (baseQty >= 1000) return { quantity: baseQty / 1000, unit: 'l' };
    return { quantity: baseQty, unit: 'ml' };
  }
  return { quantity: baseQty, unit: '' };
};

/**
 * Extract quantity, unit, and cleaned ingredient name from a human string
 */
const parseIngredient = (ingredient: string): { quantity: number; unit: string; name: string } => {
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
    quantity = whole + (d ? n / d : 0);
    rest = rest.slice(mf[0].length).trim();
  } else {
    const fo = rest.match(fractionOnly);
    if (fo) {
      const [n, d] = fo[1].split('/').map(Number);
      quantity = d ? n / d : 0;
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
  const words = rest.split(/\s+/);
  const twoWords = words.slice(0, 2).join(' ').toLowerCase();
  if (UNIT_MAP[twoWords]) {
    unit = twoWords;
    rest = words.slice(2).join(' ');
  } else {
    const firstWord = words[0]?.toLowerCase() ?? '';
    if (UNIT_MAP[firstWord]) {
      unit = firstWord;
      rest = words.slice(1).join(' ');
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
    name = name.replace(new RegExp(`\\s*${term}\\b`, 'gi'), '');
  }
  name = name.replace(/,\s*$/, '').trim();

  return { quantity, unit, name };
};

/**
 * Canonical name normalization to dedupe items
 */
const normalizeIngredientName = (name: string): string => {
  let normalized = name.toLowerCase().trim();
  normalized = normalized.replace(/[.,]/g, ' ');
  const adjectives = [
    'fresh', 'frozen', 'canned', 'dried', 'raw', 'cooked',
    'red', 'green', 'yellow', 'orange', 'purple', 'black', 'white',
    'large', 'medium', 'small', 'extra', 'virgin', 'cold-pressed',
    'organic', 'free-range', 'grass-fed', 'lean', 'ripe'
  ];
  for (const adj of adjectives) {
    normalized = normalized.replace(new RegExp(`\\b${adj}\\b`, 'g'), '');
  }
  if (normalized.includes('pepper')) {
    if (normalized.includes('bell')) normalized = 'bell pepper';
    else if (normalized.includes('chili') || normalized.includes('chile')) normalized = 'chili pepper';
  }
  const normalizations: Record<string, string> = {
    'yellow onion': 'onion',
    'white onion': 'onion',
    'red onion': 'onion',
    'garlic clove': 'garlic',
    'garlic cloves': 'garlic',
    'minced garlic': 'garlic',
    'all-purpose flour': 'flour',
    'all purpose flour': 'flour',
    'ap flour': 'flour',
    'granulated sugar': 'sugar',
    'white sugar': 'sugar',
    'brown sugar': 'sugar',
    'ground black pepper': 'black pepper',
    'spring onion': 'green onion',
    'scallion': 'green onion',
    'scallions': 'green onion',
    'cilantro': 'coriander',
  };
  for (const [key, value] of Object.entries(normalizations)) {
    if (normalized.includes(key)) { normalized = value; break; }
  }
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
};

const classify = (name: string): string => {
  const n = name.toLowerCase();
  if (/(apple|banana|berry|berries|orange|fruit|grape|melon|pear|peach|plum|mango|avocado)/i.test(n)) return 'Produce';
  if (/(vegetable|carrot|onion|potato|tomato|lettuce|spinach|kale|broccoli|cauliflower|pepper|cucumber|zucchini|squash|garlic|ginger|herb)/i.test(n)) return 'Produce';
  if (/(beef|chicken|pork|turkey|lamb|meat|steak|ground|sausage|bacon)/i.test(n)) return 'Meat';
  if (/(fish|salmon|tuna|shrimp|seafood|cod|tilapia)/i.test(n)) return 'Seafood';
  if (/(milk|cheese|yogurt|cream|butter|dairy)/i.test(n)) return 'Dairy';
  if (/(bread|bagel|roll|bun|tortilla|pita|naan|bakery)/i.test(n)) return 'Bakery';
  if (/(rice|pasta|noodle|grain|quinoa|couscous|cereal|oat|flour)/i.test(n)) return 'Grains';
  if (/(bean|lentil|chickpea|legume|tofu|tempeh)/i.test(n)) return 'Legumes';
  if (/(oil|vinegar|sauce|condiment|ketchup|mustard|mayo|dressing)/i.test(n)) return 'Condiments';
  if (/(spice|salt|pepper|oregano|basil|thyme|cumin|paprika|cinnamon|herb)/i.test(n)) return 'Spices';
  if (/(sugar|honey|syrup|sweetener|baking|yeast)/i.test(n)) return 'Baking';
  if (/(nut|seed|almond|walnut|peanut|cashew|sunflower)/i.test(n)) return 'Nuts & Seeds';
  if (/(can|canned|jar|preserved)/i.test(n)) return 'Canned Goods';
  if (/(frozen)/i.test(n)) return 'Frozen';
  if (/(snack|chip|cracker|pretzel)/i.test(n)) return 'Snacks';
  if (/(juice|soda|beverage|drink|water|coffee|tea)/i.test(n)) return 'Beverages';
  return 'Other';
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

  const upsert = (nameRaw: string, factor: number, recipeId?: string) => {
    try {
      const { quantity, unit, name } = parseIngredient(nameRaw);
      const normalizedName = normalizeIngredientName(name);
      const { baseQty, kind, canonical } = toBaseUnits(quantity * factor, unit);
      const category = classify(normalizedName);
      const bucketKey = `${normalizedName}|${kind}`;

      if (!ingredientMap[bucketKey]) {
        ingredientMap[bucketKey] = {
          totalBase: baseQty,
          kind,
          sampleUnit: canonical || unit,
          originalName: normalizedName,
          category,
          recipeIds: new Set<string>(),
        };
      } else {
        ingredientMap[bucketKey].totalBase += baseQty;
      }
      if (recipeId) ingredientMap[bucketKey].recipeIds.add(recipeId);
    } catch (e) {
      log('Failed to upsert ingredient', { nameRaw, factor, error: e });
    }
  };

  Object.values(mealPlan).forEach((day) => {
    (['breakfast', 'lunch', 'dinner'] as Array<keyof typeof day>).forEach((mealType) => {
      const meal = day[mealType] as MealItem | undefined;
      if (!meal) return;
      if (meal.recipeId) {
        const recipe = recipes.find((r) => r.id === meal.recipeId);
        if (recipe) {
          const factor = (meal.servings ?? 1) / Math.max(1, recipe.servings);
          log('Recipe meal', { mealType, recipe: recipe.name, factor });
          recipe.ingredients.forEach((ingredientStr) => upsert(ingredientStr, factor, recipe.id));
        }
      } else if (meal.ingredients && meal.ingredients.length > 0) {
        const factor = meal.servings ?? 1;
        log('Custom meal', { mealType, factor, count: meal.ingredients.length });
        meal.ingredients.forEach((ci) => {
          const qty = typeof ci.quantity === 'number' ? ci.quantity : Number(ci.quantity);
          const line = `${qty} ${ci.unit ?? ''} ${ci.name}`.trim();
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
          log('Snack recipe', { recipe: recipe.name, factor });
          recipe.ingredients.forEach((ingredientStr) => upsert(ingredientStr, factor, recipe.id));
        }
      } else if (meal.ingredients && meal.ingredients.length > 0) {
        const factor = meal.servings ?? 1;
        log('Snack custom', { factor, count: meal.ingredients.length });
        meal.ingredients.forEach((ci) => {
          const qty = typeof ci.quantity === 'number' ? ci.quantity : Number(ci.quantity);
          const line = `${qty} ${ci.unit ?? ''} ${ci.name}`.trim();
          upsert(line, factor);
        });
      }
    });
  });

  const groceryList: GroceryItem[] = Object.entries(ingredientMap).map(([bucketKey, agg]) => {
    const { quantity, unit } = formatFromBase(agg.totalBase, agg.kind);
    const qtyRounded = Math.round((quantity + Number.EPSILON) * 100) / 100;
    const displayName = agg.originalName;
    const nameWithQty = unit ? `${displayName} (${qtyRounded} ${unit})` : `${displayName} (${qtyRounded})`;

    const idBase = `${bucketKey}-${unit}-${agg.category}`;

    return {
      id: idBase,
      name: nameWithQty,
      quantity: qtyRounded,
      unit,
      category: agg.category,
      checked: false,
      recipeIds: Array.from(agg.recipeIds),
    };
  });

  const sorted = groceryList.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  log('Generated grocery list', { count: sorted.length });
  return sorted;
};
