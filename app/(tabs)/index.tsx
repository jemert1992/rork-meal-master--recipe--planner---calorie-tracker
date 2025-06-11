import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, RefreshCw, ChevronRight, Database, Cloud, Key, Crown } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipeStore';
import { useGroceryStore } from '@/store/groceryStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import RecipeCard from '@/components/RecipeCard';
import WeeklyMealPlanner from '@/components/WeeklyMealPlanner';
import { generateGroceryList } from '@/utils/generateGroceryList';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import SnacksBanner from '@/components/SnacksBanner';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { Recipe, RecipeFilters, RecipeCategory } from '@/types';
import { PREMIUM_FEATURES, FREE_TIER_LIMITS } from '@/types/subscription';
import * as edamamService from '@/services/edamamService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const flatListRef = useRef<FlatList>(null);
  
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
  const { checkFeatureAccess, subscription } = useSubscriptionStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recipeCategories, setRecipeCategories] = useState(initialRecipeCategories);
  const [displayedRecipes, setDisplayedRecipes] = useState<Recipe[]>([]);
  const [edamamConfigured, setEdamamConfigured] = useState(false);
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);
  const [recipesShownToday, setRecipesShownToday] = useState(0);

  // Check if user has access to unlimited recipes
  const hasUnlimitedRecipes = checkFeatureAccess(PREMIUM_FEATURES.UNLIMITED_RECIPES);
  
  // Check if Edamam credentials are configured
  useEffect(() => {
    const checkEdamamCredentials = async () => {
      const isConfigured = await edamamService.checkEdamamCredentials();
      setEdamamConfigured(isConfigured);
    };
    
    checkEdamamCredentials();
  }, []);

  // Track recipes shown today for free tier limits
  useEffect(() => {
    if (!hasUnlimitedRecipes) {
      const trackRecipesShown = async () => {
        const today = new Date().toISOString().split('T')[0];
        const storedCount = await AsyncStorage.getItem(`recipes_shown_${today}`);
        
        if (storedCount) {
          setRecipesShownToday(parseInt(storedCount));
        } else {
          setRecipesShownToday(0);
          await AsyncStorage.setItem(`recipes_shown_${today}`, '0');
        }
      };
      
      trackRecipesShown();
    }
  }, [hasUnlimitedRecipes]);

  // Update category counts
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

  // Load recipes from API on first render
  useEffect(() => {
    loadRecipesFromApi();
  }, []);

  // Update displayed recipes when filters or search results change
  useEffect(() => {
    const updateDisplayedRecipes = async () => {
      if (searchQuery.trim().length >= 2) {
        setDisplayedRecipes(searchResults);
      } else {
        const filteredRecipes = await filterRecipes(filters);
        
        // Apply free tier limits if needed
        if (!hasUnlimitedRecipes && filteredRecipes.length > 0) {
          // If user has seen the daily limit, show subscription banner
          if (recipesShownToday >= FREE_TIER_LIMITS.RECIPES_PER_DAY) {
            setShowSubscriptionBanner(true);
            // Only show the first few recipes
            setDisplayedRecipes(filteredRecipes.slice(0, FREE_TIER_LIMITS.RECIPES_PER_DAY));
          } else {
            setShowSubscriptionBanner(false);
            setDisplayedRecipes(filteredRecipes);
            
            // Update the count of recipes shown today
            const newCount = recipesShownToday + filteredRecipes.length;
            setRecipesShownToday(newCount);
            const today = new Date().toISOString().split('T')[0];
            await AsyncStorage.setItem(`recipes_shown_${today}`, newCount.toString());
          }
        } else {
          setShowSubscriptionBanner(false);
          setDisplayedRecipes(filteredRecipes);
        }
      }
    };
    
    updateDisplayedRecipes();
  }, [searchResults, filters, filterRecipes, hasUnlimitedRecipes, recipesShownToday]);

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
    // Check if user has access to grocery list generation
    if (!checkFeatureAccess(PREMIUM_FEATURES.GROCERY_LIST)) {
      Alert.alert(
        'Premium Feature',
        'Grocery list generation is a premium feature. Upgrade to Premium to unlock this feature.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/subscription') }
        ]
      );
      return;
    }
    
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

  const handleSubscriptionPress = () => {
    router.push('/subscription');
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

  const renderCollectionItem = ({ item }: { item: any }) => (
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
      
      {/* Subscription Banner */}
      {showSubscriptionBanner && (
        <View style={styles.subscriptionBannerContainer}>
          <View style={styles.subscriptionBanner}>
            <View style={styles.subscriptionIconContainer}>
              <Crown size={24} color={Colors.white} />
            </View>
            <View style={styles.subscriptionContent}>
              <Text style={styles.subscriptionTitle}>Unlock Unlimited Recipes</Text>
              <Text style={styles.subscriptionText}>
                You've reached the free limit of {FREE_TIER_LIMITS.RECIPES_PER_DAY} recipes per day. 
                Upgrade to Premium for unlimited access.
              </Text>
              <Pressable 
                style={styles.subscriptionButton}
                onPress={handleSubscriptionPress}
              >
                <Text style={styles.subscriptionButtonText}>Upgrade Now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
      
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
        <Text style={styles.title}>Discover Recipes</Text>
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>Find and save your favorite meals</Text>
          <View style={styles.dataSourceContainer}>
            <Pressable 
              style={styles.dataSourceButton} 
              onPress={toggleDataSource}
            >
              {useFirestore ? (
                <Database size={16} color={Colors.primary} />
              ) : (
                <Cloud size={16} color={Colors.primary} />
              )}
              <Text style={styles.dataSourceText}>
                {useFirestore ? 'Firestore' : 'API'}
              </Text>
            </Pressable>
            
            {apiSources.useEdamam && edamamConfigured && (
              <View style={styles.edamamBadge}>
                <Key size={12} color={Colors.success} />
                <Text style={styles.edamamBadgeText}>Edamam</Text>
              </View>
            )}
            
            {subscription.status === 'active' && (
              <View style={styles.premiumBadge}>
                <Crown size={12} color={Colors.white} />
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>
        </View>
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
          ref={flatListRef}
          data={displayedRecipes}
          keyExtractor={(item) => item.id}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dataSourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataSourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dataSourceText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
  },
  edamamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 6,
  },
  edamamBadgeText: {
    fontSize: 10,
    color: Colors.success,
    marginLeft: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    color: Colors.white,
    marginLeft: 4,
    fontWeight: '500',
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
  subscriptionBannerContainer: {
    marginVertical: 16,
  },
  subscriptionBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  subscriptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  subscriptionContent: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subscriptionText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
  },
  subscriptionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  subscriptionButtonText: {
    color: Colors.white,
    fontWeight: '500',
    fontSize: 14,
  },
});