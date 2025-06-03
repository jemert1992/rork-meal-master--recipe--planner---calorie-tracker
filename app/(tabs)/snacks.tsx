import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Heart, BookmarkPlus, Star } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipeStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import { SnackItem } from '@/types';

export default function SnacksScreen() {
  const { recipes, favoriteRecipeIds, toggleFavorite, isLoading } = useRecipeStore();
  const { profile } = useUserStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [snacks, setSnacks] = useState<SnackItem[]>([]);
  
  // Categories specific to snacks
  const snackCategories = [
    'sweet', 'savory', 'healthy', 'protein', 'fruit', 'nuts', 
    'chocolate', 'baked', 'chips', 'energy', 'bars', 'yogurt'
  ];
  
  // Filter recipes to only include snacks
  useEffect(() => {
    const snackRecipes = recipes.filter(recipe => 
      recipe.tags.some(tag => 
        tag.toLowerCase() === 'snack' || 
        tag.toLowerCase() === 'dessert' ||
        tag.toLowerCase() === 'treat' ||
        tag.toLowerCase() === 'appetizer'
      ) ||
      recipe.name.toLowerCase().includes('snack') ||
      recipe.name.toLowerCase().includes('cookie') ||
      recipe.name.toLowerCase().includes('bar') ||
      recipe.name.toLowerCase().includes('bite') ||
      recipe.calories && recipe.calories < 300 // Snacks typically have fewer calories
    );
    
    // Convert recipes to snack items
    const snackItems: SnackItem[] = snackRecipes.map(recipe => ({
      id: recipe.id,
      name: recipe.name,
      image: recipe.image,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
      isFavorite: favoriteRecipeIds.includes(recipe.id)
    }));
    
    setSnacks(snackItems);
  }, [recipes, favoriteRecipeIds]);
  
  // Filter snacks based on search query, favorites, and category
  const filteredSnacks = snacks.filter(snack => {
    const matchesSearch = searchQuery.trim() === '' || 
      snack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snack.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFavorite = filterFavorites ? snack.isFavorite : true;
    
    const matchesCategory = selectedCategory ? 
      snack.tags.some(tag => tag.toLowerCase() === selectedCategory.toLowerCase()) : 
      true;
    
    return matchesSearch && matchesFavorite && matchesCategory;
  });
  
  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
  };
  
  const renderSnackItem = ({ item }: { item: SnackItem }) => (
    <View style={styles.snackCard}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.snackImage} />
      ) : (
        <View style={styles.snackImagePlaceholder}>
          <Star size={24} color={Colors.backgroundLight} />
        </View>
      )}
      
      <View style={styles.snackContent}>
        <Text style={styles.snackName}>{item.name}</Text>
        
        <View style={styles.snackDetails}>
          {item.calories !== undefined && (
            <Text style={styles.snackCalories}>{item.calories} calories</Text>
          )}
          
          <View style={styles.macros}>
            {item.protein !== undefined && (
              <Text style={styles.macroText}>P: {item.protein}g</Text>
            )}
            {item.carbs !== undefined && (
              <Text style={styles.macroText}>C: {item.carbs}g</Text>
            )}
            {item.fat !== undefined && (
              <Text style={styles.macroText}>F: {item.fat}g</Text>
            )}
          </View>
        </View>
        
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <Pressable 
        style={styles.favoriteButton}
        onPress={() => handleToggleFavorite(item.id)}
      >
        <Heart 
          size={20} 
          color={item.isFavorite ? Colors.error : Colors.textLight} 
          fill={item.isFavorite ? Colors.error : 'none'} 
        />
      </Pressable>
    </View>
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
            placeholder="Search snacks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textLight}
          />
        </View>
        <Pressable 
          style={[styles.filterButton, filterFavorites && styles.filterButtonActive]} 
          onPress={() => setFilterFavorites(!filterFavorites)}
        >
          <Heart size={20} color={filterFavorites ? Colors.white : Colors.text} />
        </Pressable>
      </View>
      
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          <Pressable
            style={[
              styles.categoryChip,
              selectedCategory === null && styles.categoryChipSelected
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === null && styles.categoryTextSelected
              ]}
            >
              All
            </Text>
          </Pressable>
          
          {snackCategories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipSelected
              ]}
              onPress={() => setSelectedCategory(category === selectedCategory ? null : category)}
            >
              <Text 
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextSelected
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading snacks...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSnacks}
          keyExtractor={(item) => item.id}
          renderItem={renderSnackItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No snacks found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const ScrollView = require('react-native').ScrollView;

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
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.text,
  },
  categoryTextSelected: {
    color: Colors.white,
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  snackCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  snackImage: {
    width: 100,
    height: 100,
  },
  snackImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snackContent: {
    flex: 1,
    padding: 12,
  },
  snackName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  snackDetails: {
    marginBottom: 8,
  },
  snackCalories: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  macros: {
    flexDirection: 'row',
    marginTop: 2,
  },
  macroText: {
    fontSize: 12,
    color: Colors.textLight,
    marginRight: 8,
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
  favoriteButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});