import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, SafeAreaView, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ChefHat, Sparkles } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useTutorialStore } from '@/store/tutorialStore';

import TutorialOverlay from '@/components/TutorialOverlay';
import Colors from '@/constants/colors';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;

export default function WelcomeScreen() {
  const router = useRouter();
  const { isLoggedIn, profile } = useUserStore();
  const { 
    isFirstLaunch, 
    tutorialCompleted, 
    showWelcome, 
    showTutorial, 
    startTutorial,
    skipTutorial,
    setShowTutorial,
    shouldRedirectToOnboarding,
    setShouldRedirectToOnboarding,
    checkAndStartTutorial,
    resetTutorial
  } = useTutorialStore();

  useEffect(() => {
    console.log('Welcome screen state:', { isLoggedIn, onboardingCompleted: profile.onboardingCompleted, tutorialCompleted, showTutorial, showWelcome });
    // If user is already logged in and completed onboarding, redirect to main app
    if (isLoggedIn && profile.onboardingCompleted && tutorialCompleted) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, profile.onboardingCompleted, tutorialCompleted, showTutorial, showWelcome]);
  
  // Debug effect to monitor tutorial state changes
  useEffect(() => {
    console.log('Tutorial state changed:', { showTutorial, currentStep: useTutorialStore.getState().currentStep });
  }, [showTutorial]);
  
  // Handle redirect to onboarding after tutorial completion
  useEffect(() => {
    if (shouldRedirectToOnboarding && tutorialCompleted) {
      setShouldRedirectToOnboarding(false);
      router.push('/onboarding/personal-info');
    }
  }, [shouldRedirectToOnboarding, tutorialCompleted, setShouldRedirectToOnboarding, router]);

  // Show tutorial on first launch
  useEffect(() => {
    // Small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      checkAndStartTutorial();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [checkAndStartTutorial]);

  const handleGetStarted = () => {
    console.log('handleGetStarted called');
    console.log('Current tutorial state before start:', { showTutorial, tutorialCompleted, isFirstLaunch });
    
    // Add alert to confirm button press
    alert('Starting tutorial...');
    
    // Start tutorial immediately
    startTutorial();
    
    // Check state after a delay
    setTimeout(() => {
      const state = useTutorialStore.getState();
      console.log('Tutorial state after start:', state);
      alert(`Tutorial state: showTutorial=${state.showTutorial}, currentStep=${state.currentStep}`);
    }, 500);
  };

  const handleSkipToOnboarding = () => {
    skipTutorial();
    router.push('/onboarding/personal-info');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background with subtle pattern */}
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E']}
        style={styles.backgroundGradient}
      />
      
      {/* Floating elements for visual interest */}
      <View style={styles.floatingElements}>
        <View style={[styles.floatingCircle, styles.circle1]} />
        <View style={[styles.floatingCircle, styles.circle2]} />
        <View style={[styles.floatingCircle, styles.circle3]} />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {/* Main Logo and Branding */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.logo}
            >
              <ChefHat size={isSmallScreen ? 40 : 48} color={Colors.white} />
            </LinearGradient>
            <View style={styles.sparkleContainer}>
              <Sparkles size={16} color={Colors.primary} style={styles.sparkle1} />
              <Sparkles size={12} color={Colors.secondary} style={styles.sparkle2} />
              <Sparkles size={14} color={Colors.primary} style={styles.sparkle3} />
            </View>
          </View>
          
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.brandName}>Zestora</Text>
          <Text style={styles.tagline}>
            Your AI-powered meal planning & nutrition companion
          </Text>
        </View>
        
        {/* Feature highlights */}
        <View style={styles.featuresPreview}>
          <View style={styles.featureHighlight}>
            <Text style={styles.featureEmoji}>🎯</Text>
            <Text style={styles.featureText}>Smart Nutrition Tracking</Text>
          </View>
          <View style={styles.featureHighlight}>
            <Text style={styles.featureEmoji}>📅</Text>
            <Text style={styles.featureText}>Weekly Meal Planning</Text>
          </View>
          <View style={styles.featureHighlight}>
            <Text style={styles.featureEmoji}>🛒</Text>
            <Text style={styles.featureText}>Auto Grocery Lists</Text>
          </View>
        </View>
        
        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaText}>
            Ready to transform your eating habits?
          </Text>
          
          <Pressable 
            style={({ pressed }) => [
              styles.startButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
            ]}
onPress={() => {
              console.log('Start Tutorial button pressed');
              console.log('Tutorial store state before start:', { showTutorial, tutorialCompleted, isFirstLaunch });
              handleGetStarted();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Start Tutorial</Text>
              <ArrowRight size={20} color={Colors.white} />
            </LinearGradient>
          </Pressable>
          
          <Pressable style={styles.skipButton} onPress={handleSkipToOnboarding}>
            <Text style={styles.skipButtonText}>Skip to Setup</Text>
          </Pressable>
        </View>
      </View>
      
      {/* Tutorial Components - moved to end to avoid blocking */}
      <TutorialOverlay currentScreen="welcome" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.1,
  },
  circle1: {
    width: 120,
    height: 120,
    backgroundColor: Colors.primary,
    top: '15%',
    right: -30,
  },
  circle2: {
    width: 80,
    height: 80,
    backgroundColor: Colors.secondary,
    top: '60%',
    left: -20,
  },
  circle3: {
    width: 60,
    height: 60,
    backgroundColor: Colors.primary,
    top: '35%',
    left: '20%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: isSmallScreen ? 60 : 80,
    paddingBottom: isSmallScreen ? 40 : 50,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: isSmallScreen ? -40 : -60,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: isSmallScreen ? 24 : 32,
  },
  logo: {
    width: isSmallScreen ? 100 : 120,
    height: isSmallScreen ? 100 : 120,
    borderRadius: isSmallScreen ? 50 : 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle1: {
    position: 'absolute',
    top: -8,
    right: 10,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 5,
    left: -5,
  },
  sparkle3: {
    position: 'absolute',
    top: 20,
    left: -10,
  },
  welcomeText: {
    fontSize: isSmallScreen ? 18 : 20,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    marginBottom: 4,
    textAlign: 'center',
  },
  brandName: {
    fontSize: isSmallScreen ? 42 : 48,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: isSmallScreen ? 12 : 16,
    textAlign: 'center',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: isSmallScreen ? 16 : 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 22 : 26,
    paddingHorizontal: 20,
    fontWeight: '400',
  },
  featuresPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: isSmallScreen ? 32 : 40,
    paddingHorizontal: 10,
  },
  featureHighlight: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  featureEmoji: {
    fontSize: isSmallScreen ? 24 : 28,
    marginBottom: 8,
  },
  featureText: {
    fontSize: isSmallScreen ? 12 : 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  ctaSection: {
    alignItems: 'center',
    paddingBottom: isSmallScreen ? 20 : 30,
  },
  ctaText: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: isSmallScreen ? 24 : 32,
    lineHeight: isSmallScreen ? 24 : 28,
  },
  startButton: {
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
    width: '100%',
    maxWidth: 280,
    marginBottom: 16,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 18 : 20,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: isSmallScreen ? 18 : 19,
    marginRight: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: isSmallScreen ? 14 : 15,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});