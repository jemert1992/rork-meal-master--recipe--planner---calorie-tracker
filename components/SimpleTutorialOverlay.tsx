import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowRight, ArrowLeft, X, Lightbulb } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  screen: string;
  position?: 'top' | 'bottom' | 'center';
  action?: 'tap' | 'swipe' | 'scroll';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome-intro',
    title: 'Welcome to Zestora! 🎉',
    description: 'Your personal meal planning and nutrition tracking companion. We\'re here to make healthy eating simple and enjoyable!',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-nutrition',
    title: 'Smart Nutrition Tracking 📊',
    description: 'Track calories, macros, and nutrients effortlessly. Our AI analyzes your eating patterns and provides personalized insights.',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-planning',
    title: 'Weekly Meal Planning 📅',
    description: 'Plan your entire week with drag-and-drop simplicity. Get personalized recipe recommendations based on your goals.',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-grocery',
    title: 'Auto Grocery Lists 🛒',
    description: 'Never forget ingredients again! Your shopping list is automatically generated from your meal plans.',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-ai',
    title: 'AI Recommendations ✨',
    description: 'Get personalized meal suggestions, recipe modifications, and nutrition advice tailored to your preferences and goals.',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'ready-to-start',
    title: 'Ready to Transform Your Health? 🚀',
    description: 'Let\'s set up your profile and start your journey to better nutrition. Your healthiest self is just a few steps away!',
    screen: 'welcome',
    position: 'center',
  },
];

interface SimpleTutorialOverlayProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  currentScreen: string;
}

export default function SimpleTutorialOverlay({ 
  visible, 
  onComplete, 
  onSkip, 
  currentScreen 
}: SimpleTutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const currentStepData = TUTORIAL_STEPS[currentStep];
  const isCurrentScreen = currentStepData?.screen === currentScreen;
  const shouldShow = visible && isCurrentScreen && !!currentStepData;
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;
  
  // Reset step when tutorial becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
    }
  }, [visible]);
  
  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const getModalPosition = () => {
    const isSmallScreen = screenHeight < 700;
    const topPadding = isSmallScreen ? 120 : 160;
    const bottomPadding = isSmallScreen ? 120 : 160;
    
    switch (currentStepData?.position) {
      case 'top':
        return { justifyContent: 'flex-start', paddingTop: topPadding };
      case 'bottom':
        return { justifyContent: 'flex-end', paddingBottom: bottomPadding };
      default:
        return { justifyContent: 'center', paddingHorizontal: 20 };
    }
  };
  
  if (!shouldShow || !currentStepData) {
    return null;
  }
  
  const TutorialCard = () => (
    <View style={[styles.container, getModalPosition()]}>
      <View style={styles.tutorialCard}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {TUTORIAL_STEPS.length}
          </Text>
        </View>
        
        {/* Close Button */}
        <Pressable style={styles.closeButton} onPress={onSkip}>
          <X size={20} color={Colors.textLight} />
        </Pressable>
        
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Lightbulb size={32} color={Colors.primary} />
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>
        </View>
        
        {/* Action Hint */}
        {currentStepData.action && (
          <View style={styles.actionHint}>
            <Text style={styles.actionText}>
              {currentStepData.action === 'tap' && '👆 Tap to try it'}
              {currentStepData.action === 'swipe' && '👈 Swipe to explore'}
              {currentStepData.action === 'scroll' && '📜 Scroll to see more'}
            </Text>
          </View>
        )}
        
        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {!isFirstStep && (
            <Pressable style={styles.secondaryButton} onPress={handlePrevious}>
              <ArrowLeft size={16} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Back</Text>
            </Pressable>
          )}
          
          <View style={styles.buttonSpacer} />
          
          {isLastStep ? (
            <Pressable style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Set Up Profile</Text>
              <ArrowRight size={16} color={Colors.white} />
            </Pressable>
          ) : (
            <Pressable style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Next</Text>
              <ArrowRight size={16} color={Colors.white} />
            </Pressable>
          )}
        </View>
        
        {/* Skip Button */}
        <Pressable style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip Tutorial</Text>
        </Pressable>
      </View>
    </View>
  );
  
  // Web fallback - render as absolute positioned overlay
  if (Platform.OS === 'web') {
    return shouldShow ? (
      <View style={[styles.overlay, styles.webOverlay]}>
        <View style={[StyleSheet.absoluteFill, styles.webBlur]} />
        <TutorialCard />
      </View>
    ) : null;
  }
  
  return (
    <Modal
      visible={shouldShow}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={Platform.OS !== ('web' as any)}
      presentationStyle={Platform.OS === ('web' as any) ? undefined : 'overFullScreen'}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : Platform.OS === 'android' ? (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webBlur]} />
        )}
        
        <TutorialCard />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 9999,
  },
  webOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  webBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tutorialCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: screenWidth < 380 ? 20 : 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: screenWidth < 380 ? screenWidth - 40 : 400,
    alignSelf: 'center',
    width: '100%',
    minHeight: 220,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    }),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: screenWidth < 380 ? 18 : 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  description: {
    fontSize: screenWidth < 380 ? 14 : 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: screenWidth < 380 ? 20 : 24,
    paddingHorizontal: 8,
  },
  actionHint: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  buttonSpacer: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    }),
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  skipButtonText: {
    color: Colors.textLight,
    fontSize: 14,
  },
});