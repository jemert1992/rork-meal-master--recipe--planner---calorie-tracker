import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Clock, Users } from 'lucide-react-native';
import { MealItem } from '@/types';
import { useRecipeStore } from '@/store/recipeStore';
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
  const recipe = meal?.recipeId ? recipes.find(r => r.id === meal.recipeId) : null;

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

  return (
    <View style={styles.container}>
      <Text style={styles.mealType}>{formatMealType(mealType)}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
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
});