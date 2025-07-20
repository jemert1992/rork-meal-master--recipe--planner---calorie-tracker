import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowRight, ArrowLeft, X, Target, Calendar, ShoppingCart, Sparkles, Home } from 'lucide-react-native';
import { useTutorialStore } from '@/store/tutorialStore';
import Colors from '@/constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  tip: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Zestora! 👋',
    description: 'Your personal nutrition companion is ready to help you eat healthier and reach your goals.',
    icon: Home,
    tip: 'Take your time exploring - you can always revisit this tutorial from Settings.',
  },
  {
    id: 'nutrition',
    title: 'Track Your Nutrition 📊',
    description: 'Easily log meals and see your daily calories, protein, carbs, and fats in beautiful charts.',
    icon: Target,
    tip: 'Pro tip: Use the camera to quickly scan food labels and get nutrition info instantly.',
  },
  {
    id: 'planning',
    title: 'Plan Your Meals 📅',
    description: 'Drag and drop recipes into your weekly calendar. Get personalized suggestions based on your goals.',
    icon: Calendar,
    tip: 'Planning ahead saves time and helps you stick to your nutrition goals.',
  },
  {
    id: 'grocery',
    title: 'Smart Shopping Lists 🛒',
    description: 'Your grocery list is automatically created from your meal plans. Never forget ingredients again!',
    icon: ShoppingCart,
    tip: 'Organize by store sections and check off items as you shop.',
  },
  {
    id: 'ai',
    title: 'AI Recommendations ✨',
    description: 'Get personalized recipe suggestions, meal modifications, and nutrition advice tailored just for you.',
    icon: Sparkles,
    tip: 'The more you use Zestora, the better our recommendations become.',
  },
];

interface UserFriendlyTutorialProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function UserFriendlyTutorial({ visible, onComplete, onSkip }: UserFriendlyTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const currentStepData = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

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

  const handleSkip = () => {
    onSkip();
  };

  if (!visible || !currentStepData) {
    return null;
  }

  const IconComponent = currentStepData.icon;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={Platform.OS !== 'web'}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}
        
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={handleSkip}>
            <X size={20} color={Colors.textSecondary} />
          </Pressable>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {currentStep + 1} of {TUTORIAL_STEPS.length}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <IconComponent size={48} color={Colors.primary} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{currentStepData.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{currentStepData.description}</Text>

            {/* Tip */}
            <View style={styles.tipContainer}>
              <Text style={styles.tipLabel}>💡 Tip:</Text>
              <Text style={styles.tipText}>{currentStepData.tip}</Text>
            </View>
          </View>

          {/* Navigation */}
          <View style={styles.navigation}>
            <View style={styles.navigationRow}>
              {!isFirstStep && (
                <Pressable style={styles.backButton} onPress={handlePrevious}>
                  <ArrowLeft size={16} color={Colors.textSecondary} />
                  <Text style={styles.backButtonText}>Back</Text>
                </Pressable>
              )}
              
              <View style={styles.navigationSpacer} />
              
              <Pressable style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {isLastStep ? "Let's Go!" : 'Next'}
                </Text>
                <ArrowRight size={16} color={Colors.white} />
              </Pressable>
            </View>

            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip tutorial</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    maxHeight: screenHeight * 0.8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressTrack: {
    width: 120,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 30,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  tipContainer: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  tipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  navigation: {
    alignItems: 'center',
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
  navigationSpacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '500',
  },
});