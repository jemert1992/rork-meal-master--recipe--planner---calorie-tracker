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
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ArrowRight, Sparkles, Target, Calendar, ShoppingCart, Earth } from 'lucide-react-native';
import { useTutorialStore } from '@/store/tutorialStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import ModernTutorialOverlay from './ModernTutorialOverlay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;

interface TutorialCompletionModalProps {
  visible: boolean;
  onAddDetails: () => void;
  onSkipForNow: () => void;
}

function TutorialCompletionModal({ visible, onAddDetails, onSkipForNow }: TutorialCompletionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.celebrationIcon}>
              <Earth size={48} color={Colors.primary} />
            </View>
            
            <Text style={styles.modalTitle}>🎉 You're in!</Text>
            <Text style={styles.modalSubtitle}>Let's customize your experience</Text>
            
            <View style={styles.modalButtons}>
              <Pressable style={styles.primaryModalButton} onPress={onAddDetails}>
                <Text style={styles.primaryModalButtonText}>Add my details</Text>
                <ArrowRight size={16} color={Colors.white} />
              </Pressable>
              
              <Pressable style={styles.secondaryModalButton} onPress={onSkipForNow}>
                <Text style={styles.secondaryModalButtonText}>Skip for now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TutorialWelcome() {
  const router = useRouter();
  const { 
    showWelcome, 
    startTutorial, 
    skipTutorial, 
    completeTutorial,
    isFirstLaunch, 
    tutorialCompleted, 
    forceHideTutorial, 
    showTutorial,
    isTutorialActive,
    shouldRedirectToOnboarding,
    setShouldRedirectToOnboarding
  } = useTutorialStore();
  const { isLoggedIn, profile, userInfoSubmitted } = useUserStore();
  const [isHandlingAction, setIsHandlingAction] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // All hooks must be called unconditionally at the top level
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // GUARD: Set mounted state only once
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // GUARD: Safety timeout - auto-hide after 30 seconds if stuck
  useEffect(() => {
    if (showWelcome && isMounted) {
      const timeout = setTimeout(() => {
        console.log('Tutorial welcome timeout - force hiding');
        forceHideTutorial();
      }, 30000);
      
      return () => clearTimeout(timeout);
    }
  }, [showWelcome, forceHideTutorial, isMounted]);
  
  // GUARD: Animate only when showWelcome changes
  useEffect(() => {
    if (showWelcome && isMounted) {
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
  }, [showWelcome, fadeAnim, slideAnim, isMounted]);
  
  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    console.log('Tutorial completed, navigating to personal info');
    completeTutorial();
    // Navigate directly to personal info instead of showing modal
    router.replace('/onboarding/personal-info');
  }, [completeTutorial, router]);
  
  // Handle tutorial skip
  const handleTutorialSkip = useCallback(() => {
    console.log('Tutorial skipped, showing completion modal');
    skipTutorial();
    setShowCompletionModal(true);
  }, [skipTutorial]);
  
  // Handle completion modal actions
  const handleAddDetails = useCallback(() => {
    setShowCompletionModal(false);
    router.replace('/onboarding/personal-info');
  }, [router]);
  
  const handleSkipForNow = useCallback(() => {
    setShowCompletionModal(false);
    router.replace('/(tabs)');
  }, [router]);
  
  // Handle redirect after tutorial completion
  useEffect(() => {
    if (shouldRedirectToOnboarding && !userInfoSubmitted) {
      console.log('Redirecting to personal info after tutorial');
      setShouldRedirectToOnboarding(false);
      router.replace('/onboarding/personal-info');
    }
  }, [shouldRedirectToOnboarding, userInfoSubmitted, router, setShouldRedirectToOnboarding]);
  
  // ALL useCallback hooks must be called unconditionally at the top level
  const handleStartTutorial = useCallback(() => {
    if (isHandlingAction || !isMounted) return;
    setIsHandlingAction(true);
    console.log('Starting tutorial from welcome screen');
    
    // Directly start tutorial without complex conditions
    startTutorial();
    setIsHandlingAction(false);
  }, [isHandlingAction, isMounted, startTutorial]);
  
  const handleSkip = useCallback(() => {
    if (isHandlingAction || !isMounted || showTutorial || !showWelcome) return;
    setIsHandlingAction(true);
    console.log('Skipping tutorial from welcome screen');
    
    // Use a longer timeout to prevent rapid state changes and ensure stability
    setTimeout(() => {
      const currentState = useTutorialStore.getState();
      if (!currentState.tutorialCompleted && 
          currentState.showWelcome &&
          isMounted) {
        handleTutorialSkip();
      }
      setIsHandlingAction(false);
    }, 300); // Increased timeout
  }, [isHandlingAction, isMounted, showTutorial, showWelcome, handleTutorialSkip]);
  
  console.log('TutorialWelcome render:', { showWelcome, isFirstLaunch, tutorialCompleted, showTutorial, isLoggedIn, onboardingCompleted: profile.onboardingCompleted });
  
  // Early returns to prevent rendering conflicts - but all hooks are already called above
  if (!isMounted) {
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
  
  // Don't render welcome if tutorial is active - let the overlay handle it
  if (showTutorial || isTutorialActive) {
    return null;
  }
  
  // Show completion modal if needed
  if (showCompletionModal) {
    return (
      <TutorialCompletionModal
        visible={showCompletionModal}
        onAddDetails={handleAddDetails}
        onSkipForNow={handleSkipForNow}
      />
    );
  }
  
  // Only show the welcome modal if showWelcome is explicitly true and tutorial overlay is not showing
  const shouldShow = showWelcome && !showTutorial && isMounted;
  
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    paddingHorizontal: 20,
  },
  modalContent: {
    width: Math.min(screenWidth - 40, 350),
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  primaryModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryModalButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
  secondaryModalButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryModalButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
});