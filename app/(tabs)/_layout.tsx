import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Home, Calendar, ShoppingCart, User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSubscriptionStore } from '@/store/subscriptionStore';

export default function TabLayout() {
  const { refreshSubscriptionStatus } = useSubscriptionStore();
  
  // Refresh subscription status when tabs are loaded
  useEffect(() => {
    refreshSubscriptionStatus();
  }, [refreshSubscriptionStatus]);
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Meal Plan',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="grocery-list"
        options={{
          title: 'Grocery',
          tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}