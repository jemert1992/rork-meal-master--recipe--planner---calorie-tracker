import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { poundsToKg, feetInchesToCm } from '@/utils/unitConversions';
import { DietType, UserProfile } from '@/types';

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
  allergies: [],
  dietType: 'any',
  fitnessGoals: [],
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
        // First update the profile
        set((state) => ({
          profile: {
            ...state.profile,
            ...updates,
          },
        }));
        
        // Then check if we need to recalculate nutrition goals
        // This prevents the infinite loop by separating the state updates
        if (
          updates.weight !== undefined ||
          updates.height !== undefined ||
          updates.age !== undefined ||
          updates.gender !== undefined ||
          updates.activityLevel !== undefined
        ) {
          // Use setTimeout to ensure this runs after the state update
          setTimeout(() => {
            get().calculateNutritionGoals();
          }, 0);
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
        
        // Use setTimeout to ensure this runs after the state update
        setTimeout(() => {
          get().calculateNutritionGoals();
        }, 0);
      },
      
      updateWeightImperial: (pounds) => {
        const weightInKg = poundsToKg(pounds);
        set((state) => ({
          profile: {
            ...state.profile,
            weight: weightInKg,
          },
        }));
        
        // Use setTimeout to ensure this runs after the state update
        setTimeout(() => {
          get().calculateNutritionGoals();
        }, 0);
      },
      
      calculateNutritionGoals: () => {
        const { profile } = get();
        
        // Skip calculation if required fields are missing
        if (!profile.gender || !profile.weight || !profile.height || !profile.age || !profile.activityLevel) {
          return;
        }
        
        // Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
        let bmr = 0;
        if (profile.gender === 'male') {
          bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
        } else {
          bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
        }
        
        // Apply activity multiplier
        const activityMultipliers: Record<string, number> = {
          'sedentary': 1.2,      // Little or no exercise
          'light': 1.375,        // Light exercise 1-3 days/week
          'moderate': 1.55,      // Moderate exercise 3-5 days/week
          'active': 1.725,       // Hard exercise 6-7 days/week
          'very-active': 1.9,    // Very hard exercise & physical job
        };
        
        const multiplier = activityMultipliers[profile.activityLevel];
        let calorieGoal = Math.round(bmr * multiplier);
        
        // Adjust calorie goal based on diet type
        if (profile.dietType === 'keto' || profile.dietType === 'low-carb') {
          // Keto and low-carb diets often have slightly lower calorie targets
          calorieGoal = Math.round(calorieGoal * 0.9);
        }
        
        // Calculate macronutrient goals based on diet type
        let proteinPercentage = 0.3; // 30%
        let carbsPercentage = 0.4;   // 40%
        let fatPercentage = 0.3;     // 30%
        
        // Adjust macros based on diet type
        if (profile.dietType === 'keto') {
          proteinPercentage = 0.25;  // 25%
          carbsPercentage = 0.05;    // 5%
          fatPercentage = 0.7;       // 70%
        } else if (profile.dietType === 'low-carb') {
          proteinPercentage = 0.3;   // 30%
          carbsPercentage = 0.2;     // 20%
          fatPercentage = 0.5;       // 50%
        } else if (profile.dietType === 'vegan' || profile.dietType === 'vegetarian') {
          proteinPercentage = 0.25;  // 25%
          carbsPercentage = 0.5;     // 50%
          fatPercentage = 0.25;      // 25%
        }
        
        const proteinGoal = Math.round((calorieGoal * proteinPercentage) / 4); // 4 calories per gram of protein
        const carbsGoal = Math.round((calorieGoal * carbsPercentage) / 4);     // 4 calories per gram of carbs
        const fatGoal = Math.round((calorieGoal * fatPercentage) / 9);         // 9 calories per gram of fat
        
        set((state) => ({
          profile: {
            ...state.profile,
            calorieGoal,
            proteinGoal,
            carbsGoal,
            fatGoal,
          },
        }));
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);