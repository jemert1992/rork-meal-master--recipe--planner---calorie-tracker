import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Heart, RefreshCw, Info } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { SnackItem } from '@/types';
import Colors from '@/constants/colors';

// Mock snacks data
const mockSnacks: SnackItem[] = [
  {
    id: 'snack-1',
    name: 'Greek Yogurt with Berries',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    calories: 150,
    protein: 15,
    carbs: 20,
    fat: 2,
    tags: ['protein', 'low-fat', 'quick'],
    description: 'Greek yogurt topped with fresh berries and a drizzle of honey.',
  },
  {
    id: 'snack-2',
    name: 'Avocado Toast',
    image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    calories: 220,
    protein: 5,
    carbs: 25,
    fat: 12,
    tags: ['healthy-fats', 'fiber', 'vegetarian'],
    description: 'Whole grain toast topped with mashed avocado, salt, pepper, and red pepper flakes.',
  },
  {
    id: 'snack-3',
    name: 'Protein Smoothie',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a90a0868?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    calories: 250,
    protein: 20,
    carbs: 30,
    fat: 5,
    tags: ['protein', 'post-workout', 'fruit'],
    description: 'Blend of protein powder, banana, berries, spinach, and almond milk.',
  },
  {
    id: 'snack-4',
    name: 'Hummus with Veggies',
    image: 'https://images.unsplash.com/photo-1541095441899-5d96a6da10b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    calories: 180,
    protein: 8,
    carbs: 15,
    fat: 10,
    tags: ['plant-based', 'fiber', 'vegan'],
    description: 'Creamy hummus served with fresh cucumber, carrot, and bell pepper slices.',
  },
  {
    id: 'snack-5',
    name: 'Trail Mix',
    image: 'https://images.unsplash.com/photo-1604210565264-8917562a63d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    calories: 280,
    protein: 10,
    carbs: 25,
    fat: 18,
    tags: ['nuts', 'energy', 'on-the-go'],
    description: 'Mix of almonds, walnuts, dried cranberries, and dark chocolate chips.',
  },
  {
    id: 'snack-6',
    name: 'Apple with Almond Butter',
    image: 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    calories: 200,
    protein: 5,
    carbs: 25,
    fat: 10,
    tags: ['fruit', 'healthy-fats', 'quick'],
    description: 'Sliced apple served with a tablespoon of natural almond butter.',
  },
  {
    id: 'snack-7',
    name: 'Cottage Cheese with Pineapple',
    image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    calories: 160,
    protein: 18,
    carbs: 15,
    fat: 2,
    tags: ['protein', 'low-fat', 'sweet'],
    description: 'Low-fat cottage cheese topped with fresh pineapple chunks.',
  },
  {
    id: 'snack-8',
    name: 'Hard-Boiled Eggs',
    image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    calories: 140,
    protein: 12,
    carbs: 0,
    fat: 10,
    tags: ['protein', 'keto', 'low-carb'],
    description: 'Hard-boiled eggs sprinkled with salt and pepper.',
  },
  {
    id: 'snack-9',
    name: 'Edamame',
    image: 'https://images.unsplash.com/photo-1563411771784-8e6b7f68a0c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    calories: 120,
    protein: 10,
    carbs: 10,
    fat: 5,
    tags: ['plant-protein', 'vegan', 'fiber'],
    description: 'Steamed edamame pods sprinkled with sea salt.',
  },
  {
    id: 'snack-10',
    name: 'Dark Chocolate',
    image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    calories: 170,
    protein: 2,
    carbs: 15,
    fat: 12,
    tags: ['antioxidants', 'treat', 'mood-booster'],
    description: 'Two squares of 70% dark chocolate.',
  },
];

