/*
  Usage examples (run with Bun):
  - bun run scripts/recipe-importer.ts --source file --input ./imports/recipes.json --tag imported
  - bun run scripts/recipe-importer.ts --source csv --input ./imports/recipes.csv --tag imported
  - SPOONACULAR_API_KEY=xxx bun run scripts/recipe-importer.ts --source spoonacular --count 120 --tag imported
  - EDAMAM_APP_ID=xxx EDAMAM_APP_KEY=yyy bun run scripts/recipe-importer.ts --source edamam --query "chicken" --count 120 --tag imported

  The script validates with sanitizeRecipe + isRecipeDataValid, dedupes by id and name, and writes constants/mockData.ts
*/

/* eslint-disable no-console */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Recipe } from '@/types';
import { sanitizeRecipe, isRecipeDataValid } from '@/utils/recipeIntegrity';
import { validateRecipe } from '@/services/recipeApiService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : 'true';
      if (val !== 'true') i++;
      args[key] = val;
    }
  }
  return args;
}

function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }
function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') return v.split('|').map(s => s.trim()).filter(Boolean);
  return [];
}

async function loadExistingMockRecipes(): Promise<Recipe[]> {
  try {
    const moduleUrl = pathToFileURL(resolve(__dirname, '../constants/mockData.ts')).href;
    const mod: any = await import(moduleUrl + `?t=${Date.now()}`);
    const arr = Array.isArray(mod.mockRecipes) ? mod.mockRecipes as Recipe[] : [];
    return arr.map(validateRecipe);
  } catch (e) {
    console.warn('Could not import existing mockRecipes, will treat as empty.', e);
    return [];
  }
}

function normalizeBase(r: any): Recipe {
  const base = validateRecipe(r);
  const tagged = { ...base } as Recipe;
  tagged.tags = uniq([...(base.tags ?? []), 'imported']);
  if (!tagged.source) tagged.source = 'import';
  return tagged;
}

function ensureUniqueIds(recipes: Recipe[], existingIds: Set<string>): Recipe[] {
  return recipes.map((r) => {
    let id = r.id && String(r.id).trim().length > 0 ? String(r.id) : `import-${Math.random().toString(36).slice(2)}`;
    while (existingIds.has(id)) {
      id = `${id}-dup${Math.random().toString(36).slice(2, 6)}`;
    }
    return { ...r, id };
  });
}

function dedupeRecipes(recipes: Recipe[], existing: Recipe[]): { deduped: Recipe[]; duplicates: number } {
  const byKey = new Map<string, Recipe>();
  const existingKeys = new Set<string>([
    ...existing.map(r => r.id),
    ...existing.map(r => r.name.toLowerCase())
  ]);
  let dup = 0;
  for (const r of recipes) {
    const keyId = r.id;
    const keyName = r.name.toLowerCase();
    if (existingKeys.has(keyId) || existingKeys.has(keyName)) { dup++; continue; }
    const k = `${keyId}|${keyName}`;
    if (!byKey.has(k)) byKey.set(k, r); else dup++;
  }
  return { deduped: Array.from(byKey.values()), duplicates: dup };
}

function csvToJson(csv: string): any[] {
  const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const obj: any = {};
    headers.forEach((h, idx) => { obj[h] = (cols[idx] ?? '').trim(); });
    rows.push(obj);
  }
  return rows;
}

async function loadFromFile(inputPath: string, format: 'json' | 'csv'): Promise<Recipe[]> {
  const abs = resolve(process.cwd(), inputPath);
  const raw = readFileSync(abs, 'utf-8');
  const rows: any[] = format === 'csv' ? csvToJson(raw) : JSON.parse(raw);
  const out: Recipe[] = [];
  for (const row of rows) {
    const ingredients = toArray(row.ingredients);
    const instructions = toArray(row.instructions);
    const tags = toArray(row.tags);
    const r: any = {
      id: row.id ?? undefined,
      name: row.name ?? row.title ?? 'Untitled',
      image: row.image ?? undefined,
      prepTime: row.prepTime ?? '15 min',
      cookTime: row.cookTime ?? undefined,
      servings: Number(row.servings ?? 2),
      calories: Number(row.calories ?? 300),
      protein: Number(row.protein ?? 15),
      carbs: Number(row.carbs ?? 30),
      fat: Number(row.fat ?? 12),
      fiber: row.fiber !== undefined ? Number(row.fiber) : undefined,
      ingredients,
      instructions,
      tags,
      mealType: row.mealType && ['breakfast','lunch','dinner'].includes(String(row.mealType)) ? String(row.mealType) : undefined,
      source: row.source ?? 'file'
    };
    out.push(normalizeBase(r));
  }
  return out;
}

