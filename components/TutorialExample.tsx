import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTutorialRef } from '@/hooks/useTutorialRef';
import Colors from '@/constants/colors';

/**
 * Example component showing how to properly use the enhanced tutorial system
 * with interaction completion and accessibility features
 */
export default function TutorialExample() {
  const [searchText, setSearchText] = useState('');
  
  // Enhanced ref registration with interaction completion
  const { ref: searchInputRef, markInteractionComplete: markSearchComplete } = useTutorialRef('search-input');
  const { ref: quickActionsRef, markInteractionComplete: markActionsComplete } = useTutorialRef('quick-actions');

  return (
    <View style={styles.container}>
      {/* Search input with tutorial ref and interaction tracking */}
      <TextInput
        ref={searchInputRef}
        style={styles.searchInput}
        placeholder="Search recipes..."
        placeholderTextColor={Colors.textSecondary}
        value={searchText}
        onChangeText={(text) => {
          setSearchText(text);
          // Mark interaction complete when user starts typing
          if (text.length > 0) {
            markSearchComplete();
          }
        }}
        accessible={true}
        accessibilityLabel="Recipe search input"
        accessibilityHint="Type to search for recipes by name or ingredients"
      />

      {/* Quick actions with tutorial ref and interaction tracking */}
      <View ref={quickActionsRef} style={styles.quickActions}>
        <Pressable 
          style={styles.actionButton}
          onPress={() => markActionsComplete()}
          accessible={true}
          accessibilityLabel="Add meal"
          accessibilityHint="Add a meal to your plan"
        >
          <Text style={styles.actionText}>Add Meal</Text>
        </Pressable>
        <Pressable 
          style={styles.actionButton}
          onPress={() => markActionsComplete()}
          accessible={true}
          accessibilityLabel="Generate grocery list"
          accessibilityHint="Generate a shopping list from your meal plan"
        >
          <Text style={styles.actionText}>Generate List</Text>
        </Pressable>
        <Pressable 
          style={styles.actionButton}
          onPress={() => markActionsComplete()}
          accessible={true}
          accessibilityLabel="View favorites"
          accessibilityHint="Browse your favorite recipes"
        >
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