import { Recipe } from '@/types';
import { normalizeIngredientList } from '@/utils/ingredientParser';
import { validateRecipe } from '@/services/recipeApiService';

export function isRecipeDataValid(input: any): input is Recipe {
  try {
    const r = validateRecipe(input);
    const hasName = typeof r.name === 'string' && r.name.trim().length > 0;
    const hasIngredients = Array.isArray(r.ingredients) && r.ingredients.length > 0 && r.ingredients.every((s) => typeof s === 'string' && s.trim().length > 0);
    const hasInstructions = Array.isArray(r.instructions) && r.instructions.length > 0;
    const caloriesOk = typeof r.calories === 'number' && !isNaN(r.calories) && r.calories >= 0;
    return hasName && hasIngredients && hasInstructions && caloriesOk;
  } catch (e) {
    console.warn('isRecipeDataValid error', e);
    return false;
  }
}

export function sanitizeRecipe(input: any): Recipe {
  try {
    const base = validateRecipe(input);
    const { strings, parsed } = normalizeIngredientList(base.ingredients);
    return {
      ...base,
      ingredients: strings.length > 0 ? strings : ['Ingredients unavailable'],
      parsedIngredients: parsed,
      instructions: Array.isArray(base.instructions) && base.instructions.length > 0 ? base.instructions : (strings.length > 0 ? strings.map((ing) => `Use ${ing}`) : ['Prepare and serve']),
      tags: Array.isArray(base.tags) ? base.tags.map((t) => String(t).toLowerCase()).filter((t) => t.length > 0) : [],
    };
  } catch (e) {
    console.error('sanitizeRecipe error', e);
    return validateRecipe(input);
  }
}
