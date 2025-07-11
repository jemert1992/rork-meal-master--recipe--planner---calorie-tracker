import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { ArrowRight, ArrowLeft, X } from 'lucide-react-native';
import { useTutorialStore } from '@/store/tutorialStore';
import Colors from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

interface TutorialTooltipProps {
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  visible: boolean;
}

export default function TutorialTooltip({ 
  targetElement, 
  position = 'bottom', 
  visible 
}: TutorialTooltipProps) {
  const {
    currentStep,
    steps,
    nextStep,
    previousStep,
    skipTutorial,
  } = useTutorialStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  const currentStepData = steps[currentStep];
  
  useEffect(() => {
    if (visible) {
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
  }, [visible, fadeAnim, scaleAnim]);
  
  if (!visible || !currentStepData) {
    return null;
  }
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  
  const getTooltipStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      maxWidth: screenWidth - 48,
      minWidth: 280,
    };
    
    switch (position) {
      case 'top':
        return { ...baseStyle, bottom: '100%', marginBottom: 12 };
      case 'bottom':
        return { ...baseStyle, top: '100%', marginTop: 12 };
      case 'left':
        return { ...baseStyle, right: '100%', marginRight: 12 };
      case 'right':
        return { ...baseStyle, left: '100%', marginLeft: 12 };
      default:
        return { ...baseStyle, top: '100%', marginTop: 12 };
    }
  };
  
  const getArrowStyle = () => {
    const arrowSize = 12;
    const baseArrow = {
      position: 'absolute' as const,
      width: 0,
      height: 0,
      borderStyle: 'solid' as const,
    };
    
    switch (position) {
      case 'top':
        return {
          ...baseArrow,
          top: '100%',
          left: '50%',
          marginLeft: -arrowSize,
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: Colors.white,
        };
      case 'bottom':
        return {
          ...baseArrow,
          bottom: '100%',
          left: '50%',
          marginLeft: -arrowSize,
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: Colors.white,
        };
      case 'left':
        return {
          ...baseArrow,
          left: '100%',
          top: '50%',
          marginTop: -arrowSize,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: Colors.white,
        };
      case 'right':
        return {
          ...baseArrow,
          right: '100%',
          top: '50%',
          marginTop: -arrowSize,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: Colors.white,
        };
      default:
        return {
          ...baseArrow,
          bottom: '100%',
          left: '50%',
          marginLeft: -arrowSize,
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: Colors.white,
        };
    }
  };
  
  return (
    <Animated.View
      style={[
        getTooltipStyle(),
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.tooltip}>
        <View style={getArrowStyle()} />
        
        {/* Close Button */}
        <Pressable style={styles.closeButton} onPress={skipTutorial}>
          <X size={16} color={Colors.textLight} />
        </Pressable>
        
        {/* Content */}
        <Text style={styles.title}>{currentStepData.title}</Text>
        <Text style={styles.description}>{currentStepData.description}</Text>
        
        {/* Action Hint */}
        {currentStepData.action && (
          <View style={styles.actionHint}>
            <Text style={styles.actionText}>
              {currentStepData.action === 'tap' && '👆 Try tapping this'}
              {currentStepData.action === 'swipe' && '👈 Try swiping'}
              {currentStepData.action === 'scroll' && '📜 Try scrolling'}
            </Text>
          </View>
        )}
        
        {/* Navigation */}
        <View style={styles.navigation}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              {currentStep + 1} of {steps.length}
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            {!isFirstStep && (
              <Pressable style={styles.navButton} onPress={previousStep}>
                <ArrowLeft size={16} color={Colors.primary} />
              </Pressable>
            )}
            
            <Pressable 
              style={[styles.navButton, styles.nextButton]} 
              onPress={isLastStep ? skipTutorial : nextStep}
            >
              {isLastStep ? (
                <Text style={styles.nextButtonText}>Done</Text>
              ) : (
                <ArrowRight size={16} color={Colors.white} />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    marginRight: 24,
  },
  description: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionHint: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepIndicator: {
    flex: 1,
  },
  stepText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    minWidth: 60,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});