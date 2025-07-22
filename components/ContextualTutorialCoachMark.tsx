import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  Animated,
  Modal,
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
import { 
  useTutorialStore, 
  selectCurrentStep, 
  selectIsTutorialActive, 
  selectCurrentStepData,
  ElementPosition 
} from '@/store/tutorialStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CoachMarkProps {
  visible: boolean;
  step: any;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
  elementPosition?: ElementPosition;
}

const CoachMark: React.FC<CoachMarkProps> = ({
  visible,
  step,
  onNext,
  onPrevious,
  onSkip,
  isFirst,
  isLast,
  currentStep,
  totalSteps,
  elementPosition
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

  const getCoachMarkPosition = () => {
    const padding = 20;
    const coachMarkWidth = Math.min(screenWidth - 40, 320);
    const coachMarkHeight = 200; // Approximate height
    
    if (elementPosition) {
      const { x, y, width, height } = elementPosition;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      
      // Determine best position based on element location
      const spaceAbove = y;
      const spaceBelow = screenHeight - (y + height);
      const spaceLeft = x;
      const spaceRight = screenWidth - (x + width);
      
      let position: any = {};
      let pointerStyle = {};
      
      if (spaceBelow > coachMarkHeight + 20) {
        // Position below element
        position = {
          top: y + height + 15,
          left: Math.max(padding, Math.min(centerX - coachMarkWidth / 2, screenWidth - coachMarkWidth - padding)),
        };
        pointerStyle = { top: -8, left: Math.max(20, centerX - position.left - 8) };
      } else if (spaceAbove > coachMarkHeight + 20) {
        // Position above element
        position = {
          bottom: screenHeight - y + 15,
          left: Math.max(padding, Math.min(centerX - coachMarkWidth / 2, screenWidth - coachMarkWidth - padding)),
        };
        pointerStyle = { bottom: -8, left: Math.max(20, centerX - position.left - 8) };
      } else if (spaceRight > coachMarkWidth + 20) {
        // Position to the right
        position = {
          top: Math.max(padding, Math.min(centerY - coachMarkHeight / 2, screenHeight - coachMarkHeight - padding)),
          left: x + width + 15,
        };
        pointerStyle = { left: -8, top: Math.max(20, centerY - position.top - 8) };
      } else if (spaceLeft > coachMarkWidth + 20) {
        // Position to the left
        position = {
          top: Math.max(padding, Math.min(centerY - coachMarkHeight / 2, screenHeight - coachMarkHeight - padding)),
          right: screenWidth - x + 15,
        };
        pointerStyle = { right: -8, top: Math.max(20, centerY - position.top - 8) };
      } else {
        // Fallback to center
        position = {
          top: (screenHeight - coachMarkHeight) / 2,
          left: padding,
          right: padding,
        };
      }
      
      return { position, pointerStyle };
    }
    
    // Default positioning based on step position
    switch (step.position) {
      case 'top':
        return {
          position: { top: 120, left: padding, right: padding },
          pointerStyle: {}
        };
      case 'bottom':
        return {
          position: { bottom: 140, left: padding, right: padding },
          pointerStyle: {}
        };
      case 'center':
        return {
          position: { top: (screenHeight - 200) / 2, left: padding, right: padding },
          pointerStyle: {}
        };
      default:
        return {
          position: { bottom: 140, left: padding, right: padding },
          pointerStyle: {}
        };
    }
  };

  if (!visible) return null;

  const { position, pointerStyle } = getCoachMarkPosition();

  return (
    <>
      {/* Backdrop */}
      <View style={styles.backdrop} pointerEvents="none" />
      
      {/* Highlight spotlight for target element */}
      {elementPosition && step.highlightElement && (
        <View 
          style={[
            styles.spotlight,
            {
              left: elementPosition.x - 8,
              top: elementPosition.y - 8,
              width: elementPosition.width + 16,
              height: elementPosition.height + 16,
            }
          ]} 
          pointerEvents="none"
        />
      )}
      
      {/* Coach Mark */}
      <Animated.View
        style={[
          styles.coachMark,
          position,
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

        {/* Pointer */}
        {elementPosition && Object.keys(pointerStyle).length > 0 && (
          <View style={[styles.pointer, pointerStyle]} />
        )}
      </Animated.View>
    </>
  );
};

export default function ContextualTutorialCoachMark() {
  const router = useRouter();
  
  // Use stable selectors to prevent unnecessary rerenders
  const isTutorialActive = useTutorialStore(selectIsTutorialActive);
  const currentStep = useTutorialStore(selectCurrentStep);
  const stepData = useTutorialStore(selectCurrentStepData);
  const { 
    nextStep, 
    previousStep, 
    completeTutorial, 
    skipTutorial, 
    shouldRedirectToOnboarding,
    setShouldRedirectToOnboarding,
    steps,
    elementRefs,
    highlightTargets
  } = useTutorialStore();
  
  // Stable state with refs to prevent infinite loops
  const hasNavigatedRef = useRef<Record<string, boolean>>({});
  const hasRedirectedRef = useRef(false);
  const [elementPosition, setElementPosition] = useState<ElementPosition | undefined>();
  
  // Memoize current step data to prevent unnecessary recalculations
  const currentStepInfo = useMemo(() => {
    if (!stepData) return null;
    return stepData;
  }, [stepData]);
  
  // Guard: Only measure element position when step changes and has target element
  useEffect(() => {
    if (!isTutorialActive || !currentStepInfo?.step?.targetElement) {
      setElementPosition(undefined);
      return;
    }
    
    const { step } = currentStepInfo;
    const targetRef = elementRefs[step.targetElement];
    
    if (targetRef?.current) {
      // Use ref.current.measure() to get real position
      targetRef.current.measure?.((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setElementPosition({ x: pageX, y: pageY, width, height });
      });
    } else {
      // Fallback to predefined positions
      const fallbackPosition = getFallbackPosition(step.targetElement);
      setElementPosition(fallbackPosition);
    }
  }, [currentStep, isTutorialActive, currentStepInfo?.step?.targetElement, elementRefs]);
  
  // Guard: Navigate only when needed and prevent duplicate navigation
  useEffect(() => {
    if (!isTutorialActive || !currentStepInfo?.step) return;
    
    const { step } = currentStepInfo;
    const navigationKey = `${currentStep}-${step.route}`;
    
    if (step.route && !step.skipNavigation && !hasNavigatedRef.current[navigationKey]) {
      hasNavigatedRef.current[navigationKey] = true;
      
      // Navigate with a small delay to ensure state stability
      const timeoutId = setTimeout(() => {
        if (useTutorialStore.getState().isTutorialActive) {
          router.replace(step.route as any);
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentStep, isTutorialActive, currentStepInfo?.step, router]);
  
  // Guard: Handle redirect only once after tutorial completion
  useEffect(() => {
    if (!shouldRedirectToOnboarding || isTutorialActive || hasRedirectedRef.current) return;
    
    hasRedirectedRef.current = true;
    setShouldRedirectToOnboarding(false);
    
    const timeoutId = setTimeout(() => {
      if (!useTutorialStore.getState().isTutorialActive) {
        router.replace('/onboarding/personal-info');
      }
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [shouldRedirectToOnboarding, isTutorialActive, setShouldRedirectToOnboarding, router]);
  
  // Stable action handlers with guards
  const handleNext = useCallback(() => {
    if (!isTutorialActive) return;
    
    if (currentStepInfo?.isLast) {
      completeTutorial();
    } else {
      nextStep();
    }
  }, [isTutorialActive, currentStepInfo?.isLast, completeTutorial, nextStep]);
  
  const handlePrevious = useCallback(() => {
    if (!isTutorialActive || currentStepInfo?.isFirst) return;
    previousStep();
  }, [isTutorialActive, currentStepInfo?.isFirst, previousStep]);
  
  const handleSkip = useCallback(() => {
    if (!isTutorialActive) return;
    skipTutorial();
  }, [isTutorialActive, skipTutorial]);
  
  if (!isTutorialActive || !currentStepInfo) {
    return null;
  }
  
  const { step, isFirst, isLast } = currentStepInfo;
  
  return (
    <Modal
      visible={isTutorialActive}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <CoachMark
        visible={isTutorialActive}
        step={step}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSkip={handleSkip}
        isFirst={isFirst}
        isLast={isLast}
        currentStep={currentStep}
        totalSteps={steps.length}
        elementPosition={elementPosition}
      />
    </Modal>
  );
}

// Helper function for fallback positions
function getFallbackPosition(targetElement: string): ElementPosition | undefined {
  switch (targetElement) {
    case 'search-input':
      return { x: 20, y: 180, width: screenWidth - 100, height: 48 };
    case 'quick-actions':
      return { x: 20, y: 280, width: screenWidth - 40, height: 80 };
    case 'meal-plan-content':
      return { x: 20, y: 200, width: screenWidth - 40, height: 200 };
    case 'grocery-content':
      return { x: 20, y: 200, width: screenWidth - 40, height: 200 };
    case 'profile-content':
      return { x: 20, y: 200, width: screenWidth - 40, height: 200 };
    default:
      return undefined;
  }
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
  spotlight: {
    position: 'absolute',
    backgroundColor: 'rgba(76, 205, 196, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 20px rgba(76, 205, 196, 0.4)',
      position: 'fixed' as any,
    }),
  },
  coachMark: {
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
    maxWidth: 320,
    minWidth: 280,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      position: 'fixed' as any,
    }),
  },
  pointer: {
    position: 'absolute',
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 8,
    borderTopColor: Colors.surface,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
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