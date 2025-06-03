import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Calendar } from 'lucide-react-native';
import { format, addDays, startOfWeek } from 'date-fns';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRecipeStore } from '@/store/recipeStore';
import Colors from '@/constants/colors';

type MealSlotProps = {
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  onPress: () => void;
  recipeName?: string;
  recipeImage?: string;
};

const MealSlot = ({ date, mealType, onPress, recipeName, recipeImage }: MealSlotProps) => {
  const mealTypeLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner'
  };

  return (
    <Pressable style={styles.mealSlot} onPress={onPress}>
      {recipeName ? (
        <View style={styles.filledSlot}>
          {recipeImage ? (
            <Image source={{ uri: recipeImage }} style={styles.recipeImage} />
          ) : (
            <View style={styles.placeholderImage} />
          )}
          <View style={styles.recipeInfo}>
            <Text style={styles.mealTypeLabel}>{mealTypeLabels[mealType]}</Text>
            <Text style={styles.recipeName} numberOfLines={1}>{recipeName}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptySlot}>
          <Text style={styles.mealTypeLabel}>{mealTypeLabels[mealType]}</Text>
          <Plus size={20} color={Colors.primary} />
          <Text style={styles.addRecipeText}>Add Recipe</Text>
        </View>
      )}
    </Pressable>
  );
};

type WeeklyMealPlannerProps = {
  onGenerateGroceryList: () => void;
};

export default function WeeklyMealPlanner({ onGenerateGroceryList }: WeeklyMealPlannerProps) {
  const router = useRouter();
  const { mealPlan } = useMealPlanStore();
  const { recipes } = useRecipeStore();
  
  // Get the current week starting from today
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Generate an array of 7 days starting from weekStart
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      dateString: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      dayNumber: format(date, 'd')
    };
  });

  const handleMealSlotPress = (date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    router.push(`/add-meal/${date}?mealType=${mealType}`);
  };

  const getRecipeDetails = (recipeId?: string) => {
    if (!recipeId) return { name: undefined, image: undefined };
    const recipe = recipes.find(r => r.id === recipeId);
    return {
      name: recipe?.name,
      image: recipe?.image
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Meal Plan</Text>
        <Pressable style={styles.generateButton} onPress={onGenerateGroceryList}>
          <Text style={styles.generateButtonText}>Generate Grocery List</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScroll}>
        {weekDays.map((day) => (
          <View key={day.dateString} style={styles.dayColumn}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{day.dayName}</Text>
              <Text style={styles.dayNumber}>{day.dayNumber}</Text>
            </View>

            {['breakfast', 'lunch', 'dinner'].map((mealType) => {
              const dayPlan = mealPlan[day.dateString] || {};
              const meal = dayPlan[mealType as keyof typeof dayPlan];
              
              // Check if meal is defined and is not an array before accessing recipeId
              const recipeId = meal && !Array.isArray(meal) ? meal.recipeId : undefined;
              const { name, image } = getRecipeDetails(recipeId);

              return (
                <MealSlot
                  key={`${day.dateString}-${mealType}`}
                  date={day.dateString}
                  mealType={mealType as 'breakfast' | 'lunch' | 'dinner'}
                  recipeName={name}
                  recipeImage={image}
                  onPress={() => handleMealSlotPress(day.dateString, mealType as 'breakfast' | 'lunch' | 'dinner')}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: Colors.white,
    fontWeight: '500',
    fontSize: 12,
  },
  weekScroll: {
    flexDirection: 'row',
  },
  dayColumn: {
    width: 140,
    marginRight: 12,
  },
  dayHeader: {
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  mealSlot: {
    height: 80,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  emptySlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  filledSlot: {
    flex: 1,
    flexDirection: 'row',
  },
  mealTypeLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  addRecipeText: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  recipeImage: {
    width: 80,
    height: 80,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    backgroundColor: Colors.backgroundLight,
  },
  recipeInfo: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
});