import React from 'react';
import { StyleSheet, View, Text, ScrollView, FlatList, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, ChevronRight } from 'lucide-react-native';
import RecipeCard from '@/components/RecipeCard';
import WeeklyMealPlanner from '@/components/WeeklyMealPlanner';
import Colors from '@/constants/colors';
import { Recipe } from '@/types';

export default function TutorialRecipesScreen() {
  // Mock recipe data
  const mockRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Avocado Toast with Eggs',
      description: 'Healthy breakfast with protein and healthy fats',
      ingredients: ['2 slices whole grain bread', '1 avocado', '2 eggs', 'salt', 'pepper'],
      instructions: ['Toast bread', 'Mash avocado', 'Fry eggs', 'Assemble'],
      prepTime: 10,
      cookTime: 5,
      servings: 1,
      calories: 420,
      protein: 18,
      carbs: 32,
      fat: 24,
      tags: ['breakfast', 'healthy', 'quick'],
      mealType: 'breakfast',
      image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=300&fit=crop',
      difficulty: 'easy',
      dietaryPreferences: ['vegetarian']
    },
    {
      id: '2',
      name: 'Grilled Chicken Salad',
      description: 'Fresh salad with grilled chicken and mixed vegetables',
      ingredients: ['chicken breast', 'mixed greens', 'tomatoes', 'cucumber', 'olive oil'],
      instructions: ['Grill chicken', 'Prepare vegetables', 'Mix salad', 'Add dressing'],
      prepTime: 15,
      cookTime: 20,
      servings: 2,
      calories: 380,
      protein: 35,
      carbs: 15,
      fat: 18,
      tags: ['lunch', 'healthy', 'high-protein'],
      mealType: 'lunch',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
      difficulty: 'medium',
      dietaryPreferences: ['low-carb']
    },
    {
      id: '3',
      name: 'Mediterranean Bowl',
      description: 'Nutritious bowl with quinoa, vegetables, and tahini dressing',
      ingredients: ['quinoa', 'chickpeas', 'cucumber', 'tomatoes', 'tahini'],
      instructions: ['Cook quinoa', 'Prepare vegetables', 'Make dressing', 'Assemble bowl'],
      prepTime: 20,
      cookTime: 15,
      servings: 2,
      calories: 450,
      protein: 16,
      carbs: 58,
      fat: 18,
      tags: ['dinner', 'vegetarian', 'mediterranean'],
      mealType: 'dinner',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      difficulty: 'medium',
      dietaryPreferences: ['vegetarian', 'vegan']
    }
  ];

  const featuredCollections = [
    {
      id: 'quick-meals',
      name: 'Quick & Easy',
      description: 'Ready in 15 minutes or less',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=200&fit=crop'
    },
    {
      id: 'high-protein',
      name: 'High Protein',
      description: 'Build muscle with these protein-packed recipes',
      image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=200&fit=crop'
    }
  ];

  const recipeCategories = [
    { id: 'breakfast', name: 'Breakfast', count: 1, image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&h=150&fit=crop' },
    { id: 'lunch', name: 'Lunch', count: 1, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop' },
    { id: 'dinner', name: 'Dinner', count: 1, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=200&h=150&fit=crop' },
    { id: 'vegetarian', name: 'Vegetarian', count: 2, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=150&fit=crop' }
  ];

  const renderCategoryItem = ({ item }: { item: typeof recipeCategories[0] }) => (
    <Pressable style={styles.categoryItem}>
      <Image source={{ uri: item.image }} style={styles.categoryImage} />
      <View style={styles.categoryOverlay} />
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryCount}>{item.count} recipes</Text>
    </Pressable>
  );

  const renderCollectionItem = ({ item }: { item: typeof featuredCollections[0] }) => (
    <Pressable style={styles.collectionItem}>
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Recipes</Text>
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>Find and save your favorite meals</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Search recipes or tags...</Text>
        </View>
        <Pressable style={styles.filterButton}>
          <Filter size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ marginHorizontal: 20, marginBottom: 8 }}>
          <WeeklyMealPlanner onGenerateGroceryList={() => {}} />
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
        
        <View style={[styles.sectionHeader, { marginHorizontal: 20 }]}>
          <Text style={styles.sectionTitle}>All Recipes</Text>
        </View>

        <View style={styles.recipesContainer}>
          {mockRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </View>

        {/* AI Features Section */}
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>AI-Powered Features</Text>
          
          <View style={styles.aiFeatureCard}>
            <Text style={styles.aiFeatureTitle}>🤖 Smart Recommendations</Text>
            <Text style={styles.aiFeatureDescription}>
              Get personalized recipe suggestions based on your dietary preferences, past favorites, and nutrition goals.
            </Text>
          </View>

          <View style={styles.aiFeatureCard}>
            <Text style={styles.aiFeatureTitle}>🔍 Intelligent Search</Text>
            <Text style={styles.aiFeatureDescription}>
              Find recipes by ingredients you have, cooking time, difficulty level, or dietary restrictions.
            </Text>
          </View>

          <View style={styles.aiFeatureCard}>
            <Text style={styles.aiFeatureTitle}>📊 Nutrition Analysis</Text>
            <Text style={styles.aiFeatureDescription}>
              Automatically calculate calories, macros, and nutrients for every recipe with detailed breakdowns.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: Colors.textLight,
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
  content: {
    flex: 1,
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
  recipesContainer: {
    paddingHorizontal: 20,
  },
  aiSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginTop: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  aiFeatureCard: {
    marginBottom: 16,
  },
  aiFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  aiFeatureDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '400',
  },
});