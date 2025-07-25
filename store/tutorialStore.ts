import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { RefObject } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  waitForInteraction?: boolean;
  pulseTarget?: boolean;
  completionMessage?: string;
}

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TutorialProgress {
  currentStep: number;
  completedSteps: string[];
  skipped: boolean;
  lastActiveDate: string;
}

interface TutorialState {
  // Core stable state
  currentStep: number;
  isTutorialActive: boolean;
  highlightTargets: Record<string, ElementPosition>;
  
  // New advanced features
  isPaused: boolean;
  waitingForInteraction: boolean;
  progress: TutorialProgress | null;
  animationsEnabled: boolean;
  currentRoute: string;
  
  // Legacy state for compatibility
  isFirstLaunch: boolean;
  tutorialCompleted: boolean;
  showTutorial: boolean;
  showWelcome: boolean;
  steps: TutorialStep[];
  shouldRedirectToOnboarding: boolean;
  welcomeCheckPerformed: boolean;
  onboardingStep: string;
  
  // Ref registry
  elementRefs: Record<string, RefObject<any>>;
  
  // Actions
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  registerRef: (stepId: string, ref: RefObject<any>) => void;
  unregisterRef: (stepId: string) => void;
  updateElementPosition: (stepId: string, position: ElementPosition) => void;
  
  // New advanced actions
  pauseTutorial: () => void;
  resumeTutorial: () => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<TutorialProgress | null>;
  setCurrentRoute: (route: string) => void;
  markInteractionComplete: () => void;
  
  // Legacy actions for compatibility
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
    highlightElement: true,
    pulseTarget: true,
    waitForInteraction: true
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
    highlightElement: true,
    pulseTarget: true
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
    color: '#FF6B6B',
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
    color: '#FFD166',
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
    icon: 'user',
    color: '#4ECDC4',
    highlightElement: false,
    completionMessage: '🎉 You\'re all set! Let\'s set up your profile.'
  }
];

