import { create } from 'zustand';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  screen: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'center';
  action?: 'tap' | 'swipe' | 'scroll';
  completed: boolean;
  actionText?: string;
  icon?: string;
  color?: string;
  features?: string[];
  tip?: string;
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
    id: 'welcome',
    title: 'Welcome to Zestora! 🎉',
    description: 'Your personal nutrition companion that makes healthy eating simple and enjoyable.',
    screen: 'welcome',
    position: 'center',
    completed: false,
    actionText: 'Let\'s explore what you can do',
    icon: 'chef-hat',
    color: '#FF6B6B',
    features: [
      'Track nutrition with visual insights',
      'Plan meals for the entire week',
      'Generate smart grocery lists',
      'Discover personalized recipes'
    ]
  },
  {
    id: 'recipes',
    title: 'Discover Amazing Recipes 🍽️',
    description: 'Browse thousands of recipes tailored to your dietary preferences and fitness goals.',
    screen: 'recipes',
    position: 'center',
    completed: false,
    actionText: 'Try searching for "chicken" or "vegetarian"',
    icon: 'search',
    color: '#4ECDC4',
    features: [
      'Search by ingredients or cuisine',
      'Filter by dietary preferences',
      'Save favorites with a tap',
      'Get nutrition info for every recipe'
    ],
    tip: 'Tap the heart icon to save recipes you love!'
  },
  {
    id: 'meal-planning',
    title: 'Plan Your Week Ahead 📅',
    description: 'Drag and drop recipes into your weekly meal plan. Never wonder "what\'s for dinner?" again.',
    screen: 'meal-plan',
    position: 'center',
    completed: false,
    actionText: 'Tap "Add Meal" to plan your first meal',
    icon: 'calendar',
    color: '#45B7D1',
    features: [
      'Visual weekly calendar view',
      'Drag & drop meal planning',
      'AI-powered meal suggestions',
      'Automatic nutrition calculations'
    ],
    tip: 'Plan similar meals for the week to save time shopping!'
  },
  {
    id: 'nutrition',
    title: 'Track Your Nutrition 📊',
    description: 'See your daily calories, macros, and nutrients with beautiful visual charts.',
    screen: 'nutrition',
    position: 'center',
    completed: false,
    actionText: 'Log your first meal to see it in action',
    icon: 'target',
    color: '#96CEB4',
    features: [
      'Visual calorie and macro tracking',
      'Daily nutrition goals',
      'Progress charts and insights',
      'Meal timing recommendations'
    ],
    tip: 'Set realistic goals and track your progress over time!'
  },
  {
    id: 'grocery',
    title: 'Smart Grocery Lists 🛒',
    description: 'Your shopping list is automatically generated from your meal plan, organized by store sections.',
    screen: 'grocery',
    position: 'center',
    completed: false,
    actionText: 'Generate your first grocery list',
    icon: 'shopping-cart',
    color: '#FECA57',
    features: [
      'Auto-generated from meal plans',
      'Organized by store sections',
      'Check off items as you shop',
      'Add custom items anytime'
    ],
    tip: 'The app groups ingredients by store sections to make shopping faster!'
  },
  {
    id: 'ready',
    title: 'You\'re All Set! 🚀',
    description: 'You now know the basics of Zestora. Start with setting up your profile and nutrition goals.',
    screen: 'profile',
    position: 'center',
    completed: false,
    actionText: 'Let\'s set up your profile',
    icon: 'check-circle',
    color: '#FF6B6B',
    features: [
      'Personalized nutrition goals',
      'Dietary preference settings',
      'Fitness goal tracking',
      'Progress monitoring'
    ],
    tip: 'You can always restart this tutorial from Settings > Help!'
  },
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