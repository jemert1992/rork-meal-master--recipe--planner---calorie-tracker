import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { poundsToKg, feetInchesToCm } from '@/utils/unitConversions';
import { DietType, UserProfile } from '@/types';
import { trpcClient } from '@/lib/trpc';

interface UserState {
  isLoggedIn: boolean;
  profile: UserProfile;
  isCalculatingGoals: boolean;
  isLoading: boolean;
  error: string | null;
  userInfoSubmitted: boolean;
  login: (profile: Partial<UserProfile>) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateHeightImperial: (feet: number, inches: number) => void;
  updateWeightImperial: (pounds: number) => void;
  calculateNutritionGoals: () => void;
  createProfile: (profileData: Omit<UserProfile, 'id' | 'completedOnboarding'>) => Promise<void>;
  syncProfile: () => Promise<void>;
  setUserInfoSubmitted: (submitted: boolean) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  onboardingCompleted: false,
  completedOnboarding: false,
  dietaryPreferences: [],
  allergies: [],
  dietType: 'any',
  fitnessGoals: [],
  autoGenerateMeals: true,
  strictNoDuplicates: true,
  requireDailyPlantBased: false,
  preferSimpleMeals: true,
  breakfastSimpleBiasStrong: true,
  noComplexMeals: false,
  // Batch prep & leftovers defaults
  preferBatchPrep: true,
  planLeftovers: true,
  maxLeftoverGapDays: 2,
  // Breakfast repeats
  breakfastRepeatMode: 'repeat',
  // Lunch repeats
  lunchRepeatMode: 'no-repeat',
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      profile: DEFAULT_PROFILE,
      isCalculatingGoals: false,
      isLoading: false,
      error: null,
      userInfoSubmitted: false,
      
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
          userInfoSubmitted: false,
        });
      },
      
      updateProfile: (updates) => {
        const currentProfile = get().profile;
        const { isCalculatingGoals } = get();
        
        // Skip if already calculating to prevent infinite loops
        if (isCalculatingGoals) {
          console.log('Already calculating goals, skipping profile update');
          return;
        }
        
        // Check if we need to recalculate nutrition goals
        const shouldRecalculate = 
          updates.weight !== undefined ||
          updates.height !== undefined ||
          updates.age !== undefined ||
          updates.gender !== undefined ||
          updates.activityLevel !== undefined ||
          updates.dietType !== undefined;
        
        // Update the profile first
        set((state) => ({
          profile: {
            ...state.profile,
            ...updates,
          },
        }));
        
        // Only recalculate if necessary and if we have the required fields
        if (shouldRecalculate) {
          const newProfile = { ...currentProfile, ...updates };
          if (newProfile.gender && newProfile.weight && newProfile.height && newProfile.age && newProfile.activityLevel) {
            // Use setTimeout to avoid infinite loops and ensure state is updated
            setTimeout(() => {
              const store = get();
              // Double-check all conditions before calculating
              if (store.profile.gender && 
                  store.profile.weight && 
                  store.profile.height && 
                  store.profile.age && 
                  store.profile.activityLevel && 
                  !store.isCalculatingGoals) {
                try {
                  store.calculateNutritionGoals();
                } catch (error) {
                  console.error('Error in delayed nutrition calculation:', error);
                  set({ isCalculatingGoals: false });
                }
              }
            }, 100);
          }
        }
      },
      
      updateHeightImperial: (feet, inches) => {
        const heightInCm = feetInchesToCm(feet, inches);
        const currentProfile = get().profile;
        const { isCalculatingGoals } = get();
        
        // Skip if already calculating to prevent infinite loops
        if (isCalculatingGoals) {
          console.log('Already calculating goals, skipping height update');
          return;
        }
        
        set((state) => ({
          profile: {
            ...state.profile,
            height: heightInCm,
          },
        }));
        
        // Only recalculate if we have all required fields
        if (currentProfile.gender && currentProfile.weight && currentProfile.age && currentProfile.activityLevel) {
          setTimeout(() => {
            const store = get();
            if (store.profile.gender && 
                store.profile.weight && 
                store.profile.height && 
                store.profile.age && 
                store.profile.activityLevel && 
                !store.isCalculatingGoals) {
              try {
                store.calculateNutritionGoals();
              } catch (error) {
                console.error('Error in height update nutrition calculation:', error);
                set({ isCalculatingGoals: false });
              }
            }
          }, 100);
        }
      },
      
      updateWeightImperial: (pounds) => {
        const weightInKg = poundsToKg(pounds);
        const currentProfile = get().profile;
        const { isCalculatingGoals } = get();
        
        // Skip if already calculating to prevent infinite loops
        if (isCalculatingGoals) {
          console.log('Already calculating goals, skipping weight update');
          return;
        }
        
        set((state) => ({
          profile: {
            ...state.profile,
            weight: weightInKg,
          },
        }));
        
        // Only recalculate if we have all required fields
        if (currentProfile.gender && currentProfile.height && currentProfile.age && currentProfile.activityLevel) {
          setTimeout(() => {
            const store = get();
            if (store.profile.gender && 
                store.profile.weight && 
                store.profile.height && 
                store.profile.age && 
                store.profile.activityLevel && 
                !store.isCalculatingGoals) {
              try {
                store.calculateNutritionGoals();
              } catch (error) {
                console.error('Error in weight update nutrition calculation:', error);
                set({ isCalculatingGoals: false });
              }
            }
          }, 100);
        }
      },
      
      calculateNutritionGoals: () => {
        try {
          const { profile, isCalculatingGoals } = get();
          
          // Skip if already calculating to prevent infinite loops
          if (isCalculatingGoals) {
            console.log('Already calculating nutrition goals, skipping');
            return;
          }
          
          // Skip calculation if required fields are missing
          if (!profile.gender || !profile.weight || !profile.height || !profile.age || !profile.activityLevel) {
            console.log('Missing required fields for nutrition calculation');
            return;
          }
          
          // Skip if goals are already calculated to prevent infinite loops
          if (profile.calorieGoal && profile.proteinGoal && profile.carbsGoal && profile.fatGoal) {
            // Only recalculate if the current goals seem outdated (basic check)
            const expectedBMR = profile.gender === 'male' 
              ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
              : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
            
            const activityMultipliers: Record<string, number> = {
              'sedentary': 1.2,
              'light': 1.375,
              'moderate': 1.55,
              'active': 1.725,
              'very-active': 1.9,
            };
            
            const multiplier = activityMultipliers[profile.activityLevel] || 1.2;
            const expectedCalories = Math.round(expectedBMR * multiplier);
            
            // If current calorie goal is within 10% of expected, don't recalculate
            if (Math.abs(profile.calorieGoal - expectedCalories) / expectedCalories < 0.1) {
              console.log('Nutrition goals are up to date, skipping recalculation');
              return;
            }
          }
          
          // Set calculating flag
          set({ isCalculatingGoals: true });
          
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
        
        const multiplier = activityMultipliers[profile.activityLevel] || 1.2;
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
          isCalculatingGoals: false, // Clear the calculating flag
        }));
        
        console.log('Nutrition goals calculated:', { calorieGoal, proteinGoal, carbsGoal, fatGoal });
        } catch (error) {
          console.error('Error calculating nutrition goals:', error);
          set({ isCalculatingGoals: false });
        }
      },
      
      createProfile: async (profileData) => {
        try {
          set({ isLoading: true, error: null });

          const safeName = (profileData.name ?? '').toString().trim();
          if (!safeName) {
            const err = new Error('Name is required');
            set({ isLoading: false, error: err.message });
            throw err;
          }

          const payload = {
            ...profileData,
            name: safeName,
            // Provide sane minimum defaults to satisfy backend validation if callers omitted values
            age: profileData.age ?? 25,
            weight: profileData.weight ?? 70,
            height: profileData.height ?? 170,
            gender: profileData.gender ?? 'other',
            activityLevel: profileData.activityLevel ?? 'moderate',
            dietType: profileData.dietType ?? 'any',
            allergies: profileData.allergies ?? [],
            fitnessGoals: profileData.fitnessGoals ?? [],
            autoGenerateMeals: profileData.autoGenerateMeals ?? true,
          };

          const response = await trpcClient.user.createProfile.mutate(payload);
          
          if (response.success) {
            set({
              isLoggedIn: true,
              profile: {
                ...response.profile,
                completedOnboarding: true,
                onboardingCompleted: true,
              },
              isLoading: false,
              error: null,
            });
            console.log('Profile created successfully:', response.profile);
          } else {
            throw new Error('Failed to create profile');
          }
        } catch (error) {
          console.error('Error creating profile:', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to create profile' 
          });
          throw error;
        }
      },
      
      setUserInfoSubmitted: (submitted: boolean) => {
        set({ userInfoSubmitted: submitted });
      },
      
      syncProfile: async () => {
        try {
          const { profile } = get();
          if (!profile.id) {
            console.log('No profile ID, skipping sync');
            return;
          }
          
          set({ isLoading: true, error: null });
          
          const response = await trpcClient.user.updateProfile.mutate({
            id: profile.id,
            ...profile,
          });
          
          if (response.success) {
            set({
              profile: {
                ...get().profile,
                ...response.profile,
              },
              isLoading: false,
              error: null,
            });
            console.log('Profile synced successfully');
          }
        } catch (error) {
          console.error('Error syncing profile:', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : 'Failed to sync profile' 
          });
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        console.log('User store rehydrated:', state);
        // Ensure userInfoSubmitted is properly loaded
        if (state && state.userInfoSubmitted === undefined) {
          state.userInfoSubmitted = false;
        }
      },
    }
  )
);