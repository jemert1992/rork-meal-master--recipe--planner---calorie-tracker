import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2 } from 'lucide-react-native';
import { useGroceryStore } from '@/store/groceryStore';
import GroceryItem from '@/components/GroceryItem';
import Colors from '@/constants/colors';

export default function GroceryListScreen() {
  const { groceryItems, addItem, removeItem, toggleChecked, clearCheckedItems, sortByCategory } = useGroceryStore();
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    addItem({
      name: newItemName.trim(),
      category: newItemCategory.trim() || 'Other',
      checked: false,
    });

    setNewItemName('');
    setNewItemCategory('');
    setShowAddForm(false);
  };

  const handleClearChecked = () => {
    Alert.alert(
      'Clear Checked Items',
      'Are you sure you want to remove all checked items?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCheckedItems },
      ]
    );
  };

  const sortedItems = sortByCategory();
  const checkedCount = groceryItems.filter(item => item.checked).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Grocery List</Text>
        <Text style={styles.subtitle}>
          {groceryItems.length} items, {checkedCount} checked
        </Text>
      </View>

      {showAddForm ? (
        <View style={styles.addFormContainer}>
          <TextInput
            style={styles.input}
            placeholder="Item name"
            value={newItemName}
            onChangeText={setNewItemName}
            placeholderTextColor={Colors.textLight}
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="Category (optional)"
            value={newItemCategory}
            onChangeText={setNewItemCategory}
            placeholderTextColor={Colors.textLight}
          />
          <View style={styles.formButtons}>
            <Pressable 
              style={[styles.formButton, styles.cancelButton]} 
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable 
              style={[styles.formButton, styles.addFormButton]} 
              onPress={handleAddItem}
            >
              <Text style={styles.addFormButtonText}>Add Item</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.actionsContainer}>
          <Pressable style={styles.addButton} onPress={() => setShowAddForm(true)}>
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Add Item</Text>
          </Pressable>
          {checkedCount > 0 && (
            <Pressable style={styles.clearButton} onPress={handleClearChecked}>
              <Trash2 size={20} color={Colors.textLight} />
              <Text style={styles.clearButtonText}>Clear Checked</Text>
            </Pressable>
          )}
        </View>
      )}

      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroceryItem
            item={item}
            onToggle={() => toggleChecked(item.id)}
            onRemove={() => removeItem(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Your grocery list is empty</Text>
            <Text style={styles.emptySubtext}>Add items to get started</Text>
          </View>
        }
      />
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
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 4,
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  addFormContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: Colors.text,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  formButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: Colors.card,
  },
  cancelButtonText: {
    color: Colors.textLight,
    fontWeight: '500',
  },
  addFormButton: {
    backgroundColor: Colors.primary,
  },
  addFormButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});