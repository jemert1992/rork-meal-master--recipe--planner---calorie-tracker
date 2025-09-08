import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Image, Modal, ScrollView } from 'react-native';
import { ChevronRight, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SnackItem } from '@/types';

// Mock snacks data (simplified from the original snacks.tsx)
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
];

interface SnackCardProps {
  snack: SnackItem;
}

const SnackCard = ({ snack }: SnackCardProps) => {
  return (
    <View style={styles.snackCard}>
      <Image source={{ uri: snack.image }} style={styles.snackImage} accessibilityRole="image" accessibilityLabel={`Image of ${snack.name}`} />
      <View style={styles.snackContent}>
        <Text style={styles.snackName}>{snack.name}</Text>
        <Text style={styles.snackDescription} numberOfLines={2}>{snack.description}</Text>
        
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{snack.calories}</Text>
            <Text style={styles.nutritionLabel}>cal</Text>
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
          {snack.tags.slice(0, 3).map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const SnacksBanner = () => {
  const [modalVisible, setModalVisible] = useState(false);
  
  return (
    <>
      <Pressable 
        style={styles.bannerContainer}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="View healthy snacks"
        accessibilityHint="Opens a modal with healthy snack options"
      >
        <View style={styles.bannerContent}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1604210565264-8917562a63d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }} 
            style={styles.bannerImage} 
            accessibilityRole="image"
            accessibilityLabel="Healthy snacks thumbnail"
          />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Did you know we have snacks too?</Text>
            <Text style={styles.bannerSubtitle}>Discover nutritious between-meal options</Text>
          </View>
          <ChevronRight size={20} color={Colors.primary} />
        </View>
      </Pressable>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Healthy Snacks</Text>
              <Pressable 
                style={styles.closeButton} 
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Close snacks modal"
                accessibilityRole="button"
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            <Text style={styles.modalSubtitle}>Nutritious options for between meals</Text>
            
            <ScrollView 
              style={styles.snacksList}
              showsVerticalScrollIndicator={false}
            >
              {mockSnacks.map((snack) => (
                <SnackCard key={snack.id} snack={snack} />
              ))}
              
              <View style={styles.moreInfoContainer}>
                <Text style={styles.moreInfoText}>
                  Healthy snacking helps maintain energy levels and prevents overeating at meals.
                  Choose snacks that combine protein, fiber, and healthy fats for the best nutrition.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  bannerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 20,
  },
  snacksList: {
    flex: 1,
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
    height: 140,
    resizeMode: 'cover',
  },
  snackContent: {
    padding: 16,
  },
  snackName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
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
  moreInfoContainer: {
    backgroundColor: Colors.backgroundLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  moreInfoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});

export default SnacksBanner;