import { RecipeIngredient } from '@/types';

const units = [
  'tsp','teaspoon','teaspoons','tbsp','tablespoon','tablespoons','cup','cups','oz','ounce','ounces','lb','pound','pounds','g','gram','grams','kg','kilogram','kilograms','ml','milliliter','milliliters','l','liter','liters','pinch','clove','cloves','slice','slices','can','cans'
] as const;

const unitPattern = new RegExp(`^(${units.join('|')})$`, 'i');

export function parseIngredientLine(line: string): RecipeIngredient {
  try {
    const cleaned = (line ?? '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return { name: '' };

    const parts = cleaned.split(' ');

    let quantity: number | undefined;
    let unit: string | undefined;
    let nameStartIdx = 0;

    const fracToNumber = (txt: string): number | undefined => {
      if (!txt) return undefined;
      if (/^\d+$/.test(txt)) return parseFloat(txt);
      if (/^\d+[\/\-]\d+$/.test(txt)) {
        const [a,b] = txt.split(/[\/\-]/).map(Number);
        if (!isNaN(a) && !isNaN(b) && b !== 0) return a/b;
      }
      if (/^\d+\.\d+$/.test(txt)) return parseFloat(txt);
      return undefined;
    };

    const q1 = fracToNumber(parts[0]);
    if (q1 !== undefined) {
      quantity = q1;
      nameStartIdx = 1;
      const maybeUnit = parts[1];
      if (maybeUnit && unitPattern.test(maybeUnit)) {
        unit = maybeUnit.toLowerCase();
        nameStartIdx = 2;
      }
    } else if (parts[1] && /^\d+[\/\-]\d+$/.test(parts[1])) {
      const mix = fracToNumber(`${parts[0]} ${parts[1]}`.replace(' ', '/'));
      if (mix !== undefined) {
        quantity = mix;
        nameStartIdx = 2;
        const maybeUnit = parts[2];
        if (maybeUnit && unitPattern.test(maybeUnit)) {
          unit = maybeUnit.toLowerCase();
          nameStartIdx = 3;
        }
      }
    }

    const name = parts.slice(nameStartIdx).join(' ').replace(/^of\s+/i, '').trim();
    return { name, quantity, unit };
  } catch (e) {
    console.error('parseIngredientLine error', e);
    return { name: (line ?? '').trim() };
  }
}

export function normalizeIngredientList(lines: unknown): { strings: string[]; parsed: RecipeIngredient[] } {
  try {
    const arr = Array.isArray(lines) ? lines : [];
    const strings = arr
      .map((x) => (typeof x === 'string' ? x : ''))
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const parsed = strings.map(parseIngredientLine);
    return { strings, parsed };
  } catch (e) {
    console.error('normalizeIngredientList error', e);
    return { strings: [], parsed: [] };
  }
}
