import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodLog, FoodEntry, DailyLog, FoodItem } from '@/types';

interface FoodLogState {
  foodLog: FoodLog;
  addFoodEntry: (date: string, entry: FoodItem) => void;
  removeFoodEntry: (date: string, index: number) => void;
  updateFoodEntry: (date: string, index: number, entry: FoodItem) => void;
  getDailyLog: (date: string) => DailyLog | null;
}

// Mock data structure that matches our FoodLog type
const mockFoodLog: FoodLog = {
  '2023-06-10': {
    totalCalories: 1850,
    totalProtein: 95,
    totalCarbs: 220,
    totalFat: 60,
    meals: [
      {
        id: '1',
        name: 'Oatmeal with Berries',
        calories: 350,
        protein: 12,
        carbs: 60,
        fat: 8,
        fiber: 8,
        quantity: 1,
        unit: 'bowl',
        mealType: 'breakfast',
        time: '08:00'
      },
      {
        id: '2',
        name: 'Grilled Chicken Salad',
        calories: 450,
        protein: 35,
        carbs: 25,
        fat: 22,
        fiber: 6,
        quantity: 1,
        unit: 'plate',
        mealType: 'lunch',
        time: '13:00'
      },
      {
        id: '3',
        name: 'Salmon with Vegetables',
        calories: 550,
        protein: 40,
        carbs: 30,
        fat: 25,
        fiber: 8,
        quantity: 1,
        unit: 'plate',
        mealType: 'dinner',
        time: '19:00'
      },
      {
        id: '4',
        name: 'Greek Yogurt',
        calories: 150,
        protein: 15,
        carbs: 10,
        fat: 5,
        fiber: 0,
        quantity: 1,
        unit: 'cup',
        mealType: 'snacks',
        time: '16:00'
      },
      {
        id: '5',
        name: 'Apple',
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4,
        quantity: 1,
        unit: 'medium',
        mealType: 'snacks',
        time: '11:00'
      }
    ]
  }
};

export const useFoodLogStore = create<FoodLogState>()(
  persist(
    (set, get) => ({
      foodLog: mockFoodLog,
      
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