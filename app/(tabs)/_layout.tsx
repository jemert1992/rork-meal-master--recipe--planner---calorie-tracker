import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Home, Calendar, ShoppingCart, User } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { useTutorialStore } from '@/store/tutorialStore';
import TutorialWelcome from '@/components/TutorialWelcome';
import ContextualTutorialCoachMark from '@/components/ContextualTutorialCoachMark';

export default function TabLayout() {
  const { profile } = useUserStore();
  const { checkShouldShowWelcome, welcomeCheckPerformed } = useTutorialStore();
  const hasCheckedWelcome = useRef(false);
  
  useEffect(() => {
    // Only check once when onboarding is completed and we haven't checked before
    if (profile.onboardingCompleted && !hasCheckedWelcome.current && !welcomeCheckPerformed) {
      console.log('TabLayout: Checking if should show welcome tutorial');
      hasCheckedWelcome.current = true;
      checkShouldShowWelcome(true);
    }
  }, [profile.onboardingCompleted, welcomeCheckPerformed, checkShouldShowWelcome]);
  
  return (
    <>
      <TutorialWelcome />
      <ContextualTutorialCoachMark />
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