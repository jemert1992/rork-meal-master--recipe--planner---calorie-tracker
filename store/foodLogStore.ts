import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodLog, FoodEntry, DailyLog } from '@/types';
import { mockFoodLog } from '@/constants/mockData';

interface FoodLogState {
  foodLog: FoodLog;
  addFoodEntry: (date: string, entry: FoodEntry) => void;
  removeFoodEntry: (date: string, index: number) => void;
  updateFoodEntry: (date: string, index: number, entry: FoodEntry) => void;
  getDailyLog: (date: string) => DailyLog | null;
}

// Convert mock data to ensure it matches the FoodLog type
const typedMockFoodLog: FoodLog = {};
for (const [date, log] of Object.entries(mockFoodLog)) {
  typedMockFoodLog[date] = {
    totalCalories: log.totalCalories,
    totalProtein: log.totalProtein,
    totalCarbs: log.totalCarbs,
    totalFat: log.totalFat,
    meals: log.meals.map(meal => ({
      ...meal,
      mealType: meal.mealType as FoodEntry['mealType']
    }))
  };
}

export const useFoodLogStore = create<FoodLogState>()(
  persist(
    (set, get) => ({
      foodLog: typedMockFoodLog,
      
      addFoodEntry: (date, entry) => {
        set((state) => {
          const dayLog = state.foodLog[date] || {
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            meals: [],
          };
          
          const updatedDayLog = {
            totalCalories: dayLog.totalCalories + (entry.calories || 0),
            totalProtein: dayLog.totalProtein + (entry.protein || 0),
            totalCarbs: dayLog.totalCarbs + (entry.carbs || 0),
            totalFat: dayLog.totalFat + (entry.fat || 0),
            meals: [...dayLog.meals, entry],
          };
          
          return {
            foodLog: {
              ...state.foodLog,
              [date]: updatedDayLog,
            },
          };
        });
      },
      
      removeFoodEntry: (date, index) => {
        set((state) => {
          const dayLog = state.foodLog[date];
          if (!dayLog) return state;
          
          const entryToRemove = dayLog.meals[index];
          const updatedMeals = [...dayLog.meals];
          updatedMeals.splice(index, 1);
          
          const updatedDayLog = {
            totalCalories: dayLog.totalCalories - (entryToRemove.calories || 0),
            totalProtein: dayLog.totalProtein - (entryToRemove.protein || 0),
            totalCarbs: dayLog.totalCarbs - (entryToRemove.carbs || 0),
            totalFat: dayLog.totalFat - (entryToRemove.fat || 0),
            meals: updatedMeals,
          };
          
          return {
            foodLog: {
              ...state.foodLog,
              [date]: updatedDayLog,
            },
          };
        });
      },
      
      updateFoodEntry: (date, index, entry) => {
        set((state) => {
          const dayLog = state.foodLog[date];
          if (!dayLog) return state;
          
          const oldEntry = dayLog.meals[index];
          const updatedMeals = [...dayLog.meals];
          updatedMeals[index] = entry;
          
          const updatedDayLog = {
            totalCalories: dayLog.totalCalories - (oldEntry.calories || 0) + (entry.calories || 0),
            totalProtein: dayLog.totalProtein - (oldEntry.protein || 0) + (entry.protein || 0),
            totalCarbs: dayLog.totalCarbs - (oldEntry.carbs || 0) + (entry.carbs || 0),
            totalFat: dayLog.totalFat - (oldEntry.fat || 0) + (entry.fat || 0),
            meals: updatedMeals,
          };
          
          return {
            foodLog: {
              ...state.foodLog,
              [date]: updatedDayLog,
            },
          };
        });
      },
      
      getDailyLog: (date) => {
        return get().foodLog[date] || null;
      },
    }),
    {
      name: 'food-log-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);