import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function SubscriptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_bottom',
      }}
    />
  );
}