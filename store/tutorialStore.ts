import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  screen: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'center';
  action?: 'tap' | 'swipe' | 'scroll';
  completed: boolean;
}

interface TutorialState {
  isFirstLaunch: boolean;
  currentStep: number;
  tutorialCompleted: boolean;
  showTutorial: boolean;
  steps: TutorialStep[];
  
  // Actions
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  setShowTutorial: (show: boolean) => void;
  markStepCompleted: (stepId: string) => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Zestora! 🎉',
    description: 'Your personal meal planning and nutrition tracking companion. Let\'s take a quick tour!',
    screen: 'home',
    position: 'center',
    completed: false,
  },
  {
    id: 'home-overview',
    title: 'Your Dashboard',
    description: 'This is your home screen where you can see today\'s meals, nutrition progress, and quick actions.',
    screen: 'home',
    position: 'top',
    completed: false,
  },
  {
    id: 'nutrition-tracking',
    title: 'Track Your Nutrition',
    description: 'Monitor your daily calories, protein, carbs, and fats with this visual progress bar.',
    screen: 'home',
    targetElement: 'nutrition-bar',
    position: 'bottom',
    completed: false,
  },
  {
    id: 'add-meal',
    title: 'Add Meals Easily',
    description: 'Tap the + button to add meals to your daily plan. You can search recipes or add custom meals.',
    screen: 'home',
    targetElement: 'add-meal-button',
    position: 'top',
    action: 'tap',
    completed: false,
  },
  {
    id: 'meal-planning',
    title: 'Weekly Meal Planning',
    description: 'Plan your entire week ahead! View and organize meals for each day.',
    screen: 'meal-plan',
    position: 'top',
    completed: false,
  },
  {
    id: 'pick-for-me',
    title: 'Let Us Pick For You',
    description: 'Use the "Pick for Me" feature to automatically select meals based on your preferences and nutrition goals.',
    screen: 'meal-plan',
    targetElement: 'pick-for-me-button',
    position: 'bottom',
    action: 'tap',
    completed: false,
  },
  {
    id: 'grocery-list',
    title: 'Smart Grocery Lists',
    description: 'Your grocery list is automatically generated from your meal plans. Never forget an ingredient!',
    screen: 'grocery-list',
    position: 'top',
    completed: false,
  },
  {
    id: 'profile-settings',
    title: 'Personalize Your Experience',
    description: 'Update your profile, dietary preferences, and nutrition goals anytime from here.',
    screen: 'profile',
    position: 'top',
    completed: false,
  },
  {
    id: 'completion',
    title: 'You\'re All Set! 🚀',
    description: 'You\'re ready to start your healthy eating journey. Remember, you can always access help from your profile.',
    screen: 'home',
    position: 'center',
    completed: false,
  },
];

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      isFirstLaunch: true,
      currentStep: 0,
      tutorialCompleted: false,
      showTutorial: false,
      steps: TUTORIAL_STEPS,
      
      startTutorial: () => {
        set({
          showTutorial: true,
          currentStep: 0,
          isFirstLaunch: false,
        });
      },
      
      nextStep: () => {
        const { currentStep, steps } = get();
        if (currentStep < steps.length - 1) {
          set({ currentStep: currentStep + 1 });
        } else {
          get().completeTutorial();
        }
      },
      
      previousStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },
      
      skipTutorial: () => {
        set({
          showTutorial: false,
          tutorialCompleted: true,
          isFirstLaunch: false,
        });
      },
      
      completeTutorial: () => {
        set({
          showTutorial: false,
          tutorialCompleted: true,
          currentStep: 0,
        });
      },
      
      resetTutorial: () => {
        set({
          currentStep: 0,
          tutorialCompleted: false,
          showTutorial: false,
          steps: TUTORIAL_STEPS.map(step => ({ ...step, completed: false })),
        });
      },
      
      setShowTutorial: (show: boolean) => {
        set({ showTutorial: show });
      },
      
      markStepCompleted: (stepId: string) => {
        set((state) => ({
          steps: state.steps.map(step => 
            step.id === stepId ? { ...step, completed: true } : step
          ),
        }));
      },
    }),
    {
      name: 'tutorial-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);