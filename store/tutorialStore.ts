import { create } from 'zustand';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  screen: string;
  route: string;
  targetElement?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'tap' | 'swipe' | 'scroll';
  actionText?: string;
  icon?: string;
  color?: string;
  highlightElement?: boolean;
  skipNavigation?: boolean;
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
    id: 'recipes-search',
    title: 'Search for Recipes',
    description: 'Use the search bar to find recipes by ingredients, cuisine, or dietary preferences. Try searching for "chicken" or "vegetarian".',
    screen: 'recipes',
    route: '/(tabs)',
    targetElement: 'search-input',
    position: 'bottom',
    actionText: 'Try searching for a recipe',
    icon: 'search',
    color: '#4ECDC4',
    highlightElement: true
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Use these shortcuts to quickly add meals, generate grocery lists, or view your favorites.',
    screen: 'recipes',
    route: '/(tabs)',
    targetElement: 'quick-actions',
    position: 'bottom',
    actionText: 'Tap any quick action to try it',
    icon: 'zap',
    color: '#FF6B6B',
    highlightElement: true
  },
  {
    id: 'meal-planner',
    title: 'Weekly Meal Planner',
    description: 'Plan your entire week at a glance. Tap on any day to add meals or view your planned nutrition.',
    screen: 'recipes',
    route: '/(tabs)',
    targetElement: 'weekly-planner',
    position: 'bottom',
    actionText: 'Tap a day to add a meal',
    icon: 'calendar',
    color: '#45B7D1',
    highlightElement: true
  },
  {
    id: 'meal-plan-tab',
    title: 'Detailed Meal Planning',
    description: 'Switch to the Meal Plan tab for a detailed view of your weekly meals and nutrition tracking.',
    screen: 'meal-plan',
    route: '/(tabs)/meal-plan',
    targetElement: 'meal-plan-content',
    position: 'top',
    actionText: 'Explore your meal plan',
    icon: 'calendar',
    color: '#45B7D1',
    highlightElement: false
  },
  {
    id: 'grocery-list-tab',
    title: 'Smart Grocery Lists',
    description: 'Your shopping list is automatically generated from your meal plan, organized by store sections for efficient shopping.',
    screen: 'grocery-list',
    route: '/(tabs)/grocery-list',
    targetElement: 'grocery-content',
    position: 'top',
    actionText: 'Check off items as you shop',
    icon: 'shopping-cart',
    color: '#FECA57',
    highlightElement: false
  },
  {
    id: 'profile-setup',
    title: 'Complete Your Profile',
    description: 'Set up your nutrition goals, dietary preferences, and fitness targets for personalized recommendations.',
    screen: 'profile',
    route: '/(tabs)/profile',
    targetElement: 'profile-content',
    position: 'top',
    actionText: 'Tap to edit your profile',
    icon: 'user',
    color: '#96CEB4',
    highlightElement: false
  }
];

export const useTutorialStore = create<TutorialState>()((set, get) => ({
      isFirstLaunch: true,
      currentStep: 0,
      tutorialCompleted: false,
      showTutorial: false,
      showWelcome: false,
      steps: TUTORIAL_STEPS,
      shouldRedirectToOnboarding: false,
      tutorialActive: false,
      
      startTutorial: () => {
        console.log('[TutorialStore] START TUTORIAL');
        const state = get();
        console.log('Current state before starting tutorial:', state);
        set({
          showTutorial: true,
          showWelcome: false,
          currentStep: 0,
          tutorialCompleted: false,
          isFirstLaunch: false,
          tutorialActive: true,
        });
        const newState = get();
        console.log('Tutorial state after starting:', newState);
      },
      
      nextStep: () => {
        const { currentStep, steps } = get();
        console.log('nextStep called, current:', currentStep, 'total steps:', steps.length);
        if (currentStep < steps.length - 1) {
          set({ currentStep: currentStep + 1 });
          console.log('Advanced to step:', currentStep + 1);
        } else {
          console.log('Last step reached, completing tutorial');
          get().completeTutorial();
        }
      },
      
      previousStep: () => {
        const { currentStep } = get();
        console.log('previousStep called, current:', currentStep);
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
          console.log('Went back to step:', currentStep - 1);
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
    }));