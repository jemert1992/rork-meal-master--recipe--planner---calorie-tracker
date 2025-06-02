import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';

type NutritionBarProps = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goal?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  // Add these props to match what's being passed in meal-plan.tsx
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
};

export default function NutritionBar({ 
  calories, 
  protein, 
  carbs, 
  fat, 
  goal,
  calorieGoal,
  proteinGoal,
  carbsGoal,
  fatGoal
}: NutritionBarProps) {
  const { profile } = useUserStore();
  
  // Use provided goals or fall back to user profile goals or defaults
  const nutritionGoals = goal || {
    calories: calorieGoal || profile.calorieGoal || 2000,
    protein: proteinGoal || profile.proteinGoal || 100,
    carbs: carbsGoal || profile.carbsGoal || 250,
    fat: fatGoal || profile.fatGoal || 70
  };
  
  const calculatePercentage = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };

  const caloriesPercentage = calculatePercentage(calories, nutritionGoals.calories);
  const proteinPercentage = calculatePercentage(protein, nutritionGoals.protein);
  const carbsPercentage = calculatePercentage(carbs, nutritionGoals.carbs);
  const fatPercentage = calculatePercentage(fat, nutritionGoals.fat);

  return (
    <View style={styles.container}>
      <View style={styles.nutrientContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Calories</Text>
          <Text style={styles.value}>{calories} / {nutritionGoals.calories}</Text>
        </View>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${caloriesPercentage}%`, backgroundColor: Colors.primary }]} />
        </View>
      </View>

      <View style={styles.macrosContainer}>
        <View style={styles.nutrientContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Protein</Text>
            <Text style={styles.value}>{protein}g / {nutritionGoals.protein}g</Text>
          </View>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${proteinPercentage}%`, backgroundColor: '#E57373' }]} />
          </View>
        </View>

        <View style={styles.nutrientContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Carbs</Text>
            <Text style={styles.value}>{carbs}g / {nutritionGoals.carbs}g</Text>
          </View>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${carbsPercentage}%`, backgroundColor: '#64B5F6' }]} />
          </View>
        </View>

        <View style={styles.nutrientContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Fat</Text>
            <Text style={styles.value}>{fat}g / {nutritionGoals.fat}g</Text>
          </View>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${fatPercentage}%`, backgroundColor: '#FFD54F' }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  nutrientContainer: {
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: Colors.textLight,
  },
  barBackground: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  macrosContainer: {
    marginTop: 8,
  },
});