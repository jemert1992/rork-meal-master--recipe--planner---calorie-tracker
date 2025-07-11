import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Filter, Info, X } from 'lucide-react-native';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRecipeStore } from '@/store/recipeStore';
import { useUserStore } from '@/store/userStore';
import DateSelector from '@/components/DateSelector';
import MealPlanItem from '@/components/MealPlanItem';
import NutritionBar from '@/components/NutritionBar';
import Colors from '@/constants/colors';
import { DailyMeals, Recipe, RecipeFilters } from '@/types';
import * as firebaseService from '@/services/firebaseService';

export default function MealPlanScreen() {
  const router = useRouter();
  const { 
    mealPlan, 
    addMeal, 
    removeMeal, 
    clearDay, 
    generateMealPlan,
    isRecipeSuitable,
    isRecipeUsedInMealPlan,
    updateWeeklyUsedRecipeIds,
    lastGenerationError,
    generationSuggestions,
    clearGenerationError
  } = useMealPlanStore();
  const { recipes, isLoading, useFirestore } = useRecipeStore();
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
  const [isLoadingFirestoreRecipes, setIsLoadingFirestoreRecipes] = useState(false);
  const [firestoreRecipes, setFirestoreRecipes] = useState<Recipe[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [alternativesAvailable, setAlternativesAvailable] = useState<{
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  }>({
    breakfast: false,
    lunch: false,
    dinner: false
  });

  const dateString = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);
  const dayPlan = useMemo(() => mealPlan[dateString] || {}, [mealPlan, dateString]);

  // Show error modal when generation error occurs
  useEffect(() => {
    if (lastGenerationError) {
      setShowErrorModal(true);
    }
  }, [lastGenerationError]);

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

    setShowDietaryWarning(!(breakfastOk && lunchOk && dinnerOk));
  }, [dayPlan, profile.dietType, profile.allergies, profile.excludedIngredients, recipes]);

  // Load recipes from Firestore when needed
  useEffect(() => {
    let isMounted = true;
    
    const loadFirestoreRecipes = async () => {
      if (useFirestore && showSuggestions && !isLoadingFirestoreRecipes) {
        setIsLoadingFirestoreRecipes(true);
        try {
          // Get weekly used recipe IDs to avoid suggesting already used recipes
          updateWeeklyUsedRecipeIds(
            new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 3).toISOString().split('T')[0],
            new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 3).toISOString().split('T')[0]
          );
          
          // Create filters based on user preferences
          const filters: RecipeFilters = {};
          
          if (profile.dietType && profile.dietType !== 'any') {
            filters.dietaryPreference = profile.dietType;
          }
          
          if (profile.fitnessGoals && profile.fitnessGoals.length > 0) {
            filters.fitnessGoal = profile.fitnessGoals[0];
          }
          
          // Get recipes from Firestore
          const { recipes: firestoreRecipes } = await firebaseService.getRecipesFromFirestore(filters, 20);
          
          if (isMounted) {
            setFirestoreRecipes(firestoreRecipes);
          }
        } catch (error) {
          console.error('Error loading recipes from Firestore:', error);
        } finally {
          if (isMounted) {
            setIsLoadingFirestoreRecipes(false);
          }
        }
      }
    };
    
    loadFirestoreRecipes();
    
    return () => {
      isMounted = false;
    };
  }, [useFirestore, showSuggestions, selectedDate, profile.dietType, profile.fitnessGoals]);

  // Check if alternatives are available for each meal type
  useEffect(() => {
    let isMounted = true;
    
    const checkAlternatives = async () => {
      if (!useFirestore || Object.keys(dayPlan).length === 0) {
        return;
      }
      
      const newAlternativesAvailable = {
        breakfast: false,
        lunch: false,
        dinner: false
      };
      
      try {
        if (dayPlan.breakfast?.recipeId) {
          const alternatives = await firebaseService.getAlternativeRecipes(
            'breakfast',
            dayPlan.breakfast.recipeId,
            {
              dietType: profile.dietType,
              allergies: profile.allergies,
              excludedIngredients: profile.excludedIngredients
            },
            1
          );
          newAlternativesAvailable.breakfast = alternatives.length > 0;
        }
        
        if (dayPlan.lunch?.recipeId) {
          const alternatives = await firebaseService.getAlternativeRecipes(
            'lunch',
            dayPlan.lunch.recipeId,
            {
              dietType: profile.dietType,
              allergies: profile.allergies,
              excludedIngredients: profile.excludedIngredients
            },
            1
          );
          newAlternativesAvailable.lunch = alternatives.length > 0;
        }
        
        if (dayPlan.dinner?.recipeId) {
          const alternatives = await firebaseService.getAlternativeRecipes(
            'dinner',
            dayPlan.dinner.recipeId,
            {
              dietType: profile.dietType,
              allergies: profile.allergies,
              excludedIngredients: profile.excludedIngredients
            },
            1
          );
          newAlternativesAvailable.dinner = alternatives.length > 0;
        }
        
        if (isMounted) {
          setAlternativesAvailable(newAlternativesAvailable);
        }
      } catch (error) {
        console.error('Error checking alternatives:', error);
      }
    };
    
    checkAlternatives();
    
    return () => {
      isMounted = false;
    };
  }, [dayPlan, profile.dietType, profile.allergies, profile.excludedIngredients, useFirestore]);

  // Memoize the function to generate meal suggestions
  const generateMealSuggestions = useCallback(() => {
    // Use Firestore recipes if available, otherwise use local recipes
    const recipesToUse = useFirestore && firestoreRecipes.length > 0 ? firestoreRecipes : recipes;
    
    if (recipesToUse.length === 0) return [];
    
    const suggestions = [];
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    
    // Filter recipes by dietary preferences if available
    let availableRecipes = recipesToUse.filter(recipe => !isRecipeUsedInMealPlan(recipe.id));
    
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
          recipe.mealType === mealType ||
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
  }, [dayPlan, recipes, firestoreRecipes, profile.dietType, profile.allergies, profile.excludedIngredients, profile.dietaryPreferences, useFirestore]);

  // Update meal suggestions only when showSuggestions changes to true
  useEffect(() => {
    if (showSuggestions && !isLoadingFirestoreRecipes) {
      const suggestions = generateMealSuggestions();
      setMealSuggestions(suggestions);
    }
  }, [showSuggestions, generateMealSuggestions, isLoadingFirestoreRecipes]);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowSuggestions(false);
  }, []);

  const handleAddMeal = useCallback((mealType: string) => {
    router.push(`/add-meal/${dateString}?mealType=${mealType}`);
  }, [router, dateString]);

  const handleRemoveMeal = useCallback((mealType: string) => {
    removeMeal(dateString, mealType as 'breakfast' | 'lunch' | 'dinner');
  }, [removeMeal, dateString]);

  const handleClearDay = useCallback(() => {
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
  }, [clearDay, dateString]);

  const handleGenerateMealPlan = useCallback(async () => {
    setIsGenerating(true);
    try {
      // Update weekly used recipe IDs
      updateWeeklyUsedRecipeIds(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 3).toISOString().split('T')[0],
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 3).toISOString().split('T')[0]
      );
      
      if (useFirestore) {
        // Generate meal plan using Firestore
        const result = await generateMealPlan(dateString, []);
        
        if (result.success) {
          if (result.generatedMeals.length === 0) {
            Alert.alert(
              'No Changes Needed',
              'Your meal plan is already complete for this day.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Success',
              `Generated ${result.generatedMeals.length} meal(s) for your plan!`,
              [{ text: 'OK' }]
            );
          }
        } else {
          // Error will be shown in the error modal
          setShowErrorModal(true);
        }
      } else {
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
        
        const result = await generateMealPlan(dateString, recipesToUse);
        
        if (result.success) {
          if (result.generatedMeals.length === 0) {
            Alert.alert(
              'No Changes Needed',
              'Your meal plan is already complete for this day.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Success',
              `Generated ${result.generatedMeals.length} meal(s) for your plan!`,
              [{ text: 'OK' }]
            );
          }
        } else {
          // Error will be shown in the error modal
          setShowErrorModal(true);
        }
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert(
        'Error',
        'Failed to generate meal plan. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  }, [selectedDate, useFirestore, dateString, recipes, profile]);

  const handleToggleSuggestions = useCallback(() => {
    setShowSuggestions(!showSuggestions);
  }, [showSuggestions]);

  const handleAddSuggestion = useCallback((recipeId: string, recipeName: string, mealType: string) => {
    // Check if recipe is already used in meal plan
    if (isRecipeUsedInMealPlan(recipeId)) {
      Alert.alert(
        'Recipe Already Used',
        'This recipe is already used in your meal plan. Please choose a different recipe.',
        [{ text: 'OK' }]
      );
      return;
    }
    
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
      else return; // No empty slots
    }
    
    addMeal(dateString, targetMealType as 'breakfast' | 'lunch' | 'dinner', { recipeId, name: recipeName });
  }, [dayPlan, dateString]);

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
            accessibilityLabel="Generate meal plan"
            accessibilityHint="Automatically generates a meal plan for the selected day"
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
          
          <Pressable 
            style={styles.clearButton} 
            onPress={handleClearDay}
            accessibilityLabel="Clear day"
            accessibilityHint="Removes all meals for the selected day"
          >
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
          hasAlternatives={alternativesAvailable.breakfast}
        />

        <MealPlanItem
          mealType="lunch"
          meal={dayPlan.lunch}
          date={dateString}
          onRemove={() => handleRemoveMeal('lunch')}
          onAdd={() => handleAddMeal('lunch')}
          hasAlternatives={alternativesAvailable.lunch}
        />

        <MealPlanItem
          mealType="dinner"
          meal={dayPlan.dinner}
          date={dateString}
          onRemove={() => handleRemoveMeal('dinner')}
          onAdd={() => handleAddMeal('dinner')}
          hasAlternatives={alternativesAvailable.dinner}
        />

        {/* Meal Suggestions Section */}
        <View style={styles.suggestionsContainer}>
          <Pressable 
            style={styles.suggestionsHeader} 
            onPress={handleToggleSuggestions}
            accessibilityLabel={showSuggestions ? "Hide meal suggestions" : "Show meal suggestions"}
            accessibilityRole="button"
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
              {isLoadingFirestoreRecipes ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading suggestions...</Text>
                </View>
              ) : mealSuggestions.length > 0 ? (
                mealSuggestions.map((recipe) => (
                  <Pressable 
                    key={recipe.id}
                    style={styles.suggestionItem}
                    onPress={() => handleAddSuggestion(recipe.id, recipe.name, recipe.mealType || 'any')}
                    accessibilityLabel={`Add ${recipe.name} to meal plan`}
                    accessibilityHint={`${recipe.calories} calories, tags: ${recipe.tags.join(', ')}`}
                  >
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionName}>{recipe.name}</Text>
                      <Text style={styles.suggestionCalories}>{recipe.calories} calories</Text>
                      <View style={styles.suggestionDetails}>
                        {recipe.mealType && (
                          <Text style={styles.mealTypeTag}>
                            {recipe.mealType.charAt(0).toUpperCase() + recipe.mealType.slice(1)}
                          </Text>
                        )}
                        {recipe.tags.length > 0 && (
                          <View style={styles.tagContainer}>
                            {recipe.tags.slice(0, 3).map((tag, index) => (
                              <Text key={`${recipe.id}-tag-${index}`} style={styles.tagText}>
                                {tag}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                    <Plus size={16} color={Colors.primary} />
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No suggestions available</Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting your dietary preferences or adding more recipes to your collection
                  </Text>
                </View>
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

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => {
          setShowErrorModal(false);
          clearGenerationError();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <View style={styles.errorModalHeader}>
              <Info size={24} color={Colors.warning} />
              <Text style={styles.errorModalTitle}>Generation Issue</Text>
              <Pressable 
                onPress={() => {
                  setShowErrorModal(false);
                  clearGenerationError();
                }}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            <Text style={styles.errorModalMessage}>
              {lastGenerationError || "There was an issue generating your meal plan."}
            </Text>
            
            {generationSuggestions && generationSuggestions.length > 0 && (
              <View style={styles.suggestionsList}>
                <Text style={styles.suggestionsTitle}>Suggestions:</Text>
                {generationSuggestions.map((suggestion, index) => (
                  <View key={`suggestion-${index}`} style={styles.suggestionItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <Pressable 
              style={styles.errorModalButton}
              onPress={() => {
                setShowErrorModal(false);
                clearGenerationError();
              }}
            >
              <Text style={styles.errorModalButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  },
  generateButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  warningText: {
    fontSize: 15,
    color: Colors.warning,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingBottom: 120, // Add extra padding to ensure content is scrollable
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  suggestionsContainer: {
    marginBottom: 24,
    marginTop: 16,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagText: {
    fontSize: 10,
    color: Colors.textLight,
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
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
    backgroundColor: Colors.backgroundLight,
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
    backgroundColor: Colors.warning,
  },
  bottomPadding: {
    height: 80, // Extra padding at the bottom
  },
  // Error Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorModal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  errorModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  errorModalMessage: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 8,
    marginTop: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  errorModalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  errorModalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});