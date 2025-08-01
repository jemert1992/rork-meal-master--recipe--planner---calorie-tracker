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
  elementRefs: Record<string, RefObject<any>>;
  
  // Actions
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  forceHideTutorial: () => void;
  
  // Ref management
  registerRef: (stepId: string, ref: RefObject<any>) => void;
  unregisterRef: (stepId: string) => void;
  markInteractionComplete: () => void;
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
  elementRefs: {},
  
  startTutorial: () => {
    set({ showTutorial: true, stepIndex: 0 });
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
    set({ showTutorial: false, stepIndex: 0, tutorialCompleted: true });
  },
  
  completeTutorial: () => {
    set({ showTutorial: false, stepIndex: 0, tutorialCompleted: true });
  },
  
  resetTutorial: () => {
    set({ showTutorial: false, stepIndex: 0, tutorialCompleted: false });
  },
  
  forceHideTutorial: () => {
    set({ showTutorial: false });
  },
  
  registerRef: (stepId: string, ref: RefObject<any>) => {
    set((state) => ({
      elementRefs: {
        ...state.elementRefs,
        [stepId]: ref
      }
    }));
  },
  
  unregisterRef: (stepId: string) => {
    set((state) => {
      const newRefs = { ...state.elementRefs };
      delete newRefs[stepId];
      return { elementRefs: newRefs };
    });
  },
  
  markInteractionComplete: () => {
    // For now, just advance to next step
    get().nextStep();
  },
}));

