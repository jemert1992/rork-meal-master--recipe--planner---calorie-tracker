import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  Share,
  Platform,
  AccessibilityInfo
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
  Info,
  Check,
  Minus,
  Plus as PlusIcon
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
    clearGenerationError,
    getAlternativeRecipes,
    swapMeal,
    updateMealServings,
    isGenerating,
    generationProgress
  } = useMealPlanStore();
  const { recipes } = useRecipeStore();
  const { profile } = useUserStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const modalCloseButtonRef = useRef<any>(null);
  const errorCloseButtonRef = useRef<any>(null);
  const previouslyFocusedRef = useRef<Element | null>(null as unknown as Element | null);
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

  // Swap modal state
  const [swapVisible, setSwapVisible] = useState(false);
  const [swapDate, setSwapDate] = useState<string | null>(null);
  const [swapMealType, setSwapMealType] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [swapQuery, setSwapQuery] = useState<string>('');
  const [swapOnlySuitable, setSwapOnlySuitable] = useState<boolean>(false);
  const [swapLoading, setSwapLoading] = useState<boolean>(false);
  const [swapAlternatives, setSwapAlternatives] = useState<typeof recipes>([]);
  const swapCloseButtonRef = useRef<any>(null);
  const previouslyFocusedSwapRef = useRef<Element | null>(null as unknown as Element | null);

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
  
  // Update week days when current week index changes
  React.useEffect(() => {
    setWeekDays(getWeekDays(currentWeekIndex));
  }, [currentWeekIndex, getWeekDays]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (modalVisible) {
        previouslyFocusedRef.current = (document?.activeElement as Element) ?? null;
        setTimeout(() => {
          try {
            (modalCloseButtonRef.current as unknown as any)?.focus?.();
          } catch (e) {
            console.log('Focus set error (weekly modal):', e);
          }
        }, 0);
      } else {
        try {
          (previouslyFocusedRef.current as any)?.focus?.();
        } catch (e) {
          // noop
        }
      }
    }
  }, [modalVisible]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (showErrorModal) {
        previouslyFocusedRef.current = (document?.activeElement as Element) ?? null;
        setTimeout(() => {
          try {
            (errorCloseButtonRef.current as unknown as any)?.focus?.();
          } catch (e) {
            console.log('Focus set error (error modal):', e);
          }
        }, 0);
      } else {
        try {
          (previouslyFocusedRef.current as any)?.focus?.();
        } catch (e) {
          // noop
        }
      }
    }
  }, [showErrorModal]);

  // Show error modal when generation error occurs
  React.useEffect(() => {
    if (lastGenerationError) {
      setShowErrorModal(true);
      try { AccessibilityInfo.announceForAccessibility?.('There was a problem generating your meal plan'); } catch {}
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
                  try { AccessibilityInfo.announceForAccessibility?.('Weekly plan generated'); } catch {}
                  showSnack('Weekly plan generated');
                } else {
                  setShowErrorModal(true);
                  try { AccessibilityInfo.announceForAccessibility?.('Failed to generate weekly plan'); } catch {}
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
          try { AccessibilityInfo.announceForAccessibility?.('Weekly plan generated'); } catch {}
          showSnack('Weekly plan generated');
        } else {
          setShowErrorModal(true);
          try { AccessibilityInfo.announceForAccessibility?.('Failed to generate weekly plan'); } catch {}
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
  // Simple snackbar
  const [snack, setSnack] = useState<{ visible: boolean; message: string }>(() => ({ visible: false, message: '' }));
  const showSnack = useCallback((message: string) => {
    setSnack({ visible: true, message });
    setTimeout(() => setSnack({ visible: false, message: '' }), 2200);
  }, []);
  
  const handleShareMealPlan = async () => {
    try {
      setSharingPlan(true);
      if (Platform.OS === 'web') {
        const text = 'My Zestora Weekly Meal Plan';
        if (typeof navigator !== 'undefined' && (navigator as any).share) {
          await (navigator as any).share({ title: 'Zestora Plan', text });
        } else {
          Alert.alert('Share', 'Sharing is not supported in this browser. You can take a screenshot of the plan.');
        }
      } else {
        if (!mealPlanRef.current) return;
        const uri = await captureRef(mealPlanRef.current as View, {
          format: 'png',
          quality: 1,
          result: 'data-uri',
          width: 1080,
          height: 1080
        });
        await Share.share({
          url: uri,
          title: 'My Zestora Weekly Meal Plan',
          message: 'Check out my weekly meal plan from Zestora! #Zestora #MealPlanning'
        });
      }
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
  
  const openSwap = async (date: string, mealType: 'breakfast' | 'lunch' | 'dinner', recipeId?: string) => {
    setSwapDate(date);
    setSwapMealType(mealType);
    setSwapQuery('');
    setSwapOnlySuitable(false);
    setSwapVisible(true);
    setSwapLoading(true);
    try {
      if (recipeId) {
        const alts = await getAlternativeRecipes(date, mealType, recipeId);
        setSwapAlternatives(Array.isArray(alts) ? alts : []);
      } else {
        setSwapAlternatives([]);
      }
    } catch (e) {
      console.log('Swap alternatives fetch failed, using local recipes');
      setSwapAlternatives([]);
    } finally {
      setSwapLoading(false);
    }
  };

  const doSwap = async (newRecipeId: string) => {
    if (!swapDate || !swapMealType) return;
    try {
      const ok = await swapMeal(swapDate, swapMealType, newRecipeId);
      if (ok) {
        try { AccessibilityInfo.announceForAccessibility?.('Meal swapped'); } catch {}
        showSnack('Meal swapped');
        setSwapVisible(false);
      }
    } catch (e) {
      console.log('Swap failed', e);
      try { AccessibilityInfo.announceForAccessibility?.('Failed to swap meal'); } catch {}
    }
  };

  const renderDayItem = (item: typeof weekDays[0]) => {
    const dayPlan = mealPlan[item.dateString] || {};

    return (
      <View style={styles.dayContainer} key={item.dateString}>
        <View style={styles.dayHeader}>
          <View style={[styles.dayNumberContainer, item.isToday && styles.todayNumberContainer]}>
            <Text style={[styles.dayNumber, item.isToday && styles.todayNumber]}>{item.dayNumber}</Text>
            <Text style={[styles.dayMonth, item.isToday && styles.todayMonth]}>{item.month}</Text>
          </View>
          <View style={styles.dayInfo}>
            <Text style={styles.dayName}>{item.dayName}</Text>
            <Text style={styles.dayDate}>{format(item.date, 'yyyy-MM-dd')}</Text>
          </View>
          {profile.autoGenerateMeals && (
            <Pressable
              style={[styles.generateDayButton, generatingDayPlan === item.dateString && styles.generatingDayButton]}
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
          {(['breakfast', 'lunch', 'dinner'] as const).map((mealType) => {
            const meal = dayPlan[mealType as keyof typeof dayPlan];
            const recipeId = (meal && !Array.isArray(meal) && 'recipeId' in meal) ? (meal as any).recipeId as string | undefined : undefined;
            const { name, image } = getRecipeDetails(recipeId);
            const servings = (meal && !Array.isArray(meal) && 'servings' in meal) ? Math.max(1, Math.min(20, Number((meal as any).servings ?? 1))) : 1;
            const isGen = !!(generatingMeal && generatingMeal.date === item.dateString && generatingMeal.mealType === mealType && generatingMeal.loading);
            const changeServings = (delta: number) => {
              const next = Math.max(1, Math.min(20, servings + delta));
              try {
                updateMealServings(item.dateString, mealType, next);
              } catch (e) {
                console.log('Failed to update servings', e);
              }
            };

            return (
              <View key={`${item.dateString}-${mealType}`} style={styles.mealSlotContainer}>
                {Platform.OS === 'web' ? (
                  <View
                    // @ts-expect-error onClick is web-only
                    onClick={() => !isGen && handleMealSlotPress(item.dateString, mealType)}
                    style={[styles.mealSlot, name ? styles.filledMealSlot : styles.emptyMealSlot]}
                    aria-label={name ? `${mealType}: ${name}` : `Add ${mealType} for ${item.dayName}`}
                    data-testid={`meal-slot-${item.dateString}-${mealType}`}
                  >
                    {name ? (
                      <View style={styles.filledMealContent}>
                        {image ? (
                          <Image source={{ uri: image }} style={styles.mealImage} accessibilityLabel={`Image of ${name}`} />
                        ) : (
                          <View style={styles.mealImagePlaceholder} />
                        )}
                        <View style={styles.mealInfo}>
                          <Text style={styles.mealTypeLabel}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
                          <Text style={styles.mealName} numberOfLines={1}>{name}</Text>
                          <View style={styles.slotActionsRow}>
                            <View style={styles.stepper} data-testid={`week-stepper-${item.dateString}-${mealType}`}>
                              <View
                                // @ts-expect-error onClick is web-only
                                onClick={(e) => { try { (e as any).stopPropagation?.(); } catch {}; changeServings(-1); }}
                                aria-label={`Decrease ${mealType} servings`}
                                style={styles.stepperButton}
                                data-testid={`week-decrease-servings-${item.dateString}-${mealType}`}
                              >
                                <Minus size={14} color={Colors.text} />
                              </View>
                              <View style={styles.stepperValue} aria-label={`Servings x ${servings}`}>
                                <Text style={styles.stepperText}>x {servings}</Text>
                              </View>
                              <View
                                // @ts-expect-error onClick is web-only
                                onClick={(e) => { try { (e as any).stopPropagation?.(); } catch {}; changeServings(1); }}
                                aria-label={`Increase ${mealType} servings`}
                                style={styles.stepperButton}
                                data-testid={`week-increase-servings-${item.dateString}-${mealType}`}
                              >
                                <PlusIcon size={14} color={Colors.text} />
                              </View>
                            </View>
                            <View
                              // @ts-expect-error onClick is web-only
                              onClick={(e) => { try { (e as any).stopPropagation?.(); } catch {}; openSwap(item.dateString, mealType, recipeId); }}
                              aria-label={`Swap ${mealType}`}
                              style={styles.slotSwapButton}
                              data-testid={`swap-${item.dateString}-${mealType}`}
                            >
                              <RefreshCw size={14} color={Colors.primary} />
                              <Text style={styles.slotSwapText}>Swap</Text>
                            </View>
                            <View
                              // @ts-expect-error onClick is web-only
                              onClick={(e) => { try { (e as any).stopPropagation?.(); } catch {}; handleMealSlotPress(item.dateString, mealType); }}
                              aria-label={`Edit ${mealType}`}
                              style={styles.slotEditButton}
                              data-testid={`edit-${item.dateString}-${mealType}`}
                            >
                              <Text style={styles.slotEditText}>Edit</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.emptyMealContent}>
                        <Text style={styles.mealTypeLabel}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
                        {isGen ? (
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
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.mealSlot, name ? styles.filledMealSlot : styles.emptyMealSlot, pressed && styles.focusRing]}
                    onPress={() => handleMealSlotPress(item.dateString, mealType)}
                    disabled={isGen}
                    accessibilityLabel={name ? `${mealType}: ${name}` : `Add ${mealType} for ${item.dayName}`}
                    accessibilityRole="button"
                  >
                    {name ? (
                      <View style={styles.filledMealContent}>
                        {image ? (
                          <Image source={{ uri: image }} style={styles.mealImage} accessibilityLabel={`Image of ${name}`} />
                        ) : (
                          <View style={styles.mealImagePlaceholder} />
                        )}
                        <View style={styles.mealInfo}>
                          <Text style={styles.mealTypeLabel}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
                          <Text style={styles.mealName} numberOfLines={1}>{name}</Text>
                          <View style={styles.slotActionsRow}>
                            <View style={styles.stepper} testID={`week-stepper-${item.dateString}-${mealType}`}>
                              <Pressable 
                                onPress={() => changeServings(-1)}
                                accessibilityLabel={`Decrease ${mealType} servings`}
                                accessibilityRole="button"
                                style={({ pressed }) => [styles.stepperButton, styles.stepperLeft, pressed && styles.focusRing]}
                                testID={`week-decrease-servings-${item.dateString}-${mealType}`}
                              >
                                <Minus size={14} color={Colors.text} />
                              </Pressable>
                              <View style={styles.stepperValue}>
                                <Text style={styles.stepperText}>x {servings}</Text>
                              </View>
                              <Pressable 
                                onPress={() => changeServings(1)}
                                accessibilityLabel={`Increase ${mealType} servings`}
                                accessibilityRole="button"
                                style={({ pressed }) => [styles.stepperButton, styles.stepperRight, pressed && styles.focusRing]}
                                testID={`week-increase-servings-${item.dateString}-${mealType}`}
                              >
                                <PlusIcon size={14} color={Colors.text} />
                              </Pressable>
                            </View>
                            <Pressable
                              style={({ pressed }) => [styles.slotSwapButton, pressed && styles.focusRing]}
                              onPress={() => openSwap(item.dateString, mealType, recipeId)}
                              accessibilityRole="button"
                              accessibilityLabel={`Swap ${mealType}`}
                            >
                              <RefreshCw size={14} color={Colors.primary} />
                              <Text style={styles.slotSwapText}>Swap</Text>
                            </Pressable>
                            <Pressable
                              style={({ pressed }) => [styles.slotEditButton, pressed && styles.focusRing]}
                              onPress={() => handleMealSlotPress(item.dateString, mealType)}
                              accessibilityRole="button"
                              accessibilityLabel={`Edit ${mealType}`}
                            >
                              <Text style={styles.slotEditText}>Edit</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.emptyMealContent}>
                        <Text style={styles.mealTypeLabel}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
                        {isGen ? (
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
                )}

                {!name && !isGen && (
                  <Pressable
                    style={({ pressed }) => [styles.pickForMeButton, pressed && styles.focusRing]}
                    onPress={() => handleAutoGenerateMeal(item.dateString, mealType)}
                    accessibilityLabel={`Auto-generate ${mealType} for ${item.dayName}`}
                    accessibilityHint="Let the app pick a recipe for you"
                    accessibilityRole="button"
                  >
                    <View style={styles.pickForMeContent}>
                      <Sparkles size={18} color={Colors.white} />
                      <Text style={styles.pickForMeText}>Pick for me</Text>
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
        style={({ pressed }) => [styles.planButton, pressed && styles.focusRing]} 
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
          <ChevronRight size={20} color={Colors.textMuted} />
        </View>
      </Pressable>

      {plannedMealsCount > 0 && (
        <Pressable 
          style={({ pressed }) => [styles.groceryButton, pressed && styles.focusRing]} 
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
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        testID="weekly-meal-planner-modal"
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalContentFull} accessibilityLabel="Weekly meal plan dialog">
          <View style={styles.modalHeader} accessibilityRole="header">
              <Text style={styles.modalTitle} accessibilityRole="text">Weekly Meal Plan</Text>
              <Pressable 
                ref={modalCloseButtonRef}
                style={styles.closeButton} 
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Close weekly meal plan"
                accessibilityHint="Closes the weekly planner dialog"
                accessibilityRole="button"
                testID="weekly-planner-close"
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.weeklyActionContainer}>
              <Pressable 
                style={({ pressed }) => [styles.generateWeeklyButton, (generatingWeeklyPlan || isGenerating) && styles.generatingButton, pressed && styles.focusRing]} 
                onPress={handleGenerateWeeklyMealPlan}
                disabled={generatingWeeklyPlan || isGenerating}
                accessibilityLabel="Generate weekly meal plan"
                accessibilityHint="Automatically generate meals for the entire week"
                accessibilityRole="button"
              >
                {generatingWeeklyPlan || isGenerating ? (
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
              {isGenerating && (
                <View style={styles.progressTrack} accessibilityLabel={`Generating… ${Math.round(generationProgress*100)} percent`}>
                  <View style={[styles.progressBar, { width: `${Math.round(generationProgress*100)}%` }]} />
                </View>
              )}
              
              <Text style={styles.weeklyPlanInfo}>
                {profile.dietType && profile.dietType !== 'any' 
                  ? `Based on your ${profile.dietType} diet • Variety on`
                  : 'Based on your preferences • Variety on'}
              </Text>
            </View>
            
            <View style={styles.weekNavigationContainer}>
              <Pressable 
                style={({ pressed }) => [styles.weekNavigationButton, pressed && styles.focusRing]} 
                onPress={handlePreviousWeek}
                disabled={isGenerating}
                accessibilityLabel="Previous week"
                accessibilityRole="button"
              >
                <ChevronLeft size={20} color={Colors.text} />
                <Text style={styles.weekNavigationText}>Previous</Text>
              </Pressable>
              
              <Text style={styles.weekRangeText}>
                {format(weekDays[0].date, 'yyyy-MM-dd')} - {format(weekDays[6].date, 'yyyy-MM-dd')}
              </Text>
              
              <Pressable 
                style={({ pressed }) => [styles.weekNavigationButton, pressed && styles.focusRing]} 
                onPress={handleNextWeek}
                disabled={isGenerating}
                accessibilityLabel="Next week"
                accessibilityRole="button"
              >
                <Text style={styles.weekNavigationText}>Next</Text>
                <ChevronRight size={20} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.verticalWeekContent} showsVerticalScrollIndicator={false} accessibilityLabel="Weekly plan days list" testID="weekly-plan-scroll">
              {weekDays.map(d => renderDayItem(d))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <View style={styles.footerButtonsRow}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.generateButton,
                    (plannedMealsCount === 0 || isGenerating) && styles.disabledButton,
                    pressed && styles.focusRing
                  ]} 
                  onPress={() => {
                    onGenerateGroceryList();
                    setModalVisible(false);
                  }}
                  disabled={plannedMealsCount === 0 || isGenerating}
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
                  style={({ pressed }) => [
                    styles.shareButton,
                    (plannedMealsCount === 0 || sharingPlan) && styles.disabledButton,
                    pressed && styles.focusRing
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
                    {format(weekDays[0].date, 'yyyy-MM-dd')} - {format(weekDays[6].date, 'yyyy-MM-dd')}
                  </Text>
                </View>
                
                {weekDays.map((day) => {
                  const dayPlan = mealPlan[day.dateString] || {};
                  
                  return (
                    <View key={day.dateString} style={styles.captureDayRow}>
                      <View style={styles.captureDayHeader}>
                        <Text style={styles.captureDayName}>{day.dayName}</Text>
                        <Text style={styles.captureDayDate}>{format(day.date, 'yyyy-MM-dd')}</Text>
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
      </Modal>

      {/* Swap Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={swapVisible}
        onRequestClose={() => setSwapVisible(false)}
        testID="swap-modal"
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalContentFull} accessibilityLabel="Swap meal dialog">
          <View style={styles.modalHeader} accessibilityRole="header">
            <Text style={styles.modalTitle} accessibilityRole="text">Swap {swapMealType ? swapMealType.charAt(0).toUpperCase() + swapMealType.slice(1) : ''}</Text>
            <Pressable 
              ref={swapCloseButtonRef}
              style={styles.closeButton} 
              onPress={() => setSwapVisible(false)}
              accessibilityLabel="Close swap dialog"
              accessibilityRole="button"
              testID="swap-modal-close"
            >
              <X size={24} color={Colors.text} />
            </Pressable>
          </View>
          <View style={styles.weekNavigationContainer}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14, color: Colors.textSecondary }}>Search</Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ position: 'absolute', opacity: 0 }}>Search</Text>
                <Pressable>
                  {/* Placeholder for input label for accessibility */}
                </Pressable>
              </View>
            </View>
          </View>
          <View style={{ paddingHorizontal: 16 }}>
            {swapLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text accessibilityLiveRegion="polite" style={{ marginTop: 8, color: Colors.textSecondary }}>Loading alternatives…</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.gridScrollContent} accessibilityLabel="Swap alternatives grid">
                <View style={styles.swapGridInner}>
                  {(swapAlternatives.length > 0 ? swapAlternatives : recipes)
                    .filter(r => (swapMealType ? (r.mealType === swapMealType || r.tags.includes(swapMealType)) : true))
                    .filter(r => r.name.toLowerCase().includes(swapQuery.toLowerCase()))
                    .map(r => (
                      <Pressable key={`swap-${r.id}`} style={styles.swapGridCard} onPress={() => doSwap(r.id)} accessibilityRole="button" accessibilityLabel={`Choose ${r.name}`}>
                        {r.image ? (
                          <Image source={{ uri: r.image }} style={styles.swapGridImage} accessibilityLabel={`Image of ${r.name}`} />
                        ) : (
                          <View style={styles.swapGridImage} />
                        )}
                        <Text style={styles.swapGridTitle} numberOfLines={2}>{r.name}</Text>
                        <Text style={styles.swapGridMeta}>{r.calories} cal</Text>
                      </Pressable>
                    ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Snackbar */}
      {snack.visible && (
        <View style={styles.snackbar} accessibilityLiveRegion="polite">
          <Text style={styles.snackbarText}>{snack.message}</Text>
        </View>
      )}

      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => {
          setShowErrorModal(false);
          clearGenerationError();
        }}
        testID="generation-error-modal"
        accessibilityViewIsModal={true}
      >
        <View style={styles.errorModalOverlay} importantForAccessibility="yes">
          <View style={styles.errorModal} accessibilityLabel="Meal plan help dialog">
            <View style={styles.errorModalHeader} accessibilityRole="header">
              <Info size={24} color={Colors.warning} />
              <Text style={styles.errorModalTitle} accessibilityRole="text">{lastGenerationError ? "Couldn't generate plan" : 'Meal plan help'}</Text>
              <Pressable 
                ref={errorCloseButtonRef}
                onPress={() => {
                  setShowErrorModal(false);
                  clearGenerationError();
                }}
                style={styles.closeButton}
                accessibilityLabel="Close"
                accessibilityRole="button"
                testID="error-modal-close"
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ paddingBottom: 8 }} accessibilityLiveRegion="polite">
              <Text style={styles.errorModalMessage}>
                {lastGenerationError ?? 'We hit a snag while generating the plan.'}
              </Text>
              {generationSuggestions && generationSuggestions.length > 0 && (
                <View style={styles.errorSuggestionsList} accessibilityLabel="Suggestions list">
                  <Text style={styles.errorSuggestionsTitle}>How to fix it:</Text>
                  {generationSuggestions.map((suggestion, index) => (
                    <View key={`error-suggestion-${index}`} style={styles.errorSuggestionItem}>
                      <View style={styles.errorBulletPoint} />
                      <Text style={styles.errorSuggestionText}>{suggestion}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable 
                style={[styles.errorModalButton, { flex: 1 }]}
                onPress={async () => {
                  setShowErrorModal(false);
                  // regenerate current visible week
                  const _days = getWeekDays(currentWeekIndex);
                  updateWeeklyUsedRecipeIds(_days[0].dateString, _days[6].dateString);
                  await handleGenerateWeeklyMealPlan();
                }}
                accessibilityLabel="Try again"
                accessibilityRole="button"
                testID="weekly-error-retry"
              >
                <Text style={styles.errorModalButtonText}>Try Again</Text>
              </Pressable>
              <Pressable 
                style={[styles.errorModalButton, { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight }]}
                onPress={() => {
                  setShowErrorModal(false);
                  router.push('/onboarding/dietary-preferences');
                }}
                accessibilityLabel="Adjust dietary preferences"
                accessibilityRole="button"
                testID="weekly-error-preferences"
              >
                <Text style={[styles.errorModalButtonText, { color: Colors.text }]}>Adjust Preferences</Text>
              </Pressable>
              <Pressable 
                style={[styles.errorModalButton, { flex: 1, backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary }]}
                onPress={() => {
                  setShowErrorModal(false);
                  setModalVisible(true);
                }}
                accessibilityLabel="Open weekly planner"
                accessibilityRole="button"
                testID="weekly-error-open-planner"
              >
                <Text style={[styles.errorModalButtonText, { color: Colors.primary }]}>Open Planner</Text>
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  groceryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  groceryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  modalContentFull: {
    flex: 1,
    backgroundColor: Colors.background,
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
  progressTrack: {
    height: 6,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.primary,
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
  verticalWeekContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  dayContainer: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  dayNumberContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  todayNumberContainer: {
    backgroundColor: Colors.primary,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  todayNumber: {
    color: Colors.white,
  },
  dayMonth: {
    fontSize: 11,
    color: Colors.white,
    opacity: 0.9,
    fontWeight: '600',
  },
  todayMonth: {
    color: Colors.white,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  dayDate: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  mealsContainer: {
    gap: 16,
  },
  mealSlotContainer: {
    marginBottom: 12,
  },
  mealSlot: {
    minHeight: 96,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyMealSlot: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  filledMealSlot: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyMealContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  filledMealContent: {
    flex: 1,
    flexDirection: 'row',
  },
  mealTypeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  addMealText: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 6,
    fontWeight: '600',
  },
  mealImage: {
    width: 96,
    height: 96,
  },
  mealImagePlaceholder: {
    width: 96,
    height: 96,
    backgroundColor: Colors.backgroundLight,
  },
  mealInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  slotActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  slotSwapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  slotSwapText: {
    marginLeft: 6,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  slotEditButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  slotEditText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  mealName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.1,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 10,
    alignSelf: 'stretch',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  pickForMeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickForMeText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  pickForMeButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  snackbar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: Colors.text,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  snackbarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  swapActionButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
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
  gridScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  swapGridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  swapGridCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  swapGridImage: {
    height: 120,
    backgroundColor: Colors.backgroundLight,
    width: '100%',
  },
  swapGridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
    marginHorizontal: 10,
    marginBottom: 4,
  },
  swapGridMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  swapListItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  swapListName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  swapListMeta: {
    fontSize: 14,
    color: Colors.primary,
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
    paddingHorizontal: 20,
    paddingVertical: 40,
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
  focusRing: {
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  stepperButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  stepperLeft: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  stepperRight: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  stepperValue: {
    paddingHorizontal: 8,
  },
  stepperText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
});