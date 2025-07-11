import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { MealItem } from '@/types';
import Colors from '@/constants/colors';

interface MealDetailViewProps {
  meal: MealItem;
}

export default function MealDetailView({ meal }: MealDetailViewProps) {
  const hasIngredients = meal.ingredients && meal.ingredients.length > 0;
  const hasNutrition = meal.calories || meal.protein || meal.carbs || meal.fat || meal.fiber;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Meal Name */}
      <View style={styles.header}>
        <Text style={styles.mealName}>{meal.name}</Text>
        {meal.servings && meal.servings > 1 && (
          <Text style={styles.servings}>Serves {meal.servings}</Text>
        )}
      </View>

      {/* Nutrition Information */}
      {hasNutrition && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition (Per Serving)</Text>
          <View style={styles.nutritionGrid}>
            {meal.calories && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
            )}
            {meal.protein && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
            )}
            {meal.carbs && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
            )}
            {meal.fat && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            )}
            {meal.fiber && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{meal.fiber}g</Text>
                <Text style={styles.nutritionLabel}>Fiber</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Ingredients */}
      {hasIngredients && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {meal.ingredients!.map((ingredient, index) => (
            <View key={ingredient.id} style={styles.ingredientItem}>
              <View style={styles.ingredientHeader}>
                <Text style={styles.ingredientName}>
                  {ingredient.quantity} {ingredient.unit} {ingredient.name}
                </Text>
              </View>
              {(ingredient.calories || ingredient.protein || ingredient.carbs || ingredient.fat) && (
                <View style={styles.ingredientNutrition}>
                  {ingredient.calories && (
                    <Text style={styles.ingredientNutritionText}>
                      {ingredient.calories} cal
                    </Text>
                  )}
                  {ingredient.protein && (
                    <Text style={styles.ingredientNutritionText}>
                      {ingredient.protein}g protein
                    </Text>
                  )}
                  {ingredient.carbs && (
                    <Text style={styles.ingredientNutritionText}>
                      {ingredient.carbs}g carbs
                    </Text>
                  )}
                  {ingredient.fat && (
                    <Text style={styles.ingredientNutritionText}>
                      {ingredient.fat}g fat
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Notes */}
      {meal.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{meal.notes}</Text>
        </View>
      )}

      {/* Recipe ID Info */}
      {meal.recipeId && (
        <View style={styles.section}>
          <Text style={styles.recipeInfo}>Recipe ID: {meal.recipeId}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  mealName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  servings: {
    fontSize: 16,
    color: Colors.textLight,
  },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    minWidth: '18%',
    marginBottom: 12,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
  ingredientItem: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ingredientHeader: {
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  ingredientNutrition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ingredientNutritionText: {
    fontSize: 12,
    color: Colors.textLight,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  notesText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  recipeInfo: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
});