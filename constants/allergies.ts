// Common food allergies and intolerances
export const COMMON_ALLERGIES = [
  'Dairy',
  'Eggs',
  'Peanuts',
  'Tree nuts',
  'Shellfish',
  'Fish',
  'Wheat',
  'Gluten',
  'Soy',
  'Sesame',
  'Corn',
  'Mustard'
];

// Mapping of allergies to common ingredients to avoid
export const ALLERGY_INGREDIENTS_MAP: Record<string, string[]> = {
  'Dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'lactose', 'whey', 'casein'],
  'Eggs': ['egg', 'albumin', 'mayonnaise', 'meringue', 'ovalbumin', 'lysozyme'],
  'Peanuts': ['peanut', 'arachis', 'groundnut', 'beer nuts', 'mixed nuts'],
  'Tree nuts': ['almond', 'cashew', 'walnut', 'pecan', 'hazelnut', 'pistachio', 'macadamia', 'brazil nut'],
  'Shellfish': ['shrimp', 'crab', 'lobster', 'crawfish', 'prawn', 'langoustine', 'scampi'],
  'Fish': ['fish', 'cod', 'salmon', 'tuna', 'tilapia', 'anchovy', 'bass', 'flounder', 'halibut'],
  'Wheat': ['wheat', 'flour', 'bread', 'pasta', 'cereal', 'bran', 'bulgur', 'couscous', 'semolina'],
  'Gluten': ['gluten', 'wheat', 'barley', 'rye', 'malt', 'brewer\'s yeast', 'triticale', 'spelt'],
  'Soy': ['soy', 'soya', 'edamame', 'tofu', 'tempeh', 'miso', 'tamari', 'lecithin'],
  'Sesame': ['sesame', 'tahini', 'halvah', 'gomashio', 'benne'],
  'Corn': ['corn', 'maize', 'cornstarch', 'cornmeal', 'polenta', 'grits', 'hominy'],
  'Mustard': ['mustard', 'mustard seed', 'mustard powder', 'dijon', 'wasabi']
};