import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Trash2, Plus, Calendar } from 'lucide-react-native';
import DateSelector from '@/components/DateSelector';
import MealPlanItem from '@/components/MealPlanItem';
import NutritionBar from '@/components/NutritionBar';
import Colors from '@/constants/colors';

export default function TutorialMealPlanScreen() {
  const mockDate = new Date();
  const mockDateString = mockDate.toISOString().split('T')[0];

  // Mock meal plan data
  const mockMealPlan = {
    breakfast: {
      recipeId: '1',
      name: 'Avocado Toast with Eggs',
      calories: 420,
      protein: 18,
      carbs: 32,
      fat: 24
    },
    lunch: {
      recipeId: '2', 
      name: 'Grilled Chicken Salad',
      calories: 380,
      protein: 35,
      carbs: 15,
      fat: 18
    },
    dinner: null // Empty to show add functionality
  };

  const mockNutrition = {
    calories: 800,
    protein: 53,
    carbs: 47,
    fat: 42
  };

  const mockProfile = {
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 250,
    fatGoal: 70
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Plan</Text>
        <Text style={styles.subtitle}>Plan your meals for the day</Text>
      </View>

      <DateSelector selectedDate={mockDate} onDateChange={() => {}} />

      <View style={styles.actionsContainer}>
        <View style={styles.nutritionSummary}>
          <Text style={styles.calorieText}>
            {mockNutrition.calories} / {mockProfile.calorieGoal} calories
          </Text>
          <Text style={styles.macroText}>
            P: {mockNutrition.protein}/{mockProfile.proteinGoal}g • 
            C: {mockNutrition.carbs}/{mockProfile.carbsGoal}g • 
            F: {mockNutrition.fat}/{mockProfile.fatGoal}g
          </Text>
        </View>
        
        <View style={styles.buttonGroup}>
          <Pressable style={[styles.actionButton, styles.generateButton]}>
            <RefreshCw size={16} color={Colors.white} />
            <Text style={styles.generateButtonText}>Generate</Text>
          </Pressable>
          
          <Pressable style={styles.clearButton}>
            <Trash2 size={16} color={Colors.textLight} />
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.nutritionBarContainer}>
        <NutritionBar
          calories={mockNutrition.calories}
          protein={mockNutrition.protein}
          carbs={mockNutrition.carbs}
          fat={mockNutrition.fat}
          calorieGoal={mockProfile.calorieGoal}
          proteinGoal={mockProfile.proteinGoal}
          carbsGoal={mockProfile.carbsGoal}
          fatGoal={mockProfile.fatGoal}
        />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <MealPlanItem
          mealType="breakfast"
          meal={mockMealPlan.breakfast}
          date={mockDateString}
          onRemove={() => {}}
          onAdd={() => {}}
          hasAlternatives={false}
        />

        <MealPlanItem
          mealType="lunch"
          meal={mockMealPlan.lunch}
          date={mockDateString}
          onRemove={() => {}}
          onAdd={() => {}}
          hasAlternatives={true}
        />

        <MealPlanItem
          mealType="dinner"
          meal={mockMealPlan.dinner}
          date={mockDateString}
          onRemove={() => {}}
          onAdd={() => {}}
          hasAlternatives={false}
        />

        {/* Weekly Planning Preview */}
        <View style={styles.weeklyPlanContainer}>
          <Text style={styles.sectionTitle}>Weekly Planning</Text>
          <Text style={styles.sectionSubtitle}>Plan multiple days at once</Text>
          
          <View style={styles.weeklyGrid}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <View key={day} style={[styles.dayCard, index === 2 && styles.dayCardActive]}>
                <Text style={[styles.dayLabel, index === 2 && styles.dayLabelActive]}>{day}</Text>
                <View style={[styles.dayIndicator, index === 2 && styles.dayIndicatorActive]} />
              </View>
            ))}
          </View>
        </View>

        {/* Smart Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.sectionTitle}>Smart Suggestions</Text>
          <Text style={styles.sectionSubtitle}>AI-powered meal recommendations</Text>
          
          <View style={styles.suggestionsList}>
            <View style={styles.suggestionItem}>
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionName}>Mediterranean Bowl</Text>
                <Text style={styles.suggestionCalories}>450 calories</Text>
                <View style={styles.suggestionDetails}>
                  <Text style={styles.mealTypeTag}>Dinner</Text>
                  <Text style={styles.tagText}>healthy</Text>
                  <Text style={styles.tagText}>vegetarian</Text>
                </View>
              </View>
              <Plus size={16} color={Colors.primary} />
            </View>
            
            <View style={styles.suggestionItem}>
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionName}>Protein Smoothie</Text>
                <Text style={styles.suggestionCalories}>320 calories</Text>
                <View style={styles.suggestionDetails}>
                  <Text style={styles.mealTypeTag}>Breakfast</Text>
                  <Text style={styles.tagText}>quick</Text>
                  <Text style={styles.tagText}>high-protein</Text>
                </View>
              </View>
              <Plus size={16} color={Colors.primary} />
            </View>
          </View>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    marginBottom: 0,
    fontWeight: '400',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    marginTop: 8,
  },
  nutritionSummary: {
    flex: 1,
  },
  calorieText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  macroText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 12,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  generateButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  clearButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  nutritionBarContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  weeklyPlanContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontWeight: '400',
  },
  weeklyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCard: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
  },
  dayCardActive: {
    backgroundColor: Colors.primaryLight,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dayLabelActive: {
    color: Colors.primary,
  },
  dayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
  },
  dayIndicatorActive: {
    backgroundColor: Colors.primary,
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  suggestionCalories: {
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 6,
    fontWeight: '600',
  },
  suggestionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeTag: {
    fontSize: 10,
    color: Colors.white,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    overflow: 'hidden',
  },
  tagText: {
    fontSize: 10,
    color: Colors.textLight,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
});