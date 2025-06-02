import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useFoodLogStore } from '@/store/foodLogStore';
import { useUserStore } from '@/store/userStore';
import DateSelector from '@/components/DateSelector';
import NutritionBar from '@/components/NutritionBar';
import FoodLogItem from '@/components/FoodLogItem';
import Colors from '@/constants/colors';

export default function CalorieTrackerScreen() {
  const router = useRouter();
  const { foodLog, removeFoodEntry } = useFoodLogStore();
  const { profile } = useUserStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateString = selectedDate.toISOString().split('T')[0];
  const dayLog = foodLog[dateString] || { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, meals: [] };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddFood = () => {
    router.push(`/add-food/${dateString}`);
  };

  const handleRemoveFood = (index: number) => {
    removeFoodEntry(dateString, index);
  };

  const handleEditFood = (index: number) => {
    router.push(`/add-food/${dateString}?index=${index}`);
  };

  // Group meals by meal type
  const groupedMeals = dayLog.meals.reduce((acc, meal) => {
    if (!acc[meal.mealType]) {
      acc[meal.mealType] = [];
    }
    acc[meal.mealType].push(meal);
    return acc;
  }, {} as Record<string, typeof dayLog.meals>);

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  // Calculate remaining calories and macros
  const remainingCalories = (profile.calorieGoal || 2000) - dayLog.totalCalories;
  const remainingProtein = (profile.proteinGoal || 100) - dayLog.totalProtein;
  const remainingCarbs = (profile.carbsGoal || 250) - dayLog.totalCarbs;
  const remainingFat = (profile.fatGoal || 70) - dayLog.totalFat;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calorie Tracker</Text>
        <Text style={styles.subtitle}>Track your daily nutrition</Text>
      </View>

      <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <NutritionBar
          calories={dayLog.totalCalories}
          protein={dayLog.totalProtein}
          carbs={dayLog.totalCarbs}
          fat={dayLog.totalFat}
        />

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Remaining Today</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingCalories > 0 ? remainingCalories : 0}</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingProtein > 0 ? remainingProtein : 0}g</Text>
              <Text style={styles.summaryLabel}>Protein</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingCarbs > 0 ? remainingCarbs : 0}g</Text>
              <Text style={styles.summaryLabel}>Carbs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{remainingFat > 0 ? remainingFat : 0}g</Text>
              <Text style={styles.summaryLabel}>Fat</Text>
            </View>
          </View>
        </View>

        <View style={styles.addButtonContainer}>
          <Pressable style={styles.addButton} onPress={handleAddFood}>
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Add Food</Text>
          </Pressable>
        </View>

        {dayLog.meals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No food entries for this day</Text>
            <Text style={styles.emptySubtext}>Tap the button above to add your first meal</Text>
          </View>
        ) : (
          mealTypes.map(mealType => {
            const meals = groupedMeals[mealType] || [];
            if (meals.length === 0) return null;
            
            return (
              <View key={mealType} style={styles.mealTypeContainer}>
                <Text style={styles.mealTypeTitle}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
                {meals.map((meal, index) => {
                  const originalIndex = dayLog.meals.findIndex(m => m === meal);
                  return (
                    <FoodLogItem
                      key={`${meal.name}-${meal.time}-${index}`}
                      entry={meal}
                      onRemove={() => handleRemoveFood(originalIndex)}
                      onPress={() => handleEditFood(originalIndex)}
                    />
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryContainer: {
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  addButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  mealTypeContainer: {
    marginBottom: 20,
  },
  mealTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
});