const SnackCard = ({ snack, onToggleFavorite, isFavorite, onViewDetails }: { 
  snack: SnackItem; 
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  onViewDetails: (snack: SnackItem) => void;
}) => {
  return (
    <View style={styles.snackCard}>
      {snack.image && (
        <Image source={{ uri: snack.image }} style={styles.snackImage} />
      )}
      <View style={styles.snackContent}>
        <View style={styles.snackHeader}>
          <Text style={styles.snackName}>{snack.name}</Text>
          <Pressable 
            style={styles.favoriteButton} 
            onPress={() => onToggleFavorite(snack.id)}
          >
            <Heart 
              size={20} 
              color={isFavorite ? Colors.error : Colors.textLight} 
              fill={isFavorite ? Colors.error : 'none'} 
            />
          </Pressable>
        </View>
        
        <Text style={styles.snackDescription}>{snack.description}</Text>
        
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{snack.calories}</Text>
            <Text style={styles.nutritionLabel}>calories</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{snack.protein}g</Text>
            <Text style={styles.nutritionLabel}>protein</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{snack.carbs}g</Text>
            <Text style={styles.nutritionLabel}>carbs</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{snack.fat}g</Text>
            <Text style={styles.nutritionLabel}>fat</Text>
          </View>
        </View>
        
        <View style={styles.tagContainer}>
          {snack.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        <Pressable 
          style={styles.detailsButton}
          onPress={() => onViewDetails(snack)}
        >
          <Info size={16} color={Colors.primary} />
          <Text style={styles.detailsButtonText}>View Details</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default function SnacksScreen() {
  const [snacks, setSnacks] = useState<SnackItem[]>(mockSnacks);
  const [favoriteSnackIds, setFavoriteSnackIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useUserStore();

  // Extract unique categories from snacks
  const categories = [...new Set(
    snacks.flatMap(snack => snack.tags)
      .filter(tag => tag.length > 0)
  )].sort();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load favorites from storage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        // In a real app, you would load from AsyncStorage here
        // For now, we'll just use a mock
        setFavoriteSnackIds(['snack-1', 'snack-5']);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };
    
    loadFavorites();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavoriteSnackIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(snackId => snackId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isFavorite = (id: string) => favoriteSnackIds.includes(id);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleViewDetails = (snack: SnackItem) => {
    // Show a modal with detailed information
    Alert.alert(
      snack.name,
      `${snack.description}\n\nNutrition per serving:\nCalories: ${snack.calories}\nProtein: ${snack.protein}g\nCarbs: ${snack.carbs}g\nFat: ${snack.fat}g`,
      [
        { text: "Close", style: "cancel" },
        { 
          text: "Add to Favorites", 
          onPress: () => toggleFavorite(snack.id),
          style: isFavorite(snack.id) ? "destructive" : "default"
        }
      ]
    );
  };

  // Filter snacks based on search query, favorites filter, and category
  const filteredSnacks = snacks.filter(snack => {
    const matchesSearch = searchQuery.trim() === '' || 
      snack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snack.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      snack.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFavorite = filterFavorites ? favoriteSnackIds.includes(snack.id) : true;
    
    const matchesCategory = selectedCategory ? snack.tags.includes(selectedCategory) : true;
    
    // Filter by dietary preferences if set
    let matchesDiet = true;
    if (profile.dietType && profile.dietType !== 'any') {
      // Check if snack matches diet type
      switch (profile.dietType) {
        case 'vegetarian':
          matchesDiet = snack.tags.some(tag => ['vegetarian', 'vegan'].includes(tag));
          break;
        case 'vegan':
          matchesDiet = snack.tags.includes('vegan');
          break;
        case 'keto':
          matchesDiet = snack.tags.some(tag => ['keto', 'low-carb'].includes(tag));
          break;
        case 'gluten-free':
          matchesDiet = snack.tags.includes('gluten-free');
          break;
        case 'dairy-free':
          matchesDiet = snack.tags.includes('dairy-free');
          break;
        // Add more diet types as needed
      }
    }
    
    return matchesSearch && matchesFavorite && matchesCategory && matchesDiet;
  });

  const renderCategoryItem = ({ item }: { item: string }) => (
    <Pressable
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.categoryItemSelected,
      ]}
      onPress={() => {
        setSelectedCategory(prev => prev === item ? null : item);
      }}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.categoryTextSelected,
        ]}
      >
        {item}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Healthy Snacks</Text>
        <Text style={styles.subtitle}>Discover nutritious between-meal options</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search snacks or tags..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textLight}
            accessibilityLabel="Search snacks"
            accessibilityHint="Enter keywords to search for snacks"
          />
        </View>
        <Pressable 
          style={[styles.filterButton, filterFavorites && styles.filterButtonActive]} 
          onPress={() => setFilterFavorites(!filterFavorites)}
          accessibilityLabel={filterFavorites ? "Show all snacks" : "Show favorites only"}
          accessibilityRole="button"
        >
          <Filter size={20} color={filterFavorites ? Colors.white : Colors.text} />
        </Pressable>
      </View>

      {categories.length > 0 && (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          accessibilityLabel="Categories list"
        />
      )}

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading snacks...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSnacks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SnackCard 
              snack={item} 
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite(item.id)}
              onViewDetails={handleViewDetails}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No snacks found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
              <Pressable 
                style={styles.refreshButton} 
                onPress={handleRefresh}
                accessibilityLabel="Refresh snacks"
                accessibilityRole="button"
              >
                <RefreshCw size={16} color={Colors.white} />
                <Text style={styles.refreshButtonText}>Refresh Snacks</Text>
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
  categoriesList: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryItemSelected: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.text,
  },
  categoryTextSelected: {
    color: Colors.white,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  snackCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  snackImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  snackContent: {
    padding: 16,
  },
  snackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  snackName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  snackDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  nutritionLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundLight,
  },
  detailsButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 6,
    fontWeight: '500',
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
});