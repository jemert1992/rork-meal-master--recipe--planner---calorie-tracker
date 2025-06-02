import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react-native';
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
    generateMealPlan,
    isRecipeSuitable
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
  const [showDietaryWarning, setShowDietaryWarning] = useState(false);

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
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0
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

  // Check if the current meal plan meets dietary requirements
  useEffect(() => {
    if (Object.keys(dayPlan).length === 0 || !profile.dietType || profile.dietType === 'any') {
      setShowDietaryWarning(false);
      return;
    }

    const checkMeal = (meal: any) => {
      if (!meal?.recipeId) return true;
      const recipe = recipes.find(r => r.id === meal.recipeId);
      if (!recipe) return true;
      return isRecipeSuitable(
        recipe, 
        profile.dietType, 
        profile.allergies, 
        profile.excludedIngredients
      );
    };

    const breakfastOk = !dayPlan.breakfast || checkMeal(dayPlan.breakfast);
    const lunchOk = !dayPlan.lunch || checkMeal(dayPlan.lunch);
    const dinnerOk = !dayPlan.dinner || checkMeal(dayPlan.dinner);
    const snacksOk = !dayPlan.snacks || dayPlan.snacks.every(checkMeal);

    setShowDietaryWarning(!(breakfastOk && lunchOk && dinnerOk && snacksOk));
  }, [dayPlan, profile, recipes, isRecipeSuitable]);

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
    
    // Apply user dietary preferences, allergies, and excluded ingredients
    if (profile.dietType && profile.dietType !== 'any') {
      availableRecipes = availableRecipes.filter(recipe => 
        isRecipeSuitable(
          recipe, 
          profile.dietType, 
          profile.allergies, 
          profile.excludedIngredients
        )
      );
    } else if (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) {
      // Fallback to old dietary preferences if dietType is not set
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
  }, [dayPlan, recipes, profile, isRecipeSuitable]);

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
      
      // Apply user dietary preferences, allergies, and excluded ingredients
      if (profile.dietType && profile.dietType !== 'any') {
        const filteredRecipes = recipes.filter(recipe => 
          isRecipeSuitable(
            recipe, 
            profile.dietType, 
            profile.allergies, 
            profile.excludedIngredients
          )
        );
        
        // Only use filtered recipes if we have enough
        if (filteredRecipes.length >= 5) {
          recipesToUse = filteredRecipes;
        } else {
          Alert.alert(
            'Limited Recipe Selection',
            `Only ${filteredRecipes.length} recipes match your dietary preferences. Using all available recipes instead.`,
            [{ text: 'OK' }]
          );
        }
      } else if (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) {
        // Fallback to old dietary preferences if dietType is not set
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

  // Calculate nutrition goal progress
  const calorieProgress = profile.calorieGoal ? (dailyNutrition.calories / profile.calorieGoal) * 100 : 0;
  const proteinProgress = profile.proteinGoal ? (dailyNutrition.protein / profile.proteinGoal) * 100 : 0;
  const carbsProgress = profile.carbsGoal ? (dailyNutrition.carbs / profile.carbsGoal) * 100 : 0;
  const fatProgress = profile.fatGoal ? (dailyNutrition.fat / profile.fatGoal) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Plan</Text>
        <Text style={styles.subtitle}>Plan your meals for the day</Text>
      </View>

      <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />

      <View style={styles.actionsContainer}>
        <View style={styles.nutritionSummary}>
          <Text style={styles.calorieText}>
            {dailyNutrition.calories} 
            {profile.calorieGoal ? ` / ${profile.calorieGoal}` : ''} calories
          </Text>
          <Text style={styles.macroText}>
            P: {dailyNutrition.protein}{profile.proteinGoal ? `/${profile.proteinGoal}` : ''}g • 
            C: {dailyNutrition.carbs}{profile.carbsGoal ? `/${profile.carbsGoal}` : ''}g • 
            F: {dailyNutrition.fat}{profile.fatGoal ? `/${profile.fatGoal}` : ''}g
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
            calorieGoal={profile.calorieGoal}
            proteinGoal={profile.proteinGoal}
            carbsGoal={profile.carbsGoal}
            fatGoal={profile.fatGoal}
          />
        </View>
      )}

      {showDietaryWarning && (
        <View style={styles.warningContainer}>
          <AlertCircle size={16} color={Colors.warning} />
          <Text style={styles.warningText}>
            Some meals may not match your dietary preferences ({profile.dietType})
          </Text>
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
                      {recipe.tags.length > 0 && (
                        <View style={styles.tagContainer}>
                          {recipe.tags.slice(0, 3).map((tag, index) => (
                            <Text key={index} style={styles.tagText}>
                              {tag}
                            </Text>
                          ))}
                        </View>
                      )}
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
        
        {/* Nutrition Goals Section */}
        {profile.calorieGoal && (
          <View style={styles.nutritionGoalsContainer}>
            <Text style={styles.sectionTitle}>Nutrition Goals</Text>
            
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalLabel}>Calories</Text>
                <Text style={styles.goalValue}>
                  {dailyNutrition.calories} / {profile.calorieGoal}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${Math.min(calorieProgress, 100)}%` },
                    calorieProgress > 100 ? styles.progressBarExceeded : null
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalLabel}>Protein</Text>
                <Text style={styles.goalValue}>
                  {dailyNutrition.protein}g / {profile.proteinGoal}g
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    styles.progressBarProtein,
                    { width: `${Math.min(proteinProgress, 100)}%` },
                    proteinProgress > 100 ? styles.progressBarExceeded : null
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalLabel}>Carbs</Text>
                <Text style={styles.goalValue}>
                  {dailyNutrition.carbs}g / {profile.carbsGoal}g
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    styles.progressBarCarbs,
                    { width: `${Math.min(carbsProgress, 100)}%` },
                    carbsProgress > 100 ? styles.progressBarExceeded : null
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.goalItem}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalLabel}>Fat</Text>
                <Text style={styles.goalValue}>
                  {dailyNutrition.fat}g / {profile.fatGoal}g
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    styles.progressBarFat,
                    { width: `${Math.min(fatProgress, 100)}%` },
                    fatProgress > 100 ? styles.progressBarExceeded : null
                  ]} 
                />
              </View>
            </View>
          </View>
        )}
        
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBg || '#FFF3CD',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: Colors.warning || '#856404',
    marginLeft: 8,
    flex: 1,
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
    marginBottom: 24,
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
  tagContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tagText: {
    fontSize: 10,
    color: Colors.textLight,
    backgroundColor: Colors.backgroundLight || '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  nutritionGoalsContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  goalItem: {
    marginTop: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  goalLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  goalValue: {
    fontSize: 14,
    color: Colors.textLight,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.backgroundLight || '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressBarProtein: {
    backgroundColor: '#4CAF50', // Green
  },
  progressBarCarbs: {
    backgroundColor: '#2196F3', // Blue
  },
  progressBarFat: {
    backgroundColor: '#FF9800', // Orange
  },
  progressBarExceeded: {
    backgroundColor: Colors.warning || '#FFC107',
  },
  bottomPadding: {
    height: 80, // Extra padding at the bottom
  },
});