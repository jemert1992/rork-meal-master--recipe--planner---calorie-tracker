import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowRight, ArrowLeft, X, Lightbulb } from 'lucide-react-native';
import { useTutorialStore } from '@/store/tutorialStore';
import Colors from '@/constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TutorialOverlayProps {
  currentScreen: string;
}

export default function TutorialOverlay({ currentScreen }: TutorialOverlayProps) {
  const {
    showTutorial,
    currentStep,
    steps,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
  } = useTutorialStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  const currentStepData = steps[currentStep];
  const isCurrentScreen = currentStepData?.screen === currentScreen;
  const shouldShow = showTutorial && isCurrentScreen;
  
  useEffect(() => {
    if (shouldShow) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [shouldShow, fadeAnim, scaleAnim]);
  
  if (!shouldShow || !currentStepData) {
    return null;
  }
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  const getModalPosition = () => {
    switch (currentStepData.position) {
      case 'top':
        return { justifyContent: 'flex-start', paddingTop: 100 };
      case 'bottom':
        return { justifyContent: 'flex-end', paddingBottom: 100 };
      default:
        return { justifyContent: 'center' };
    }
  };
  
  return (
    <Modal
      visible={shouldShow}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}
        
        <View style={[styles.container, getModalPosition()]}>
          <Animated.View
            style={[
              styles.tutorialCard,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {currentStep + 1} of {steps.length}
              </Text>
            </View>
            
            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={skipTutorial}>
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
                <Pressable style={styles.secondaryButton} onPress={previousStep}>
                  <ArrowLeft size={16} color={Colors.primary} />
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
              )}
              
              <View style={styles.buttonSpacer} />
              
              {isLastStep ? (
                <Pressable style={styles.primaryButton} onPress={completeTutorial}>
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                  <ArrowRight size={16} color={Colors.white} />
                </Pressable>
              ) : (
                <Pressable style={styles.primaryButton} onPress={nextStep}>
                  <Text style={styles.primaryButtonText}>Next</Text>
                  <ArrowRight size={16} color={Colors.white} />
                </Pressable>
              )}
            </View>
            
            {/* Skip Button */}
            <Pressable style={styles.skipButton} onPress={skipTutorial}>
              <Text style={styles.skipButtonText}>Skip Tutorial</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  tutorialCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
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
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
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
  },
  buttonSpacer: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    justifyContent: 'center',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
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
  },
  skipButtonText: {
    color: Colors.textLight,
    fontSize: 14,
  },
});