async function loadFromSpoonacular(count: number): Promise<Recipe[]> {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) {
    console.warn('SPOONACULAR_API_KEY not set; skipping Spoonacular import.');
    return [];
  }
  const url = `https://api.spoonacular.com/recipes/random?number=${Math.min(count, 100)}&apiKey=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn('Spoonacular request failed', res.status, res.statusText);
    return [];
  }
  const data: any = await res.json();
  const recipes = (data.recipes ?? []).map((raw: any) => normalizeBase({
    id: `spoon-${raw.id}`,
    name: raw.title,
    image: raw.image,
    prepTime: raw.preparationMinutes ? `${raw.preparationMinutes} min` : '15 min',
    cookTime: raw.cookingMinutes ? `${raw.cookingMinutes} min` : undefined,
    servings: raw.servings ?? 2,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    ingredients: (raw.extendedIngredients ?? []).map((i: any) => {
      const amt = i.measures?.us?.amount || i.amount || ''; const unit = i.measures?.us?.unitShort || i.unit || ''; const nm = i.originalName || i.name || '';
      if (amt && unit) return `${amt} ${unit} ${nm}`; if (amt) return `${amt} ${nm}`; return nm;
    }),
    instructions: raw.analyzedInstructions?.[0]?.steps?.map((s: any) => s.step) ?? (raw.instructions ? String(raw.instructions).split(/\r?\n|\./).map((s: string) => s.trim()).filter(Boolean) : []),
    tags: [
      ...(raw.cuisines ?? []).map((x: string) => x.toLowerCase()),
      ...(raw.dishTypes ?? []).map((x: string) => x.toLowerCase()),
      ...(raw.diets ?? []).map((x: string) => x.toLowerCase()),
    ],
    mealType: undefined,
    source: 'Spoonacular'
  }));
  return recipes;
}

async function loadFromEdamam(query: string, count: number): Promise<Recipe[]> {
  const appId = process.env.EDAMAM_APP_ID; const appKey = process.env.EDAMAM_APP_KEY;
  if (!appId || !appKey) { console.warn('EDAMAM_APP_ID or EDAMAM_APP_KEY not set; skipping Edamam import.'); return []; }
  const url = `https://api.edamam.com/search?q=${encodeURIComponent(query)}&app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&to=${Math.min(count, 100)}`;
  const res = await fetch(url);
  if (!res.ok) { console.warn('Edamam request failed', res.status, res.statusText); return []; }
  const data: any = await res.json();
  const items = Array.isArray(data.hits) ? data.hits : [];
  const recipes: Recipe[] = items.map((hit: any) => normalizeBase({
    id: `edamam-${Buffer.from(String(hit.recipe.uri || hit.recipe.label)).toString('base64').slice(0, 16)}`,
    name: hit.recipe.label,
    image: hit.recipe.image,
    prepTime: '20 min',
    servings: Math.max(1, Math.round(hit.recipe.yield || 2)),
    calories: Math.max(0, Math.round((hit.recipe.calories || 0) / Math.max(1, hit.recipe.yield || 1))),
    protein: Math.round(((hit.recipe.totalNutrients?.PROCNT?.quantity ?? 0) / Math.max(1, hit.recipe.yield || 1))),
    carbs: Math.round(((hit.recipe.totalNutrients?.CHOCDF?.quantity ?? 0) / Math.max(1, hit.recipe.yield || 1))),
    fat: Math.round(((hit.recipe.totalNutrients?.FAT?.quantity ?? 0) / Math.max(1, hit.recipe.yield || 1))),
    fiber: Math.round(((hit.recipe.totalNutrients?.FIBTG?.quantity ?? 0) / Math.max(1, hit.recipe.yield || 1))),
    ingredients: (hit.recipe.ingredientLines ?? []),
    instructions: [],
    tags: [
      ...(hit.recipe.cuisineType ?? []),
      ...(hit.recipe.dishType ?? []),
      ...(hit.recipe.dietLabels ?? []),
      ...(hit.recipe.healthLabels ?? [])
    ].map((s: string) => String(s).toLowerCase()),
    mealType: (hit.recipe.mealType?.[0] && ['breakfast','lunch','dinner'].includes(String(hit.recipe.mealType[0]).toLowerCase())) ? String(hit.recipe.mealType[0]).toLowerCase() : undefined,
    source: 'Edamam'
  }));
  return recipes;
}

