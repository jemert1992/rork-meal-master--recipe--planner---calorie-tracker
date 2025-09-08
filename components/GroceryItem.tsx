import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { GroceryItem as GroceryItemType } from '@/types';

interface GroceryItemProps {
  item: GroceryItemType;
  onToggle: () => void;
  onRemove: () => void;
}

export default function GroceryItem({ item, onToggle, onRemove }: GroceryItemProps) {
  const checked = !!item.checked;
  return (
    <View style={styles.container} accessibilityLabel={`${item.name}, ${item.quantity} ${item.unit}`}>
      <Pressable 
        style={styles.checkboxContainer} 
        onPress={onToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="checkbox"
        accessibilityLabel={`Mark ${item.name} as ${checked ? 'not purchased' : 'purchased'}`}
        accessibilityState={{ checked }}
        testID={`grocery-toggle-${item.id}`}
      >
        <View style={[
          styles.checkbox,
          checked && styles.checkboxChecked
        ]}>
          {checked && <Check size={16} color={Colors.white} />}
        </View>
      </Pressable>
      
      <View style={styles.itemInfo}>
        <Text style={[
          styles.itemName,
          checked && styles.itemNameChecked
        ]}
        accessibilityRole="text"
        accessibilityLabel={`${item.name}${checked ? ', purchased' : ''}`}
        >
          {item.name}
        </Text>
        
        <Text style={styles.itemQuantity} accessibilityRole="text">
          {item.quantity} {item.unit}
        </Text>
      </View>
      
      <Pressable 
        style={styles.removeButton} 
        onPress={onRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name}`}
        accessibilityHint="Deletes this item from the list"
        testID={`grocery-remove-${item.id}`}
      >
        <Trash2 size={18} color={Colors.error} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  checkboxContainer: {
    marginRight: 16,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    color: Colors.text,
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
    opacity: 0.7,
  },
  itemQuantity: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  removeButton: {
    padding: 12,
  },
});