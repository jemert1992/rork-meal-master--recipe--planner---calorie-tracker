import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import type { FlatList as FlatListType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, RefreshCw, ChevronRight, Database, Cloud } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipeStore';
import { useGroceryStore } from '@/store/groceryStore';
import RecipeCard from '@/components/RecipeCard';
import WeeklyMealPlanner from '@/components/WeeklyMealPlanner';
import { generateGroceryList } from '@/utils/generateGroceryList';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import OneShotOnboardingCard, { getOneShotSeen } from '@/components/OneShotOnboardingCard';
import SnacksBanner from '@/components/SnacksBanner';

import { useTutorialStore } from '@/store/tutorialStore';
import { useUserStore } from '@/store/userStore';
import { useTutorialRef } from '@/hooks/useTutorialRef';
import { Recipe, RecipeFilters, RecipeCategory } from '@/types';
import * as edamamService from '@/services/edamamService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to get time-based greeting
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

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

// Recipe categories with immutable structure
const initialRecipeCategories = [
  { id: 'breakfast', name: 'Breakfast', count: 0, image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  { id: 'lunch', name: 'Lunch', count: 0, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  { id: 'dinner', name: 'Dinner', count: 0, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  { id: 'vegetarian', name: 'Vegetarian', count: 0, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  { id: 'vegan', name: 'Vegan', count: 0, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
  { id: 'low-carb', name: 'Low Carb', count: 0, image: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
];

export default function RecipesScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatListType<any>>(null);
  const { showTutorial, tutorialCompleted, startTutorial, skipTutorial, resetTutorial } = useTutorialStore();
  const { isLoggedIn, profile } = useUserStore();
  
  // Register tutorial refs
  const searchInputRef = useTutorialRef('search-input');
  const quickActionsRef = useTutorialRef('quick-actions');
  
  const { 
    recipes, 
    favoriteRecipeIds, 
    isLoading, 
    loadRecipesFromApi,
    searchRecipes,
    filterRecipes,
    loadMoreRecipes,
    pagination,
    useFirestore,
    setUseFirestore,
    apiSources
  } = useRecipeStore();
  
  const { mealPlan } = useMealPlanStore();
  const { setGroceryItems } = useGroceryStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recipeCategories, setRecipeCategories] = useState(initialRecipeCategories);
  const [displayedRecipes, setDisplayedRecipes] = useState<Recipe[]>([]);
  const [edamamConfigured, setEdamamConfigured] = useState(false);
  const [showIntro, setShowIntro] = useState<boolean>(false);
  
  useEffect(() => {
    let mounted = true;
    const decideIntro = async () => {
      try {
        const seen = await getOneShotSeen();
        if (!seen && isLoggedIn && (profile.onboardingCompleted ?? false)) {
          if (mounted) setShowIntro(true);
        }
      } catch (e) {
        console.log('decideIntro error', e);
      }
    };
    decideIntro();
    return () => { mounted = false; };
  }, [isLoggedIn, profile.onboardingCompleted]);
  
  // GUARD: Check Edamam credentials only once on mount
  useEffect(() => {
    const checkEdamamCredentials = async () => {
      const isConfigured = await edamamService.checkEdamamCredentials();
      setEdamamConfigured(isConfigured);
    };
    
    checkEdamamCredentials();
  }, []);

  // GUARD: Auto-start tutorial only once for new users after onboarding
  const hasAutoStartedTutorial = useRef(false);
  useEffect(() => {
    if (isLoggedIn && profile.onboardingCompleted && !tutorialCompleted && !showTutorial && !hasAutoStartedTutorial.current) {
      hasAutoStartedTutorial.current = true;
      // Show tutorial after a brief delay to let the user see the main screen first
      const timer = setTimeout(() => {
        console.log('Auto-starting tutorial for new user');
        startTutorial();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, profile.onboardingCompleted, tutorialCompleted, showTutorial, startTutorial]);

  // GUARD: Update category counts only when recipes change
  useEffect(() => {
    const updatedCategories = initialRecipeCategories.map(category => {
      let count = 0;
      
      if (category.id === 'breakfast' || category.id === 'lunch' || category.id === 'dinner') {
        count = recipes.filter(recipe => recipe.mealType === category.id).length;
      } else {
        count = recipes.filter(recipe => 
          recipe.tags.includes(category.id) || 
          recipe.dietaryPreferences?.includes(category.id as any)
        ).length;
      }
      
      return { ...category, count };
    });
    
    setRecipeCategories(updatedCategories);
  }, [recipes]);

  // GUARD: Load recipes from API only once on mount
  const hasLoadedRecipes = useRef(false);
  useEffect(() => {
    if (!hasLoadedRecipes.current) {
      hasLoadedRecipes.current = true;
      loadRecipesFromApi();
    }
  }, [loadRecipesFromApi]);

  // GUARD: Update displayed recipes only when search results or filters change
  useEffect(() => {
    const updateDisplayedRecipes = async () => {
      const dedupe = (arr: Recipe[]): Recipe[] => [...new Map(arr.map(r => [r.id, r])).values()];
      if (searchQuery.trim().length >= 2) {
        setDisplayedRecipes(dedupe(searchResults));
      } else {
        const filteredRecipes = await filterRecipes(filters);
        setDisplayedRecipes(dedupe(filteredRecipes));
      }
    };
    
    updateDisplayedRecipes();
  }, [searchResults, filters, searchQuery, filterRecipes]);

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

  // GUARD: Handle search with debounce - only when search query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, performSearch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecipesFromApi(false);
    setRefreshing(false);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    
    if (categoryId === selectedCategory) {
      setFilters({...filters, mealType: undefined, dietaryPreference: undefined});
    } else if (categoryId === 'breakfast' || categoryId === 'lunch' || categoryId === 'dinner') {
      setFilters({...filters, mealType: categoryId as 'breakfast' | 'lunch' | 'dinner', dietaryPreference: undefined});
    } else {
      // For other categories like vegetarian, vegan, etc.
      setFilters({...filters, dietaryPreference: categoryId, mealType: undefined});
    }
    
    // Scroll to top when changing category
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const handleFilterToggle = () => {
    setFilters({...filters, favorite: !filters.favorite});
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

  const handleLoadMore = () => {
    if (!isLoading && !refreshing && pagination.hasMore && !pagination.loading) {
      loadMoreRecipes(filters);
    }
  };

  const toggleDataSource = () => {
    setUseFirestore(!useFirestore);
    // Reload recipes with the new data source
    loadRecipesFromApi(false);
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
        
        // Scroll to top when changing collection
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
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
    <View>
      <View style={{ marginHorizontal: 20, marginBottom: 8 }} testID="weekly-planner">
        <WeeklyMealPlanner onGenerateGroceryList={handleGenerateGroceryList} />
      </View>
      
      <View style={[styles.sectionHeader, { marginHorizontal: 20 }]}>
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
      
      <View style={[styles.sectionHeader, { marginHorizontal: 20 }]}>
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
      
      <View style={{ marginHorizontal: 20, marginVertical: 12 }}>
        <SnacksBanner />
      </View>
      
      <View style={[styles.sectionHeader, { marginHorizontal: 20 }]}>
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
    </View>
  );

  const renderFooter = () => {
    if (!pagination.loading) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerText}>Loading more recipes...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()}, {profile.name || 'there'}! 👋</Text>
            <Text style={styles.subtitle}>Ready to plan some delicious meals?</Text>
          </View>
          <Pressable 
            style={styles.helpButton}
            onPress={() => {
              console.log('Help button pressed, starting tutorial');
              startTutorial();
            }}
          >
            <Text style={styles.helpButtonText}>Tutorial</Text>
          </Pressable>
        </View>
        
        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Object.values(mealPlan).filter(day => day.breakfast || day.lunch || day.dinner).length}</Text>
            <Text style={styles.statLabel}>Days Planned</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{favoriteRecipeIds.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{recipes.length}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View ref={quickActionsRef} style={styles.quickActions} testID="quick-actions">
        <Pressable style={styles.quickActionButton} onPress={() => router.push('/add-meal/today')}>
          <Text style={styles.quickActionEmoji}>🍽️</Text>
          <Text style={styles.quickActionText}>Add Meal</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={handleGenerateGroceryList}>
          <Text style={styles.quickActionEmoji}>🛒</Text>
          <Text style={styles.quickActionText}>Grocery List</Text>
        </Pressable>
        <Pressable style={styles.quickActionButton} onPress={() => setFilters({...filters, favorite: true})}>
          <Text style={styles.quickActionEmoji}>❤️</Text>
          <Text style={styles.quickActionText}>Favorites</Text>
        </Pressable>
      </View>
      
      <View style={styles.searchContainer}>
        <View ref={searchInputRef} style={styles.searchInputContainer} testID="search-input">
          <Search size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for recipes, ingredients, or cuisines..."
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
          <Filter size={20} color={filters.favorite ? Colors.white : Colors.textSecondary} />
        </Pressable>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading recipes...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={displayedRecipes}
          keyExtractor={(item, index) => (item?.id && item.id.length > 0 ? String(item.id) : `${item?.name ?? 'recipe'}-${index}`)}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recipes found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery.trim().length >= 2 
                  ? 'Try different keywords or check your spelling'
                  : filters.favorite 
                    ? 'Start favoriting recipes by tapping the heart icon'
                    : 'Try refreshing or adjusting your filters'
                }
              </Text>
              <Pressable style={styles.refreshButton} onPress={handleRefresh}>
                <RefreshCw size={16} color={Colors.white} />
                <Text style={styles.refreshButtonText}>Refresh Recipes</Text>
              </Pressable>
            </View>
          }
        />
      )}

      <OneShotOnboardingCard
        visible={showIntro}
        onClose={() => setShowIntro(false)}
      />
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
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  helpButton: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  helpButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    minWidth: 80,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '400',
    flex: 1,
  },
  dataSourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataSourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dataSourceText: {
    fontSize: 11,
    color: Colors.primary,
    marginLeft: 3,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.backgroundLight,
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  listContent: {
    paddingBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  categoryItem: {
    width: 120,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  categoryName: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
    padding: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryCount: {
    color: Colors.white,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingBottom: 10,
    opacity: 0.9,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  collectionsContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  collectionItem: {
    width: 280,
    height: 160,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
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
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  collectionDescription: {
    color: Colors.white,
    fontSize: 13,
    marginBottom: 12,
    opacity: 0.95,
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  collectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  collectionButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
});