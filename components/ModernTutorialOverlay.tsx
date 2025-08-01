import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';

import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  ChefHat, 
  Target, 
  Calendar, 
  ShoppingCart, 
  Zap, 
  Search,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { GlobalStyles } from '@/styles/globalStyles';
import { useTutorialStore } from '@/store/tutorialStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ModernTutorialOverlay() {
  const {
    showTutorial,
    stepIndex,
    steps,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
  } = useTutorialStore();
  
  const currentStepData = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;
  
  const handleNext = () => {
    if (isLastStep) {
      completeTutorial();
    } else {
      nextStep();
    }
  };
  
  const handlePrevious = () => {
    if (!isFirstStep) {
      previousStep();
    }
  };
  
  const getIcon = (iconType: string, size = 32, color = Colors.white) => {
    switch (iconType) {
      case 'chef-hat': return <ChefHat size={size} color={color} />;
      case 'search': return <Search size={size} color={color} />;
      case 'calendar': return <Calendar size={size} color={color} />;
      case 'target': return <Target size={size} color={color} />;
      case 'shopping-cart': return <ShoppingCart size={size} color={color} />;
      case 'zap': return <Zap size={size} color={color} />;
      default: return <ChefHat size={size} color={color} />;
    }
  };

  if (!showTutorial || !currentStepData) {
    return null;
  }

  return (
    <Modal
      visible={showTutorial}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[StyleSheet.absoluteFill, Platform.OS === 'web' ? styles.webBlur : styles.androidBlur]} />
        
        <View style={styles.container}>
          <View style={styles.tutorialCard}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${progress}%`,
                      backgroundColor: currentStepData.color || Colors.primary 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {stepIndex + 1} of {steps.length}
              </Text>
            </View>

            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={skipTutorial}>
              <X size={20} color={Colors.textSecondary} />
            </Pressable>

            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: currentStepData.color || Colors.primary }]}>
              {getIcon(currentStepData.icon || 'chef-hat', 40, Colors.white)}
            </View>

            {/* Title */}
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>

            {/* Description */}
            <Text style={styles.stepDescription}>{currentStepData.description}</Text>

            {/* Navigation */}
            <View style={styles.navigationContainer}>
              <View style={styles.leftNavigation}>
                {/* Skip Button */}
                <Pressable style={styles.skipButton} onPress={skipTutorial}>
                  <Text style={styles.skipButtonText}>Skip</Text>
                </Pressable>
                
                {/* Back Button */}
                {!isFirstStep && (
                  <Pressable style={styles.backButton} onPress={handlePrevious}>
                    <ArrowLeft size={16} color={Colors.textSecondary} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </Pressable>
                )}
              </View>
              
              <View style={styles.navigationSpacer} />
              
              <Pressable 
                style={[styles.nextButton, { backgroundColor: currentStepData.color || Colors.primary }]} 
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? 'Finish' : 'Next'}
                </Text>
                <ArrowRight size={16} color={Colors.white} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 9999,
  },
  webBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    zIndex: 10001,
  },
  tutorialCard: {
    width: Math.min(screenWidth - 40, 400),
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    }),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 50,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    zIndex: 10,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  stepTitle: {
    ...GlobalStyles.heading2,
    textAlign: 'center',
    marginBottom: 12,
    color: Colors.text,
  },
  stepDescription: {
    ...GlobalStyles.bodyText,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '500',
  },
  leftNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});