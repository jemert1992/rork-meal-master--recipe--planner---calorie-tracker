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
  {
    id: 'home-welcome',
    title: 'Your Recipe Dashboard',
    description: 'Welcome to your recipe hub! Discover thousands of recipes, browse by categories, and find meals that match your goals.',
    screen: 'home',
    position: 'center',
    completed: false,
  },
  {
    id: 'meal-planner-widget',
    title: 'Weekly Meal Planner',
    description: 'Plan your entire week with the meal planner widget. Tap any day to add meals or use "Pick for Me" for automatic suggestions.',
    screen: 'home',
    targetElement: 'meal-planner',
    position: 'top',
    completed: false,
  },
  {
    id: 'recipe-categories',
    title: 'Browse by Categories',
    description: 'Explore recipes by meal type (breakfast, lunch, dinner) or dietary preferences (vegetarian, vegan, low-carb).',
    screen: 'home',
    targetElement: 'categories',
    position: 'center',
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
      showWelcome: false,
      steps: TUTORIAL_STEPS,
      shouldRedirectToOnboarding: false,
      
      startTutorial: () => {
        console.log('Starting tutorial');
        set({
          showTutorial: true,
          showWelcome: false,
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
          showWelcome: false,
          tutorialCompleted: true,
          isFirstLaunch: false,
        });
      },
      
      completeTutorial: () => {
        console.log('Completing tutorial');
        const { steps, currentStep } = get();
        const currentStepData = steps[currentStep];
        
        // If completing tutorial on welcome screen, set redirect flag
        const shouldRedirect = currentStepData?.screen === 'welcome';
        
        set({
          showTutorial: false,
          showWelcome: false,
          tutorialCompleted: true,
          currentStep: 0,
          isFirstLaunch: false,
          shouldRedirectToOnboarding: shouldRedirect,
        });
      },
      
      resetTutorial: () => {
        console.log('Resetting tutorial');
        set({
          currentStep: 0,
          tutorialCompleted: false,
          showTutorial: false,
          showWelcome: true,
          isFirstLaunch: true,
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
        });
      },
      
      setShouldRedirectToOnboarding: (should: boolean) => {
        set({ shouldRedirectToOnboarding: should });
      },
      
      checkAndStartTutorial: () => {
        const { isFirstLaunch, tutorialCompleted, showTutorial, showWelcome } = get();
        console.log('Checking if should start tutorial:', { isFirstLaunch, tutorialCompleted, showTutorial, showWelcome });
        
        // On first launch, don't auto-start tutorial - let user choose
        // The welcome screen will handle tutorial initiation
        if (isFirstLaunch && !tutorialCompleted) {
          console.log('First launch detected - welcome screen will handle tutorial');
          // Don't auto-start, let the welcome screen handle it
        }
      },
    }),
    {
      name: 'tutorial-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);