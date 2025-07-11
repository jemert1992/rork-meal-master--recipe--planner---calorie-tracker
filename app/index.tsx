import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isLoggedIn, profile } = useUserStore();

  useEffect(() => {
    // If user is already logged in and completed onboarding, redirect to main app
    if (isLoggedIn && profile.onboardingCompleted) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, profile.onboardingCompleted]);

  const handleGetStarted = () => {
    router.push('/onboarding/personal-info');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Image 
        source={{ uri: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' }} 
        style={styles.backgroundImage} 
      />
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      />
      
      <View style={styles.content}>
        <Text style={styles.title}>Zestora</Text>
        <Text style={styles.subtitle}>Your personal meal planner and nutrition tracker</Text>
        
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🍽️</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Personalized Meal Plans</Text>
              <Text style={styles.featureDescription}>Get meal suggestions based on your preferences</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>📊</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Track Your Nutrition</Text>
              <Text style={styles.featureDescription}>Monitor calories and macros with ease</Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🛒</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Grocery Lists</Text>
              <Text style={styles.featureDescription}>Automatically create shopping lists from recipes</Text>
            </View>
          </View>
        </View>
        
        <Pressable style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
          <ArrowRight size={20} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 32,
  },
  features: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
});