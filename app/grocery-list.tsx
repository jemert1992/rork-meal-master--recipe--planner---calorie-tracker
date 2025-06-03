import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Filter, Check } from 'lucide-react-native';
import { useGroceryStore } from '@/store/groceryStore';
import GroceryItem from '@/components/GroceryItem';
import Colors from '@/constants/colors';

const CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat',
  'Bakery',
  'Frozen',
  'Canned Goods',
  'Dry Goods',
  'Snacks',
  'Beverages',
  'Condiments',
  'Oils & Vinegars',
  'Baking',
  'Other'
];

export default function GroceryListScreen() {
  const { groceryItems, addItem, removeItem, toggleChecked, clearCheckedItems, sortByCategory } = useGroceryStore();
  const [newItemName, setNewItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Produce');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [sortedByCategory, setSortedByCategory] = useState(false);
  const [displayItems, setDisplayItems] = useState(groceryItems);
  
  useEffect(() => {
    if (sortedByCategory) {
      setDisplayItems(sortByCategory());
    } else {
      setDisplayItems(groceryItems);
    }
  }, [groceryItems, sortedByCategory]);
  
  const handleAddItem = () => {
    if (newItemName.trim() === '') {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }
    
    addItem({
      name: newItemName.trim(),
      category: selectedCategory,
      checked: false,
    });
    
    setNewItemName('');
  };
  
  const handleClearChecked = () => {
    Alert.alert(
      'Clear Checked Items',
      'Are you sure you want to remove all checked items?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCheckedItems }
      ]
    );
  };
  
  const toggleSort = () => {
    setSortedByCategory(!sortedByCategory);
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Grocery List</Text>
        {groceryItems.some(item => item.checked) && (
          <Pressable style={styles.clearButton} onPress={handleClearChecked}>
            <Trash2 size={20} color={Colors.danger} />
          </Pressable>
        )}
      </View>
      
      <View style={styles.addItemContainer}>
        <TextInput
          style={styles.input}
          value={newItemName}
          onChangeText={setNewItemName}
          placeholder="Add an item..."
          returnKeyType="done"
          onSubmitEditing={handleAddItem}
        />
        
        <Pressable 
          style={styles.categoryButton} 
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
        >
          <Text style={styles.categoryButtonText}>{selectedCategory}</Text>
          <Filter size={16} color={Colors.textLight} />
        </Pressable>
        
        <Pressable style={styles.addButton} onPress={handleAddItem}>
          <Plus size={24} color={Colors.white} />
        </Pressable>
      </View>
      
      {showCategoryPicker && (
        <View style={styles.categoryPickerContainer}>
          <ScrollView style={styles.categoryScroll} contentContainerStyle={styles.categoryScrollContent}>
            {CATEGORIES.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.categoryOption,
                  selectedCategory === category && styles.selectedCategoryOption
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCategoryPicker(false);
                }}
              >
                <Text 
                  style={[
                    styles.categoryOptionText,
                    selectedCategory === category && styles.selectedCategoryOptionText
                  ]}
                >
                  {category}
                </Text>
                {selectedCategory === category && (
                  <Check size={16} color={Colors.white} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.sortContainer}>
        <Pressable 
          style={[styles.sortButton, sortedByCategory && styles.sortButtonActive]} 
          onPress={toggleSort}
        >
          <Filter size={16} color={sortedByCategory ? Colors.white : Colors.text} />
          <Text 
            style={[styles.sortButtonText, sortedByCategory && styles.sortButtonTextActive]}
          >
            Sort by Category
          </Text>
        </Pressable>
      </View>
      
      <ScrollView style={styles.listContainer}>
        {displayItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Your grocery list is empty</Text>
            <Text style={styles.emptyStateSubtext}>Add items using the field above</Text>
          </View>
        ) : (
          displayItems.map((item) => (
            <GroceryItem
              key={item.id}
              item={item}
              onToggle={() => toggleChecked(item.id)}
              onRemove={() => removeItem(item.id)}
            />
          ))
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  clearButton: {
    padding: 8,
  },
  addItemContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButton: {
    height: 48,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryScroll: {
    flex: 1,
  },
  categoryScrollContent: {
    padding: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectedCategoryOption: {
    backgroundColor: Colors.primary,
  },
  categoryOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedCategoryOptionText: {
    color: Colors.white,
    fontWeight: '500',
  },
  sortContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  sortButtonTextActive: {
    color: Colors.white,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
  },
});