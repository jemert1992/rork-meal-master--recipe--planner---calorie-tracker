import { DietType } from '@/types';

// Diet types with descriptions
export const DIET_TYPES: { id: DietType; label: string; description: string }[] = [
  { id: 'any', label: 'Any', description: 'No specific diet restrictions' },
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat, fish, or poultry' },
  { id: 'vegan', label: 'Vegan', description: 'No animal products' },
  { id: 'keto', label: 'Keto', description: 'High-fat, low-carb diet' },
  { id: 'paleo', label: 'Paleo', description: 'Based on foods presumed to be available to paleolithic humans' },
  { id: 'gluten-free', label: 'Gluten-Free', description: 'No wheat, barley, or rye' },
  { id: 'dairy-free', label: 'Dairy-Free', description: 'No milk, cheese, or dairy products' },
  { id: 'low-carb', label: 'Low-Carb', description: 'Reduced carbohydrate consumption' },
];

// Mapping of diet types to foods to avoid
export const DIET_RESTRICTIONS: Record<DietType, string[]> = {
  'any': [],
  'vegetarian': ['meat', 'poultry', 'fish', 'seafood', 'gelatin', 'lard', 'animal rennet'],
  'vegan': [
    'meat', 'poultry', 'fish', 'seafood', 'eggs', 'dairy', 'milk', 'cheese', 
    'butter', 'honey', 'gelatin', 'lard', 'whey', 'casein', 'animal rennet'
  ],
  'keto': [
    'sugar', 'bread', 'pasta', 'rice', 'potatoes', 'corn', 'beans', 'lentils',
    'most fruits', 'candy', 'soda', 'juice', 'honey', 'agave'
  ],
  'paleo': [
    'grains', 'legumes', 'dairy', 'refined sugar', 'salt', 'potatoes', 
    'processed foods', 'refined vegetable oils'
  ],
  'gluten-free': [
    'wheat', 'barley', 'rye', 'triticale', 'malt', 'brewer\'s yeast', 
    'wheat starch', 'wheat bran', 'wheat germ', 'cracked wheat', 'hydrolyzed wheat protein'
  ],
  'dairy-free': [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'ice cream', 'whey', 
    'casein', 'lactose', 'ghee', 'curds'
  ],
  'low-carb': [
    'sugar', 'bread', 'pasta', 'rice', 'potatoes', 'corn', 'beans', 
    'lentils', 'candy', 'soda', 'juice', 'honey', 'agave'
  ]
};