import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowRight, Sparkles, Target, Calendar, ShoppingCart } from 'lucide-react-native';
import { useTutorialStore } from '@/store/tutorialStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;

export default function TutorialWelcome() {
  const { showWelcome, startTutorial, skipTutorial, isFirstLaunch, tutorialCompleted, forceHideTutorial, showTutorial, isProcessingAction } = useTutorialStore();
  const { isLoggedIn, profile } = useUserStore();
  const [isHandlingAction, setIsHandlingAction] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Prevent multiple instances
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  console.log('TutorialWelcome render:', { showWelcome, isFirstLaunch, tutorialCompleted, showTutorial, isLoggedIn, onboardingCompleted: profile.onboardingCompleted });
  
  // Early returns to prevent rendering conflicts
  if (!isMounted || isProcessingAction) {
    return null;
  }
  
  // Don't render if tutorial is completed
  if (tutorialCompleted) {
    return null;
  }
  
  // Don't render if tutorial overlay is showing
  if (showTutorial) {
    return null;
  }
  
  // Don't render if user hasn't completed onboarding yet
  if (!isLoggedIn || !profile.onboardingCompleted) {
    return null;
  }
  
  // Don't render if welcome is not explicitly shown
  if (!showWelcome) {
    return null;
  }
  
  // Safety timeout - auto-hide after 30 seconds if stuck
  useEffect(() => {
    if (showWelcome) {
      const timeout = setTimeout(() => {
        console.log('Tutorial welcome timeout - force hiding');
        forceHideTutorial();
      }, 30000);
      
      return () => clearTimeout(timeout);
    }
  }, [showWelcome, forceHideTutorial]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    if (showWelcome) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showWelcome]);
  
  if (!showWelcome) {
    return null;
  }
  
  const handleStartTutorial = useCallback(() => {
    if (isHandlingAction || isProcessingAction || !isMounted || showTutorial) return;
    setIsHandlingAction(true);
    console.log('Starting tutorial from welcome screen');
    
    // Use a longer timeout to prevent rapid state changes and ensure stability
    setTimeout(() => {
      const currentState = useTutorialStore.getState();
      if (!currentState.showTutorial && !currentState.isProcessingAction) {
        startTutorial();
      }
      setIsHandlingAction(false);
    }, 200);
  }, [isHandlingAction, isProcessingAction, isMounted, showTutorial, startTutorial]);
  
  const handleSkip = () => {
    if (isHandlingAction || isProcessingAction || !isMounted || showTutorial) return;
    setIsHandlingAction(true);
    console.log('Skipping tutorial from welcome screen');
    
    // Use a longer timeout to prevent rapid state changes and ensure stability
    setTimeout(() => {
      const currentState = useTutorialStore.getState();
      if (!currentState.tutorialCompleted && !currentState.isProcessingAction) {
        skipTutorial();
      }
      setIsHandlingAction(false);
    }, 200);
  };
  
  // Only show the welcome modal if showWelcome is explicitly true and tutorial overlay is not showing
  const shouldShow = showWelcome && !showTutorial && isMounted && !isProcessingAction;
  
  if (!shouldShow) {
    return null;
  }
  
  return (
    <Modal
      visible={shouldShow}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' }} 
          style={styles.backgroundImage} 
        />
        
        {Platform.OS === 'ios' ? (
          <BlurView intensity={30} style={styles.overlay} />
        ) : (
          <View style={[styles.overlay, styles.androidOverlay]} />
        )}
        
        <View style={styles.safeContainer}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Sparkles size={40} color={Colors.primary} />
              </View>
              <Text style={styles.title}>Zestora</Text>
              <Text style={styles.subtitle}>
                Your personal meal planning and nutrition tracking companion
              </Text>
            </View>
            
            {/* Features Preview */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureRow}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Target size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.featureTitle}>Smart Nutrition</Text>
                  <Text style={styles.featureDescription}>Track calories and macros effortlessly</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Calendar size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.featureTitle}>Meal Planning</Text>
                  <Text style={styles.featureDescription}>Plan your week with personalized recipes</Text>
                </View>
              </View>
              
              <View style={styles.featureRow}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <ShoppingCart size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.featureTitle}>Auto Grocery Lists</Text>
                  <Text style={styles.featureDescription}>Never forget ingredients again</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Sparkles size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.featureTitle}>AI Recommendations</Text>
                  <Text style={styles.featureDescription}>Get meals picked just for you</Text>
                </View>
              </View>
            </View>
            
            {/* Call to Action & Buttons */}
            <View style={styles.bottomSection}>
              <View style={styles.ctaContainer}>
                <Text style={styles.ctaText}>
                  Ready to transform your eating habits?
                </Text>
                <Text style={styles.ctaSubtext}>
                  Let's take a quick tour to get you started!
                </Text>
              </View>
              
              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <Pressable style={styles.primaryButton} onPress={handleStartTutorial}>
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                  <ArrowRight size={20} color={Colors.white} />
                </Pressable>
                
                <Pressable style={styles.skipButton} onPress={handleSkip}>
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
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
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  androidOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  safeContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? (isSmallScreen ? 50 : 60) : (isSmallScreen ? 30 : 40),
    paddingBottom: Platform.OS === 'ios' ? (isSmallScreen ? 30 : 40) : (isSmallScreen ? 15 : 20),
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 16 : 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: isSmallScreen ? 16 : 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 22 : 26,
  },
  featuresContainer: {
    marginBottom: isSmallScreen ? 16 : 20,
    flex: 1,
    justifyContent: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 14,
  },
  ctaContainer: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 20 : 24,
  },
  ctaText: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtext: {
    fontSize: isSmallScreen ? 14 : 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  bottomSection: {
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '80%',
    maxWidth: 280,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});