function renderMockDataTs(recipes: Recipe[], previousTail = '\n// Sample meal plan for app functionality\nexport const mockMealPlan: MealPlan = {};\n\n// Sample grocery list for app functionality\nexport const mockGroceryList: GroceryItem[] = [];\n'): string {
  const header = `// Auto-generated by scripts/recipe-importer.ts\n\nimport { Recipe, MealPlan, GroceryItem } from '@/types';\n\nexport const mockRecipes: Recipe[] = [\n`;
  const body = recipes.map((r) => {
    const obj = {
      id: r.id,
      name: r.name,
      image: r.image,
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      servings: r.servings,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      fiber: r.fiber,
      ingredients: r.ingredients,
      instructions: r.instructions,
      tags: r.tags,
      mealType: r.mealType,
      complexity: r.complexity,
      dietaryPreferences: r.dietaryPreferences,
      fitnessGoals: r.fitnessGoals,
      source: r.source,
    } as Recipe;
    const json = JSON.stringify(obj, null, 2)
      .replace(/"mealType": null/g, '"mealType": undefined')
      .replace(/\n/g, '\n')
      ;
    return json;
  }).join(',\n');
  const footer = `\n];\n\n${previousTail}`;
  return header + body + footer;
}

async function main() {
  const args = parseArgs(process.argv);
  const source = String(args.source || 'file');
  const input = args.input ? String(args.input) : '';
  const tag = args.tag ? String(args.tag) : 'imported';
  const count = args.count ? Math.max(1, Number(args.count)) : 120;
  const query = args.query ? String(args.query) : 'dinner';

  console.log('Importer starting', { source, input, tag, count, query });

  const existing = await loadExistingMockRecipes();
  const existingIds = new Set(existing.map(r => r.id));

  let imported: Recipe[] = [];
  if (source === 'file' || source === 'json') {
    if (!input) throw new Error('--input required for source=file');
    imported = await loadFromFile(input, 'json');
  } else if (source === 'csv') {
    if (!input) throw new Error('--input required for source=csv');
    imported = await loadFromFile(input, 'csv');
  } else if (source === 'spoonacular') {
    imported = await loadFromSpoonacular(count);
  } else if (source === 'edamam') {
    imported = await loadFromEdamam(query, count);
  } else {
    throw new Error(`Unknown source: ${source}`);
  }

  console.log(`Fetched ${imported.length} raw recipes from ${source}`);

  // Tag
  imported = imported.map(r => ({ ...r, tags: uniq([...(r.tags ?? []), tag]) }));

  // Ensure ids unique against existing set
  imported = ensureUniqueIds(imported, existingIds);

  // Sanitize and validate
  const valid: Recipe[] = [];
  const failures: { name: string; id: string; reason: string }[] = [];
  for (const raw of imported) {
    try {
      const san = sanitizeRecipe(raw);
      if (isRecipeDataValid(san)) {
        valid.push(san);
      } else {
        failures.push({ name: raw.name, id: raw.id, reason: 'isRecipeDataValid returned false' });
      }
    } catch (e: any) {
      failures.push({ name: raw?.name ?? 'unknown', id: raw?.id ?? 'unknown', reason: String(e?.message ?? e) });
    }
  }

  // Dedupe vs existing
  const { deduped, duplicates } = dedupeRecipes(valid, existing);

  console.log(`Valid: ${valid.length}, duplicates skipped: ${duplicates}, failures: ${failures.length}`);

  // Merge into existing
  const merged = [...existing, ...deduped];

  // As a safety: ensure final uniqueness by id
  const seen = new Set<string>();
  const mergedUnique = merged.filter((r) => {
    if (seen.has(r.id)) return false; seen.add(r.id); return true;
  });

  // Write mockData.ts
  const targetPath = resolve(__dirname, '../constants/mockData.ts');
  const prevTail = '\n// Sample meal plan for app functionality\nexport const mockMealPlan: MealPlan = {};\n\n// Sample grocery list for app functionality\nexport const mockGroceryList: GroceryItem[] = [];\n';
  const fileContent = renderMockDataTs(mergedUnique, prevTail);

  // Ensure dir exists
  const dir = dirname(targetPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(targetPath, fileContent, 'utf-8');

  // Save an import report
  const reportDir = resolve(__dirname, '../imports');
  if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });
  const report = {
    timestamp: new Date().toISOString(),
    source,
    input,
    tag,
    requested: count,
    fetched: imported.length,
    valid: valid.length,
    added: deduped.length,
    duplicates,
    failures
  };
  writeFileSync(resolve(reportDir, `import-report-${Date.now()}.json`), JSON.stringify(report, null, 2));

  console.log('Import complete:', { totalNow: mergedUnique.length, added: deduped.length });
  console.log('A report was saved to /imports/*.json.');
}

// Run
main().catch((e) => {
  console.error('Importer failed', e);
  process.exit(1);
});
