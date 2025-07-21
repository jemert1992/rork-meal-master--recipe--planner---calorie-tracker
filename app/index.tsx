import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable, SafeAreaView, Dimensions, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ChefHat, Sparkles } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useTutorialStore } from '@/store/tutorialStore';

import ModernTutorialOverlay from '@/components/ModernTutorialOverlay';
import TestTutorialOverlay from '@/components/TestTutorialOverlay';
import Colors from '@/constants/colors';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;

export default function WelcomeScreen() {
  const router = useRouter();
  const { isLoggedIn, profile } = useUserStore();
  const tutorialStore = useTutorialStore();
  const [testModalVisible, setTestModalVisible] = useState(false);
  const { 
    isFirstLaunch, 
    tutorialCompleted, 
    showTutorial, 
    startTutorial,
    skipTutorial,
    shouldRedirectToOnboarding,
    setShouldRedirectToOnboarding,
    checkAndStartTutorial
  } = tutorialStore;

  // Check if tutorial should be shown immediately on first launch
  useEffect(() => {
    console.log('Welcome screen mounted:', { isFirstLaunch, tutorialCompleted, isLoggedIn, onboardingCompleted: profile.onboardingCompleted });
    
    // If user is already set up, redirect to main app
    if (isLoggedIn && profile.onboardingCompleted && tutorialCompleted) {
      router.replace('/(tabs)');
      return;
    }
    
    // Temporarily disable auto-starting tutorial to prevent blocking
    // if (isFirstLaunch && !tutorialCompleted) {
    //   console.log('First launch detected - starting tutorial');
    //   startTutorial();
    // }
  }, [isFirstLaunch, tutorialCompleted, isLoggedIn, profile.onboardingCompleted]);
  
  // Handle redirect to onboarding after tutorial completion
  useEffect(() => {
    if (shouldRedirectToOnboarding && tutorialCompleted) {
      console.log('Redirecting to onboarding after tutorial completion');
      setShouldRedirectToOnboarding(false);
      router.push('/onboarding/personal-info');
    }
  }, [shouldRedirectToOnboarding, tutorialCompleted, setShouldRedirectToOnboarding, router]);

  // Debug: Monitor showTutorial state changes
  useEffect(() => {
    console.log('showTutorial state changed in WelcomeScreen:', showTutorial);
    console.log('Full tutorial store state on change:', tutorialStore);
  }, [showTutorial]);

  // Debug: Monitor all tutorial store changes
  useEffect(() => {
    console.log('Tutorial store changed:', tutorialStore);
  }, [tutorialStore]);

  const handleGetStarted = () => {
    console.log('=== STARTING TUTORIAL ===');
    console.log('Current tutorial state before:', { showTutorial, tutorialCompleted, isFirstLaunch });
    console.log('Full tutorial store state before:', tutorialStore);
    
    startTutorial();
    
    // Immediate check
    const immediateState = useTutorialStore.getState();
    console.log('Immediate state after startTutorial:', immediateState);
    
    // Wait a bit for state to update
    setTimeout(() => {
      const delayedState = useTutorialStore.getState();
      console.log('Delayed state after startTutorial:', delayedState);
      console.log('showTutorial value:', delayedState.showTutorial);
    }, 100);
  };
  
  const handleTutorialComplete = () => {
    console.log('Tutorial completed');
    // Redirect to onboarding after tutorial completion
    router.push('/onboarding/personal-info');
  };
  
  const handleTutorialSkip = () => {
    console.log('Tutorial skipped');
    skipTutorial();
    router.push('/onboarding/personal-info');
  };

  const handleSkipToOnboarding = () => {
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
            onPress={handleGetStarted}
            hitSlop={Platform.OS === 'web' ? undefined : { top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Start Tutorial"
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
          
          {/* Test Modal button */}
          <Pressable 
            style={[styles.emergencyButton, { backgroundColor: 'rgba(0, 255, 0, 0.2)' }]} 
            onPress={() => {
              console.log('Showing test modal');
              setTestModalVisible(true);
            }}
          >
            <Text style={styles.emergencyButtonText}>Test Modal</Text>
          </Pressable>

          {/* Debug button to force tutorial */}
          <Pressable 
            style={[styles.emergencyButton, { backgroundColor: 'rgba(255, 0, 0, 0.2)' }]} 
            onPress={() => {
              console.log('Force showing tutorial');
              tutorialStore.setShowTutorial(true);
              // Also try direct state update
              setTimeout(() => {
                console.log('State after force show:', useTutorialStore.getState());
              }, 50);
            }}
          >
            <Text style={styles.emergencyButtonText}>Force Show Tutorial (Debug)</Text>
          </Pressable>

          {/* Emergency fallback button */}
          <Pressable style={styles.emergencyButton} onPress={() => router.push('/onboarding/personal-info')}>
            <Text style={styles.emergencyButtonText}>Continue to App Setup →</Text>
          </Pressable>
        </View>
      </View>
      
      {/* Test Modal */}
      <Modal
        visible={testModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTestModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
            <Text style={{ color: 'black', marginBottom: 20 }}>Test Modal Works!</Text>
            <Pressable 
              style={{ backgroundColor: Colors.primary, padding: 10, borderRadius: 5 }}
              onPress={() => setTestModalVisible(false)}
            >
              <Text style={{ color: 'white' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Tutorial Overlay - Test Version */}
      <TestTutorialOverlay 
        visible={showTutorial}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
      
      {/* Original Tutorial Overlay - Commented out for testing */}
      {/* <ModernTutorialOverlay 
        visible={showTutorial}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      /> */}
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
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
    }),
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
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: isSmallScreen ? 14 : 15,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  emergencyButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  emergencyButtonText: {
    color: Colors.white,
    fontSize: isSmallScreen ? 16 : 17,
    fontWeight: '600',
  },

});