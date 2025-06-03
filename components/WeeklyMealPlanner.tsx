import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Plus, ShoppingBag, X, Sparkles } from 'lucide-react-native';
import { format, addDays, startOfWeek } from 'date-fns';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRecipeStore } from '@/store/recipeStore';
import Colors from '@/constants/colors';

type WeeklyMealPlannerProps = {
  onGenerateGroceryList: () => void;
};

export default function WeeklyMealPlanner({ onGenerateGroceryList }: WeeklyMealPlannerProps) {
  const router = useRouter();
  const { mealPlan, generateMealPlan, isRecipeUsedInMealPlan } = useMealPlanStore();
  const { recipes } = useRecipeStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [generatingMeal, setGeneratingMeal] = useState<{
    date: string;
    mealType: 'breakfast' | 'lunch' | 'dinner';
    loading: boolean;
  } | null>(null);
  
  // Get the current week starting from today
  const [weekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Generate an array of 7 days starting from weekStart
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      dateString: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      dayNumber: format(date, 'd'),
      month: format(date, 'MMM')
    };
  });

  const handleMealSlotPress = (date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    router.push(`/add-meal/${date}?mealType=${mealType}`);
    setModalVisible(false);
  };

  const handleAutoGenerateMeal = async (date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    try {
      setGeneratingMeal({ date, mealType, loading: true });
      
      // Generate a meal plan for the specific date and meal type
      await generateMealPlan(date, recipes, mealType);
      
      // Success message
      Alert.alert(
        "Meal Generated",
        `Your ${mealType} has been automatically generated!`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error generating meal:", error);
      Alert.alert(
        "Generation Failed",
        "Could not generate a meal. Please try again or select a recipe manually.",
        [{ text: "OK" }]
      );
    } finally {
      setGeneratingMeal(null);
    }
  };

  const getRecipeDetails = (recipeId?: string) => {
    if (!recipeId) return { name: undefined, image: undefined };
    const recipe = recipes.find(r => r.id === recipeId);
    return {
      name: recipe?.name,
      image: recipe?.image
    };
  };

  // Count how many meals are planned
  const countPlannedMeals = () => {
    let count = 0;
    Object.values(mealPlan).forEach(day => {
      if (day.breakfast && day.breakfast.recipeId) count++;
      if (day.lunch && day.lunch.recipeId) count++;
      if (day.dinner && day.dinner.recipeId) count++;
    });
    return count;
  };

  const plannedMealsCount = countPlannedMeals();
  const totalPossibleMeals = weekDays.length * 3; // 7 days * 3 meals
  const completionPercentage = Math.round((plannedMealsCount / totalPossibleMeals) * 100);

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.planButton} 
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.buttonContent}>
          <View style={styles.buttonIconContainer}>
            <Calendar size={24} color={Colors.white} />
          </View>
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitle}>Plan Your Weekly Meals</Text>
            <Text style={styles.buttonSubtitle}>
              {plannedMealsCount > 0 
                ? `${plannedMealsCount}/${totalPossibleMeals} meals planned (${completionPercentage}%)`
                : "Tap to start planning your meals"}
            </Text>
          </View>
          <ChevronRight size={20} color={Colors.textLight} />
        </View>
      </Pressable>

      {plannedMealsCount > 0 && (
        <Pressable 
          style={styles.groceryButton} 
          onPress={onGenerateGroceryList}
        >
          <ShoppingBag size={16} color={Colors.primary} />
          <Text style={styles.groceryButtonText}>Generate Grocery List</Text>
        </Pressable>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weekly Meal Plan</Text>
              <Pressable 
                style={styles.closeButton} 
                onPress={() => setModalVisible(false)}
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              {weekDays.map((day) => (
                <View key={day.dateString} style={styles.daySection}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayNumberContainer}>
                      <Text style={styles.dayNumber}>{day.dayNumber}</Text>
                      <Text style={styles.dayMonth}>{day.month}</Text>
                    </View>
                    <View style={styles.dayInfo}>
                      <Text style={styles.dayName}>{day.dayName}</Text>
                      <Text style={styles.dayDate}>{format(day.date, 'MMMM d, yyyy')}</Text>
                    </View>
                  </View>

                  <View style={styles.mealsContainer}>
                    {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                      const dayPlan = mealPlan[day.dateString] || {};
                      const meal = dayPlan[mealType as keyof typeof dayPlan];
                      
                      const recipeId = meal?.recipeId;
                      const { name, image } = getRecipeDetails(recipeId);
                      
                      const isGenerating = generatingMeal && 
                        generatingMeal.date === day.dateString && 
                        generatingMeal.mealType === mealType && 
                        generatingMeal.loading;

                      return (
                        <View key={`${day.dateString}-${mealType}`} style={styles.mealSlotContainer}>
                          <Pressable
                            style={[
                              styles.mealSlot,
                              name ? styles.filledMealSlot : styles.emptyMealSlot
                            ]}
                            onPress={() => handleMealSlotPress(day.dateString, mealType as 'breakfast' | 'lunch' | 'dinner')}
                            disabled={isGenerating}
                          >
                            {name ? (
                              <View style={styles.filledMealContent}>
                                {image ? (
                                  <Image source={{ uri: image }} style={styles.mealImage} />
                                ) : (
                                  <View style={styles.mealImagePlaceholder} />
                                )}
                                <View style={styles.mealInfo}>
                                  <Text style={styles.mealTypeLabel}>
                                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                                  </Text>
                                  <Text style={styles.mealName} numberOfLines={1}>{name}</Text>
                                </View>
                              </View>
                            ) : (
                              <View style={styles.emptyMealContent}>
                                <Text style={styles.mealTypeLabel}>
                                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                                </Text>
                                {isGenerating ? (
                                  <Text style={styles.generatingText}>Generating...</Text>
                                ) : (
                                  <>
                                    <Plus size={20} color={Colors.primary} />
                                    <Text style={styles.addMealText}>Add Recipe</Text>
                                  </>
                                )}
                              </View>
                            )}
                          </Pressable>
                          
                          {!name && !isGenerating && (
                            <Pressable 
                              style={styles.pickForMeButton}
                              onPress={() => handleAutoGenerateMeal(
                                day.dateString, 
                                mealType as 'breakfast' | 'lunch' | 'dinner'
                              )}
                            >
                              <Sparkles size={14} color={Colors.white} />
                              <Text style={styles.pickForMeText}>Pick for me</Text>
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable 
                style={[
                  styles.generateButton,
                  plannedMealsCount === 0 && styles.disabledButton
                ]} 
                onPress={() => {
                  onGenerateGroceryList();
                  setModalVisible(false);
                }}
                disabled={plannedMealsCount === 0}
              >
                <ShoppingBag size={20} color={Colors.white} />
                <Text style={styles.generateButtonText}>Generate Grocery List</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  planButton: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
  },
  groceryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  groceryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  daySection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  dayNumberContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  dayMonth: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dayDate: {
    fontSize: 14,
    color: Colors.textLight,
  },
  mealsContainer: {
    gap: 12,
  },
  mealSlotContainer: {
    marginBottom: 8,
  },
  mealSlot: {
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyMealSlot: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.backgroundLight,
    borderStyle: 'dashed',
  },
  filledMealSlot: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyMealContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  filledMealContent: {
    flex: 1,
    flexDirection: 'row',
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textLight,
    marginBottom: 4,
  },
  addMealText: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  mealImage: {
    width: 80,
    height: 80,
  },
  mealImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: Colors.backgroundLight,
  },
  mealInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: Colors.backgroundLight,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 8,
  },
  pickForMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
    alignSelf: 'center',
  },
  pickForMeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.white,
    marginLeft: 4,
  },
  generatingText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
});