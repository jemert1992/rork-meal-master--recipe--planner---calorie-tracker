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
        style={[styles.checkbox, item.checked && styles.checkboxChecked]} 
        onPress={onToggle}
      >
        {item.checked && <Check size={16} color={Colors.white} />}
      </Pressable>
      
      <View style={styles.content}>
        <Text 
          style={[styles.name, item.checked && styles.nameChecked]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        
        <Text style={styles.details}>
          {item.quantity} {item.unit && item.unit}
        </Text>
      </View>
      
      <Pressable style={styles.removeButton} onPress={onRemove}>
        <Trash2 size={18} color={Colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 2,
  },
  nameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textLight,
  },
  details: {
    fontSize: 14,
    color: Colors.textLight,
  },
  removeButton: {
    padding: 8,
  },
});