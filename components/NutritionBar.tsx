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
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  nutrientContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  value: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  barBackground: {
    height: 10,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  macrosContainer: {
    marginTop: 12,
  },
});