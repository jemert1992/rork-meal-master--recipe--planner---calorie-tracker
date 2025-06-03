import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/colors';

// Main recipe categories for filtering
const MAIN_CATEGORIES = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'vegetarian',
  'vegan',
  'high-protein',
  'low-carb',
  'quick',
  'meal-prep'
];

type CategoryFilterProps = {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
};

export default function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: CategoryFilterProps) {
  // Filter to only show main categories or those that have multiple recipes
  const filteredCategories = categories.filter(
    category => MAIN_CATEGORIES.includes(category)
  );
  
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Pressable
          style={[
            styles.categoryButton,
            selectedCategory === null && styles.categoryButtonActive
          ]}
          onPress={() => onSelectCategory(null)}
        >
          <Text 
            style={[
              styles.categoryText,
              selectedCategory === null && styles.categoryTextActive
            ]}
          >
            All
          </Text>
        </Pressable>
        
        {filteredCategories.map((category) => (
          <Pressable
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => onSelectCategory(category)}
          >
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}
            >
              {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.white,
    marginRight: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.text,
  },
  categoryTextActive: {
    color: Colors.white,
    fontWeight: '500',
  },
});