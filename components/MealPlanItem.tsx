import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Image, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Clock, Users, RefreshCw, Check } from 'lucide-react-native';
import { MealItem, Recipe } from '@/types';
import { useRecipeStore } from '@/store/recipeStore';
import { useMealPlanStore } from '@/store/mealPlanStore';
import Colors from '@/constants/colors';

type MealPlanItemProps = {
  mealType: string;
  meal?: MealItem;
  date: string;
  onRemove: () => void;
  onAdd: () => void;
};

export default function MealPlanItem({ mealType, meal, date, onRemove, onAdd }: MealPlanItemProps) {
  const router = useRouter();
  const { recipes } = useRecipeStore();
  const { getAlternativeRecipes, swapMeal, isLoadingAlternatives } = useMealPlanStore();
  const recipe = meal?.recipeId ? recipes.find(r => r.id === meal.recipeId) : null;
  
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<Recipe[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [swappingRecipe, setSwappingRecipe] = useState(false);

  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handlePress = () => {
    if (meal?.recipeId) {
      router.push(`/recipe/${meal.recipeId}`);
    } else if (meal) {
      // Show food details if it's not a recipe
    } else {
      onAdd();
    }
  };

  const getCalories = () => {
    if (meal?.calories) return meal.calories;
    if (recipe) return recipe.calories || 0;
    return 0;
  };
  
  const handleShowAlternatives = async () => {
    if (!meal?.recipeId) return;
    
    setLoadingAlternatives(true);
    setShowAlternatives(true);
    
    try {
      const alternativeRecipes = await getAlternativeRecipes(
        date, 
        mealType as 'breakfast' | 'lunch' | 'dinner',
        meal.recipeId
      );
      
      setAlternatives(alternativeRecipes);
    } catch (error) {
      console.error('Error loading alternative recipes:', error);
    } finally {
      setLoadingAlternatives(false);
    }
  };
  
  const handleSwapRecipe = async (newRecipeId: string) => {
    if (!meal?.recipeId) return;
    
    setSwappingRecipe(true);
    
    try {
      const success = await swapMeal(
        date, 
        mealType as 'breakfast' | 'lunch' | 'dinner',
        newRecipeId
      );
      
      if (success) {
        setShowAlternatives(false);
      }
    } catch (error) {
      console.error('Error swapping recipe:', error);
    } finally {
      setSwappingRecipe(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.mealType}>{formatMealType(mealType)}</Text>
        {meal?.recipeId && (
          <Pressable 
            style={styles.swapButton} 
            onPress={handleShowAlternatives}
            accessibilityLabel={`Swap ${formatMealType(mealType)}`}
            accessibilityHint="Show alternative recipes"
            accessibilityRole="button"
          >
            <RefreshCw size={14} color={Colors.primary} />
            <Text style={styles.swapButtonText}>Swap</Text>
          </Pressable>
        )}
      </View>
      
      {meal ? (
        <Pressable 
          style={styles.mealContainer} 
          onPress={handlePress}
          accessibilityLabel={`${formatMealType(mealType)}: ${meal.name}`}
          accessibilityHint={`${getCalories()} calories. Tap to view details.`}
          accessibilityRole="button"
        >
          {recipe && (
            <Image 
              source={{ uri: recipe.image }} 
              style={styles.mealImage} 
              accessibilityLabel={`Image of ${meal.name}`}
            />
          )}
          <View style={styles.mealContent}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.calories}>{getCalories()} calories</Text>
            
            {recipe && (
              <View style={styles.recipeDetails}>
                <View style={styles.recipeDetail}>
                  <Clock size={12} color={Colors.textLight} />
                  <Text style={styles.detailText}>{recipe.prepTime}</Text>
                </View>
                <View style={styles.recipeDetail}>
                  <Users size={12} color={Colors.textLight} />
                  <Text style={styles.detailText}>{recipe.servings} servings</Text>
                </View>
              </View>
            )}
            
            {recipe && recipe.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {recipe.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Pressable 
            style={styles.removeButton} 
            onPress={onRemove} 
            hitSlop={8}
            accessibilityLabel={`Remove ${meal.name} from ${mealType}`}
            accessibilityRole="button"
          >
            <X size={18} color={Colors.textLight} />
          </Pressable>
        </Pressable>
      ) : (
        <Pressable 
          style={styles.addButton} 
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
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alternative {formatMealType(mealType)} Options</Text>
              <Pressable 
                style={styles.closeButton} 
                onPress={() => setShowAlternatives(false)}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            {loadingAlternatives ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading alternatives...</Text>
              </View>
            ) : alternatives.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No alternative recipes found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your dietary preferences or adding more recipes</Text>
              </View>
            ) : (
              <FlatList
                data={alternatives}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable 
                    style={styles.alternativeItem}
                    onPress={() => handleSwapRecipe(item.id)}
                    disabled={swappingRecipe}
                    accessibilityLabel={`Swap with ${item.name}`}
                    accessibilityHint={`${item.calories} calories. Tap to swap.`}
                    accessibilityRole="button"
                  >
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.alternativeImage} 
                      accessibilityLabel={`Image of ${item.name}`}
                    />
                    <View style={styles.alternativeContent}>
                      <Text style={styles.alternativeName}>{item.name}</Text>
                      <Text style={styles.alternativeCalories}>{item.calories} calories</Text>
                      
                      <View style={styles.recipeDetails}>
                        <View style={styles.recipeDetail}>
                          <Clock size={12} color={Colors.textLight} />
                          <Text style={styles.detailText}>{item.prepTime}</Text>
                        </View>
                        <View style={styles.recipeDetail}>
                          <Users size={12} color={Colors.textLight} />
                          <Text style={styles.detailText}>{item.servings} servings</Text>
                        </View>
                      </View>
                      
                      {item.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} style={styles.tag}>
                              <Text style={styles.tagText}>{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    <Pressable 
                      style={styles.swapActionButton}
                      onPress={() => handleSwapRecipe(item.id)}
                      disabled={swappingRecipe}
                      accessibilityLabel={`Swap with ${item.name}`}
                      accessibilityRole="button"
                    >
                      {swappingRecipe ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Check size={18} color={Colors.white} />
                      )}
                    </Pressable>
                  </Pressable>
                )}
                contentContainerStyle={styles.alternativesList}
                showsVerticalScrollIndicator={false}
              />
            )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  swapButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 4,
  },
  mealContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  mealImage: {
    width: 80,
    height: 'auto',
    aspectRatio: 1,
  },
  mealContent: {
    flex: 1,
    padding: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  calories: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  recipeDetails: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  recipeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: Colors.primary,
  },
  removeButton: {
    padding: 12,
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: Colors.primary,
    fontWeight: '500',
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
});