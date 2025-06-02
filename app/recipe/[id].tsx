import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Clock, Users, ArrowLeft, Plus } from 'lucide-react-native';
import { useRecipeStore } from '@/store/recipeStore';
import Colors from '@/constants/colors';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { recipes, isFavorite, toggleFavorite, getRecipeById } = useRecipeStore();
  const [recipe, setRecipe] = useState(recipes.find(r => r.id === id));
  const [loading, setLoading] = useState(!recipe);
  
  useEffect(() => {
    const loadRecipe = async () => {
      if (!recipe) {
        setLoading(true);
        const fetchedRecipe = await getRecipeById(id);
        if (fetchedRecipe) {
          setRecipe(fetchedRecipe);
        }
        setLoading(false);
      }
    };
    
    loadRecipe();
  }, [id]);
  
  const favorite = recipe ? isFavorite(recipe.id) : false;
  
  const handleFavoritePress = () => {
    if (recipe) {
      toggleFavorite(recipe.id);
    }
  };
  
  const handleBackPress = () => {
    router.back();
  };
  
  const handleAddToMealPlan = () => {
    router.push(`/add-meal/select?recipeId=${id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Recipe not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: recipe.image }} style={styles.image} />
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <ArrowLeft size={24} color={Colors.white} />
          </Pressable>
          <Pressable style={styles.favoriteButton} onPress={handleFavoritePress}>
            <Heart 
              size={24} 
              color={Colors.white} 
              fill={favorite ? Colors.error : 'transparent'} 
            />
          </Pressable>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>{recipe.name}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Clock size={20} color={Colors.primary} />
              <Text style={styles.metaText}>{recipe.prepTime} prep</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={20} color={Colors.primary} />
              <Text style={styles.metaText}>{recipe.cookTime} cook</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={20} color={Colors.primary} />
              <Text style={styles.metaText}>{recipe.servings} servings</Text>
            </View>
          </View>
          
          <View style={styles.nutritionContainer}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionDivider} />
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionDivider} />
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionDivider} />
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{recipe.fat}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.bullet} />
                <Text style={styles.ingredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>{index + 1}</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsList}>
              {recipe.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
      
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <Pressable style={styles.addToMealPlanButton} onPress={handleAddToMealPlan}>
          <Plus size={20} color={Colors.white} />
          <Text style={styles.addToMealPlanText}>Add to Meal Plan</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 4,
  },
  nutritionContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  nutritionLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  nutritionDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    fontWeight: 'bold',
    fontSize: 14,
  },
  instructionText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
    lineHeight: 24,
  },
  tagsContainer: {
    marginBottom: 80,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: Colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
  },
  addToMealPlanButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToMealPlanText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 40,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 16,
  },
});