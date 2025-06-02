export const mockRecipes = [
  {
    id: '1',
    name: 'Avocado Toast',
    image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    prepTime: '10 min',
    cookTime: '5 min',
    servings: 1,
    calories: 320,
    protein: 12,
    carbs: 30,
    fat: 18,
    ingredients: [
      '2 slices whole grain bread',
      '1 ripe avocado',
      '2 eggs',
      'Salt and pepper to taste',
      'Red pepper flakes (optional)',
    ],
    instructions: [
      'Toast the bread until golden and firm.',
      'Remove the pit from the avocado and scoop the flesh into a bowl.',
      'Mash the avocado with a fork and season with salt and pepper.',
      'Spread the mashed avocado on top of the toasted bread.',
      'Fry the eggs to your liking and place on top of the avocado toast.',
      'Sprinkle with additional salt, pepper, and red pepper flakes if desired.',
    ],
    tags: ['breakfast', 'vegetarian', 'quick'],
  },
  {
    id: '2',
    name: 'Greek Salad',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    prepTime: '15 min',
    cookTime: '0 min',
    servings: 2,
    calories: 250,
    protein: 8,
    carbs: 15,
    fat: 20,
    ingredients: [
      '1 cucumber, diced',
      '2 large tomatoes, diced',
      '1 red onion, thinly sliced',
      '1 cup kalamata olives',
      '200g feta cheese, cubed',
      '2 tbsp olive oil',
      '1 tbsp red wine vinegar',
      '1 tsp dried oregano',
      'Salt and pepper to taste',
    ],
    instructions: [
      'Combine cucumber, tomatoes, red onion, and olives in a large bowl.',
      'Add the feta cheese cubes.',
      'In a small bowl, whisk together olive oil, red wine vinegar, oregano, salt, and pepper.',
      'Pour the dressing over the salad and toss gently to combine.',
      'Serve immediately or refrigerate for up to 1 hour before serving.',
    ],
    tags: ['lunch', 'vegetarian', 'salad'],
  },
  {
    id: '3',
    name: 'Chicken Stir Fry',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    prepTime: '20 min',
    cookTime: '15 min',
    servings: 4,
    calories: 380,
    protein: 35,
    carbs: 25,
    fat: 15,
    ingredients: [
      '500g chicken breast, sliced',
      '2 bell peppers, sliced',
      '1 broccoli head, cut into florets',
      '1 carrot, julienned',
      '3 cloves garlic, minced',
      '1 tbsp ginger, grated',
      '3 tbsp soy sauce',
      '1 tbsp honey',
      '2 tbsp vegetable oil',
      '1 tsp sesame oil',
      'Salt and pepper to taste',
    ],
    instructions: [
      'Heat vegetable oil in a large wok or skillet over high heat.',
      'Add chicken and cook until browned, about 5-6 minutes. Remove and set aside.',
      'In the same pan, add a bit more oil if needed, then add garlic and ginger. Stir for 30 seconds.',
      'Add all vegetables and stir fry for 5-6 minutes until crisp-tender.',
      'Return chicken to the pan. Add soy sauce and honey, stirring to coat everything.',
      'Cook for another 2 minutes until everything is heated through.',
      'Drizzle with sesame oil, season with salt and pepper, and serve hot.',
    ],
    tags: ['dinner', 'high-protein', 'asian'],
  },
];

export const mockMealPlan = {
  '2025-06-02': {
    breakfast: { recipeId: '1', name: 'Avocado Toast' },
    lunch: { recipeId: '2', name: 'Greek Salad' },
    dinner: { recipeId: '3', name: 'Chicken Stir Fry' },
    snacks: [{ name: 'Apple', calories: 95 }, { name: 'Greek Yogurt', calories: 150 }]
  },
  '2025-06-03': {
    breakfast: { name: 'Oatmeal with Berries', calories: 280 },
    lunch: { recipeId: '2', name: 'Greek Salad' },
    dinner: { name: 'Grilled Salmon', calories: 420 },
    snacks: [{ name: 'Mixed Nuts', calories: 170 }]
  },
  '2025-06-04': {
    breakfast: { name: 'Smoothie Bowl', calories: 310 },
    lunch: { name: 'Quinoa Bowl', calories: 380 },
    dinner: { recipeId: '3', name: 'Chicken Stir Fry' },
    snacks: [{ name: 'Protein Bar', calories: 200 }]
  }
};

export const mockFoodLog = {
  '2025-06-02': {
    totalCalories: 1890,
    totalProtein: 95,
    totalCarbs: 180,
    totalFat: 75,
    meals: [
      { name: 'Avocado Toast', calories: 320, protein: 12, carbs: 30, fat: 18, time: '08:30', mealType: 'breakfast' as const },
      { name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, time: '10:30', mealType: 'snack' as const },
      { name: 'Greek Salad', calories: 250, protein: 8, carbs: 15, fat: 20, time: '13:00', mealType: 'lunch' as const },
      { name: 'Greek Yogurt', calories: 150, protein: 15, carbs: 10, fat: 5, time: '16:00', mealType: 'snack' as const },
      { name: 'Chicken Stir Fry', calories: 380, protein: 35, carbs: 25, fat: 15, time: '19:00', mealType: 'dinner' as const },
    ]
  }
};

export const mockGroceryList = [
  { id: '1', name: 'Avocados', category: 'Produce', checked: false },
  { id: '2', name: 'Whole grain bread', category: 'Bakery', checked: true },
  { id: '3', name: 'Eggs', category: 'Dairy', checked: false },
  { id: '4', name: 'Cucumber', category: 'Produce', checked: false },
  { id: '5', name: 'Tomatoes', category: 'Produce', checked: false },
  { id: '6', name: 'Red onion', category: 'Produce', checked: true },
  { id: '7', name: 'Kalamata olives', category: 'Canned Goods', checked: false },
  { id: '8', name: 'Feta cheese', category: 'Dairy', checked: false },
  { id: '9', name: 'Olive oil', category: 'Oils & Vinegars', checked: true },
  { id: '10', name: 'Chicken breast', category: 'Meat', checked: false },
  { id: '11', name: 'Bell peppers', category: 'Produce', checked: false },
  { id: '12', name: 'Broccoli', category: 'Produce', checked: false },
  { id: '13', name: 'Carrots', category: 'Produce', checked: true },
  { id: '14', name: 'Soy sauce', category: 'Condiments', checked: false },
  { id: '15', name: 'Honey', category: 'Baking', checked: false },
];