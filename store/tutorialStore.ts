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
  showWelcome: boolean;
  steps: TutorialStep[];
  shouldRedirectToOnboarding: boolean;
  tutorialActive: boolean;
  
  // Actions
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  setShowTutorial: (show: boolean) => void;
  markStepCompleted: (stepId: string) => void;
  checkShouldShowWelcome: (onboardingCompleted: boolean) => void;
  forceHideTutorial: () => void;
  setShouldRedirectToOnboarding: (should: boolean) => void;
  checkAndStartTutorial: () => void;
  setTutorialActive: (active: boolean) => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome-intro',
    title: 'Welcome to Zestora! 🎉',
    description: 'Your personal meal planning and nutrition tracking companion. We\'re here to make healthy eating simple and enjoyable!',
    screen: 'welcome',
    position: 'center',
    completed: false,
  },
  {
    id: 'features-nutrition',
    title: 'Smart Nutrition Tracking 📊',
    description: 'Track calories, macros, and nutrients effortlessly. Our AI analyzes your eating patterns and provides personalized insights.',
    screen: 'welcome',
    position: 'center',
    completed: false,
  },
  {
    id: 'features-planning',
    title: 'Weekly Meal Planning 📅',
    description: 'Plan your entire week with drag-and-drop simplicity. Get personalized recipe recommendations based on your goals.',
    screen: 'welcome',
    position: 'center',
    completed: false,
  },
  {
    id: 'features-grocery',
    title: 'Auto Grocery Lists 🛒',
    description: 'Never forget ingredients again! Your shopping list is automatically generated from your meal plans.',
    screen: 'welcome',
    position: 'center',
    completed: false,
  },
  {
    id: 'features-ai',
    title: 'AI Recommendations ✨',
    description: 'Get personalized meal suggestions, recipe modifications, and nutrition advice tailored to your preferences and goals.',
    screen: 'welcome',
    position: 'center',
    completed: false,
  },
  {
    id: 'ready-to-start',
    title: 'Ready to Transform Your Health? 🚀',
    description: 'Let\'s set up your profile and start your journey to better nutrition. Your healthiest self is just a few steps away!',
    screen: 'welcome',
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
      showWelcome: false,
      steps: TUTORIAL_STEPS,
      shouldRedirectToOnboarding: false,
      tutorialActive: false,
      
      startTutorial: () => {
        console.log('Starting tutorial');
        set({
          showTutorial: true,
          showWelcome: false,
          currentStep: 0,
          tutorialCompleted: false,
          isFirstLaunch: false,
          tutorialActive: true,
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
          showWelcome: false,
          tutorialCompleted: true,
          isFirstLaunch: false,
          tutorialActive: false,
          shouldRedirectToOnboarding: true,
        });
      },
      
      completeTutorial: () => {
        console.log('Completing tutorial');
        set({
          showTutorial: false,
          showWelcome: false,
          tutorialCompleted: true,
          currentStep: 0,
          isFirstLaunch: false,
          tutorialActive: false,
          shouldRedirectToOnboarding: true,
        });
      },
      
      resetTutorial: () => {
        console.log('Resetting tutorial');
        set({
          currentStep: 0,
          tutorialCompleted: false,
          showTutorial: false,
          showWelcome: false,
          isFirstLaunch: true,
          tutorialActive: false,
          shouldRedirectToOnboarding: false,
          steps: TUTORIAL_STEPS.map(step => ({ ...step, completed: false })),
        });
      },
      
      setShowTutorial: (show: boolean) => {
        console.log('Setting showTutorial to:', show);
        set({ showTutorial: show });
      },
      
      markStepCompleted: (stepId: string) => {
        set((state) => ({
          steps: state.steps.map(step => 
            step.id === stepId ? { ...step, completed: true } : step
          ),
        }));
      },
      
      checkShouldShowWelcome: (onboardingCompleted: boolean) => {
        const { isFirstLaunch, tutorialCompleted, showWelcome } = get();
        console.log('Tutorial check:', { onboardingCompleted, isFirstLaunch, tutorialCompleted, showWelcome });
        // Only show welcome after onboarding is completed, if tutorial hasn't been completed
        if (onboardingCompleted && !tutorialCompleted && !showWelcome) {
          console.log('Setting showWelcome to true after onboarding');
          set({ showWelcome: true });
        }
      },
      
      forceHideTutorial: () => {
        console.log('Force hiding tutorial');
        set({
          showTutorial: false,
          showWelcome: false,
          tutorialActive: false,
        });
      },
      
      setShouldRedirectToOnboarding: (should: boolean) => {
        set({ shouldRedirectToOnboarding: should });
      },
      
      checkAndStartTutorial: () => {
        const { isFirstLaunch, tutorialCompleted } = get();
        if (isFirstLaunch && !tutorialCompleted) {
          set({ showWelcome: true });
        }
      },
      
      setTutorialActive: (active: boolean) => {
        set({ tutorialActive: active });
      },
    }),
    {
      name: 'tutorial-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);