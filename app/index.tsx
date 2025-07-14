import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, SafeAreaView, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Calendar, ShoppingCart, Sparkles, ArrowRight, ChefHat } from 'lucide-react-native';
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
    checkAndStartTutorial
  } = useTutorialStore();

  useEffect(() => {
    // If user is already logged in and completed onboarding, redirect to main app
    if (isLoggedIn && profile.onboardingCompleted && tutorialCompleted) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, profile.onboardingCompleted, tutorialCompleted]);
  
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
    // Always start tutorial first on first launch
    startTutorial();
  };

  const handleSkipToOnboarding = () => {
    skipTutorial();
    router.push('/onboarding/personal-info');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Tutorial Components */}
      <TutorialOverlay currentScreen="welcome" />
      
      {/* Background Image */}
      <Image 
        source={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' }} 
        style={styles.backgroundImage} 
      />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.logo}
            >
              <ChefHat size={isSmallScreen ? 32 : 36} color={Colors.white} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Welcome to Zestora</Text>
          <Text style={styles.subtitle}>
            Your personal meal planning and nutrition tracking companion
          </Text>
        </View>
        
        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What makes Zestora special?</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Target size={24} color={Colors.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Smart Nutrition Tracking</Text>
                <Text style={styles.featureDescription}>Track calories and macros effortlessly with AI-powered insights</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Calendar size={24} color={Colors.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Weekly Meal Planning</Text>
                <Text style={styles.featureDescription}>Plan your entire week with personalized recipe recommendations</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <ShoppingCart size={24} color={Colors.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Auto Grocery Lists</Text>
                <Text style={styles.featureDescription}>Never forget ingredients with automatically generated shopping lists</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Sparkles size={24} color={Colors.primary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI Recommendations</Text>
                <Text style={styles.featureDescription}>Get personalized meal suggestions based on your goals and preferences</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>
            Ready to transform your eating habits?
          </Text>
          <Text style={styles.ctaSubtitle}>
            Let's take a quick tour to get you started!
          </Text>
        </View>
        
        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.startButton} onPress={handleGetStarted}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  backgroundImage: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    opacity: 0.4,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: isSmallScreen ? 50 : 70,
    paddingBottom: isSmallScreen ? 40 : 50,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 20 : 30,
  },
  logoContainer: {
    marginBottom: isSmallScreen ? 16 : 20,
  },
  logo: {
    width: isSmallScreen ? 80 : 90,
    height: isSmallScreen ? 80 : 90,
    borderRadius: isSmallScreen ? 40 : 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isSmallScreen ? 16 : 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 22 : 26,
    paddingHorizontal: 20,
  },
  featuresSection: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: isSmallScreen ? 16 : 24,
    maxHeight: isSmallScreen ? 300 : 400,
  },
  featuresTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: isSmallScreen ? 20 : 24,
  },
  featuresList: {
    gap: isSmallScreen ? 12 : 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: isSmallScreen ? 14 : 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIconContainer: {
    width: isSmallScreen ? 44 : 48,
    height: isSmallScreen ? 44 : 48,
    borderRadius: isSmallScreen ? 22 : 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isSmallScreen ? 12 : 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: isSmallScreen ? 12 : 13,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: isSmallScreen ? 16 : 18,
  },
  ctaSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 20 : 24,
  },
  ctaTitle: {
    fontSize: isSmallScreen ? 20 : 22,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: isSmallScreen ? 15 : 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 20 : 22,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: 12,
  },
  startButton: {
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    width: '100%',
    maxWidth: 300,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 16 : 18,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: isSmallScreen ? 17 : 18,
    marginRight: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: isSmallScreen ? 15 : 16,
    textDecorationLine: 'underline',
  },
});