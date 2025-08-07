import { create } from 'zustand';
import { RefObject } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
  color?: string;
}

interface TutorialState {
  showTutorial: boolean;
  stepIndex: number;
  steps: TutorialStep[];
  tutorialCompleted: boolean;
  isTutorialActive: boolean;
  
  // Actions
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  
  // Ref management (for compatibility)
  registerRef: (stepId: string, ref: RefObject<any>) => void;
  unregisterRef: (stepId: string) => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Zestora! 🎉',
    description: 'Your personal healthy eating companion is ready to help you discover amazing recipes and plan nutritious meals.',
    icon: 'chef-hat',
    color: '#4ECDC4'
  },
  {
    id: 'search',
    title: 'Discover Perfect Recipes 🔍',
    description: 'Search for any ingredient, cuisine, or dietary preference. Try "chicken teriyaki" or "vegan pasta" to get started.',
    icon: 'search',
    color: '#4ECDC4'
  },
  {
    id: 'quick-actions',
    title: 'One-Tap Magic ⚡',
    description: 'Use quick action buttons to instantly find recipes by category, add meals to your plan, or generate shopping lists.',
    icon: 'zap',
    color: '#FF6B6B'
  },
  {
    id: 'meal-planner',
    title: 'Smart Meal Planning 🍽️',
    description: 'Plan your entire week in minutes. Drag recipes to days, get balanced nutrition, and never wonder "what\'s for dinner?" again.',
    icon: 'calendar',
    color: '#FF6B6B'
  },
  {
    id: 'auto-shopping',
    title: 'Effortless Shopping 🛒',
    description: 'Your grocery list updates automatically as you plan meals. Organized by store sections, with smart quantity calculations.',
    icon: 'shopping-cart',
    color: '#FFD166'
  },
  {
    id: 'profile',
    title: 'Personalize Your Experience ✨',
    description: 'Set your dietary preferences, allergies, and nutrition goals to get personalized recipe recommendations.',
    icon: 'target',
    color: '#4ECDC4'
  }
];

export const useTutorialStore = create<TutorialState>((set, get) => ({
  showTutorial: false,
  stepIndex: 0,
  steps: TUTORIAL_STEPS,
  tutorialCompleted: false,
  isTutorialActive: false,
  
  startTutorial: () => {
    console.log('Tutorial store: startTutorial called');
    set({ 
      showTutorial: true, 
      isTutorialActive: true, 
      stepIndex: 0 
    });
    console.log('Tutorial store: state after start:', get());
  },
  
  nextStep: () => {
    const { stepIndex, steps } = get();
    if (stepIndex < steps.length - 1) {
      set({ stepIndex: stepIndex + 1 });
    } else {
      get().completeTutorial();
    }
  },
  
  previousStep: () => {
    const { stepIndex } = get();
    if (stepIndex > 0) {
      set({ stepIndex: stepIndex - 1 });
    }
  },
  
  skipTutorial: () => {
    console.log('Tutorial store: skipTutorial called');
    set({ 
      showTutorial: false, 
      isTutorialActive: false, 
      stepIndex: 0, 
      tutorialCompleted: true 
    });
  },
  
  completeTutorial: () => {
    console.log('Tutorial store: completeTutorial called');
    set({ 
      showTutorial: false, 
      isTutorialActive: false, 
      stepIndex: 0, 
      tutorialCompleted: true 
    });
  },
  
  resetTutorial: () => {
    set({ 
      showTutorial: false, 
      isTutorialActive: false, 
      stepIndex: 0, 
      tutorialCompleted: false 
    });
  },
  
  // Ref management (no-op for compatibility)
  registerRef: (stepId: string, ref: RefObject<any>) => {
    // No-op for compatibility with existing code
    console.log('registerRef called for stepId:', stepId);
  },
  
  unregisterRef: (stepId: string) => {
    // No-op for compatibility with existing code
    console.log('unregisterRef called for stepId:', stepId);
  },
}));

