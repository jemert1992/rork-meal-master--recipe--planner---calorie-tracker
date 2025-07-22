import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTutorialRef } from '@/hooks/useTutorialRef';
import Colors from '@/constants/colors';

/**
 * Example component showing how to properly use the tutorial system
 * without causing infinite loops or TypeScript errors
 */
export default function TutorialExample() {
  // Safe ref registration - no infinite loops
  const searchInputRef = useTutorialRef('search-input');
  const quickActionsRef = useTutorialRef('quick-actions');

  return (
    <View style={styles.container}>
      {/* Search input with tutorial ref */}
      <TextInput
        ref={searchInputRef}
        style={styles.searchInput}
        placeholder="Search recipes..."
        placeholderTextColor={Colors.textSecondary}
      />

      {/* Quick actions with tutorial ref */}
      <View ref={quickActionsRef} style={styles.quickActions}>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionText}>Add Meal</Text>
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionText}>Generate List</Text>
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Text style={styles.actionText}>Favorites</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.surface,
    color: Colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 14,
  },
});