import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { Recipe } from '@/types';
import { useRecipeStore } from '@/store/recipeStore';
import Colors from '@/constants/colors';

type RecipeCardProps = {
  recipe: Recipe;
  compact?: boolean;
};

export default function RecipeCard({ recipe, compact = false }: RecipeCardProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useRecipeStore();
  const favorite = isFavorite(recipe.id);

  const handlePress = () => {
    router.push(`/recipe/${recipe.id}`);
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    toggleFavorite(recipe.id);
  };

  if (compact) {
    return (
      <Pressable 
        style={styles.compactContainer} 
        onPress={handlePress}
      >
        <Image source={{ uri: recipe.image }} style={styles.compactImage} />
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>{recipe.name}</Text>
          <Text style={styles.compactCalories}>{recipe.calories} cal</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable 
      style={styles.container} 
      onPress={handlePress}
    >
      <Image source={{ uri: recipe.image }} style={styles.image} />
      <Pressable 
        style={styles.favoriteButton} 
        onPress={handleFavoritePress}
        hitSlop={10}
      >
        <Heart 
          size={24} 
          color={favorite ? Colors.error : Colors.white} 
          fill={favorite ? Colors.error : 'transparent'} 
        />
      </Pressable>
      <View style={styles.content}>
        <Text style={styles.title}>{recipe.name}</Text>
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.calories}</Text>
            <Text style={styles.metaLabel}>calories</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.prepTime}</Text>
            <Text style={styles.metaLabel}>prep time</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.servings}</Text>
            <Text style={styles.metaLabel}>servings</Text>
          </View>
        </View>
        <View style={styles.tagsContainer}>
          {recipe.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  metaDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary,
  },
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  compactImage: {
    width: 80,
    height: 80,
  },
  compactContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  compactCalories: {
    fontSize: 14,
    color: Colors.primary,
  },
});