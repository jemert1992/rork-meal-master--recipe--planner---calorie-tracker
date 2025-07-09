import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipeStore';
import { useMealPlanStore } from '@/store/mealPlanStore';
import RecipeCard from '@/components/RecipeCard';
import Colors from '@/constants/colors';

export default function AddMealScreen() {
  const { date, mealType } = useLocalSearchParams<{ date: string; mealType?: string }>();
  const router = useRouter();
  const { recipes } = useRecipeStore();
  const { addMeal, isRecipeUsedInMealPlan } = useMealPlanStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  
  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleSelectRecipe = (recipeId: string, recipeName: string) => {
    // Check if recipe is already used in meal plan
    if (isRecipeUsedInMealPlan(recipeId)) {
      Alert.alert(
        'Recipe Already Used',
        'This recipe is already used in your meal plan. Please choose a different recipe.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (mealType && ['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      addMeal(date, mealType as 'breakfast' | 'lunch' | 'dinner', { 
        recipeId, 
        name: recipeName 
      });
    }
    router.back();
  };
  
  const handleAddCustomMeal = () => {
    if (!customName.trim()) return;
    
    const calories = parseInt(customCalories);
    
    if (mealType && ['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      addMeal(date, mealType as 'breakfast' | 'lunch' | 'dinner', { 
        name: customName.trim(),
        calories: isNaN(calories) ? undefined : calories
      });
    }
    router.back();
  };

  const formattedMealType = mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : "Meal";
  
  // Handle undefined mealType
  if (!mealType) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Invalid meal type</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <X size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>
            Add {formattedMealType}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.subtitle}>Select a recipe or add a custom meal</Text>
      </View>
      
      {showCustomForm ? (
        <View style={styles.customFormContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Add Custom Meal</Text>
            <Pressable onPress={() => setShowCustomForm(false)}>
              <X size={24} color={Colors.textLight} />
            </Pressable>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Meal name"
            value={customName}
            onChangeText={setCustomName}
            placeholderTextColor={Colors.textLight}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Calories (optional)"
            value={customCalories}
            onChangeText={setCustomCalories}
            keyboardType="numeric"
            placeholderTextColor={Colors.textLight}
          />
          
          <Pressable 
            style={[styles.addButton, !customName.trim() && styles.addButtonDisabled]} 
            onPress={handleAddCustomMeal}
            disabled={!customName.trim()}
          >
            <Text style={styles.addButtonText}>Add to Meal Plan</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search recipes..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>
          
          <Pressable 
            style={styles.customMealButton} 
            onPress={() => setShowCustomForm(true)}
          >
            <Text style={styles.customMealButtonText}>+ Add Custom Meal</Text>
          </Pressable>
          
          <FlatList
            data={filteredRecipes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleSelectRecipe(item.id, item.name)}>
                <RecipeCard recipe={item} compact />
              </Pressable>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recipes found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or add a custom meal</Text>
              </View>
            }
          />
        </>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  customMealButton: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  customMealButtonText: {
    color: Colors.primary,
    fontWeight: '500',
    fontSize: 16,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  customFormContainer: {
    margin: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: Colors.primaryLight,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});