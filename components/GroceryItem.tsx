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
  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.checkboxContainer} 
        onPress={onToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={[
          styles.checkbox,
          item.checked && styles.checkboxChecked
        ]}>
          {item.checked && <Check size={16} color={Colors.white} />}
        </View>
      </Pressable>
      
      <View style={styles.itemInfo}>
        <Text style={[
          styles.itemName,
          item.checked && styles.itemNameChecked
        ]}>
          {item.name}
        </Text>
        
        <Text style={styles.itemQuantity}>
          {item.quantity} {item.unit}
        </Text>
      </View>
      
      <Pressable 
        style={styles.removeButton} 
        onPress={onRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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