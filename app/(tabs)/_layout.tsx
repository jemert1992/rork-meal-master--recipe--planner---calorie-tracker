import { Tabs } from 'expo-router';
import { Home, CalendarClock, BookOpen, ShoppingCart, User, Cookie } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        },
        headerShown: false, // Hide the header for all tab screens
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Meal Plan',
          tabBarIcon: ({ color, size }) => <CalendarClock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="snacks"
        options={{
          title: 'Snacks',
          tabBarIcon: ({ color, size }) => <Cookie size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calorie-tracker"
        options={{
          title: 'Food Log',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="grocery-list"
        options={{
          title: 'Groceries',
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