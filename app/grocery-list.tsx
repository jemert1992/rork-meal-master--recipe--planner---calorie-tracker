import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import { useGroceryStore } from '@/store/groceryStore';
import GroceryItem from '@/components/GroceryItem';
import Colors from '@/constants/colors';

export default function GroceryListScreen() {
  const { groceryItems, addGroceryItem, clearGroceryList } = useGroceryStore();
  const [newItemName, setNewItemName] = useState('');
  
  // Group items by category
  const groupedItems = groceryItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof groceryItems>);
  
  // Convert grouped items to array for FlatList
  const sections = Object.entries(groupedItems)
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => a.category.localeCompare(b.category));
  
  const handleAddItem = () => {
    if (newItemName.trim()) {
      addGroceryItem({
        id: Date.now().toString(),
        name: newItemName.trim(),
        category: 'Other',
        checked: false
      });
      setNewItemName('');
    }
  };
  
  const handleClearList = () => {
    clearGroceryList();
  };
  
  const completedCount = groceryItems.filter(item => item.checked).length;
  const progress = groceryItems.length > 0 
    ? Math.round((completedCount / groceryItems.length) * 100) 
    : 0;
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Grocery List</Text>
        {groceryItems.length > 0 && (
          <Text style={styles.subtitle}>
            {completedCount} of {groceryItems.length} items checked ({progress}%)
          </Text>
        )}
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add an item..."
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={handleAddItem}>
          <Plus size={20} color={Colors.white} />
        </Pressable>
      </View>
      
      {groceryItems.length > 0 ? (
        <>
          <FlatList
            data={sections}
            keyExtractor={(item) => item.category}
            renderItem={({ item }) => (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>{item.category}</Text>
                {item.items.map((groceryItem) => (
                  <GroceryItem key={groceryItem.id} item={groceryItem} />
                ))}
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
          
          <View style={styles.footer}>
            <Pressable style={styles.clearButton} onPress={handleClearList}>
              <Trash2 size={20} color={Colors.white} />
              <Text style={styles.clearButtonText}>Clear List</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>Your grocery list is empty</Text>
          <Text style={styles.emptySubtext}>
            Add items manually or generate a list from your meal plan
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  addButton: {
    marginLeft: 12,
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearButton: {
    flexDirection: 'row',
    backgroundColor: Colors.danger,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});