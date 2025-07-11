import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, Alert, FlatList } from 'react-native';
import { X, Plus, Trash2, Calculator, Search } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { CustomIngredient, MealItem } from '@/types';
import { calculateNutrition, getIngredientSuggestions, getCommonUnits } from '@/services/nutritionService';

interface CustomMealFormProps {
  onSubmit: (meal: MealItem) => void;
  onCancel: () => void;
}

export default function CustomMealForm({ onSubmit, onCancel }: CustomMealFormProps) {
  const [mealName, setMealName] = useState('');
  const [servings, setServings] = useState('1');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<CustomIngredient[]>([
    { id: '1', name: '', quantity: 0, unit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  ]);
  const [manualCalories, setManualCalories] = useState('');
  const [useManualCalories, setUseManualCalories] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeIngredientId, setActiveIngredientId] = useState<string | null>(null);
  const [ingredientSuggestions, setIngredientSuggestions] = useState<string[]>([]);

  const addIngredient = () => {
    const newIngredient: CustomIngredient = {
      id: Date.now().toString(),
      name: '',
      quantity: 0,
      unit: 'g',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ing => ing.id !== id));
    }
  };

  const updateIngredient = (id: string, field: keyof CustomIngredient, value: string | number) => {
    setIngredients(ingredients.map(ing => {
      if (ing.id === id) {
        const updated = { ...ing, [field]: value };
        
        // Auto-calculate nutrition when ingredient name or quantity changes
        if (field === 'name' && typeof value === 'string') {
          const suggestions = getIngredientSuggestions(value);
          setIngredientSuggestions(suggestions);
          setActiveIngredientId(id);
          
          // Try to calculate nutrition if we have enough info
          if (value.trim() && updated.quantity > 0) {
            const nutrition = calculateNutrition(value, updated.quantity, updated.unit);
            if (nutrition) {
              return {
                ...updated,
                calories: nutrition.calories,
                protein: nutrition.protein,
                carbs: nutrition.carbs,
                fat: nutrition.fat,
                fiber: nutrition.fiber
              };
            }
          }
        } else if ((field === 'quantity' || field === 'unit') && updated.name.trim()) {
          const nutrition = calculateNutrition(updated.name, updated.quantity, updated.unit);
          if (nutrition) {
            return {
              ...updated,
              calories: nutrition.calories,
              protein: nutrition.protein,
              carbs: nutrition.carbs,
              fat: nutrition.fat,
              fiber: nutrition.fiber
            };
          }
        }
        
        return updated;
      }
      return ing;
    }));
  };
  
  const selectIngredientSuggestion = (ingredientId: string, suggestion: string) => {
    updateIngredient(ingredientId, 'name', suggestion);
    setIngredientSuggestions([]);
    setActiveIngredientId(null);
  };

  const calculateNutritionFromIngredients = async () => {
    setIsCalculating(true);
    
    try {
      // Filter out empty ingredients
      const validIngredients = ingredients.filter(ing => ing.name.trim() && ing.quantity > 0);
      
      if (validIngredients.length === 0) {
        Alert.alert('No Ingredients', 'Please add at least one ingredient with a name and quantity.');
        setIsCalculating(false);
        return;
      }

      // First try local database calculation
      let localCalculationSuccess = true;
      const updatedIngredients = validIngredients.map(ing => {
        const nutrition = calculateNutrition(ing.name, ing.quantity, ing.unit);
        if (nutrition) {
          return {
            ...ing,
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
            fiber: nutrition.fiber
          };
        } else {
          localCalculationSuccess = false;
          return ing;
        }
      });

      if (localCalculationSuccess) {
        setIngredients(updatedIngredients);
        const total = updatedIngredients.reduce((acc, ing) => ({
          calories: acc.calories + (ing.calories || 0),
          protein: acc.protein + (ing.protein || 0),
          carbs: acc.carbs + (ing.carbs || 0),
          fat: acc.fat + (ing.fat || 0),
          fiber: acc.fiber + (ing.fiber || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
        
        Alert.alert(
          'Nutrition Calculated!', 
          `Total estimated calories: ${total.calories} kcal\nProtein: ${total.protein.toFixed(1)}g\nCarbs: ${total.carbs.toFixed(1)}g\nFat: ${total.fat.toFixed(1)}g\nFiber: ${total.fiber.toFixed(1)}g`,
          [{ text: 'OK' }]
        );
        setIsCalculating(false);
        return;
      }

      // Fallback to AI calculation for unknown ingredients
      const ingredientPrompts = validIngredients.map(ing => 
        `${ing.quantity}${ing.unit} ${ing.name}`
      ).join(', ');

      const prompt = `Please estimate the nutritional values for these ingredients: ${ingredientPrompts}. 
      
      Provide the response in this exact JSON format:
      {
        "ingredients": [
          {
            "name": "ingredient name",
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number,
            "fiber": number
          }
        ],
        "total": {
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "fiber": number
        }
      }
      
      All nutritional values should be in grams except calories (kcal). Be as accurate as possible based on standard nutritional databases.`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate nutrition');
      }

      const data = await response.json();
      
      try {
        const nutritionData = JSON.parse(data.completion);
        
        // Update ingredients with calculated nutrition
        const aiUpdatedIngredients = validIngredients.map((ing, index) => {
          const nutritionInfo = nutritionData.ingredients[index];
          if (nutritionInfo) {
            return {
              ...ing,
              calories: nutritionInfo.calories || 0,
              protein: nutritionInfo.protein || 0,
              carbs: nutritionInfo.carbs || 0,
              fat: nutritionInfo.fat || 0,
              fiber: nutritionInfo.fiber || 0
            };
          }
          return ing;
        });

        setIngredients(aiUpdatedIngredients);
        
        Alert.alert(
          'Nutrition Calculated!', 
          `Total estimated calories: ${nutritionData.total.calories} kcal\nProtein: ${nutritionData.total.protein}g\nCarbs: ${nutritionData.total.carbs}g\nFat: ${nutritionData.total.fat}g\nFiber: ${nutritionData.total.fiber}g`,
          [{ text: 'OK' }]
        );
      } catch (parseError) {
        console.error('Error parsing nutrition data:', parseError);
        Alert.alert('Error', 'Could not parse nutrition information. Please try again or enter values manually.');
      }
    } catch (error) {
      console.error('Error calculating nutrition:', error);
      Alert.alert('Error', 'Failed to calculate nutrition. Please check your internet connection and try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateTotalNutrition = () => {
    const servingCount = parseInt(servings) || 1;
    
    if (useManualCalories && manualCalories) {
      return {
        calories: Math.round(parseInt(manualCalories) / servingCount),
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      };
    }

    const total = ingredients.reduce((acc, ing) => ({
      calories: acc.calories + (ing.calories || 0),
      protein: acc.protein + (ing.protein || 0),
      carbs: acc.carbs + (ing.carbs || 0),
      fat: acc.fat + (ing.fat || 0),
      fiber: acc.fiber + (ing.fiber || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    // Divide by servings to get per-serving values
    return {
      calories: Math.round(total.calories / servingCount),
      protein: Math.round((total.protein / servingCount) * 10) / 10,
      carbs: Math.round((total.carbs / servingCount) * 10) / 10,
      fat: Math.round((total.fat / servingCount) * 10) / 10,
      fiber: Math.round((total.fiber / servingCount) * 10) / 10
    };
  };

  const handleSubmit = () => {
    if (!mealName.trim()) {
      Alert.alert('Missing Information', 'Please enter a meal name.');
      return;
    }

    const nutrition = calculateTotalNutrition();
    const validIngredients = ingredients.filter(ing => ing.name.trim() && ing.quantity > 0);

    const customMeal: MealItem = {
      name: mealName.trim(),
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      ingredients: validIngredients.length > 0 ? validIngredients : undefined,
      servings: parseInt(servings) || 1,
      notes: notes.trim() || undefined
    };

    onSubmit(customMeal);
  };

  const totalNutrition = calculateTotalNutrition();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Custom Meal</Text>
        <Pressable onPress={onCancel} style={styles.closeButton}>
          <X size={24} color={Colors.textLight} />
        </Pressable>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Meal Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Chicken Caesar Salad"
            value={mealName}
            onChangeText={setMealName}
            placeholderTextColor={Colors.textLight}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Servings</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={servings}
              onChangeText={setServings}
              keyboardType="numeric"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional notes about this meal..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.textLight}
          />
        </View>
      </View>

      {/* Ingredients Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Pressable onPress={calculateNutritionFromIngredients} style={styles.calculateButton} disabled={isCalculating}>
            <Calculator size={16} color={Colors.white} />
            <Text style={styles.calculateButtonText}>
              {isCalculating ? 'Calculating...' : 'Auto Calculate'}
            </Text>
          </Pressable>
        </View>

        {ingredients.map((ingredient, index) => (
          <View key={ingredient.id} style={styles.ingredientRow}>
            <View style={styles.ingredientHeader}>
              <Text style={styles.ingredientNumber}>#{index + 1}</Text>
              {ingredients.length > 1 && (
                <Pressable 
                  onPress={() => removeIngredient(ingredient.id)}
                  style={styles.removeButton}
                >
                  <Trash2 size={16} color={Colors.error} />
                </Pressable>
              )}
            </View>

            <View style={styles.ingredientInputs}>
              <View style={styles.ingredientNameContainer}>
                <TextInput
                  style={[styles.input, styles.ingredientNameInput]}
                  placeholder="Ingredient name"
                  value={ingredient.name}
                  onChangeText={(value) => updateIngredient(ingredient.id, 'name', value)}
                  placeholderTextColor={Colors.textLight}
                  onFocus={() => {
                    if (ingredient.name.trim()) {
                      const suggestions = getIngredientSuggestions(ingredient.name);
                      setIngredientSuggestions(suggestions);
                      setActiveIngredientId(ingredient.id);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow selection
                    setTimeout(() => {
                      setIngredientSuggestions([]);
                      setActiveIngredientId(null);
                    }, 200);
                  }}
                />
                {activeIngredientId === ingredient.id && ingredientSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <FlatList
                      data={ingredientSuggestions}
                      keyExtractor={(item, index) => `${ingredient.id}-suggestion-${index}`}
                      renderItem={({ item }) => (
                        <Pressable
                          style={styles.suggestionItem}
                          onPress={() => selectIngredientSuggestion(ingredient.id, item)}
                        >
                          <Search size={14} color={Colors.textLight} />
                          <Text style={styles.suggestionText}>{item}</Text>
                        </Pressable>
                      )}
                      style={styles.suggestionsList}
                      nestedScrollEnabled
                    />
                  </View>
                )}
              </View>
              
              <View style={styles.quantityRow}>
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  placeholder="Amount"
                  value={ingredient.quantity.toString()}
                  onChangeText={(value) => updateIngredient(ingredient.id, 'quantity', parseFloat(value) || 0)}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={[styles.input, styles.unitInput]}
                  placeholder="Unit"
                  value={ingredient.unit}
                  onChangeText={(value) => updateIngredient(ingredient.id, 'unit', value)}
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              {/* Manual nutrition inputs */}
              <View style={styles.nutritionInputs}>
                <TextInput
                  style={[styles.input, styles.nutritionInput]}
                  placeholder="Cal"
                  value={ingredient.calories?.toString() || ''}
                  onChangeText={(value) => updateIngredient(ingredient.id, 'calories', parseFloat(value) || 0)}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={[styles.input, styles.nutritionInput]}
                  placeholder="Protein"
                  value={ingredient.protein?.toString() || ''}
                  onChangeText={(value) => updateIngredient(ingredient.id, 'protein', parseFloat(value) || 0)}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={[styles.input, styles.nutritionInput]}
                  placeholder="Carbs"
                  value={ingredient.carbs?.toString() || ''}
                  onChangeText={(value) => updateIngredient(ingredient.id, 'carbs', parseFloat(value) || 0)}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={[styles.input, styles.nutritionInput]}
                  placeholder="Fat"
                  value={ingredient.fat?.toString() || ''}
                  onChangeText={(value) => updateIngredient(ingredient.id, 'fat', parseFloat(value) || 0)}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </View>
          </View>
        ))}

        <Pressable onPress={addIngredient} style={styles.addIngredientButton}>
          <Plus size={16} color={Colors.primary} />
          <Text style={styles.addIngredientText}>Add Another Ingredient</Text>
        </Pressable>
      </View>

      {/* Manual Calories Override */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Pressable 
            onPress={() => setUseManualCalories(!useManualCalories)}
            style={[styles.checkbox, useManualCalories && styles.checkboxChecked]}
          >
            {useManualCalories && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>
          <Text style={styles.toggleLabel}>Override with manual calories</Text>
        </View>

        {useManualCalories && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total Calories</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter total calories"
              value={manualCalories}
              onChangeText={setManualCalories}
              keyboardType="numeric"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        )}
      </View>

      {/* Nutrition Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nutrition Summary (Per Serving)</Text>
        <View style={styles.nutritionSummary}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{totalNutrition.calories}</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{totalNutrition.protein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{totalNutrition.carbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{totalNutrition.fat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{totalNutrition.fiber}g</Text>
            <Text style={styles.nutritionLabel}>Fiber</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Add to Meal Plan</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  calculateButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  ingredientRow: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ingredientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  removeButton: {
    padding: 4,
  },
  ingredientInputs: {
    gap: 8,
  },
  ingredientNameContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  ingredientNameInput: {
    marginBottom: 0,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 150,
    zIndex: 1000,
    elevation: 5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    maxHeight: 150,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.text,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quantityInput: {
    flex: 2,
  },
  unitInput: {
    flex: 1,
  },
  nutritionInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  nutritionInput: {
    flex: 1,
    fontSize: 14,
    padding: 8,
  },
  addIngredientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    gap: 8,
  },
  addIngredientText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  nutritionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  nutritionItem: {
    alignItems: 'center',
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
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: '500',
    fontSize: 16,
  },
  submitButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});