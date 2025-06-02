import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { poundsToKg, feetInchesToCm } from '@/utils/unitConversions';

export type UserProfile = {
  name: string;
  age?: number;
  weight?: number; // Stored in kg internally
  height?: number; // Stored in cm internally
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  dietaryPreferences?: string[];
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  completedOnboarding: boolean;
};

interface UserState {
  isLoggedIn: boolean;
  profile: UserProfile;
  login: (profile: Partial<UserProfile>) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateHeightImperial: (feet: number, inches: number) => void;
  updateWeightImperial: (pounds: number) => void;
  calculateNutritionGoals: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  completedOnboarding: false,
  dietaryPreferences: [],
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      profile: DEFAULT_PROFILE,
      
      login: (profile) => {
        set({
          isLoggedIn: true,
          profile: {
            ...get().profile,
            ...profile,
          },
        });
      },
      
      logout: () => {
        set({
          isLoggedIn: false,
          profile: DEFAULT_PROFILE,
        });
      },
      
      updateProfile: (updates) => {
        set({
          profile: {
            ...get().profile,
            ...updates,
          },
        });
        
        // Recalculate nutrition goals if relevant fields were updated
        if (
          updates.weight !== undefined ||
          updates.height !== undefined ||
          updates.age !== undefined ||
          updates.gender !== undefined ||
          updates.activityLevel !== undefined
        ) {
          get().calculateNutritionGoals();
        }
      },
      
      updateHeightImperial: (feet, inches) => {
        const heightInCm = feetInchesToCm(feet, inches);
        set((state) => ({
          profile: {
            ...state.profile,
            height: heightInCm,
          },
        }));
        
        // Recalculate nutrition goals
        get().calculateNutritionGoals();
      },
      
      updateWeightImperial: (pounds) => {
        const weightInKg = poundsToKg(pounds);
        set((state) => ({
          profile: {
            ...state.profile,
            weight: weightInKg,
          },
        }));
        
        // Recalculate nutrition goals
        get().calculateNutritionGoals();
      },
      
      calculateNutritionGoals: () => {
        const { profile } = get();
        const { gender, weight, height, age, activityLevel } = profile;
        
        // Skip calculation if required fields are missing
        if (!gender || !weight || !height || !age || !activityLevel) {
          return;
        }
        
        // Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
        let bmr = 0;
        if (gender === 'male') {
          bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
          bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }
        
        // Apply activity multiplier
        const activityMultipliers = {
          'sedentary': 1.2,      // Little or no exercise
          'light': 1.375,        // Light exercise 1-3 days/week
          'moderate': 1.55,      // Moderate exercise 3-5 days/week
          'active': 1.725,       // Hard exercise 6-7 days/week
          'very-active': 1.9,    // Very hard exercise & physical job
        };
        
        const multiplier = activityMultipliers[activityLevel];
        const calorieGoal = Math.round(bmr * multiplier);
        
        // Calculate macronutrient goals (standard distribution)
        // Protein: 30%, Carbs: 40%, Fat: 30%
        const proteinGoal = Math.round((calorieGoal * 0.3) / 4); // 4 calories per gram of protein
        const carbsGoal = Math.round((calorieGoal * 0.4) / 4);   // 4 calories per gram of carbs
        const fatGoal = Math.round((calorieGoal * 0.3) / 9);     // 9 calories per gram of fat
        
        set({
          profile: {
            ...profile,
            calorieGoal,
            proteinGoal,
            carbsGoal,
            fatGoal,
          },
        });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);