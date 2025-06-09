import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, RefreshCw, ChevronRight } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipeStore';
import { useGroceryStore } from '@/store/groceryStore';
import RecipeCard from '@/components/RecipeCard';
import WeeklyMealPlanner from '@/components/WeeklyMealPlanner';
import { generateGroceryList } from '@/utils/generateGroceryList';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import SnacksBanner from '@/components/SnacksBanner';
import { Recipe, RecipeFilters, RecipeCategory } from '@/types';

// Featured recipe collections
const featuredCollections = [
  {
    id: 'quick-meals',
    name: 'Quick & Easy',
    description: 'Ready in 15 minutes or less',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'high-protein',
    name: 'High Protein',
    description: 'Build muscle with these protein-packed recipes',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'weight-loss',
    name: 'Weight Loss',
    description: 'Healthy, satisfying meals under 400 calories',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  }
];

// Recipe categories
const recipeCategories: RecipeCategory[] = [
  { id: 'breakfast', name: 'Breakfast', count: 0, image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  { id: 'lunch', name: 'Lunch', count: 0, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  { id: 'dinner', name: 'Dinner', count: 0, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  { id: 'vegetarian', name: 'Vegetarian', count: 0, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  { id: 'vegan', name: 'Vegan', count: 0, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  { id: 'low-carb', name: 'Low Carb', count: 0, image: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
];

export default function RecipesScreen() {
  const router = useRouter();
  const { 
    recipes, 
    favoriteRecipeIds, 
    isLoading, 
    loadRecipesFromApi,
    searchRecipes 
  } = useRecipeStore();
  
  const { mealPlan } = useMealPlanStore();
  const { setGroceryItems } = useGroceryStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Update category counts
  useEffect(() => {
    recipeCategories.forEach(category => {
      if (category.id === 'breakfast' || category.id === 'lunch' || category.id === 'dinner') {
        category.count = recipes.filter(recipe => recipe.mealType === category.id).length;
      } else {
        category.count = recipes.filter(recipe => recipe.tags.includes(category.id)).length;
      }
    });
  }, [recipes]);

  // Load recipes from API on first render
  useEffect(() => {
    loadRecipesFromApi();
  }, []);

  // Memoize the search function to prevent recreating it on every render
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length >= 2) {
      setIsSearching(true);
      const results = await searchRecipes(query);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  }, [searchRecipes]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, performSearch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecipesFromApi();
    setRefreshing(false);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    
    if (categoryId === selectedCategory) {
      setFilters({...filters, mealType: null});
    } else if (categoryId === 'breakfast' || categoryId === 'lunch' || categoryId === 'dinner') {
      setFilters({...filters, mealType: categoryId as 'breakfast' | 'lunch' | 'dinner'});
    } else {
      // For other categories like vegetarian, vegan, etc.
      setFilters({...filters, dietaryPreference: categoryId});
    }
  };

  const handleFilterToggle = () => {
    setFilters({...filters, favorite: !filters.favorite});
  };

  // Determine which recipes to display
  const getFilteredRecipes = () => {
    let filteredRecipes = searchQuery.trim().length >= 2 ? searchResults : recipes;
    
    // Apply meal type filter
    if (filters.mealType) {
      filteredRecipes = filteredRecipes.filter(recipe => recipe.mealType === filters.mealType);
    }
    
    // Apply dietary preference filter
    if (filters.dietaryPreference) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        recipe.tags.includes(filters.dietaryPreference!)
      );
    }
    
    // Apply favorites filter
    if (filters.favorite) {
      filteredRecipes = filteredRecipes.filter(recipe => 
        favoriteRecipeIds.includes(recipe.id)
      );
    }
    
    return filteredRecipes;
  };

  const handleGenerateGroceryList = () => {
    // Check if there are any meals planned
    const hasMeals = Object.values(mealPlan).some(day => 
      day.breakfast || day.lunch || day.dinner || (day.snacks && day.snacks.length > 0)
    );
    
    if (!hasMeals) {
      Alert.alert(
        "No Meals Planned",
        "Please add some meals to your meal plan before generating a grocery list.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Generate the grocery list
    const groceryList = generateGroceryList(mealPlan, recipes);
    
    if (groceryList.length === 0) {
      Alert.alert(
        "No Ingredients Found",
        "Could not extract ingredients from your meal plan. Please try adding different recipes.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Update the grocery store
    setGroceryItems(groceryList);
    
    Alert.alert(
      "Grocery List Generated",
      `Successfully created a grocery list with ${groceryList.length} items.`,
      [
        { 
          text: "View List", 
          onPress: () => {
            // Navigate to the grocery list tab
            router.push('/grocery-list');
          }
        },
        { text: "OK" }
      ]
    );
  };

  const renderCategoryItem = ({ item }: { item: RecipeCategory }) => (
    <Pressable 
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemSelected
      ]}
      onPress={() => handleCategoryPress(item.id)}
    >
      <Image source={{ uri: item.image }} style={styles.categoryImage} />
      <View style={styles.categoryOverlay} />
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryCount}>{item.count} recipes</Text>
    </Pressable>
  );

  const renderCollectionItem = ({ item }: { item: typeof featuredCollections[0] }) => (
    <Pressable 
      style={styles.collectionItem}
      onPress={() => {
        // Handle collection press
        if (item.id === 'quick-meals') {
          setFilters({...filters, complexity: 'simple'});
        } else if (item.id === 'high-protein') {
          setFilters({...filters, dietaryPreference: 'high-protein'});
        } else if (item.id === 'weight-loss') {
          setFilters({...filters, fitnessGoal: 'weight-loss'});
        }
      }}
    >
      <Image source={{ uri: item.image }} style={styles.collectionImage} />
      <View style={styles.collectionOverlay} />
      <View style={styles.collectionContent}>
        <Text style={styles.collectionName}>{item.name}</Text>
        <Text style={styles.collectionDescription}>{item.description}</Text>
        <View style={styles.collectionButton}>
          <Text style={styles.collectionButtonText}>View All</Text>
          <ChevronRight size={16} color={Colors.white} />
        </View>
      </View>
    </Pressable>
  );

  const renderListHeader = () => (
    <>
      <WeeklyMealPlanner onGenerateGroceryList={handleGenerateGroceryList} />
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Collections</Text>
      </View>
      
      <FlatList
        data={featuredCollections}
        renderItem={renderCollectionItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.collectionsContainer}
      />
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
      </View>
      
      <FlatList
        data={recipeCategories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      />
      
      <SnacksBanner />
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {searchQuery.trim().length >= 2 
            ? 'Search Results' 
            : filters.favorite 
              ? 'Favorite Recipes' 
              : filters.mealType 
                ? `${filters.mealType.charAt(0).toUpperCase() + filters.mealType.slice(1)} Recipes` 
                : filters.dietaryPreference 
                  ? `${filters.dietaryPreference.charAt(0).toUpperCase() + filters.dietaryPreference.slice(1).replace('-', ' ')} Recipes` 
                  : 'All Recipes'}
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Recipes</Text>
        <Text style={styles.subtitle}>Find and save your favorite meals</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes or tags..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textLight}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.searchLoader} />
          )}
        </View>
        <Pressable 
          style={[styles.filterButton, filters.favorite && styles.filterButtonActive]} 
          onPress={handleFilterToggle}
        >
          <Filter size={20} color={filters.favorite ? Colors.white : Colors.text} />
        </Pressable>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading recipes...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredRecipes()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recipes found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
              <Pressable style={styles.refreshButton} onPress={handleRefresh}>
                <RefreshCw size={16} color={Colors.white} />
                <Text style={styles.refreshButtonText}>Refresh Recipes</Text>
              </Pressable>
            </View>
          }
        />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
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
  searchLoader: {
    marginLeft: 8,
  },
  filterButton: {
    marginLeft: 12,
    backgroundColor: Colors.white,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
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
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: Colors.white,
    fontWeight: '500',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryItem: {
    width: 120,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  categoryItemSelected: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  categoryImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  categoryName: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
    padding: 10,
  },
  categoryCount: {
    color: Colors.white,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingBottom: 10,
    opacity: 0.8,
  },
  collectionsContainer: {
    paddingRight: 20,
  },
  collectionItem: {
    width: 280,
    height: 160,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  collectionImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  collectionOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  collectionContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  collectionName: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  collectionDescription: {
    color: Colors.white,
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.9,
  },
  collectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  collectionButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
});