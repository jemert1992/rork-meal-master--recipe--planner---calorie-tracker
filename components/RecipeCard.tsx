import React from 'react';
import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Clock, Users } from 'lucide-react-native';
import { Recipe, FitnessGoal, DietaryPreference } from '@/types';
import { useRecipeStore } from '@/store/recipeStore';
import Colors from '@/constants/colors';

type RecipeCardProps = {
  recipe: Recipe;
  compact?: boolean;
};

// Type guard functions to check if a string is a valid dietary preference or fitness goal
const isDietaryPreference = (value: string): value is DietaryPreference => {
  const validDietaryPreferences: DietaryPreference[] = [
    'vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free', 'dairy-free', 'low-carb', 'high-protein'
  ];
  return validDietaryPreferences.includes(value as DietaryPreference);
};

const isFitnessGoal = (value: string): value is FitnessGoal => {
  const validFitnessGoals: FitnessGoal[] = [
    'weight-loss', 'muscle-gain', 'general-health', 'heart-health', 'energy-boost', 'high-protein'
  ];
  return validFitnessGoals.includes(value as FitnessGoal);
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

  // Determine which tags to display (prioritize dietary preferences and fitness goals)
  const displayTags: string[] = [];
  
  // Add dietary preferences if they exist and are valid
  if (recipe.dietaryPreferences) {
    recipe.dietaryPreferences.forEach(pref => {
      if (typeof pref === 'string' && isDietaryPreference(pref)) {
        displayTags.push(pref);
      }
    });
  }
  
  // Add fitness goals if they exist and are valid
  if (recipe.fitnessGoals) {
    recipe.fitnessGoals.forEach(goal => {
      if (isFitnessGoal(goal)) {
        displayTags.push(goal);
      }
    });
  }
  
  // If we don't have enough dietary preferences or fitness goals, add some regular tags
  if (displayTags.length < 3 && recipe.tags.length > 0) {
    const regularTags = recipe.tags.filter(tag => 
      !displayTags.includes(tag) && 
      tag !== recipe.mealType && 
      tag !== recipe.complexity
    );
    
    // Add up to 3 regular tags
    for (let i = 0; i < regularTags.length && displayTags.length < 3; i++) {
      displayTags.push(regularTags[i]);
    }
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
          color={favorite ? Colors.error : Colors.textSecondary} 
          fill={favorite ? Colors.error : 'transparent'} 
        />
      </Pressable>
      
      {recipe.mealType && (
        <View style={styles.mealTypeTag}>
          <Text style={styles.mealTypeText}>{recipe.mealType}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{recipe.name}</Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{recipe.calories}</Text>
            <Text style={styles.metaLabel}>calories</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Clock size={16} color={Colors.primary} style={styles.metaIcon} />
            <Text style={styles.metaText}>{recipe.prepTime}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Users size={16} color={Colors.primary} style={styles.metaIcon} />
            <Text style={styles.metaText}>{recipe.servings}</Text>
          </View>
        </View>
        
        <View style={styles.tagsContainer}>
          {displayTags.slice(0, 3).map((tag, index) => (
            <View key={`${recipe.id}-display-tag-${index}`} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          
          {recipe.complexity && (
            <View style={[
              styles.tag, 
              recipe.complexity === 'simple' ? styles.simpleTag : styles.complexTag
            ]}>
              <Text style={[
                styles.tagText,
                recipe.complexity === 'simple' ? styles.simpleTagText : styles.complexTagText
              ]}>
                {recipe.complexity}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  image: {
    width: '100%',
    height: 220,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  mealTypeTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mealTypeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
    height: 52,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  metaValue: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 4,
    fontWeight: '500',
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metaDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  simpleTag: {
    backgroundColor: '#e6f7ee',
  },
  simpleTagText: {
    color: '#2ecc71',
  },
  complexTag: {
    backgroundColor: '#ffeaea',
  },
  complexTagText: {
    color: '#e74c3c',
  },
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  compactImage: {
    width: 90,
    height: 90,
  },
  compactContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  compactCalories: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});