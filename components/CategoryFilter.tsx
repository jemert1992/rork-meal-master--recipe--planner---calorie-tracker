import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/colors';

// Main recipe categories for filtering - reduced to most important ones
const MAIN_CATEGORIES = [
  'breakfast',
  'lunch',
  'dinner',
  'vegetarian',
  'vegan',
  'high-protein',
  'low-carb',
  'quick'
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
  // Filter to only show main categories
  const filteredCategories = MAIN_CATEGORIES.filter(
    category => categories.includes(category)
  );
  
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredCategories.map((category) => (
          <Pressable
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => onSelectCategory(category === selectedCategory ? null : category)}
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
    marginBottom: 12,
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