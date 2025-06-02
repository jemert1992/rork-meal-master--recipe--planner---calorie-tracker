import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRecipeStore } from '@/store/recipeStore';
import { useUserStore } from '@/store/userStore';
import DateSelector from '@/components/DateSelector';
import MealPlanItem from '@/components/MealPlanItem';
import NutritionBar from '@/components/NutritionBar';
import Colors from '@/constants/colors';
import { DailyMeals, Recipe } from '@/types';

export default function MealPlanScreen() {
  const router = useRouter();
  const { 
    mealPlan, 
    addMeal, 
    removeMeal, 
    addSnack, 
    removeSnack, 
    clearDay, 
    generateMealPlan 
  } = useMealPlanStore();
  const { recipes, isLoading } = useRecipeStore();
  const { profile } = useUserStore();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyNutrition, setDailyNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mealSuggestions, setMealSuggestions] = useState<typeof recipes>([]);

  const dateString = selectedDate.toISOString().split('T')[0];
  const dayPlan = mealPlan[dateString] || {};

  // Memoize the addNutritionFromMeal function to prevent recreating it on every render
  const addNutritionFromMeal = useCallback((meal: any, recipeList: Recipe[]) => {
    if (meal?.recipeId) {
      const recipe = recipeList.find(r => r.id === meal.recipeId);
      if (recipe) {
        return {
          calories: recipe.calories || 0,
          protein: recipe.protein || 0,
          carbs: recipe.carbs || 0,
          fat: recipe.fat || 0
        };
      }
    } else if (meal?.calories) {
      return {
        calories: meal.calories || 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
    }
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }, []);

  // Calculate daily nutrition whenever dayPlan or recipes change
  useEffect(() => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    if (dayPlan.breakfast) {
      const nutrition = addNutritionFromMeal(dayPlan.breakfast, recipes);
      totalCalories += nutrition.calories;
      totalProtein += nutrition.protein;
      totalCarbs += nutrition.carbs;
      totalFat += nutrition.fat;
    }
    
    if (dayPlan.lunch) {
      const nutrition = addNutritionFromMeal(dayPlan.lunch, recipes);
      totalCalories += nutrition.calories;
      totalProtein += nutrition.protein;
      totalCarbs += nutrition.carbs;
      totalFat += nutrition.fat;
    }
    
    if (dayPlan.dinner) {
      const nutrition = addNutritionFromMeal(dayPlan.dinner, recipes);
      totalCalories += nutrition.calories;
      totalProtein += nutrition.protein;
      totalCarbs += nutrition.carbs;
      totalFat += nutrition.fat;
    }
    
    if (dayPlan.snacks) {
      dayPlan.snacks.forEach(snack => {
        const nutrition = addNutritionFromMeal(snack, recipes);
        totalCalories += nutrition.calories;
        totalProtein += nutrition.protein;
        totalCarbs += nutrition.carbs;
        totalFat += nutrition.fat;
      });
    }

    setDailyNutrition({
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat
    });
  }, [dayPlan, recipes, addNutritionFromMeal]);

  // Memoize the function to generate meal suggestions
  const generateMealSuggestions = useCallback(() => {
    if (recipes.length === 0) return [];
    
    const suggestions = [];
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    const existingMealIds = new Set<string>();
    
    // Add existing recipe IDs to the set
    if (dayPlan.breakfast?.recipeId) existingMealIds.add(dayPlan.breakfast.recipeId);
    if (dayPlan.lunch?.recipeId) existingMealIds.add(dayPlan.lunch.recipeId);
    if (dayPlan.dinner?.recipeId) existingMealIds.add(dayPlan.dinner.recipeId);
    
    // Filter recipes by dietary preferences if available
    let availableRecipes = recipes.filter(recipe => !existingMealIds.has(recipe.id));
    
    if (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) {
      const filteredRecipes = availableRecipes.filter(recipe => 
        profile.dietaryPreferences?.some(pref => 
          recipe.tags.includes(pref)
        )
      );
      
      // If no recipes match the preferences, fall back to all recipes
      if (filteredRecipes.length > 0) {
        availableRecipes = filteredRecipes;
      }
    }
    
    // Get suggestions for each meal type that's missing
    for (const mealType of mealTypes) {
      // Use type assertion to tell TypeScript this is a valid key
      if (!dayPlan[mealType as keyof DailyMeals]) {
        // Filter recipes by tags that match the meal type
        const typeRecipes = availableRecipes.filter(recipe => 
          recipe.tags.includes(mealType) || 
          (mealType === 'breakfast' && recipe.tags.some(tag => ['breakfast', 'brunch', 'morning'].includes(tag))) ||
          (mealType === 'lunch' && recipe.tags.some(tag => ['lunch', 'salad', 'sandwich', 'light'].includes(tag))) ||
          (mealType === 'dinner' && recipe.tags.some(tag => ['dinner', 'main', 'supper', 'entree'].includes(tag)))
        );
        
        // If we have recipes that match the meal type, add them to suggestions
        if (typeRecipes.length > 0) {
          suggestions.push(...typeRecipes.slice(0, 2));
        } else if (availableRecipes.length > 0) {
          // Otherwise, just add some random recipes
          const randomRecipes = [...availableRecipes]
            .sort(() => 0.5 - Math.random())
            .slice(0, 2);
          suggestions.push(...randomRecipes);
        }
      }
    }
    
    // Limit to 6 suggestions and remove duplicates
    const uniqueSuggestions = [...new Map(suggestions.map(item => [item.id, item])).values()];
    return uniqueSuggestions.slice(0, 6);
  }, [dayPlan, recipes, profile.dietaryPreferences]);

  // Update meal suggestions only when showSuggestions changes to true
  useEffect(() => {
    if (showSuggestions) {
      const suggestions = generateMealSuggestions();
      setMealSuggestions(suggestions);
    }
  }, [showSuggestions, generateMealSuggestions]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setShowSuggestions(false);
  };

  const handleAddMeal = (mealType: string) => {
    router.push(`/add-meal/${dateString}?mealType=${mealType}`);
  };

  const handleRemoveMeal = (mealType: string) => {
    removeMeal(dateString, mealType);
  };

  const handleAddSnack = () => {
    router.push(`/add-meal/${dateString}?mealType=snack`);
  };

  const handleRemoveSnack = (index: number) => {
    removeSnack(dateString, index);
  };

  const handleClearDay = () => {
    Alert.alert(
      'Clear Day',
      'Are you sure you want to clear all meals for this day?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive', 
          onPress: () => {
            clearDay(dateString);
            setShowSuggestions(false);
          }
        },
      ]
    );
  };

  const handleGenerateMealPlan = async () => {
    setIsGenerating(true);
    try {
      // Filter recipes by dietary preferences if available
      let recipesToUse = [...recipes];
      
      if (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) {
        const filteredRecipes = recipes.filter(recipe => 
          profile.dietaryPreferences?.some(pref => 
            recipe.tags.includes(pref)
          )
        );
        
        // Only use filtered recipes if we have enough
        if (filteredRecipes.length >= 5) {
          recipesToUse = filteredRecipes;
        }
      }
      
      await generateMealPlan(dateString, recipesToUse);
      Alert.alert('Success', 'Meal plan generated successfully!');
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
  };

  const handleAddSuggestion = (recipeId: string, recipeName: string, mealType: string) => {
    // Find the first available meal slot
    let targetMealType = mealType;
    
    if (dayPlan.breakfast && dayPlan.lunch && dayPlan.dinner) {
      // All slots filled, ask user which one to replace
      Alert.alert(
        'All Meals Filled',
        'Which meal would you like to replace?',
        [
          { text: 'Breakfast', onPress: () => addMeal(dateString, 'breakfast', { recipeId, name: recipeName }) },
          { text: 'Lunch', onPress: () => addMeal(dateString, 'lunch', { recipeId, name: recipeName }) },
          { text: 'Dinner', onPress: () => addMeal(dateString, 'dinner', { recipeId, name: recipeName }) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    
    // Find the first empty slot if no specific meal type is provided
    if (!mealType || mealType === 'any') {
      if (!dayPlan.breakfast) targetMealType = 'breakfast';
      else if (!dayPlan.lunch) targetMealType = 'lunch';
      else if (!dayPlan.dinner) targetMealType = 'dinner';
      else targetMealType = 'snack';
    }
    
    if (targetMealType === 'snack') {
      addSnack(dateString, { recipeId, name: recipeName });
    } else {
      addMeal(dateString, targetMealType, { recipeId, name: recipeName });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Plan</Text>
        <Text style={styles.subtitle}>Plan your meals for the day</Text>
      </View>

      <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />

      <View style={styles.actionsContainer}>
        <View style={styles.nutritionSummary}>
          <Text style={styles.calorieText}>{dailyNutrition.calories} calories</Text>
          <Text style={styles.macroText}>
            P: {dailyNutrition.protein}g • C: {dailyNutrition.carbs}g • F: {dailyNutrition.fat}g
          </Text>
        </View>
        
        <View style={styles.buttonGroup}>
          <Pressable 
            style={[styles.actionButton, styles.generateButton]} 
            onPress={handleGenerateMealPlan}
            disabled={isGenerating || isLoading}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <RefreshCw size={16} color={Colors.white} />
                <Text style={styles.generateButtonText}>Generate</Text>
              </>
            )}
          </Pressable>
          
          <Pressable style={styles.clearButton} onPress={handleClearDay}>
            <Trash2 size={16} color={Colors.textLight} />
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      {dailyNutrition.calories > 0 && (
        <View style={styles.nutritionBarContainer}>
          <NutritionBar
            calories={dailyNutrition.calories}
            protein={dailyNutrition.protein}
            carbs={dailyNutrition.carbs}
            fat={dailyNutrition.fat}
          />
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <MealPlanItem
          mealType="breakfast"
          meal={dayPlan.breakfast}
          date={dateString}
          onRemove={() => handleRemoveMeal('breakfast')}
          onAdd={() => handleAddMeal('breakfast')}
        />

        <MealPlanItem
          mealType="lunch"
          meal={dayPlan.lunch}
          date={dateString}
          onRemove={() => handleRemoveMeal('lunch')}
          onAdd={() => handleAddMeal('lunch')}
        />

        <MealPlanItem
          mealType="dinner"
          meal={dayPlan.dinner}
          date={dateString}
          onRemove={() => handleRemoveMeal('dinner')}
          onAdd={() => handleAddMeal('dinner')}
        />

        <View style={styles.snacksContainer}>
          <View style={styles.snacksHeader}>
            <Text style={styles.sectionTitle}>Snacks</Text>
            <Pressable style={styles.addButton} onPress={handleAddSnack}>
              <Plus size={16} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Snack</Text>
            </Pressable>
          </View>

          {dayPlan.snacks && dayPlan.snacks.length > 0 ? (
            dayPlan.snacks.map((snack, index) => (
              <MealPlanItem
                key={index}
                mealType={`snack ${index + 1}`}
                meal={snack}
                date={dateString}
                onRemove={() => handleRemoveSnack(index)}
                onAdd={() => {}}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No snacks added yet</Text>
          )}
        </View>

        {/* Meal Suggestions Section */}
        <View style={styles.suggestionsContainer}>
          <Pressable 
            style={styles.suggestionsHeader} 
            onPress={handleToggleSuggestions}
          >
            <Text style={styles.sectionTitle}>Meal Suggestions</Text>
            {showSuggestions ? (
              <ChevronUp size={20} color={Colors.text} />
            ) : (
              <ChevronDown size={20} color={Colors.text} />
            )}
          </Pressable>

          {showSuggestions && (
            <View style={styles.suggestionsList}>
              {mealSuggestions.length > 0 ? (
                mealSuggestions.map((recipe) => (
                  <Pressable 
                    key={recipe.id}
                    style={styles.suggestionItem}
                    onPress={() => handleAddSuggestion(recipe.id, recipe.name, 'any')}
                  >
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionName}>{recipe.name}</Text>
                      <Text style={styles.suggestionCalories}>{recipe.calories} calories</Text>
                    </View>
                    <Plus size={16} color={Colors.primary} />
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyText}>No suggestions available</Text>
              )}
            </View>
          )}
        </View>
        
        {/* Add extra padding at the bottom to ensure everything is scrollable */}
        <View style={styles.bottomPadding} />
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  nutritionSummary: {
    flex: 1,
  },
  calorieText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  macroText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  generateButton: {
    backgroundColor: Colors.primary,
  },
  generateButtonText: {
    color: Colors.white,
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 4,
  },
  nutritionBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 120, // Add extra padding to ensure content is scrollable
  },
  snacksContainer: {
    marginBottom: 20,
  },
  snacksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  suggestionsContainer: {
    marginBottom: 40,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionsList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  suggestionCalories: {
    fontSize: 12,
    color: Colors.primary,
  },
  bottomPadding: {
    height: 80, // Extra padding at the bottom
  },
});