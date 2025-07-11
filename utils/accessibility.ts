import { AccessibilityInfo } from 'react-native';

export const AccessibilityUtils = {
  // Announce important changes to screen readers
  announceForAccessibility: (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  },

  // Generate accessible labels for nutrition data
  generateNutritionLabel: (calories: number, protein: number, carbs: number, fat: number) => {
    return `Nutrition: ${calories} calories, ${protein} grams protein, ${carbs} grams carbs, ${fat} grams fat`;
  },

  // Generate accessible labels for recipe cards
  generateRecipeLabel: (name: string, calories: number, prepTime: string, servings: number) => {
    return `Recipe: ${name}, ${calories} calories, ${prepTime} preparation time, serves ${servings}`;
  },

  // Generate accessible labels for meal plan items
  generateMealPlanLabel: (mealType: string, recipeName?: string, date?: string) => {
    if (recipeName) {
      return `${mealType} for ${date || 'selected date'}: ${recipeName}`;
    }
    return `Add ${mealType} for ${date || 'selected date'}`;
  },

  // Check if screen reader is enabled
  isScreenReaderEnabled: async (): Promise<boolean> => {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.warn('Error checking screen reader status:', error);
      return false;
    }
  },

  // Reduce motion check for animations
  isReduceMotionEnabled: async (): Promise<boolean> => {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch (error) {
      console.warn('Error checking reduce motion status:', error);
      return false;
    }
  },
};

export const AccessibilityRoles = {
  BUTTON: 'button' as const,
  LINK: 'link' as const,
  TEXT: 'text' as const,
  IMAGE: 'image' as const,
  HEADER: 'header' as const,
  SEARCH: 'search' as const,
  TAB: 'tab' as const,
  TABLIST: 'tablist' as const,
  MENU: 'menu' as const,
  MENUITEM: 'menuitem' as const,
  PROGRESSBAR: 'progressbar' as const,
  SLIDER: 'slider' as const,
  SWITCH: 'switch' as const,
  CHECKBOX: 'checkbox' as const,
  RADIO: 'radio' as const,
  ALERT: 'alert' as const,
  COMBOBOX: 'combobox' as const,
  LIST: 'list' as const,
  LISTITEM: 'listitem' as const,
};

export const AccessibilityStates = {
  SELECTED: { selected: true },
  NOT_SELECTED: { selected: false },
  CHECKED: { checked: true },
  UNCHECKED: { checked: false },
  EXPANDED: { expanded: true },
  COLLAPSED: { expanded: false },
  DISABLED: { disabled: true },
  ENABLED: { disabled: false },
};