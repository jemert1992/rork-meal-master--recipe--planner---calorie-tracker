import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, SafeAreaView, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ChefHat, Sparkles } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useTutorialStore } from '@/store/tutorialStore';
import ModernTutorialOverlay from '@/components/ModernTutorialOverlay';


import Colors from '@/constants/colors';



export default function WelcomeScreen() {
  const router = useRouter();
  const { isLoggedIn, profile } = useUserStore();
  const { 
    showTutorial, 
    startTutorial,
    tutorialCompleted
  } = useTutorialStore();
  const { height: screenHeight } = useWindowDimensions();
  const smallScreen = screenHeight < 700;
  const styles = useMemo(() => createStyles(smallScreen), [smallScreen]);
  
  const [hasRedirectedToTabs, setHasRedirectedToTabs] = useState(false);
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => setMounted(true), []);



  // Initialize user as logged in if not already, so tutorial can show
  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn) {

      const { login } = useUserStore.getState();
      login({ 
        name: 'New User',
        onboardingCompleted: true
      });
    }
  }, [mounted, isLoggedIn]);
  
  // Memoize user setup status to prevent unnecessary re-renders
  const isUserSetup = useMemo(() => {
    const done = profile.onboardingCompleted ?? false;
    return isLoggedIn && done && tutorialCompleted;
  }, [isLoggedIn, profile.onboardingCompleted, tutorialCompleted]);
  
  // PERMANENT FIX: Check if user is already set up, redirect to main app - GUARD: only run when conditions change
  useEffect(() => {
    if (!mounted) return;
    if (isUserSetup && !hasRedirectedToTabs) {

      setHasRedirectedToTabs(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 300);
    }
  }, [mounted, isUserSetup, hasRedirectedToTabs, router]);
  
  // Redirect to tabs after tutorial completion
  useEffect(() => {
    if (!mounted) return;
    if (tutorialCompleted && !hasRedirectedToTabs && isLoggedIn) {

      setHasRedirectedToTabs(true);
      router.replace('/(tabs)');
    }
  }, [mounted, tutorialCompleted, hasRedirectedToTabs, isLoggedIn, router]);

  const handleStartTutorial = useCallback(() => {
    startTutorial();
  }, [startTutorial]);

  if (!mounted) {
    return null;
  }

  if (showTutorial) {

    return <ModernTutorialOverlay />;
  }

  return (
    <SafeAreaView style={styles.container} testID="welcome-screen">
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E']}
        style={styles.backgroundGradient}
      />
      <View style={styles.floatingElements}>
        <View style={[styles.floatingCircle, styles.circle1]} />
        <View style={[styles.floatingCircle, styles.circle2]} />
        <View style={[styles.floatingCircle, styles.circle3]} />
      </View>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.logo}
            >
              <ChefHat size={smallScreen ? 40 : 48} color={Colors.white} />
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
        <View style={styles.ctaSection}>
          <Text style={styles.ctaText}>
            Ready to transform your eating habits?
          </Text>
          <Pressable 
            style={({ pressed }) => [
              styles.startButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
            ]}
            onPress={handleStartTutorial}
            hitSlop={Platform.OS === 'web' ? undefined : { top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Start Tutorial"
            testID="start-tutorial-button"
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Start Tutorial</Text>
              <ArrowRight size={20} color={Colors.white} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (smallScreen: boolean) => StyleSheet.create({
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
    paddingTop: smallScreen ? 60 : 80,
    paddingBottom: smallScreen ? 40 : 50,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: smallScreen ? -40 : -60,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: smallScreen ? 24 : 32,
  },
  logo: {
    width: smallScreen ? 100 : 120,
    height: smallScreen ? 100 : 120,
    borderRadius: smallScreen ? 50 : 60,
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
    fontSize: smallScreen ? 18 : 20,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    marginBottom: 4,
    textAlign: 'center',
  },
  brandName: {
    fontSize: smallScreen ? 42 : 48,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: smallScreen ? 12 : 16,
    textAlign: 'center',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: smallScreen ? 16 : 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: smallScreen ? 22 : 26,
    paddingHorizontal: 20,
    fontWeight: '400',
  },
  featuresPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: smallScreen ? 32 : 40,
    paddingHorizontal: 10,
  },
  featureHighlight: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  featureEmoji: {
    fontSize: smallScreen ? 24 : 28,
    marginBottom: 8,
  },
  featureText: {
    fontSize: smallScreen ? 12 : 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  ctaSection: {
    alignItems: 'center',
    paddingBottom: smallScreen ? 20 : 30,
  },
  ctaText: {
    fontSize: smallScreen ? 18 : 20,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: smallScreen ? 24 : 32,
    lineHeight: smallScreen ? 24 : 28,
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
    paddingVertical: smallScreen ? 18 : 20,
    paddingHorizontal: 40,
    borderRadius: 20,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: smallScreen ? 18 : 19,
    marginRight: 8,
  },


});