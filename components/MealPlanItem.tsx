import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Image, Modal, FlatList, ActivityIndicator, TextInput, Platform, AccessibilityActionEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Clock, Users, RefreshCw, Check, AlertCircle, Info, Minus, Plus } from 'lucide-react-native';
import { MealItem, Recipe } from '@/types';
import { useRecipeStore } from '@/store/recipeStore';
import { useMealPlanStore } from '@/store/mealPlanStore';
import MealDetailView from '@/components/MealDetailView';
import Colors from '@/constants/colors';

type MealPlanItemProps = {
  mealType: string;
  meal?: MealItem;
  date: string;
  onRemove: () => void;
  onAdd: () => void;
  hasAlternatives?: boolean;
};

export default function MealPlanItem({ mealType, meal, date, onRemove, onAdd, hasAlternatives = false }: MealPlanItemProps) {
  const router = useRouter();
  const { recipes } = useRecipeStore();
  const { getAlternativeRecipes, swapMeal, lastGenerationError } = useMealPlanStore();
  const recipe = meal?.recipeId ? recipes.find(r => r.id === meal.recipeId) : null;
  
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<Recipe[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [swappingRecipe, setSwappingRecipe] = useState(false);
  const [alternativesError, setAlternativesError] = useState<string | null>(null);
  const [showMealDetails, setShowMealDetails] = useState(false);
  const [query, setQuery] = useState<string>('');
  const [onlySuitable, setOnlySuitable] = useState<boolean>(false);
  const closeAltRef = useRef<any>(null);
  const prevFocusRef = useRef<Element | null>(null as unknown as Element | null);

  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handlePress = () => {
    if (meal?.recipeId) {
      router.push(`/recipe/${meal.recipeId}`);
    } else if (meal) {
      setShowMealDetails(true);
    } else {
      onAdd();
    }
  };

  const servings = meal?.servings ?? 1;

  const getCalories = () => {
    if (meal?.calories) return Math.round((meal.calories ?? 0) * servings);
    if (recipe) {
      const perServing = (recipe.calories ?? 0) / Math.max(1, recipe.servings);
      return Math.round(perServing * servings);
    }
    return 0;
  };
  
  const handleShowAlternatives = async () => {
    if (!meal) return;
    setShowAlternatives(true);
    setLoadingAlternatives(true);
    setAlternativesError(null);
    try {
      if (meal.recipeId) {
        const alternativeRecipes = await getAlternativeRecipes(
          date,
          mealType as 'breakfast' | 'lunch' | 'dinner',
          meal.recipeId
        );
        if (alternativeRecipes && alternativeRecipes.length > 0) {
          setAlternatives(alternativeRecipes);
        } else {
          setAlternatives([]);
        }
      } else {
        setAlternatives([]);
      }
    } catch (error) {
      console.log('Alternatives remote fetch failed, falling back to local', error);
      setAlternatives([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };
  
  const handleSwapRecipe = async (newRecipeId: string) => {
    if (!meal) return;
    setSwappingRecipe(true);
    try {
      const success = await swapMeal(
        date,
        mealType as 'breakfast' | 'lunch' | 'dinner',
        newRecipeId
      );
      if (success) {
        setShowAlternatives(false);
      } else if (lastGenerationError) {
        setAlternativesError(lastGenerationError);
      } else {
        setAlternativesError('Failed to swap recipe. Please try again.');
      }
    } catch (error) {
      console.error('Error swapping recipe:', error);
      setAlternativesError('An unexpected error occurred. Please try again.');
    } finally {
      setSwappingRecipe(false);
    }
  };

  const onChangeServings = useCallback((delta: number) => {
    const next = Math.max(1, Math.min(20, (meal?.servings ?? 1) + delta));
    if (!meal) return;
    try {
      console.log('Updating servings', { date, mealType, from: meal?.servings ?? 1, to: next });
      useMealPlanStore.getState().updateMealServings(date, mealType as 'breakfast' | 'lunch' | 'dinner', next);
    } catch (e) {
      console.error('Failed to update servings', e);
    }
  }, [meal?.servings, date, mealType]);

  const onStepperAccessibilityAction = useCallback((event: AccessibilityActionEvent) => {
    if (!meal) return;
    if (event.nativeEvent.actionName === 'increment') {
      onChangeServings(1);
    }
    if (event.nativeEvent.actionName === 'decrement') {
      onChangeServings(-1);
    }
  }, [meal, onChangeServings]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (showAlternatives) {
        prevFocusRef.current = (document?.activeElement as Element) ?? null;
        setTimeout(() => {
          try { (closeAltRef.current as any)?.focus?.(); } catch {}
        }, 0);
      } else {
        try { (prevFocusRef.current as any)?.focus?.(); } catch {}
      }
    }
  }, [showAlternatives]);

  return (
    <View style={styles.container} accessibilityRole="none" accessibilityLabel={`${formatMealType(mealType)} slot`}>
      <View style={styles.headerRow}>
        <Text style={styles.mealType} accessibilityRole="header">{formatMealType(mealType)}</Text>
        {meal && (
          <View style={styles.headerActions} accessibilityLabel={`${formatMealType(mealType)} actions`}>
            <Pressable
              style={({ pressed }) => [styles.swapButton, pressed && styles.focusRing]}
              onPress={handleShowAlternatives}
              accessibilityLabel={`Swap ${formatMealType(mealType)}`}
              accessibilityHint="Open recipe browser to swap"
              accessibilityRole="button"
              testID={`swap-button-${mealType}`}
            >
              <RefreshCw size={14} color={Colors.primary} />
              <Text style={styles.swapButtonText}>Swap</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.editButton, pressed && styles.focusRing]}
              onPress={() => router.push(`/add-meal/${date}?mealType=${mealType}`)}
              accessibilityLabel={`Edit ${formatMealType(mealType)}`}
              accessibilityHint="Open the meal picker"
              accessibilityRole="button"
              testID={`edit-button-${mealType}`}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>
        )}
      </View>
      
      {meal ? (
        <View style={styles.mealContainer} accessibilityLabel={`${formatMealType(mealType)} details`}>
          <Pressable 
            style={({ pressed }) => [styles.mealPressable, pressed && styles.focusRing]} 
            onPress={handlePress}
            accessibilityLabel={`${formatMealType(mealType)}: ${meal.name}`}
            accessibilityHint={`${getCalories()} calories. Tap to view details.`}
            accessibilityRole="button"
          >
            {recipe && recipe.image && (
              <Image 
                source={{ uri: recipe.image }} 
                style={styles.mealImage} 
                accessibilityLabel={`Image of ${meal.name}`}
                accessibilityRole="image"
              />
            )}
            <View style={styles.mealContent}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.calories}>{getCalories()} calories</Text>
              
              {recipe && (
                <View style={styles.recipeDetails} accessibilityRole="summary" accessibilityLabel="Recipe details">
                  <View style={styles.recipeDetail}>
                    <Clock size={12} color={Colors.textLight} />
                    <Text style={styles.detailText}>{recipe.prepTime}</Text>
                  </View>
                  <View style={styles.recipeDetail}>
                    <Users size={12} color={Colors.textLight} />
                    <Text style={styles.detailText}>x {servings}</Text>
                  </View>
                </View>
              )}
              
              {!recipe && meal.ingredients && meal.ingredients.length > 0 && (
                <View style={styles.customMealInfo} accessibilityRole="summary" accessibilityLabel="Custom meal information">
                  <View style={styles.recipeDetail}>
                    <Info size={12} color={Colors.textLight} />
                    <Text style={styles.detailText}>{meal.ingredients.length} ingredients</Text>
                  </View>
                  <View style={styles.recipeDetail}>
                    <Users size={12} color={Colors.textLight} />
                    <Text style={styles.detailText}>x {servings}</Text>
                  </View>
                </View>
              )}
              
              {recipe && recipe.tags.length > 0 && (
                <View style={styles.tagsContainer} accessibilityRole="list" accessibilityLabel="Tags list">
                  {recipe.tags.slice(0, 3).map((tag, index) => (
                    <View key={`${recipe.id}-tag-${index}`} style={styles.tag} accessibilityRole="text" accessibilityLabel={`Tag ${tag}`}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Pressable>

          {meal && (
            <View 
              style={styles.stepper} 
              testID={`servings-stepper-${mealType}`}
              accessibilityRole="adjustable"
              accessibilityLabel={`${formatMealType(mealType)} servings`}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={onStepperAccessibilityAction}
              accessibilityValue={{ min: 1, max: 20, now: servings }}
            >
              <Pressable 
                onPress={() => onChangeServings(-1)} 
                style={({ pressed }) => [styles.stepperButton, styles.stepperLeft, pressed && styles.focusRing]}
                accessibilityLabel={`Decrease ${mealType} servings`}
                accessibilityRole="button"
                accessibilityState={{ disabled: servings <= 1 }}
                accessibilityHint="Decreases servings by one"
                testID={`decrease-servings-${mealType}`}
              >
                <Minus size={16} color={Colors.text} />
              </Pressable>
              <View style={styles.stepperValue} accessibilityRole="text" accessibilityLabel={`Current servings ${servings}`}>
                <Users size={14} color={Colors.textSecondary} />
                <Text style={styles.stepperText}>{servings}</Text>
              </View>
              <Pressable 
                onPress={() => onChangeServings(1)} 
                style={({ pressed }) => [styles.stepperButton, styles.stepperRight, pressed && styles.focusRing]}
                accessibilityLabel={`Increase ${mealType} servings`}
                accessibilityRole="button"
                accessibilityState={{ disabled: servings >= 20 }}
                accessibilityHint="Increases servings by one"
                testID={`increase-servings-${mealType}`}
              >
                <Plus size={16} color={Colors.text} />
              </Pressable>
            </View>
          )}

          <Pressable 
            style={({ pressed }) => [styles.removeButton, pressed && styles.focusRing]} 
            onPress={onRemove} 
            hitSlop={8}
            accessibilityLabel={`Remove ${meal?.name ?? mealType} from ${mealType}`}
            accessibilityRole="button"
            accessibilityHint="Removes this meal from the plan"
            testID={`remove-${mealType}`}
          >
            <X size={18} color={Colors.textLight} />
          </Pressable>
        </View>
      ) : (
        <Pressable 
          style={({ pressed }) => [styles.addButton, pressed && styles.focusRing]} 
          onPress={onAdd}
          accessibilityLabel={`Add ${mealType}`}
          accessibilityHint={`Tap to add a ${mealType} to your meal plan`}
          accessibilityRole="button"
        >
          <Text style={styles.addButtonText}>+ Add {mealType}</Text>
        </Pressable>
      )}
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAlternatives}
        onRequestClose={() => setShowAlternatives(false)}
        testID={`swap-alt-modal-${mealType}`}
        {...(Platform.OS !== 'web' ? ({ accessibilityViewIsModal: true } as const) : ({} as const))}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent} accessibilityLabel={`Swap ${formatMealType(mealType)} dialog`}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} accessibilityRole="header">Swap {formatMealType(mealType)}</Text>
              <Pressable 
                ref={closeAltRef}
                style={({ pressed }) => [styles.closeButton, pressed && styles.focusRing]} 
                onPress={() => setShowAlternatives(false)}
                accessibilityLabel="Close"
                accessibilityRole="button"
                testID={`close-swap-${mealType}`}
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.searchRow} accessibilityLabel="Search and filter">
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search recipes"
                style={styles.searchInput}
                placeholderTextColor={Colors.textLight}
                accessibilityLabel="Search recipes"
                testID={`swap-search-${mealType}`}
              />
              <Pressable
                onPress={() => setOnlySuitable(!onlySuitable)}
                style={({ pressed }) => [styles.filterChip, onlySuitable ? styles.filterChipActive : null, pressed && styles.focusRing]}
                accessibilityRole="switch"
                accessibilityLabel="Suitable only"
                accessibilityState={{ checked: onlySuitable }}
                testID={`swap-filter-suitable-${mealType}`}
              >
                <Text style={[styles.filterChipText, onlySuitable ? styles.filterChipTextActive : null]}>Suitable</Text>
              </Pressable>
            </View>
            
            {loadingAlternatives && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}

            {alternativesError && (
              <View style={styles.errorContainer} accessibilityLiveRegion="polite">
                <AlertCircle size={40} color={Colors.warning} />
                <Text style={styles.errorText}>{alternativesError}</Text>
              </View>
            )}

            <View accessibilityLabel="Alternatives list">
              <FlatList
                data={(alternatives.length > 0 ? alternatives : recipes)
                  .filter(r => (r.mealType === mealType) || r.tags.includes(mealType))
                  .filter(r => !onlySuitable || true)
                  .filter(r => r.name.toLowerCase().includes(query.toLowerCase()))}
                keyExtractor={(item, index) => (item?.id && item.id.length > 0 ? item.id : `${item?.name ?? 'recipe'}-${index}`)}
                renderItem={({ item }) => (
                  <View style={styles.alternativeItem} accessibilityRole="none" accessibilityLabel={item.name}>
                    {item.image ? (
                      <Image 
                        source={{ uri: item.image }} 
                        style={styles.alternativeImage} 
                        accessibilityLabel={`Image of ${item.name}`}
                        accessibilityRole="image"
                      />
                    ) : (
                      <View style={styles.alternativeImagePlaceholder} />
                    )}
                    <View style={styles.alternativeContent}>
                      <Text style={styles.alternativeName}>{item.name}</Text>
                      <Text style={styles.alternativeCalories}>{item.calories} calories</Text>
                      {item.tags.length > 0 && (
                        <View style={styles.tagsContainer} accessibilityRole="list" accessibilityLabel="Tags list">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <View key={`${item.id}-tag-${index}`} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <Pressable 
                      style={({ pressed }) => [styles.swapActionButton, pressed && styles.focusRing]}
                      onPress={() => handleSwapRecipe(item.id)}
                      disabled={swappingRecipe}
                      accessibilityLabel={`Swap with ${item.name}`}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: swappingRecipe }}
                      testID={`choose-alt-${mealType}-${item.id}`}
                    >
                      {swappingRecipe ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Check size={18} color={Colors.white} />
                      )}
                    </Pressable>
                  </View>
                )}
                contentContainerStyle={styles.alternativesList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal
        animationType="slide"
        transparent={false}
        visible={showMealDetails}
        onRequestClose={() => setShowMealDetails(false)}
        presentationStyle="pageSheet"
      >
        <View style={styles.mealDetailModal}>
          <View style={styles.mealDetailHeader}>
            <Text style={styles.mealDetailTitle} accessibilityRole="header">Meal Details</Text>
            <Pressable 
              style={({ pressed }) => [styles.closeButton, pressed && styles.focusRing]} 
              onPress={() => setShowMealDetails(false)}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <X size={24} color={Colors.text} />
            </Pressable>
          </View>
          {meal && <MealDetailView meal={meal} />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealType: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  editButton: {
    marginLeft: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  swapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  mealContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  mealPressable: {
    flex: 1,
    flexDirection: 'row',
  },
  mealImage: {
    width: 90,
    aspectRatio: 1,
  },
  mealContent: {
    flex: 1,
    padding: 16,
  },
  mealName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  calories: {
    fontSize: 15,
    color: Colors.primary,
    marginBottom: 6,
    fontWeight: '600',
  },
  recipeDetails: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  recipeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  tagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    height: 38,
    marginRight: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  stepperButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stepperText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  removeButton: {
    padding: 16,
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 16,
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
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  filterChipText: {
    color: Colors.text,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  alternativesList: {
    padding: 16,
  },
  alternativeItem: {
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
  alternativeImage: {
    width: 80,
    height: 80,
  },
  alternativeImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: Colors.backgroundLight,
  },
  alternativeContent: {
    flex: 1,
    padding: 12,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  alternativeCalories: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  swapActionButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  tryAgainButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  tryAgainButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  customMealInfo: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  mealDetailModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mealDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  mealDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  focusRing: {
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});