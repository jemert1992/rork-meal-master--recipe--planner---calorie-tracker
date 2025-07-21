import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  User,
  CheckCircle
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTutorialStore } from '@/store/tutorialStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TooltipProps {
  visible: boolean;
  step: any;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  visible,
  step,
  onNext,
  onPrevious,
  onSkip,
  isFirst,
  isLast,
  currentStep,
  totalSteps
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
  }, [visible]);

  const getIcon = (iconType: string, size = 24, color = Colors.white) => {
    switch (iconType) {
      case 'chef-hat': return <ChefHat size={size} color={color} />;
      case 'search': return <Search size={size} color={color} />;
      case 'calendar': return <Calendar size={size} color={color} />;
      case 'target': return <Target size={size} color={color} />;
      case 'shopping-cart': return <ShoppingCart size={size} color={color} />;
      case 'check-circle': return <CheckCircle size={size} color={color} />;
      case 'zap': return <Zap size={size} color={color} />;
      case 'user': return <User size={size} color={color} />;
      default: return <ChefHat size={size} color={color} />;
    }
  };

  const getTooltipPosition = () => {
    // Position tooltip based on step position
    switch (step.position) {
      case 'top':
        return {
          top: 100,
          left: 20,
          right: 20,
        };
      case 'bottom':
        return {
          bottom: 120,
          left: 20,
          right: 20,
        };
      case 'center':
        return {
          top: screenHeight * 0.3,
          left: 20,
          right: 20,
        };
      default:
        return {
          bottom: 120,
          left: 20,
          right: 20,
        };
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.tooltip,
        getTooltipPosition(),
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
                backgroundColor: step.color || Colors.primary 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} of {totalSteps}
        </Text>
      </View>

      {/* Close button */}
      <Pressable style={styles.closeButton} onPress={onSkip}>
        <X size={16} color={Colors.textSecondary} />
      </Pressable>

      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: step.color || Colors.primary }]}>
        {getIcon(step.icon || 'chef-hat', 24, Colors.white)}
      </View>

      {/* Content */}
      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.description}>{step.description}</Text>

      {step.actionText && (
        <View style={styles.actionContainer}>
          <Text style={[styles.actionText, { color: step.color || Colors.primary }]}>
            {step.actionText}
          </Text>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {!isFirst && (
          <Pressable style={styles.backButton} onPress={onPrevious}>
            <ArrowLeft size={14} color={Colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        )}
        
        <View style={styles.navigationSpacer} />
        
        <Pressable 
          style={[styles.nextButton, { backgroundColor: step.color || Colors.primary }]} 
          onPress={onNext}
        >
          <Text style={styles.nextButtonText}>
            {isLast ? 'Finish' : 'Next'}
          </Text>
          <ArrowRight size={14} color={Colors.white} />
        </Pressable>
      </View>

      {/* Pointer/Arrow */}
      {step.position === 'bottom' && (
        <View style={[styles.pointer, styles.pointerUp]} />
      )}
      {step.position === 'top' && (
        <View style={[styles.pointer, styles.pointerDown]} />
      )}
    </Animated.View>
  );
};

export default function ContextualTutorialOverlay() {
  const router = useRouter();
  const {
    showTutorial,
    currentStep,
    steps,
    nextStep,
    previousStep,
    completeTutorial,
    skipTutorial
  } = useTutorialStore();

  const [currentRoute, setCurrentRoute] = useState('/(tabs)');
  
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // Navigate to the correct screen for each step
  useEffect(() => {
    if (showTutorial && step && step.route !== currentRoute && !step.skipNavigation) {
      console.log('Navigating to:', step.route);
      router.push(step.route as any);
      setCurrentRoute(step.route);
    }
  }, [currentStep, step, showTutorial]);

  const handleNext = () => {
    if (isLast) {
      completeTutorial();
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      previousStep();
    }
  };

  const handleSkip = () => {
    skipTutorial();
  };

  if (!showTutorial || !step) {
    return null;
  }

  return (
    <>
      {/* Semi-transparent backdrop */}
      <View style={styles.backdrop} pointerEvents="none" />
      
      {/* Highlight overlay for target elements */}
      {step.highlightElement && (
        <View style={styles.highlightOverlay} pointerEvents="none">
          {/* This would need to be positioned based on the target element */}
          <View style={styles.highlightSpotlight} />
        </View>
      )}

      {/* Tooltip */}
      <Tooltip
        visible={showTutorial}
        step={step}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
        isFirst={isFirst}
        isLast={isLast}
        currentStep={currentStep}
        totalSteps={steps.length}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 9998,
  },
  highlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  highlightSpotlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 10000,
    maxWidth: screenWidth - 40,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
    }),
  },
  pointer: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    left: '50%',
    marginLeft: -8,
  },
  pointerUp: {
    bottom: -8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.surface,
  },
  pointerDown: {
    top: -8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.surface,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionContainer: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.backgroundLight,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontWeight: '500',
    fontSize: 13,
    marginLeft: 4,
  },
  navigationSpacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  nextButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
  },
});