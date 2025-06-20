import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import Colors from "@/constants/colors";
import { useUserStore } from "@/store/userStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/lib/trpc";
import { useSubscriptionStore } from "@/store/subscriptionStore";

export const unstable_settings = {
  initialRouteName: "index",
};

// Create a client
const queryClient = new QueryClient();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const { initializeSubscription } = useSubscriptionStore();

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      
      // Keep subscription initialization for future use
      initializeSubscription();
    }
  }, [loaded, initializeSubscription]);

  if (!loaded) {
    return null;
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function RootLayoutNav() {
  const { isLoggedIn, profile } = useUserStore();
  const showOnboarding = !isLoggedIn || !profile.onboardingCompleted;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false, // Hide all headers at the Stack level
          animation: "slide_from_right",
        }}
      >
        {showOnboarding ? (
          <>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen 
              name="onboarding/personal-info" 
              options={{ 
                title: "About You",
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="onboarding/dietary-preferences" 
              options={{ 
                title: "Dietary Preferences",
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="onboarding/nutrition-goals" 
              options={{ 
                title: "Nutrition Goals",
                headerShown: false,
              }} 
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="recipe/[id]" 
              options={{ 
                title: "Recipe Details",
                headerShown: false, // Hide the header for recipe details
                presentation: "card",
              }} 
            />
            <Stack.Screen 
              name="add-meal/[date]" 
              options={{ 
                title: "Add Meal",
                presentation: "modal",
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="add-food/[date]" 
              options={{ 
                title: "Add Food",
                presentation: "modal",
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="profile/edit" 
              options={{ 
                title: "Edit Profile",
                presentation: "modal",
                headerShown: false,
              }} 
            />
            {/* Keep subscription routes for future use */}
            <Stack.Screen 
              name="subscription" 
              options={{ 
                headerShown: false,
              }} 
            />
          </>
        )}
      </Stack>
    </>
  );
}