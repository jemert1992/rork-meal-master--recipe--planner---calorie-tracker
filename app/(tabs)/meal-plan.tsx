import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Trash2, RefreshCw, ChevronUp, AlertCircle, Info, X } from 'lucide-react-native';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRecipeStore } from '@/store/recipeStore';
import { useUserStore } from '@/store/userStore';
import DateSelector from '@/components/DateSelector';
import MealPlanItem from '@/components/MealPlanItem';
import NutritionBar from '@/components/NutritionBar';
import Colors from '@/constants/colors';
import { DailyMeals, Recipe, RecipeFilters } from '@/types';
import * as firebaseService from '@/services/firebaseService';

import { useTutorialRef } from '@/hooks/useTutorialRef';
import { AccessibilityUtils } from '@/utils/accessibility';

import { format, addDays } from 'date-fns';

export default function MealPlanScreen() {
  const router = useRouter();
  
  const mealPlanContentRef = useTutorialRef('meal-plan-content');
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
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyNutrition, setDailyNutrition] = useState<{ calories: number; protein: number; carbs: number; fat: number }>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [mealSuggestions, setMealSuggestions] = useState<typeof recipes>([]);
  const [showDietaryWarning, setShowDietaryWarning] = useState<boolean>(false);
  const [isLoadingFirestoreRecipes, setIsLoadingFirestoreRecipes] = useState<boolean>(false);
  const [firestoreRecipes, setFirestoreRecipes] = useState<Recipe[]>([]);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [alternativesAvailable, setAlternativesAvailable] = useState<{
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  }>({
    breakfast: false,
    lunch: false,
    dinner: false
  });

  const [showSuggestionsModal, setShowSuggestionsModal] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: 'info' | 'success' | 'error' }>({ visible: false, message: '', type: 'info' });
  const snackbarTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [confirmClearVisible, setConfirmClearVisible] = useState<boolean>(false);
  const [replaceMealModal, setReplaceMealModal] = useState<{ visible: boolean; recipeId?: string; recipeName?: string }>({ visible: false });

  const dateString = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  const dayPlan = useMemo<Partial<DailyMeals>>(() => mealPlan[dateString] || {}, [mealPlan, dateString]);

  useEffect(() => {
    if (lastGenerationError) {
      setShowErrorModal(true);
      try { (Platform as any)?.OS && console.log('Gen error:', lastGenerationError); } catch {}
    }
  }, [lastGenerationError]);

  const addNutritionFromMeal = useCallback((meal: any, recipeList: Recipe[]) => {
    const servings: number = meal?.servings ?? 1;
    if (meal?.recipeId) {
      const recipe = recipeList.find(r => r.id === meal.recipeId);
      if (recipe) {
        const factor = servings / Math.max(1, recipe.servings ?? 1);
        return {
          calories: Math.round((recipe.calories ?? 0) * factor),
          protein: Math.round((recipe.protein ?? 0) * factor),
          carbs: Math.round((recipe.carbs ?? 0) * factor),
          fat: Math.round((recipe.fat ?? 0) * factor)
        };
      }
    } else if (meal?.calories) {
      return {
        calories: Math.round((meal.calories ?? 0) * servings),
        protein: Math.round((meal.protein ?? 0) * servings),
        carbs: Math.round((meal.carbs ?? 0) * servings),
        fat: Math.round((meal.fat ?? 0) * servings)
      };
    }
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }, []);

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
  }, [dayPlan, profile.dietType, profile.allergies, profile.excludedIngredients, recipes, isRecipeSuitable]);

  useEffect(() => {
    let isMounted = true;
    const loadFirestoreRecipes = async () => {
      if (useFirestore && showSuggestions && !isLoadingFirestoreRecipes) {
        setIsLoadingFirestoreRecipes(true);
        try {
          updateWeeklyUsedRecipeIds(
            format(addDays(selectedDate, -3), 'yyyy-MM-dd'),
            format(addDays(selectedDate, 3), 'yyyy-MM-dd')
          );
          const filters: RecipeFilters = {} as RecipeFilters;
          if (profile.dietType && profile.dietType !== 'any') {
            (filters as any).dietaryPreference = profile.dietType;
          }
          if (profile.fitnessGoals && profile.fitnessGoals.length > 0) {
            (filters as any).fitnessGoal = profile.fitnessGoals[0];
          }
          const { recipes: fr } = await firebaseService.getRecipesFromFirestore(filters, 20);
          if (isMounted) {
            setFirestoreRecipes(fr);
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
  }, [useFirestore, showSuggestions, selectedDate, profile.dietType, profile.fitnessGoals, updateWeeklyUsedRecipeIds]);

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

  const generateMealSuggestions = useCallback(() => {
    const recipesToUse = useFirestore && firestoreRecipes.length > 0 ? firestoreRecipes : recipes;
    if (recipesToUse.length === 0) return [] as Recipe[];
    const suggestions: Recipe[] = [];
    const mealTypes: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner'];
    let availableRecipes = recipesToUse.filter(recipe => !isRecipeUsedInMealPlan(recipe.id));
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
      const filteredRecipes = availableRecipes.filter(recipe => 
        profile.dietaryPreferences?.some(pref => 
          recipe.tags.includes(pref as string)
        )
      );
      if (filteredRecipes.length > 0) {
        availableRecipes = filteredRecipes;
      }
    }
    for (const mealType of mealTypes) {
      if (!(dayPlan as any)[mealType]) {
        const typeRecipes = availableRecipes.filter(recipe => 
          recipe.mealType === mealType ||
          (mealType === 'breakfast' && recipe.tags.some(tag => ['breakfast', 'brunch', 'morning'].includes(tag))) ||
          (mealType === 'lunch' && recipe.tags.some(tag => ['lunch', 'salad', 'sandwich', 'light'].includes(tag))) ||
          (mealType === 'dinner' && recipe.tags.some(tag => ['dinner', 'main', 'supper', 'entree'].includes(tag)))
        );
        if (typeRecipes.length > 0) {
          suggestions.push(...typeRecipes.slice(0, 2));
        } else if (availableRecipes.length > 0) {
          const randomRecipes = [...availableRecipes]
            .sort(() => 0.5 - Math.random())
            .slice(0, 2);
          suggestions.push(...randomRecipes);
        }
      }
    }
    const uniqueSuggestions = [...new Map(suggestions.map(item => [item.id, item])).values()];
    return uniqueSuggestions.slice(0, 6);
  }, [dayPlan, recipes, firestoreRecipes, profile.dietType, profile.allergies, profile.excludedIngredients, profile.dietaryPreferences, useFirestore, isRecipeUsedInMealPlan, isRecipeSuitable]);

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
    setConfirmClearVisible(true);
  }, []);

  const showSnack = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    if (snackbarTimerRef.current) {
      clearTimeout(snackbarTimerRef.current);
    }
    setSnackbar({ visible: true, message, type });
    try {
      AccessibilityUtils.announceForAccessibility(message);
    } catch {}
    snackbarTimerRef.current = setTimeout(() => {
      setSnackbar(prev => ({ ...prev, visible: false }));
    }, 2400);
  }, []);

  const handleGenerateMealPlan = useCallback(async () => {
    setIsGenerating(true);
    try {
      updateWeeklyUsedRecipeIds(
        format(addDays(selectedDate, -3), 'yyyy-MM-dd'),
        format(addDays(selectedDate, 3), 'yyyy-MM-dd')
      );
      if (useFirestore) {
        const result = await generateMealPlan(dateString, []);
        if (result.success) {
          if (result.generatedMeals.length === 0) {
            showSnack('No changes needed — day already complete', 'info');
          } else {
            showSnack(`Generated ${result.generatedMeals.length} meal(s)`, 'success');
          }
        } else {
          setShowErrorModal(true);
        }
      } else {
        let recipesToUse = [...recipes];
        if (profile.dietType && profile.dietType !== 'any') {
          const filteredRecipes = recipes.filter(recipe => 
            isRecipeSuitable(
              recipe, 
              profile.dietType, 
              profile.allergies, 
              profile.excludedIngredients
            )
          );
          if (filteredRecipes.length >= 5) {
            recipesToUse = filteredRecipes;
          } else {
            showSnack(`Only ${filteredRecipes.length} recipes match. Using all recipes.`, 'info');
          }
        } else if (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) {
          const filteredRecipes = recipes.filter(recipe => 
            profile.dietaryPreferences?.some(pref => 
              recipe.tags.includes(pref as string)
            )
          );
          if (filteredRecipes.length >= 5) {
            recipesToUse = filteredRecipes;
          }
        }
        const result = await generateMealPlan(dateString, recipesToUse);
        if (result.success) {
          if (result.generatedMeals.length === 0) {
            showSnack('No changes needed — day already complete', 'info');
          } else {
            showSnack(`Generated ${result.generatedMeals.length} meal(s)`, 'success');
          }
        } else {
          setShowErrorModal(true);
        }
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      showSnack('Failed to generate meal plan. Try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedDate, useFirestore, dateString, recipes, profile, showSnack, updateWeeklyUsedRecipeIds, generateMealPlan, isRecipeSuitable]);

  const handleToggleSuggestions = useCallback(() => {
    setShowSuggestions(!showSuggestions);
  }, [showSuggestions]);

  const openSuggestionsModal = useCallback(() => {
    if (!showSuggestions) {
      setShowSuggestions(true);
    }
    setShowSuggestionsModal(true);
  }, [showSuggestions]);

  const closeSuggestionsModal = useCallback(() => {
    setShowSuggestionsModal(false);
  }, []);

  const handleAddSuggestion = useCallback((recipeId: string, recipeName: string, mealType: string) => {
    if (isRecipeUsedInMealPlan(recipeId)) {
      showSnack('Recipe already used in your plan', 'info');
      return;
    }
    let targetMealType = mealType;
    if (dayPlan.breakfast && dayPlan.lunch && dayPlan.dinner) {
      setReplaceMealModal({ visible: true, recipeId, recipeName });
      return;
    }
    if (!mealType || mealType === 'any') {
      if (!dayPlan.breakfast) targetMealType = 'breakfast';
      else if (!dayPlan.lunch) targetMealType = 'lunch';
      else if (!dayPlan.dinner) targetMealType = 'dinner';
      else return;
    }
    addMeal(dateString, targetMealType as 'breakfast' | 'lunch' | 'dinner', { recipeId, name: recipeName });
    showSnack('Added to your plan', 'success');
  }, [dayPlan, dateString, addMeal, isRecipeUsedInMealPlan, showSnack]);

  const calorieProgress = profile.calorieGoal ? (dailyNutrition.calories / profile.calorieGoal) * 100 : 0;
  const proteinProgress = profile.proteinGoal ? (dailyNutrition.protein / profile.proteinGoal) * 100 : 0;
  const carbsProgress = profile.carbsGoal ? (dailyNutrition.carbs / profile.carbsGoal) * 100 : 0;
  const fatProgress = profile.fatGoal ? (dailyNutrition.fat / profile.fatGoal) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']} testID="meal-plan-content">

      <View style={styles.header}>
        <Text style={styles.title}>Meal Plan</Text>
        <Text style={styles.subtitle}>Plan your meals for the day</Text>
      </View>

      <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />

      <View style={styles.actionsContainer} testID="actions-container">
        <View style={styles.nutritionSummary}>
          <Text style={styles.calorieText} numberOfLines={1}>
            {dailyNutrition.calories} 
            {profile.calorieGoal ? ` / ${profile.calorieGoal}` : ''} calories
          </Text>
          <Text style={styles.macroText} numberOfLines={1}>
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
            accessibilityRole="button"
            accessibilityLabel="Generate meal plan"
            accessibilityHint="Automatically generates a meal plan for the selected day"
            accessibilityState={{ disabled: isGenerating || isLoading }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="pick-for-me-button"
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <RefreshCw size={18} color={Colors.white} />
                <Text style={styles.generateButtonText}>Generate</Text>
              </>
            )}
          </Pressable>

          <Pressable 
            style={styles.clearButton} 
            onPress={openSuggestionsModal}
            accessibilityRole="button"
            accessibilityLabel="Browse suggestions"
            accessibilityHint="Open full-screen recipe suggestions"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="open-suggestions"
          >
            <ChevronUp size={18} color={Colors.primary} />
            <Text style={[styles.clearButtonText, { color: Colors.primary }]}>Suggestions</Text>
          </Pressable>
          
          <Pressable 
            style={styles.clearButton} 
            onPress={handleClearDay}
            accessibilityRole="button"
            accessibilityLabel="Clear day"
            accessibilityHint="Removes all meals for the selected day"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={18} color={Colors.textLight} />
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
        ref={mealPlanContentRef}
        style={styles.content} 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 240, flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        accessibilityRole="list"
        accessibilityLabel="Meal plan slots"
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

        <Modal
          animationType="slide"
          transparent={false}
          visible={showSuggestionsModal}
          onRequestClose={closeSuggestionsModal}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Pick a Recipe</Text>
              <Pressable style={styles.closeButton} onPress={closeSuggestionsModal} accessibilityRole="button" accessibilityLabel="Close suggestions" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} testID="close-suggestions-modal">
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false} accessibilityRole="list" accessibilityLabel="Recipe suggestions">
              {isLoadingFirestoreRecipes ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading suggestions...</Text>
                  <View style={styles.gridInner}>
                    {[...Array(6)].map((_, i) => (
                      <View key={`skeleton-${i}`} style={styles.gridCard}>
                        <View style={[styles.gridImage, { backgroundColor: Colors.backgroundLight }]} />
                        <View style={{ height: 12, backgroundColor: Colors.backgroundLight, borderRadius: 6, marginBottom: 6 }} />
                        <View style={{ height: 10, backgroundColor: Colors.backgroundLight, borderRadius: 5, width: '60%' }} />
                      </View>
                    ))}
                  </View>
                </View>
              ) : mealSuggestions.length > 0 ? (
                <View style={styles.gridInner}>
                  {mealSuggestions.map((recipe) => (
                    <Pressable
                      key={`grid-${recipe.id}`}
                      style={styles.gridCard}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${recipe.name} to your plan`}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => {
                        handleAddSuggestion(recipe.id, recipe.name, recipe.mealType || 'any');
                        closeSuggestionsModal();
                      }}
                    >
                      <View style={styles.gridImage}>
                        <View style={styles.cardImageInner} />
                      </View>
                      <Text style={styles.gridTitle} numberOfLines={2}>{recipe.name}</Text>
                      <Text style={styles.gridMeta}>{recipe.calories} cal • {(recipe.mealType || 'any').toUpperCase()}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No suggestions available</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your preferences</Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

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
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        accessibilityViewIsModal={true}
        onRequestClose={() => {
          setShowErrorModal(false);
          clearGenerationError();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal} accessibilityLabel="Generation help dialog">
            <View style={styles.errorModalHeader}>
              <Info size={24} color={Colors.warning} />
              <Text style={styles.errorModalTitle}>{lastGenerationError ? 'No recipes matched your filters' : 'Meal plan help'}</Text>
              <Pressable 
                onPress={() => {
                  setShowErrorModal(false);
                  clearGenerationError();
                }}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.closeButton}
                testID="error-close"
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ paddingBottom: 8 }} accessibilityLiveRegion="polite">
              <Text style={styles.errorModalMessage}>
                {lastGenerationError ?? 'We couldn\'t find suitable recipes to fill every slot today.'}
              </Text>
              {generationSuggestions && generationSuggestions.length > 0 ? (
                <View style={styles.suggestionsList}>
                  <Text style={styles.suggestionsTitle}>Try this:</Text>
                  {generationSuggestions.map((suggestion, index) => (
                    <View key={`suggestion-${index}`} style={styles.suggestionItem}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.suggestionsList}>
                  <Text style={styles.suggestionsTitle}>Try this:</Text>
                  {[
                    'Relax dietary filters or exclusions temporarily',
                    'Allow repeats for this week in Settings',
                    'Add more recipes or import from web',
                    'Tap Browse Suggestions to pick manually'
                  ].map((s, i) => (
                    <View key={`fallback-suggestion-${i}`} style={styles.suggestionItem}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.suggestionText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
            
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable 
                style={[styles.errorModalButton, { flex: 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Try again"
                testID="error-retry"
                onPress={async () => {
                  setShowErrorModal(false);
                  await handleGenerateMealPlan();
                }}
              >
                <Text style={styles.errorModalButtonText}>Try Again</Text>
              </Pressable>
              <Pressable 
                style={[styles.errorModalButton, { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight }]}
                accessibilityRole="button"
                accessibilityLabel="Adjust dietary preferences"
                testID="error-preferences"
                onPress={() => {
                  setShowErrorModal(false);
                  router.push('/onboarding/dietary-preferences');
                }}
              >
                <Text style={[styles.errorModalButtonText, { color: Colors.text }]}>Adjust Preferences</Text>
              </Pressable>
              <Pressable 
                style={[styles.errorModalButton, { flex: 1, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Browse suggestions"
                testID="error-browse-suggestions"
                onPress={() => {
                  setShowErrorModal(false);
                  if (!showSuggestions) setShowSuggestions(true);
                  setShowSuggestionsModal(true);
                }}
              >
                <Text style={[styles.errorModalButtonText, { color: Colors.primary }]}>Browse Suggestions</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={confirmClearVisible}
        accessibilityViewIsModal={true}
        onRequestClose={() => setConfirmClearVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <Text style={styles.modalTitle}>Clear this day?</Text>
            <Text style={styles.errorModalMessage}>This will remove all meals for {dateString}.</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Pressable style={[styles.errorModalButton, { backgroundColor: Colors.backgroundLight }]} accessibilityRole="button" accessibilityLabel="Cancel" onPress={() => setConfirmClearVisible(false)}>
                <Text style={[styles.errorModalButtonText, { color: Colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.errorModalButton, { backgroundColor: Colors.danger }]}
                accessibilityRole="button"
                accessibilityLabel="Clear day"
                onPress={() => {
                  clearDay(dateString);
                  setShowSuggestions(false);
                  setConfirmClearVisible(false);
                  showSnack('Day cleared', 'success');
                }}
              >
                <Text style={styles.errorModalButtonText}>Clear</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={replaceMealModal.visible}
        accessibilityViewIsModal={true}
        onRequestClose={() => setReplaceMealModal({ visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <Text style={styles.modalTitle}>Replace which meal?</Text>
            <View style={{ height: 8 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {(['breakfast','lunch','dinner'] as const).map(slot => (
                <Pressable
                  key={`replace-${slot}`}
                  style={[styles.slotButton]}
                  accessibilityRole="button"
                  accessibilityLabel={`Replace ${slot}`}
                  onPress={() => {
                    if (replaceMealModal.recipeId && replaceMealModal.recipeName) {
                      addMeal(dateString, slot, { recipeId: replaceMealModal.recipeId, name: replaceMealModal.recipeName });
                      showSnack('Replaced', 'success');
                    }
                    setReplaceMealModal({ visible: false });
                  }}
                >
                  <Text style={styles.slotButtonText}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.errorModalButton, { backgroundColor: Colors.backgroundLight, marginTop: 12 }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={() => setReplaceMealModal({ visible: false })}>
              <Text style={[styles.errorModalButtonText, { color: Colors.text }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {snackbar.visible && (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.snackbar, snackbar.type === 'success' ? styles.snackbarSuccess : snackbar.type === 'error' ? styles.snackbarError : styles.snackbarInfo]}
          testID="snackbar"
        >
          <Text style={styles.snackbarText}>{snackbar.message}</Text>
        </View>
      )}
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
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 20,
    marginTop: 8,
  },
  nutritionSummary: {
    flex: 0,
    width: '100%',
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
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
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
    paddingBottom: 120,
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
    backgroundColor: '#4CAF50',
  },
  progressBarCarbs: {
    backgroundColor: '#2196F3',
  },
  progressBarFat: {
    backgroundColor: '#FF9800',
  },
  progressBarExceeded: {
    backgroundColor: Colors.warning,
  },
  bottomPadding: {
    height: 40,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  gridContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  gridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  gridImage: {
    height: 120,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  gridMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  errorModal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
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
    padding: 8,
    borderRadius: 8,
  },
  errorModalMessage: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  suggestionsList: {
    marginBottom: 8,
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
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
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
  cardImageInner: {
    flex: 1,
  },
  slotButton: {
    width: '32%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  slotButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  snackbarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  snackbarSuccess: {
    backgroundColor: Colors.primary,
  },
  snackbarError: {
    backgroundColor: Colors.danger,
  },
  snackbarInfo: {
    backgroundColor: Colors.text,
  },
});
