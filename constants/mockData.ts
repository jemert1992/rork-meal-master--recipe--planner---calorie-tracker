// Mock data for recipes, meal plans, and grocery items

import { Recipe, MealPlan, GroceryItem } from '@/types';

// Mock recipes
export const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Avocado Toast with Egg',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    prepTime: '10 min',
    cookTime: '5 min',
    servings: 1,
    calories: 350,
    protein: 15,
    carbs: 30,
    fat: 20,
    fiber: 8,
    ingredients: [
      '1 slice whole grain bread',
      '1/2 ripe avocado',
      '1 large egg',
      'Salt and pepper to taste',
      'Red pepper flakes (optional)',
    ],
    instructions: [
      'Toast the bread until golden and firm.',
      'While the bread is toasting, mash the avocado in a small bowl with a fork.',
      'Heat a small non-stick pan over medium heat. Crack the egg into the pan and cook until the whites are set but the yolk is still runny.',
      'Spread the mashed avocado on the toasted bread.',
      'Top with the fried egg, salt, pepper, and red pepper flakes if desired.',
    ],
    tags: ['breakfast', 'healthy', 'quick', 'vegetarian'],
    mealType: 'breakfast',
    complexity: 'simple',
    dietaryPreferences: ['vegetarian'],
  },
  {
    id: '2',
    name: 'Grilled Chicken Salad',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    prepTime: '15 min',
    cookTime: '10 min',
    servings: 2,
    calories: 420,
    protein: 35,
    carbs: 20,
    fat: 22,
    fiber: 5,
    ingredients: [
      '2 boneless, skinless chicken breasts',
      '4 cups mixed greens',
      '1 cup cherry tomatoes, halved',
      '1/2 cucumber, sliced',
      '1/4 red onion, thinly sliced',
      '1/4 cup olive oil',
      '2 tbsp balsamic vinegar',
      'Salt and pepper to taste',
    ],
    instructions: [
      'Season chicken breasts with salt and pepper.',
      'Grill chicken for 5-6 minutes per side until fully cooked.',
      'Let chicken rest for 5 minutes, then slice.',
      'In a large bowl, combine mixed greens, tomatoes, cucumber, and red onion.',
      'Whisk together olive oil and balsamic vinegar to make the dressing.',
      'Add sliced chicken to the salad and drizzle with dressing.',
    ],
    tags: ['lunch', 'dinner', 'healthy', 'high-protein'],
    mealType: 'lunch',
    complexity: 'simple',
    dietaryPreferences: ['high-protein'],
    fitnessGoals: ['weight-loss', 'muscle-gain'],
  },
  {
    id: '3',
    name: 'Vegetable Stir Fry',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    prepTime: '20 min',
    cookTime: '10 min',
    servings: 4,
    calories: 280,
    protein: 12,
    carbs: 35,
    fat: 10,
    fiber: 8,
    ingredients: [
      '2 tbsp vegetable oil',
      '2 cloves garlic, minced',
      '1 tbsp ginger, grated',
      '1 bell pepper, sliced',
      '1 cup broccoli florets',
      '1 carrot, julienned',
      '1 cup snap peas',
      '1/4 cup soy sauce',
      '1 tbsp honey',
      '1 tsp sesame oil',
      '2 green onions, sliced',
      '1 tbsp sesame seeds',
    ],
    instructions: [
      'Heat vegetable oil in a large wok or skillet over high heat.',
      'Add garlic and ginger, stir for 30 seconds until fragrant.',
      'Add bell pepper, broccoli, and carrot. Stir fry for 3-4 minutes.',
      'Add snap peas and continue cooking for 2 minutes.',
      'In a small bowl, mix soy sauce, honey, and sesame oil.',
      'Pour sauce over vegetables and toss to coat.',
      'Garnish with green onions and sesame seeds before serving.',
    ],
    tags: ['dinner', 'vegetarian', 'vegan', 'healthy'],
    mealType: 'dinner',
    complexity: 'simple',
    dietaryPreferences: ['vegetarian', 'vegan'],
    fitnessGoals: ['weight-loss', 'general-health'],
  },
];

