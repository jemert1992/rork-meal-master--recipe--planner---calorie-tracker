import React, { useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  Modal, 
  ScrollView, 
  Image, 
  Alert, 
  ActivityIndicator, 
  FlatList,
  Dimensions,
  Share,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Calendar, 
  ChevronRight, 
  Plus, 
  ShoppingBag, 
  X, 
  Sparkles, 
  RefreshCw, 
  ChevronLeft,
  Share2,
  AlertCircle,
  Info
} from 'lucide-react-native';
import { format, addDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRecipeStore } from '@/store/recipeStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import { captureRef } from 'react-native-view-shot';

type WeeklyMealPlannerProps = {
  onGenerateGroceryList: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_ITEM_WIDTH = SCREEN_WIDTH * 0.9;

export default function WeeklyMealPlanner({ onGenerateGroceryList }: WeeklyMealPlannerProps) {
  const router = useRouter();
  const { 
    mealPlan, 
    generateMealPlan, 
    generateAllMealsForDay,
    isRecipeUsedInMealPlan, 
    generateWeeklyMealPlan, 
    updateWeeklyUsedRecipeIds,
    lastGenerationError,
    generationSuggestions,
    clearGenerationError
  } = useMealPlanStore();
  const { recipes } = useRecipeStore();
  const { profile } = useUserStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [generatingMeal, setGeneratingMeal] = useState<{
    date: string;
    mealType: 'breakfast' | 'lunch' | 'dinner';
    loading: boolean;
  } | null>(null);
  const [generatingDayPlan, setGeneratingDayPlan] = useState<string | null>(null);
  const [generatingWeeklyPlan, setGeneratingWeeklyPlan] = useState(false);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [sharingPlan, setSharingPlan] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Ref for capturing the meal plan view for sharing
  const mealPlanRef = useRef<View>(null);
  
  // Get the current week starting from today
  const getWeekDays = useCallback((weekOffset: number) => {
    const today = new Date();
    const weekStart = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    // Generate an array of 7 days starting from weekStart
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dateString: format(date, 'yyyy-MM-dd'),
        dayName: format(date, 'EEE'),
        dayNumber: format(date, 'd'),
        month: format(date, 'MMM'),
        isToday: isSameDay(date, today)
      };
    });
  }, []);
  
  const [weekDays, setWeekDays] = useState(getWeekDays(0));
  const flatListRef = useRef<FlatList>(null);
  
  // Update week days when current week index changes
  React.useEffect(() => {
    setWeekDays(getWeekDays(currentWeekIndex));
  }, [currentWeekIndex, getWeekDays]);

  // Show error modal when generation error occurs
  React.useEffect(() => {
    if (lastGenerationError) {
      setShowErrorModal(true);
    }
  }, [lastGenerationError]);

  const handleMealSlotPress = (date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    router.push(`/add-meal/${date}?mealType=${mealType}`);
    setModalVisible(false);
  };

  const handleAutoGenerateMeal = async (date: string, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    try {
      setGeneratingMeal({ date, mealType, loading: true });
      
      // Check if the meal type already has a recipe
      const dayPlan = mealPlan[date] || {};
      if (dayPlan[mealType]?.recipeId) {
        // Ask for confirmation before replacing
        Alert.alert(
          "Replace Existing Meal?",
          `You already have a ${mealType} planned for this day. Do you want to replace it?`,
          [
            { text: "Cancel", style: "cancel", onPress: () => setGeneratingMeal(null) },
            { 
              text: "Replace", 
              onPress: async () => {
                const result = await generateMealPlan(date, recipes, mealType);
                
                if (result.success) {
                  // Success - no alert needed, user can see the meal was replaced
                  // The modal stays open so they can continue adding more meals
                } else {
                  // Error will be shown in the error modal
                  setShowErrorModal(true);
                }
                
                setGeneratingMeal(null);
              }
            }
          ]
        );
        return;
      }
      
      // Generate a meal plan for the specific date and meal type
      const result = await generateMealPlan(date, recipes, mealType);
      
      if (result.success) {
        // Success - no alert needed, user can see the meal was added
        // The modal stays open so they can continue adding more meals
      } else {
        // Error will be shown in the error modal
        setShowErrorModal(true);
      }
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

  const handleGenerateAllMealsForDay = async (date: string) => {
    try {
      setGeneratingDayPlan(date);
      
      // Check if the day already has meals
      const dayPlan = mealPlan[date] || {};
      const hasExistingMeals = dayPlan.breakfast || dayPlan.lunch || dayPlan.dinner;
      
      if (hasExistingMeals) {
        Alert.alert(
          "Replace Existing Meals?",
          "This will replace any existing meals for this day. Continue?",
          [
            { text: "Cancel", style: "cancel", onPress: () => setGeneratingDayPlan(null) },
            { 
              text: "Continue", 
              onPress: async () => {
                const result = await generateAllMealsForDay(date, recipes);
                
                if (result.success) {
                  // Success - no alert needed, user can see the meals were generated
                  // The modal stays open so they can continue planning
                } else {
                  setShowErrorModal(true);
                }
                
                setGeneratingDayPlan(null);
              }
            }
          ]
        );
      } else {
        const result = await generateAllMealsForDay(date, recipes);
        
        if (result.success) {
          // Success - no alert needed, user can see the meals were generated
          // The modal stays open so they can continue planning
        } else {
          setShowErrorModal(true);
        }
        
        setGeneratingDayPlan(null);
      }
    } catch (error) {
      console.error("Error generating day plan:", error);
      Alert.alert(
        "Generation Failed",
        "Could not generate meals for the day. Please try again.",
        [{ text: "OK" }]
      );
      setGeneratingDayPlan(null);
    }
  };

  const handleGenerateWeeklyMealPlan = async () => {
    try {
      setGeneratingWeeklyPlan(true);
      
      // Ask for confirmation before replacing existing meals
      const hasExistingMeals = weekDays.some(day => {
        const dayPlan = mealPlan[day.dateString];
        return dayPlan && (dayPlan.breakfast || dayPlan.lunch || dayPlan.dinner);
      });
      
      if (hasExistingMeals) {
        Alert.alert(
          "Replace Existing Meals?",
          "This will replace any existing meals in your weekly plan. Continue?",
          [
            { text: "Cancel", style: "cancel", onPress: () => setGeneratingWeeklyPlan(false) },
            { 
              text: "Continue", 
              onPress: async () => {
                // Update weekly used recipe IDs
                updateWeeklyUsedRecipeIds(weekDays[0].dateString, weekDays[6].dateString);
                
                // Generate weekly meal plan
                const result = await generateWeeklyMealPlan(weekDays[0].dateString, weekDays[6].dateString);
                
                if (result.success) {
                  Alert.alert(
                    "Weekly Plan Generated",
                    result.suggestions[0] || "Your weekly meal plan has been generated!",
                    [{ text: "OK" }]
                  );
                } else {
                  // Error will be shown in the error modal
                  setShowErrorModal(true);
                }
                
                setGeneratingWeeklyPlan(false);
              }
            }
          ]
        );
      } else {
        // Update weekly used recipe IDs
        updateWeeklyUsedRecipeIds(weekDays[0].dateString, weekDays[6].dateString);
        
        // Generate weekly meal plan
        const result = await generateWeeklyMealPlan(weekDays[0].dateString, weekDays[6].dateString);
        
        if (result.success) {
          Alert.alert(
            "Weekly Plan Generated",
            result.suggestions[0] || "Your weekly meal plan has been generated!",
            [{ text: "OK" }]
          );
        } else {
          // Error will be shown in the error modal
          setShowErrorModal(true);
        }
        
        setGeneratingWeeklyPlan(false);
      }
    } catch (error) {
      console.error("Error generating weekly meal plan:", error);
      Alert.alert(
        "Generation Failed",
        "Could not generate a weekly meal plan. Please try again.",
        [{ text: "OK" }]
      );
      setGeneratingWeeklyPlan(false);
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
  
  const handlePreviousWeek = () => {
    setCurrentWeekIndex(prev => prev - 1);
  };
  
  const handleNextWeek = () => {
    setCurrentWeekIndex(prev => prev + 1);
  };
  
  const handleShareMealPlan = async () => {
    if (!mealPlanRef.current) return;
    
    try {
      setSharingPlan(true);
      
      // Capture the meal plan view as an image
      const uri = await captureRef(mealPlanRef, {
        format: 'png',
        quality: 1,
        result: 'data-uri',
        width: 1080,
        height: 1080
      });
      
      // Share the image
      await Share.share({
        url: uri,
        title: 'My Zestora Weekly Meal Plan',
        message: 'Check out my weekly meal plan from Zestora! #Zestora #MealPlanning'
      });
      
    } catch (error) {
      console.error('Error sharing meal plan:', error);
      Alert.alert(
        'Sharing Failed',
        'Could not share your meal plan. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSharingPlan(false);
    }
  };
  
  const renderDayItem = ({ item }: { item: typeof weekDays[0] }) => {
    const dayPlan = mealPlan[item.dateString] || {};
    
    return (
      <View style={styles.dayContainer}>
        <View style={styles.dayHeader}>
          <View style={[
            styles.dayNumberContainer,
            item.isToday && styles.todayNumberContainer
          ]}>
            <Text style={[
              styles.dayNumber,
              item.isToday && styles.todayNumber
            ]}>{item.dayNumber}</Text>
            <Text style={[
              styles.dayMonth,
              item.isToday && styles.todayMonth
            ]}>{item.month}</Text>
          </View>
          <View style={styles.dayInfo}>
            <Text style={styles.dayName}>{item.dayName}</Text>
            <Text style={styles.dayDate}>{format(item.date, 'MMMM d, yyyy')}</Text>
          </View>
          {profile.autoGenerateMeals && (
            <Pressable 
              style={[
                styles.generateDayButton,
                generatingDayPlan === item.dateString && styles.generatingDayButton
              ]}
              onPress={() => handleGenerateAllMealsForDay(item.dateString)}
              disabled={generatingDayPlan === item.dateString}
              accessibilityLabel={`Generate all meals for ${item.dayName}`}
              accessibilityHint="Automatically generate breakfast, lunch, and dinner for this day"
              accessibilityRole="button"
            >
              {generatingDayPlan === item.dateString ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Sparkles size={16} color={Colors.white} />
              )}
            </Pressable>
          )}
        </View>

        <View style={styles.mealsContainer}>
          {['breakfast', 'lunch', 'dinner'].map((mealType) => {
            const meal = dayPlan[mealType as keyof typeof dayPlan];
            
            const recipeId = (meal && !Array.isArray(meal) && 'recipeId' in meal) ? meal.recipeId : undefined;
            const { name, image } = getRecipeDetails(recipeId);
            
            const isGenerating = generatingMeal && 
              generatingMeal.date === item.dateString && 
              generatingMeal.mealType === mealType && 
              generatingMeal.loading;

            return (
              <View key={`${item.dateString}-${mealType}`} style={styles.mealSlotContainer}>
                <Pressable
                  style={[
                    styles.mealSlot,
                    name ? styles.filledMealSlot : styles.emptyMealSlot
                  ]}
                  onPress={() => handleMealSlotPress(item.dateString, mealType as 'breakfast' | 'lunch' | 'dinner')}
                  disabled={isGenerating}
                  accessibilityLabel={name 
                    ? `${mealType}: ${name}` 
                    : `Add ${mealType} for ${item.dayName}`
                  }
                  accessibilityRole="button"
                >
                  {name ? (
                    <View style={styles.filledMealContent}>
                      {image ? (
                        <Image 
                          source={{ uri: image }} 
                          style={styles.mealImage}
                          accessibilityLabel={`Image of ${name}`}
                        />
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
                        <>
                          <ActivityIndicator size="small" color={Colors.primary} style={styles.generatingIndicator} />
                          <Text style={styles.generatingText}>Generating...</Text>
                        </>
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
                    style={({ pressed }) => [
                      styles.pickForMeButton,
                      pressed && styles.pickForMeButtonPressed
                    ]}
                    onPress={() => handleAutoGenerateMeal(
                      item.dateString, 
                      mealType as 'breakfast' | 'lunch' | 'dinner'
                    )}
                    accessibilityLabel={`Auto-generate ${mealType} for ${item.dayName}`}
                    accessibilityHint="Let the app pick a recipe for you"
                    accessibilityRole="button"
                  >
                    <View style={styles.pickForMeContent}>
                      <Sparkles size={18} color={Colors.white} />
                      <Text style={styles.pickForMeText}>✨ Pick for me ✨</Text>
                    </View>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.planButton} 
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Plan your weekly meals"
        accessibilityHint={`${plannedMealsCount} of ${totalPossibleMeals} meals planned`}
        accessibilityRole="button"
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
          accessibilityLabel="Generate grocery list"
          accessibilityHint="Create a shopping list based on your meal plan"
          accessibilityRole="button"
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
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.weeklyActionContainer}>
              <Pressable 
                style={[styles.generateWeeklyButton, generatingWeeklyPlan && styles.generatingButton]} 
                onPress={handleGenerateWeeklyMealPlan}
                disabled={generatingWeeklyPlan}
                accessibilityLabel="Generate weekly meal plan"
                accessibilityHint="Automatically generate meals for the entire week"
                accessibilityRole="button"
              >
                {generatingWeeklyPlan ? (
                  <>
                    <ActivityIndicator size="small" color={Colors.white} style={styles.buttonIcon} />
                    <Text style={styles.generateWeeklyButtonText}>Generating...</Text>
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} color={Colors.white} style={styles.buttonIcon} />
                    <Text style={styles.generateWeeklyButtonText}>Generate Weekly Plan</Text>
                  </>
                )}
              </Pressable>
              
              <Text style={styles.weeklyPlanInfo}>
                {profile.dietType && profile.dietType !== 'any' 
                  ? `Based on your ${profile.dietType} diet`
                  : "Based on your preferences"}
              </Text>
            </View>
            
            <View style={styles.weekNavigationContainer}>
              <Pressable 
                style={styles.weekNavigationButton} 
                onPress={handlePreviousWeek}
                accessibilityLabel="Previous week"
                accessibilityRole="button"
              >
                <ChevronLeft size={20} color={Colors.text} />
                <Text style={styles.weekNavigationText}>Previous</Text>
              </Pressable>
              
              <Text style={styles.weekRangeText}>
                {format(weekDays[0].date, 'MMM d')} - {format(weekDays[6].date, 'MMM d, yyyy')}
              </Text>
              
              <Pressable 
                style={styles.weekNavigationButton} 
                onPress={handleNextWeek}
                accessibilityLabel="Next week"
                accessibilityRole="button"
              >
                <Text style={styles.weekNavigationText}>Next</Text>
                <ChevronRight size={20} color={Colors.text} />
              </Pressable>
            </View>
            
            <FlatList
              ref={flatListRef}
              data={weekDays}
              renderItem={renderDayItem}
              keyExtractor={(item) => item.dateString}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={DAY_ITEM_WIDTH}
              snapToAlignment="center"
              decelerationRate="fast"
              contentContainerStyle={styles.dayListContent}
              getItemLayout={(_, index) => ({
                length: DAY_ITEM_WIDTH,
                offset: DAY_ITEM_WIDTH * index,
                index,
              })}
            />

            <View style={styles.modalFooter}>
              <View style={styles.footerButtonsRow}>
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
                  accessibilityLabel="Generate grocery list"
                  accessibilityHint={plannedMealsCount === 0 
                    ? "You need to add meals to your plan first" 
                    : "Create a shopping list based on your meal plan"
                  }
                  accessibilityRole="button"
                >
                  <ShoppingBag size={20} color={Colors.white} />
                  <Text style={styles.generateButtonText}>Generate Grocery List</Text>
                </Pressable>
                
                <Pressable 
                  style={[
                    styles.shareButton,
                    (plannedMealsCount === 0 || sharingPlan) && styles.disabledButton
                  ]} 
                  onPress={handleShareMealPlan}
                  disabled={plannedMealsCount === 0 || sharingPlan}
                  accessibilityLabel="Share meal plan"
                  accessibilityHint="Share your weekly meal plan as an image"
                  accessibilityRole="button"
                >
                  {sharingPlan ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Share2 size={20} color={Colors.white} />
                      <Text style={styles.shareButtonText}>Share Plan</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
            
            {/* Hidden view for capturing the meal plan image */}
            <View style={styles.captureContainer} pointerEvents="none">
              <View ref={mealPlanRef} style={styles.captureContent}>
                <View style={styles.captureHeader}>
                  <Text style={styles.captureTitle}>My #Zestora Week 🍎</Text>
                  <Text style={styles.captureSubtitle}>
                    {format(weekDays[0].date, 'MMM d')} - {format(weekDays[6].date, 'MMM d, yyyy')}
                  </Text>
                </View>
                
                {weekDays.map((day) => {
                  const dayPlan = mealPlan[day.dateString] || {};
                  
                  return (
                    <View key={day.dateString} style={styles.captureDayRow}>
                      <View style={styles.captureDayHeader}>
                        <Text style={styles.captureDayName}>{day.dayName}</Text>
                        <Text style={styles.captureDayDate}>{day.dayNumber} {day.month}</Text>
                      </View>
                      
                      <View style={styles.captureMealsColumn}>
                        {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                          const meal = dayPlan[mealType as keyof typeof dayPlan];
                          const recipeId = (meal && !Array.isArray(meal) && 'recipeId' in meal) ? meal.recipeId : undefined;
                          const { name } = getRecipeDetails(recipeId);
                          
                          return (
                            <View key={`${day.dateString}-${mealType}`} style={styles.captureMealItem}>
                              <Text style={styles.captureMealType}>
                                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}:
                              </Text>
                              <Text style={styles.captureMealName}>
                                {name || "Not planned"}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
                
                <View style={styles.captureFooter}>
                  <Text style={styles.captureFooterText}>
                    Made with Zestora - Your Personal Meal Planning Assistant
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
        <View style={styles.errorModalOverlay}>
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
              <View style={styles.errorSuggestionsList}>
                <Text style={styles.errorSuggestionsTitle}>Suggestions:</Text>
                {generationSuggestions.map((suggestion, index) => (
                  <View key={`error-suggestion-${index}`} style={styles.errorSuggestionItem}>
                    <View style={styles.errorBulletPoint} />
                    <Text style={styles.errorSuggestionText}>{suggestion}</Text>
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
  weeklyActionContainer: {
    padding: 16,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  generateWeeklyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  generatingButton: {
    backgroundColor: Colors.primary,
    opacity: 0.7,
  },
  generateWeeklyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  buttonIcon: {
    marginRight: 8,
  },
  weeklyPlanInfo: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  weekNavigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  weekNavigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  weekNavigationText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dayListContent: {
    paddingHorizontal: 16,
  },
  dayContainer: {
    width: DAY_ITEM_WIDTH,
    marginBottom: 24,
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
  todayNumberContainer: {
    backgroundColor: Colors.primary,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  todayNumber: {
    color: Colors.white,
  },
  dayMonth: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.8,
  },
  todayMonth: {
    color: Colors.white,
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
  footerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  generateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
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
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 8,
  },
  pickForMeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: 'stretch',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,

  },
  pickForMeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickForMeText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  pickForMeButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  generatingText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  generatingIndicator: {
    marginBottom: 4,
  },
  // Styles for capturing the meal plan image
  captureContainer: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    width: 1080,
    height: 1080,
    backgroundColor: Colors.white,
  },
  captureContent: {
    width: 1080,
    height: 1080,
    padding: 40,
    backgroundColor: Colors.white,
  },
  captureHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  captureTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  captureSubtitle: {
    fontSize: 24,
    color: Colors.primary,
    marginBottom: 20,
  },
  captureDayRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  captureDayHeader: {
    width: 120,
    marginRight: 20,
  },
  captureDayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  captureDayDate: {
    fontSize: 18,
    color: Colors.textLight,
  },
  captureMealsColumn: {
    flex: 1,
  },
  captureMealItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  captureMealType: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.primary,
    width: 120,
  },
  captureMealName: {
    fontSize: 20,
    color: Colors.text,
    flex: 1,
  },
  captureFooter: {
    marginTop: 30,
    alignItems: 'center',
  },
  captureFooterText: {
    fontSize: 18,
    color: Colors.textLight,
  },
  // Error Modal Styles
  errorModalOverlay: {
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
  errorModalMessage: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 22,
  },
  errorSuggestionsList: {
    marginBottom: 16,
  },
  errorSuggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  errorSuggestionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  errorBulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 8,
    marginTop: 8,
  },
  errorSuggestionText: {
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
    marginTop: 8,
  },
  errorModalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  generateDayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingDayButton: {
    backgroundColor: Colors.primary,
    opacity: 0.7,
  },
});