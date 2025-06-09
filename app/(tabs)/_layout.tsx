import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Home, Calendar, ShoppingBag, User, BookOpen } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: Colors.white,
          borderBottomColor: Colors.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          color: Colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recipes',
          tabBarLabel: 'Recipes',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Meal Plan',
          tabBarLabel: 'Meal Plan',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="grocery-list"
        options={{
          title: 'Grocery List',
          tabBarLabel: 'Grocery',
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin/import-recipes"
        options={{
          href: null, // Hide this tab from the tab bar
        }}
      />
    </Tabs>
  );
}