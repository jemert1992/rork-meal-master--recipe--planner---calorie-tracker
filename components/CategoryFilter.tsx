import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import Colors from '@/constants/colors';

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
        
        {categories.map((category) => (
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
              {category}
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