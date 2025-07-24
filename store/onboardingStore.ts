import { create } from 'zustand';
import { UserProfile, DietType, FitnessGoal } from '@/types';

interface OnboardingData {
  // Personal Info
  name: string;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  weight: number | null; // in kg
  height: number | null; // in cm
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active' | null;
  
  // Dietary Preferences
  dietType: DietType;
  allergies: string[];
  
  // Nutrition Goals
  calorieGoal: number | null;
  proteinGoal: number | null;
  carbsGoal: number | null;
  fatGoal: number | null;
  useCalculatedGoals: boolean;
  
  // Additional preferences
  fitnessGoals: FitnessGoal[];
  autoGenerateMeals: boolean;
}

interface OnboardingState {
  data: OnboardingData;
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  
  // Actions
  updatePersonalInfo: (info: Partial<Pick<OnboardingData, 'name' | 'age' | 'gender' | 'weight' | 'height' | 'activityLevel'>>) => void;
  updateDietaryPreferences: (prefs: Partial<Pick<OnboardingData, 'dietType' | 'allergies'>>) => void;
  updateNutritionGoals: (goals: Partial<Pick<OnboardingData, 'calorieGoal' | 'proteinGoal' | 'carbsGoal' | 'fatGoal' | 'useCalculatedGoals'>>) => void;
  updateFitnessGoals: (goals: FitnessGoal[]) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
  getCompleteProfile: () => Partial<UserProfile>;
}

const DEFAULT_DATA: OnboardingData = {
  name: '',
  age: null,
  gender: null,
  weight: null,
  height: null,
  activityLevel: null,
  dietType: 'any',
  allergies: [],
  calorieGoal: null,
  proteinGoal: null,
  carbsGoal: null,
  fatGoal: null,
  useCalculatedGoals: true,
  fitnessGoals: [],
  autoGenerateMeals: true,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  data: DEFAULT_DATA,
  currentStep: 1,
  totalSteps: 3,
  isComplete: false,
  
  updatePersonalInfo: (info) => {
    set((state) => ({
      data: { ...state.data, ...info },
    }));
  },
  
  updateDietaryPreferences: (prefs) => {
    set((state) => ({
      data: { ...state.data, ...prefs },
    }));
  },
  
  updateNutritionGoals: (goals) => {
    set((state) => ({
      data: { ...state.data, ...goals },
    }));
  },
  
  updateFitnessGoals: (goals) => {
    set((state) => ({
      data: { ...state.data, fitnessGoals: goals },
    }));
  },
  
  setCurrentStep: (step) => {
    set({ currentStep: step });
  },
  
  nextStep: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps) {
      set({ currentStep: currentStep + 1 });
    } else {
      set({ isComplete: true });
    }
  },
  
  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },
  
  reset: () => {
    set({
      data: DEFAULT_DATA,
      currentStep: 1,
      isComplete: false,
    });
  },
  
  getCompleteProfile: () => {
    const { data } = get();
    return {
      name: data.name,
      age: data.age || undefined,
      gender: data.gender || undefined,
      weight: data.weight || undefined,
      height: data.height || undefined,
      activityLevel: data.activityLevel || undefined,
      dietType: data.dietType,
      allergies: data.allergies,
      calorieGoal: data.calorieGoal || undefined,
      proteinGoal: data.proteinGoal || undefined,
      carbsGoal: data.carbsGoal || undefined,
      fatGoal: data.fatGoal || undefined,
      fitnessGoals: data.fitnessGoals,
      autoGenerateMeals: data.autoGenerateMeals,
      completedOnboarding: true,
    };
  },
}));