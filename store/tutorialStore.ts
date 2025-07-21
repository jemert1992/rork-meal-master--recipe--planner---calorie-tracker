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
  welcomeCheckPerformed: boolean;
  
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
  resetWelcomeCheck: () => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Zestora! 🎉',
    description: 'Your personal nutrition companion that makes healthy eating simple and enjoyable. Let\'s take a quick tour of the key features.',
    screen: 'recipes',
    route: '/(tabs)',
    targetElement: 'search-input',
    position: 'center',
    actionText: 'Let\'s explore what you can do',
    icon: 'chef-hat',
    color: '#4ECDC4',
    highlightElement: false
  },
  {
    id: 'search-recipes',
    title: 'Find Perfect Recipes',
    description: 'Search for recipes by ingredients, cuisine, or dietary preferences. Our AI helps you discover meals that match your goals.',
    screen: 'recipes',
    route: '/(tabs)',
    targetElement: 'search-input',
    position: 'bottom',
    actionText: 'Try searching for "chicken" or "vegetarian"',
    icon: 'search',
    color: '#4ECDC4',
    highlightElement: true
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions Hub',
    description: 'Access your most-used features instantly. Add meals, generate grocery lists, or browse your favorites with one tap.',
    screen: 'recipes',
    route: '/(tabs)',
    targetElement: 'quick-actions',
    position: 'bottom',
    actionText: 'Tap any action to try it out',
    icon: 'zap',
    color: '#FF6B6B',
    highlightElement: true
  },
  {
    id: 'meal-planning',
    title: 'Smart Meal Planning',
    description: 'Plan your entire week at a glance. Drag and drop meals, see nutrition summaries, and never wonder "what\'s for dinner?" again.',
    screen: 'meal-plan',
    route: '/(tabs)/meal-plan',
    targetElement: 'meal-plan-content',
    position: 'top',
    actionText: 'Explore detailed meal planning',
    icon: 'calendar',
    color: '#45B7D1',
    highlightElement: false
  },
  {
    id: 'grocery-lists',
    title: 'Auto-Generated Shopping',
    description: 'Your grocery list updates automatically based on your meal plan. Organized by store sections for efficient shopping.',
    screen: 'grocery-list',
    route: '/(tabs)/grocery-list',
    targetElement: 'grocery-content',
    position: 'top',
    actionText: 'See your smart shopping list',
    icon: 'shopping-cart',
    color: '#FECA57',
    highlightElement: false
  },
  {
    id: 'profile-setup',
    title: 'Personalize Your Experience',
    description: 'Complete your profile to get personalized recommendations, nutrition goals, and meal suggestions tailored just for you.',
    screen: 'profile',
    route: '/(tabs)/profile',
    targetElement: 'profile-content',
    position: 'top',
    actionText: 'Set up your profile now',
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
      welcomeCheckPerformed: false,
      
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
        console.log('Skipping tutorial');
        set({
          showTutorial: false,
          showWelcome: false,
          tutorialCompleted: true,
          isFirstLaunch: false,
          tutorialActive: false,
          shouldRedirectToOnboarding: true, // Redirect to personal info after skipping
          welcomeCheckPerformed: true,
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
          shouldRedirectToOnboarding: true, // Redirect to personal info after tutorial
          welcomeCheckPerformed: true,
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
          welcomeCheckPerformed: false,
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
        const { isFirstLaunch, tutorialCompleted, showWelcome, showTutorial, welcomeCheckPerformed } = get();
        console.log('Tutorial check:', { onboardingCompleted, isFirstLaunch, tutorialCompleted, showWelcome, showTutorial, welcomeCheckPerformed });
        
        // Prevent infinite loops by checking if we've already performed this check
        if (welcomeCheckPerformed) {
          console.log('Welcome check already performed, skipping');
          return;
        }
        
        // Only show welcome after onboarding is completed, if tutorial hasn't been completed and not already showing
        if (onboardingCompleted && !tutorialCompleted && !showWelcome && !showTutorial) {
          console.log('Setting showWelcome to true after onboarding');
          set({ showWelcome: true, welcomeCheckPerformed: true });
        } else {
          console.log('Not showing welcome, marking check as performed');
          set({ welcomeCheckPerformed: true });
        }
      },
      
      forceHideTutorial: () => {
        console.log('Force hiding tutorial');
        set({
          showTutorial: false,
          showWelcome: false,
          tutorialActive: false,
          welcomeCheckPerformed: true,
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
      
      resetWelcomeCheck: () => {
        set({ welcomeCheckPerformed: false });
      },
    }));