import React from "react";
import { Tabs } from "expo-router";
import { BookOpen, Calendar, BarChart2, ShoppingBag, User } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
        },
        headerShown: false, // Hide all headers in the tab navigator
        headerTitle: "", // Ensure no title is shown
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: "Meal Plan",
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="calorie-tracker"
        options={{
          title: "Tracker",
          tabBarIcon: ({ color }) => <BarChart2 size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="grocery-list"
        options={{
          title: "Grocery",
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}