// Mock meal plan
export const mockMealPlan: MealPlan = {
  '2023-11-01': {
    breakfast: {
      recipeId: '1',
      name: 'Avocado Toast with Egg',
      calories: 350,
      protein: 15,
      carbs: 30,
      fat: 20,
    },
    lunch: {
      recipeId: '2',
      name: 'Grilled Chicken Salad',
      calories: 420,
      protein: 35,
      carbs: 20,
      fat: 22,
    },
    dinner: {
      recipeId: '3',
      name: 'Vegetable Stir Fry',
      calories: 280,
      protein: 12,
      carbs: 35,
      fat: 10,
    },
    snacks: [
      {
        name: 'Greek Yogurt with Berries',
        calories: 150,
        protein: 15,
        carbs: 12,
        fat: 5,
      },
    ],
  },
  '2023-11-02': {
    breakfast: {
      recipeId: '1',
      name: 'Avocado Toast with Egg',
      calories: 350,
      protein: 15,
      carbs: 30,
      fat: 20,
    },
    lunch: {
      name: 'Tuna Sandwich',
      calories: 380,
      protein: 25,
      carbs: 40,
      fat: 12,
    },
    dinner: {
      recipeId: '3',
      name: 'Vegetable Stir Fry',
      calories: 280,
      protein: 12,
      carbs: 35,
      fat: 10,
    },
  },
};

// Mock grocery list
export const mockGroceryList: GroceryItem[] = [
  {
    id: '1',
    name: 'Avocados',
    quantity: 3,
    unit: '',
    category: 'Produce',
    checked: false,
    recipeIds: ['1']
  },
  {
    id: '2',
    name: 'Eggs',
    quantity: 12,
    unit: '',
    category: 'Dairy & Eggs',
    checked: false,
    recipeIds: ['1']
  },
  {
    id: '3',
    name: 'Whole Grain Bread',
    quantity: 1,
    unit: 'loaf',
    category: 'Bakery',
    checked: false,
    recipeIds: ['1']
  },
  {
    id: '4',
    name: 'Chicken Breast',
    quantity: 2,
    unit: 'lbs',
    category: 'Meat & Seafood',
    checked: false,
    recipeIds: ['2']
  },
  {
    id: '5',
    name: 'Mixed Greens',
    quantity: 1,
    unit: 'bag',
    category: 'Produce',
    checked: false,
    recipeIds: ['2']
  },
  {
    id: '6',
    name: 'Cherry Tomatoes',
    quantity: 1,
    unit: 'pint',
    category: 'Produce',
    checked: false,
    recipeIds: ['2']
  },
  {
    id: '7',
    name: 'Cucumber',
    quantity: 1,
    unit: '',
    category: 'Produce',
    checked: false,
    recipeIds: ['2']
  },
  {
    id: '8',
    name: 'Red Onion',
    quantity: 1,
    unit: '',
    category: 'Produce',
    checked: false,
    recipeIds: ['2', '3']
  },
  {
    id: '9',
    name: 'Olive Oil',
    quantity: 1,
    unit: 'bottle',
    category: 'Oils & Vinegars',
    checked: false,
    recipeIds: ['2']
  },
  {
    id: '10',
    name: 'Balsamic Vinegar',
    quantity: 1,
    unit: 'bottle',
    category: 'Oils & Vinegars',
    checked: false,
    recipeIds: ['2']
  },
  {
    id: '11',
    name: 'Bell Pepper',
    quantity: 2,
    unit: '',
    category: 'Produce',
    checked: false,
    recipeIds: ['3']
  },
  {
    id: '12',
    name: 'Broccoli',
    quantity: 1,
    unit: 'head',
    category: 'Produce',
    checked: false,
    recipeIds: ['3']
  },
  {
    id: '13',
    name: 'Carrots',
    quantity: 1,
    unit: 'bag',
    category: 'Produce',
    checked: false,
    recipeIds: ['3']
  },
  {
    id: '14',
    name: 'Snap Peas',
    quantity: 1,
    unit: 'bag',
    category: 'Produce',
    checked: false,
    recipeIds: ['3']
  },
  {
    id: '15',
    name: 'Soy Sauce',
    quantity: 1,
    unit: 'bottle',
    category: 'Condiments',
    checked: false,
    recipeIds: ['3']
  }
];