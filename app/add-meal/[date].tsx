import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, Pressable, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipeStore';
import { useMealPlanStore } from '@/store/mealPlanStore';
import RecipeCard from '@/components/RecipeCard';
import CustomMealForm from '@/components/CustomMealForm';
import Colors from '@/constants/colors';
import { MealItem } from '@/types';

export default function AddMealScreen() {
  const { date, mealType } = useLocalSearchParams<{ date: string; mealType?: string }>();
  const router = useRouter();
  const { recipes } = useRecipeStore();
  const { addMeal, isRecipeUsedInMealPlan } = useMealPlanStore();
  
  const [searchQuery, setSearchQuery] = useState('');
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
    
    if (validMealType) {
      addMeal(date, validMealType, { 
        recipeId, 
        name: recipeName 
      });
    }
    router.back();
  };
  
  const handleAddCustomMeal = (customMeal: MealItem) => {
    if (validMealType) {
      addMeal(date, validMealType, customMeal);
    }
    router.back();
  };

  const validMealType = useMemo(() => (mealType && ['breakfast','lunch','dinner'].includes(mealType) ? (mealType as 'breakfast'|'lunch'|'dinner') : null), [mealType]);

  const formattedMealType = validMealType ? validMealType.charAt(0).toUpperCase() + validMealType.slice(1) : 'Meal';

  if (!validMealType) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <X size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.title}>Pick meal type</Text>
            <View style={styles.placeholder} />
          </View>
          <Text style={styles.subtitle}>Choose where to add this recipe</Text>
        </View>
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {(['breakfast','lunch','dinner'] as const).map((slot) => (
            <Pressable
              key={`choose-${slot}`}
              style={[styles.customMealButton, { borderStyle: 'solid' }]}
              onPress={() => router.replace(`/add-meal/${date}?mealType=${slot}`)}
              accessibilityRole="button"
              accessibilityLabel={`Add to ${slot}`}
            >
              <Text style={[styles.customMealButtonText, { fontWeight: '700' }]}>Add to {slot}</Text>
            </Pressable>
          ))}
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
      
      <Modal
        visible={showCustomForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <CustomMealForm
            onSubmit={handleAddCustomMeal}
            onCancel={() => setShowCustomForm(false)}
          />
        </SafeAreaView>
      </Modal>
      
      {!showCustomForm && (
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
            keyExtractor={(item, index) => item.id || `recipe-${index}`}
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

});