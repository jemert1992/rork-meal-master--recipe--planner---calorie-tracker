import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Home, Calendar, ShoppingCart, User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { useTutorialStore } from '@/store/tutorialStore';
import TutorialWelcome from '@/components/TutorialWelcome';

export default function TabLayout() {
  const { profile } = useUserStore();
  const { checkShouldShowWelcome } = useTutorialStore();
  
  useEffect(() => {
    // Check if we should show the welcome tutorial after onboarding is completed
    if (profile.onboardingCompleted) {
      checkShouldShowWelcome(true);
    }
  }, [profile.onboardingCompleted, checkShouldShowWelcome]);
  
  return (
    <>
      <TutorialWelcome />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopWidth: 1,
            borderTopColor: Colors.borderLight,
            elevation: 0,
            shadowOpacity: 0,
            height: 88,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
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
      {/* Removed API settings tab */}
      </Tabs>
    </>
  );
}