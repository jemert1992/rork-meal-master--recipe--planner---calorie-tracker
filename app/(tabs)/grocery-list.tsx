import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, Plus, Trash2, RefreshCw, Check, Search, X } from 'lucide-react-native';
import { useGroceryStore } from '@/store/groceryStore';
import { useMealPlanStore } from '@/store/mealPlanStore';
import { useRecipeStore } from '@/store/recipeStore';
import { useRouter } from 'expo-router';
import GroceryItem from '@/components/GroceryItem';
import { generateGroceryList } from '@/utils/generateGroceryList';
import Colors from '@/constants/colors';
import { GroceryItem as GroceryItemType } from '@/types';
import TutorialOverlay from '@/components/TutorialOverlay';

export default function GroceryListScreen() {
  const router = useRouter();
  const { groceryItems, setGroceryItems, toggleChecked, removeItem, addItem, clearGroceryList } = useGroceryStore();
  const { mealPlan } = useMealPlanStore();
  const { recipes } = useRecipeStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filteredItems, setFilteredItems] = useState<GroceryItemType[]>([]);
  
  // Filter items based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(groceryItems);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = groceryItems.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.category.toLowerCase().includes(query)
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, groceryItems]);
  
  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryItemType[]>);
  
  // Sort categories
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    // Put "Other" category at the end
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });
  
  const handleGenerateList = () => {
    // Check if there are any meals planned
    const hasMeals = Object.values(mealPlan).some(day => 
      day.breakfast || day.lunch || day.dinner || (day.snacks && day.snacks.length > 0)
    );
    
    if (!hasMeals) {
      Alert.alert(
        "No Meals Planned",
        "Please add some meals to your meal plan before generating a grocery list.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setIsGenerating(true);
    
    // Generate the grocery list
    try {
      const groceryList = generateGroceryList(mealPlan, recipes);
      
      if (groceryList.length === 0) {
        Alert.alert(
          "No Ingredients Found",
          "Could not extract ingredients from your meal plan. Please try adding different recipes.",
          [{ text: "OK" }]
        );
        setIsGenerating(false);
        return;
      }
      
      // Update the grocery store
      setGroceryItems(groceryList);
      
      Alert.alert(
        "Grocery List Generated",
        `Successfully created a grocery list with ${groceryList.length} items.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error generating grocery list:', error);
      Alert.alert(
        "Error",
        "Failed to generate grocery list. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAddItem = () => {
    if (newItemName.trim() === '') {
      Alert.alert("Error", "Please enter an item name");
      return;
    }
    
    const quantity = parseFloat(newItemQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }
    
    addItem({
      name: newItemName.trim(),
      quantity,
      unit: newItemUnit.trim(),
      category: 'Other',
      checked: false,
      recipeIds: []
    });
    
    // Reset form
    setNewItemName('');
    setNewItemQuantity('1');
    setNewItemUnit('');
    setIsAddingItem(false);
  };
  
  const handleClearList = () => {
    Alert.alert(
      "Clear Grocery List",
      "Are you sure you want to clear your entire grocery list?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => clearGroceryList()
        }
      ]
    );
  };
  
  const handleClearChecked = () => {
    const checkedItems = groceryItems.filter(item => item.checked);
    
    if (checkedItems.length === 0) {
      Alert.alert("No Items Checked", "There are no checked items to clear.");
      return;
    }
    
    Alert.alert(
      "Clear Checked Items",
      `Are you sure you want to remove ${checkedItems.length} checked items?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => {
            const newItems = groceryItems.filter(item => !item.checked);
            setGroceryItems(newItems);
          }
        }
      ]
    );
  };
  
  const renderItem = ({ item }: { item: GroceryItemType }) => (
    <GroceryItem
      item={item}
      onToggle={() => toggleChecked(item.id)}
      onRemove={() => removeItem(item.id)}
    />
  );
  
  const renderCategory = ({ item }: { item: string }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{item}</Text>
      {groupedItems[item].map(groceryItem => renderItem({ item: groceryItem }))}
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']} testID="grocery-content">
      <TutorialOverlay currentScreen="grocery-list" />
      <View style={styles.header}>
        <Text style={styles.title}>Grocery List</Text>
        <Text style={styles.subtitle}>Manage your shopping items</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <Pressable 
          style={styles.generateButton} 
          onPress={handleGenerateList}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <RefreshCw size={16} color={Colors.white} />
              <Text style={styles.generateButtonText}>Generate from Meal Plan</Text>
            </>
          )}
        </Pressable>
        
        <View style={styles.buttonGroup}>
          <Pressable 
            style={styles.actionButton} 
            onPress={() => setIsAddingItem(true)}
          >
            <Plus size={16} color={Colors.primary} />
          </Pressable>
          
          <Pressable 
            style={styles.actionButton} 
            onPress={handleClearList}
          >
            <Trash2 size={16} color={Colors.primary} />
          </Pressable>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textLight}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <X size={20} color={Colors.textLight} />
          </Pressable>
        )}
      </View>
      
      {groceryItems.length > 0 ? (
        <>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {groceryItems.filter(item => item.checked).length} of {groceryItems.length} items checked
            </Text>
            <Pressable onPress={handleClearChecked}>
              <Text style={styles.clearCheckedText}>Clear checked</Text>
            </Pressable>
          </View>
          
          <FlatList
            data={sortedCategories}
            renderItem={renderCategory}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <ShoppingCart size={64} color={Colors.lightGray} />
          <Text style={styles.emptyTitle}>Your grocery list is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add items manually or generate a list from your meal plan
          </Text>
        </View>
      )}
      
      {/* Add Item Modal */}
      {isAddingItem && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Item</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Apples"
                value={newItemName}
                onChangeText={setNewItemName}
                autoFocus
              />
            </View>
            
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  value={newItemQuantity}
                  onChangeText={setNewItemQuantity}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Unit (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. kg, pcs"
                  value={newItemUnit}
                  onChangeText={setNewItemUnit}
                />
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setIsAddingItem(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalButton, styles.addButton]} 
                onPress={handleAddItem}
              >
                <Text style={styles.addButtonText}>Add Item</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '400',
    lineHeight: 24,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundLight,
    marginRight: 8,
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '500',
  },
});