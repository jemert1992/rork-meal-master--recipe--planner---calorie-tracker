import { DietType } from '@/types';

// Diet types with descriptions
export const DIET_TYPES = [
  {
    id: 'any' as DietType,
    label: 'No Restrictions',
    description: 'I eat everything',
  },
  {
    id: 'vegetarian' as DietType,
    label: 'Vegetarian',
    description: 'No meat, but may include dairy and eggs',
  },
  {
    id: 'vegan' as DietType,
    label: 'Vegan',
    description: 'No animal products',
  },
  {
    id: 'pescatarian' as DietType,
    label: 'Pescatarian',
    description: 'Vegetarian plus seafood',
  },
  {
    id: 'keto' as DietType,
    label: 'Keto',
    description: 'Low carb, high fat',
  },
  {
    id: 'paleo' as DietType,
    label: 'Paleo',
    description: 'Based on foods presumed to be available to paleolithic humans',
  },
  {
    id: 'gluten-free' as DietType,
    label: 'Gluten-Free',
    description: 'No gluten-containing ingredients',
  },
  {
    id: 'dairy-free' as DietType,
    label: 'Dairy-Free',
    description: 'No dairy products',
  },
  {
    id: 'low-carb' as DietType,
    label: 'Low-Carb',
    description: 'Reduced carbohydrate intake',
  },
];