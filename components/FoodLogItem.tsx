import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { FoodEntry } from '@/types';
import Colors from '@/constants/colors';

type FoodLogItemProps = {
  entry: FoodEntry;
  onRemove: () => void;
  onPress: () => void;
};

export default function FoodLogItem({ entry, onRemove, onPress }: FoodLogItemProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{entry.time}</Text>
        <Text style={styles.mealType}>{entry.mealType}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{entry.name}</Text>
        <View style={styles.nutritionContainer}>
          <Text style={styles.calories}>{entry.calories} cal</Text>
          {entry.protein && <Text style={styles.macros}>P: {entry.protein}g</Text>}
          {entry.carbs && <Text style={styles.macros}>C: {entry.carbs}g</Text>}
          {entry.fat && <Text style={styles.macros}>F: {entry.fat}g</Text>}
        </View>
      </View>
      <Pressable style={styles.removeButton} onPress={onRemove} hitSlop={8}>
        <X size={18} color={Colors.textLight} />
      </Pressable>
    </Pressable>
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
  timeContainer: {
    width: 60,
    marginRight: 12,
  },
  time: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  mealType: {
    fontSize: 12,
    color: Colors.textLight,
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  nutritionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calories: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: 8,
  },
  macros: {
    fontSize: 14,
    color: Colors.textLight,
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
});