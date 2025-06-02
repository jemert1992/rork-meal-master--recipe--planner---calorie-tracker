import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { GroceryItem as GroceryItemType } from '@/types';
import Colors from '@/constants/colors';

type GroceryItemProps = {
  item: GroceryItemType;
  onToggle: () => void;
  onRemove: () => void;
};

export default function GroceryItem({ item, onToggle, onRemove }: GroceryItemProps) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.checkboxContainer} onPress={onToggle}>
        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
          {item.checked && <Check size={16} color={Colors.white} />}
        </View>
      </Pressable>
      <View style={styles.content}>
        <Text style={[styles.name, item.checked && styles.nameChecked]}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>
      <Pressable style={styles.removeButton} onPress={onRemove} hitSlop={8}>
        <X size={18} color={Colors.textLight} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
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
  },
  nameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textLight,
  },
  category: {
    fontSize: 12,
    color: Colors.textLight,
  },
  removeButton: {
    padding: 4,
  },
});