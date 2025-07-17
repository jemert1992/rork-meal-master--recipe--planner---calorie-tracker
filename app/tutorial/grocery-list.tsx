import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshCw, Plus, Trash2, Search, Check } from 'lucide-react-native';
import GroceryItem from '@/components/GroceryItem';
import Colors from '@/constants/colors';
import { GroceryItem as GroceryItemType } from '@/types';

export default function TutorialGroceryListScreen() {
  // Mock grocery items data
  const mockGroceryItems: GroceryItemType[] = [
    {
      id: '1',
      name: 'Avocados',
      quantity: 2,
      unit: 'pcs',
      category: 'Produce',
      checked: false,
      recipeIds: ['1']
    },
    {
      id: '2',
      name: 'Eggs',
      quantity: 12,
      unit: 'pcs',
      category: 'Dairy',
      checked: true,
      recipeIds: ['1']
    },
    {
      id: '3',
      name: 'Chicken Breast',
      quantity: 1,
      unit: 'lb',
      category: 'Meat',
      checked: false,
      recipeIds: ['2']
    },
    {
      id: '4',
      name: 'Mixed Greens',
      quantity: 1,
      unit: 'bag',
      category: 'Produce',
      checked: false,
      recipeIds: ['2']
    },
    {
      id: '5',
      name: 'Olive Oil',
      quantity: 1,
      unit: 'bottle',
      category: 'Pantry',
      checked: true,
      recipeIds: ['1', '2']
    },
    {
      id: '6',
      name: 'Whole Grain Bread',
      quantity: 1,
      unit: 'loaf',
      category: 'Bakery',
      checked: false,
      recipeIds: ['1']
    }
  ];

  // Group items by category
  const groupedItems = mockGroceryItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryItemType[]>);

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });

  const checkedCount = mockGroceryItems.filter(item => item.checked).length;

  const renderItem = (item: GroceryItemType) => (
    <GroceryItem
      key={item.id}
      item={item}
      onToggle={() => {}}
      onRemove={() => {}}
    />
  );

  const renderCategory = (category: string) => (
    <View key={category} style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{category}</Text>
      {groupedItems[category].map(item => renderItem(item))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Grocery List</Text>
        <Text style={styles.subtitle}>Manage your shopping items</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <Pressable style={styles.generateButton}>
          <RefreshCw size={16} color={Colors.white} />
          <Text style={styles.generateButtonText}>Generate from Meal Plan</Text>
        </Pressable>
        
        <View style={styles.buttonGroup}>
          <Pressable style={styles.actionButton}>
            <Plus size={16} color={Colors.primary} />
          </Pressable>
          
          <Pressable style={styles.actionButton}>
            <Trash2 size={16} color={Colors.primary} />
          </Pressable>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Search items...</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {checkedCount} of {mockGroceryItems.length} items checked
        </Text>
        <Pressable>
          <Text style={styles.clearCheckedText}>Clear checked</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedCategories.map(category => renderCategory(category))}

        {/* Smart Features Section */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Smart Shopping Features</Text>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <RefreshCw size={20} color={Colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Auto-Generate Lists</Text>
              <Text style={styles.featureDescription}>
                Automatically create shopping lists from your meal plans
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Check size={20} color={Colors.success} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Smart Organization</Text>
              <Text style={styles.featureDescription}>
                Items grouped by store sections for efficient shopping
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Plus size={20} color={Colors.warning} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Custom Items</Text>
              <Text style={styles.featureDescription}>
                Add your own items with quantities and units
              </Text>
            </View>
          </View>
        </View>

        {/* Shopping Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Shopping Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Shop the perimeter first for fresh items</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Check items off as you shop</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>• Use the search to find specific items quickly</Text>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    marginBottom: 0,
    fontWeight: '400',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    marginTop: 8,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  generateButtonText: {
    color: Colors.white,
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 24,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '400',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  statsText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  clearCheckedText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
  },
  categoryContainer: {
    marginBottom: 28,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  featuresContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '400',
  },
  tipsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '400',
  },
});