export const useTutorialStore = create<TutorialState>()(subscribeWithSelector((set, get) => ({
      // Core stable state
      currentStep: 0,
      isTutorialActive: false,
      highlightTargets: {},
      
      // New advanced features
      isPaused: false,
      waitingForInteraction: false,
      progress: null,
      animationsEnabled: true,
      currentRoute: '',
      
      // Legacy state for compatibility
      isFirstLaunch: true,
      tutorialCompleted: false,
      showTutorial: false,
      showWelcome: false,
      steps: TUTORIAL_STEPS,
      shouldRedirectToOnboarding: false,
      welcomeCheckPerformed: false,
      onboardingStep: 'personal-info',
      
      // Ref registry
      elementRefs: {},
      
      startTutorial: () => {
        const { isTutorialActive, tutorialCompleted, progress } = get();
        if (isTutorialActive || tutorialCompleted) {
          return;
        }
        
        // Resume from saved progress if available
        const startStep = progress && !progress.skipped ? progress.currentStep : 0;
        
        set({
          currentStep: startStep,
          isTutorialActive: true,
          showTutorial: true,
          showWelcome: false,
          tutorialCompleted: false,
          isFirstLaunch: false,
          highlightTargets: {},
          isPaused: false,
          waitingForInteraction: false,
        });
        
        // Save initial progress
        get().saveProgress();
      },
      
      nextStep: () => {
        const { currentStep, steps, isTutorialActive, isPaused, waitingForInteraction } = get();
        if (!isTutorialActive || isPaused) return;
        
        // If waiting for interaction, don't advance automatically
        if (waitingForInteraction) {
          set({ waitingForInteraction: false });
          return;
        }
        
        if (currentStep < steps.length - 1) {
          const nextStepIndex = currentStep + 1;
          const nextStep = steps[nextStepIndex];
          
          set({ 
            currentStep: nextStepIndex,
            waitingForInteraction: nextStep?.waitForInteraction || false
          });
          
          // Save progress
          get().saveProgress();
        } else {
          get().completeTutorial();
        }
      },
      
      previousStep: () => {
        const { currentStep, isTutorialActive } = get();
        if (!isTutorialActive || currentStep <= 0) return;
        
        set({ currentStep: currentStep - 1 });
      },
      
      skipTutorial: () => {
        const { isTutorialActive, currentStep } = get();
        if (!isTutorialActive) return;
        
        // Save skip progress for potential resume
        const skipProgress: TutorialProgress = {
          currentStep,
          completedSteps: [],
          skipped: true,
          lastActiveDate: new Date().toISOString(),
        };
        
        set({
          isTutorialActive: false,
          showTutorial: false,
          showWelcome: false,
          tutorialCompleted: true,
          isFirstLaunch: false,
          shouldRedirectToOnboarding: true,
          welcomeCheckPerformed: true,
          highlightTargets: {},
          progress: skipProgress,
          isPaused: false,
          waitingForInteraction: false,
        });
        
        // Save skip state to storage
        AsyncStorage.setItem('tutorial_progress', JSON.stringify(skipProgress));
      },
      
      completeTutorial: () => {
        const { isTutorialActive, steps } = get();
        if (!isTutorialActive) return;
        
        const completionProgress: TutorialProgress = {
          currentStep: steps.length - 1,
          completedSteps: steps.map(step => step.id),
          skipped: false,
          lastActiveDate: new Date().toISOString(),
        };
        
        set({
          isTutorialActive: false,
          showTutorial: false,
          showWelcome: false,
          tutorialCompleted: true,
          currentStep: 0,
          isFirstLaunch: false,
          shouldRedirectToOnboarding: true,
          welcomeCheckPerformed: true,
          onboardingStep: 'personal-info',
          highlightTargets: {},
          progress: completionProgress,
          isPaused: false,
          waitingForInteraction: false,
        });
        
        // Save completion to storage
        AsyncStorage.setItem('tutorial_progress', JSON.stringify(completionProgress));
      },
      
      resetTutorial: () => {
        set({
          currentStep: 0,
          isTutorialActive: false,
          tutorialCompleted: false,
          showTutorial: false,
          showWelcome: false,
          isFirstLaunch: true,
          shouldRedirectToOnboarding: false,
          welcomeCheckPerformed: false,
          onboardingStep: 'personal-info',
          highlightTargets: {},
          elementRefs: {},
          steps: TUTORIAL_STEPS,
          isPaused: false,
          waitingForInteraction: false,
          progress: null,
          animationsEnabled: true,
          currentRoute: '',
        });
        
        // Clear stored progress
        AsyncStorage.removeItem('tutorial_progress');
      },
      
      registerRef: (stepId: string, ref: RefObject<any>) => {
        set((state) => ({
          elementRefs: {
            ...state.elementRefs,
            [stepId]: ref,
          },
        }));
      },
      
      unregisterRef: (stepId: string) => {
        set((state) => {
          const { [stepId]: removed, ...rest } = state.elementRefs;
          return { elementRefs: rest };
        });
      },
      
      updateElementPosition: (stepId: string, position: ElementPosition) => {
        set((state) => ({
          highlightTargets: {
            ...state.highlightTargets,
            [stepId]: position,
          },
        }));
      },
      
      // New advanced actions
      pauseTutorial: () => {
        const { isTutorialActive } = get();
        if (!isTutorialActive) return;
        
        set({ isPaused: true });
        get().saveProgress();
      },
      
      resumeTutorial: () => {
        const { isTutorialActive } = get();
        if (!isTutorialActive) return;
        
        set({ isPaused: false });
      },
      
      saveProgress: async () => {
        const { currentStep, steps, tutorialCompleted } = get();
        
        const progress: TutorialProgress = {
          currentStep,
          completedSteps: steps.slice(0, currentStep + 1).map(step => step.id),
          skipped: false,
          lastActiveDate: new Date().toISOString(),
        };
        
        set({ progress });
        
        try {
          await AsyncStorage.setItem('tutorial_progress', JSON.stringify(progress));
        } catch (error) {
          console.warn('Failed to save tutorial progress:', error);
        }
      },
      
      loadProgress: async () => {
        try {
          const stored = await AsyncStorage.getItem('tutorial_progress');
          if (stored) {
            const progress: TutorialProgress = JSON.parse(stored);
            set({ progress });
            return progress;
          }
        } catch (error) {
          console.warn('Failed to load tutorial progress:', error);
        }
        return null;
      },
      
      setCurrentRoute: (route: string) => {
        set({ currentRoute: route });
      },
      
      markInteractionComplete: () => {
        const { waitingForInteraction } = get();
        if (waitingForInteraction) {
          set({ waitingForInteraction: false });
        }
      },
      
      setShowTutorial: (show: boolean) => {
        set({ showTutorial: show, isTutorialActive: show });
      },
      
      markStepCompleted: (stepId: string) => {
        set((state) => ({
          steps: state.steps.map(step => 
            step.id === stepId ? { ...step, completed: true } : step
          ),
        }));
      },
      
      checkShouldShowWelcome: (onboardingCompleted: boolean) => {
        const { tutorialCompleted, showWelcome, showTutorial, welcomeCheckPerformed } = get();
        
        // Guard: prevent infinite loops
        if (welcomeCheckPerformed || tutorialCompleted || showWelcome || showTutorial) {
          return;
        }
        
        // Mark as performed immediately
        set({ welcomeCheckPerformed: true });
        
        // Only show welcome if onboarding is completed and tutorial hasn't been shown
        if (onboardingCompleted && !tutorialCompleted) {
          set({ showWelcome: true });
        }
      },
      
      forceHideTutorial: () => {
        set({
          isTutorialActive: false,
          showTutorial: false,
          showWelcome: false,
          welcomeCheckPerformed: true,
          highlightTargets: {},
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
        set({ isTutorialActive: active, showTutorial: active });
      },
      
      resetWelcomeCheck: () => {
        set({ welcomeCheckPerformed: false });
      },
    })));

// Stable selectors to prevent unnecessary rerenders - memoized for performance
const stepDataCache = new Map<string, any>();

export const selectCurrentStep = (state: TutorialState) => state.currentStep;
export const selectIsTutorialActive = (state: TutorialState) => state.isTutorialActive;
export const selectHighlightTargets = (state: TutorialState) => state.highlightTargets;
export const selectCurrentStepData = (state: TutorialState) => {
  const cacheKey = `${state.currentStep}-${state.steps.length}`;
  
  if (stepDataCache.has(cacheKey)) {
    return stepDataCache.get(cacheKey);
  }
  
  const step = state.steps[state.currentStep];
  const result = step ? { 
    step, 
    isFirst: state.currentStep === 0, 
    isLast: state.currentStep === state.steps.length - 1 
  } : null;
  
  stepDataCache.set(cacheKey, result);
  return result;
};