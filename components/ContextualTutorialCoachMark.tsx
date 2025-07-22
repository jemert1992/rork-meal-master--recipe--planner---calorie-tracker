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
  PanResponder,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
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
  CheckCircle,
  Play,
  Pause,
  SkipForward
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { 
  useTutorialStore, 
  selectCurrentStep, 
  selectIsTutorialActive, 
  selectCurrentStepData,
  ElementPosition 
} from '@/store/tutorialStore';
import {
  createTutorialAccessibilityProps,
  announceTutorialStep,
  announceTutorialCompletion,
  announceTutorialPause,
  getAccessibleAnimationDuration,
} from '@/utils/tutorialAccessibility';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CoachMarkProps {
  visible: boolean;
  step: any;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onPause: () => void;
  onResume: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
  elementPosition?: ElementPosition;
  isPaused: boolean;
  waitingForInteraction: boolean;
  animationsEnabled: boolean;
}

const CoachMark: React.FC<CoachMarkProps> = React.memo(({
  visible,
  step,
  onNext,
  onPrevious,
  onSkip,
  onPause,
  onResume,
  isFirst,
  isLast,
  currentStep,
  totalSteps,
  elementPosition,
  isPaused,
  waitingForInteraction,
  animationsEnabled
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const hasAnimatedRef = useRef(false);
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Swipe gesture handler for mobile navigation
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 100;
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 50 && !isLast) {
        onNext();
      } else if (gestureState.dx < -50 && !isFirst) {
        onPrevious();
      }
    },
  }), [isFirst, isLast, onNext, onPrevious]);

  // Guard: Only animate when visibility changes and prevent repeated animations
  useEffect(() => {
    if (visible && !hasAnimatedRef.current && animationsEnabled) {
      hasAnimatedRef.current = true;
      
      // Get accessible animation duration
      getAccessibleAnimationDuration(300).then((duration) => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
      
      // Announce step to screen readers
      announceTutorialStep(
        currentStep + 1,
        totalSteps,
        step.title,
        waitingForInteraction
      );
    } else if (!visible && hasAnimatedRef.current) {
      hasAnimatedRef.current = false;
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible, animationsEnabled, currentStep, totalSteps, step?.title, waitingForInteraction]);

  // Pulse animation for target elements
  useEffect(() => {
    if (step?.pulseTarget && elementPosition && animationsEnabled) {
      pulseAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimationRef.current.start();
    }
    
    return () => {
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop();
      }
    };
  }, [step?.pulseTarget, elementPosition, animationsEnabled]);

  // Smooth progress bar animation
  useEffect(() => {
    if (animationsEnabled) {
      Animated.timing(progressAnim, {
        toValue: (currentStep + 1) / totalSteps,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue((currentStep + 1) / totalSteps);
    }
  }, [currentStep, totalSteps, animationsEnabled]);

  const getIcon = useCallback((iconType: string, size = 24, color = Colors.white) => {
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
  }, []);

  const getCoachMarkPosition = useCallback(() => {
    const padding = 20;
    const coachMarkWidth = Math.min(screenWidth - 40, 320);
    const coachMarkHeight = 200;
    
    if (elementPosition) {
      const { x, y, width, height } = elementPosition;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      
      const spaceAbove = y;
      const spaceBelow = screenHeight - (y + height);
      const spaceLeft = x;
      const spaceRight = screenWidth - (x + width);
      
      let position: any = {};
      let pointerStyle = {};
      
      if (spaceBelow > coachMarkHeight + 20) {
        position = {
          top: y + height + 15,
          left: Math.max(padding, Math.min(centerX - coachMarkWidth / 2, screenWidth - coachMarkWidth - padding)),
        };
        pointerStyle = { top: -8, left: Math.max(20, centerX - position.left - 8) };
      } else if (spaceAbove > coachMarkHeight + 20) {
        position = {
          bottom: screenHeight - y + 15,
          left: Math.max(padding, Math.min(centerX - coachMarkWidth / 2, screenWidth - coachMarkWidth - padding)),
        };
        pointerStyle = { bottom: -8, left: Math.max(20, centerX - position.left - 8) };
      } else if (spaceRight > coachMarkWidth + 20) {
        position = {
          top: Math.max(padding, Math.min(centerY - coachMarkHeight / 2, screenHeight - coachMarkHeight - padding)),
          left: x + width + 15,
        };
        pointerStyle = { left: -8, top: Math.max(20, centerY - position.top - 8) };
      } else if (spaceLeft > coachMarkWidth + 20) {
        position = {
          top: Math.max(padding, Math.min(centerY - coachMarkHeight / 2, screenHeight - coachMarkHeight - padding)),
          right: screenWidth - x + 15,
        };
        pointerStyle = { right: -8, top: Math.max(20, centerY - position.top - 8) };
      } else {
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
  }, [elementPosition, step.position]);

  if (!visible) return null;

  const { position, pointerStyle } = getCoachMarkPosition();

  return (
    <>
      {/* Enhanced backdrop with blur */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={15} style={styles.backdrop} />
      ) : (
        <View style={[styles.backdrop, styles.androidBackdrop]} />
      )}
      
      {/* Focused spotlight overlay */}
      {elementPosition && step.highlightElement && (
        <>
          {/* Dimmed overlay with cutout */}
          <View style={styles.spotlightOverlay} pointerEvents="none">
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlayLeft} />
              <View 
                style={[
                  styles.spotlightCutout,
                  {
                    left: elementPosition.x - 12,
                    top: elementPosition.y - 12,
                    width: elementPosition.width + 24,
                    height: elementPosition.height + 24,
                  }
                ]}
              />
              <View style={styles.overlayRight} />
            </View>
            <View style={styles.overlayBottom} />
          </View>
          
          {/* Pulsing highlight ring */}
          {step.pulseTarget && (
            <Animated.View 
              style={[
                styles.pulseRing,
                {
                  left: elementPosition.x - 16,
                  top: elementPosition.y - 16,
                  width: elementPosition.width + 32,
                  height: elementPosition.height + 32,
                  transform: [{ scale: pulseAnim }],
                }
              ]} 
              pointerEvents="none"
            />
          )}
        </>
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
        {...panResponder.panHandlers}
        {...createTutorialAccessibilityProps(
          currentStep + 1,
          totalSteps,
          step.title,
          step.description,
          true
        )}
      >
        {/* Enhanced progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View 
              style={[
                styles.progressFill, 
                { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: step.color || Colors.primary 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {totalSteps}
          </Text>
        </View>

        {/* Skip Tutorial button */}
        <Pressable 
          style={styles.skipButton} 
          onPress={onSkip}
          accessible={true}
          accessibilityLabel="Skip tutorial"
          accessibilityHint="Skip the entire tutorial"
        >
          <SkipForward size={16} color={Colors.textSecondary} />
          <Text style={styles.skipButtonText}>Skip</Text>
        </Pressable>
        
        {/* Pause/Resume button */}
        <Pressable 
          style={styles.pauseButton} 
          onPress={isPaused ? onResume : onPause}
          accessible={true}
          accessibilityLabel={isPaused ? 'Resume tutorial' : 'Pause tutorial'}
        >
          {isPaused ? (
            <Play size={16} color={Colors.textSecondary} />
          ) : (
            <Pause size={16} color={Colors.textSecondary} />
          )}
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
            {waitingForInteraction && (
              <View style={styles.waitingIndicator}>
                <Text style={styles.waitingText}>Waiting for interaction...</Text>
              </View>
            )}
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
            style={[
              styles.nextButton, 
              { backgroundColor: step.color || Colors.primary },
              (isPaused || waitingForInteraction) && styles.disabledButton
            ]} 
            onPress={onNext}
            disabled={isPaused || waitingForInteraction}
            accessible={true}
            accessibilityLabel={isLast ? 'Finish tutorial' : 'Next step'}
          >
            <Text style={[
              styles.nextButtonText,
              (isPaused || waitingForInteraction) && styles.disabledButtonText
            ]}>
              {isLast ? 'Finish' : 'Next'}
            </Text>
            <ArrowRight size={14} color={(isPaused || waitingForInteraction) ? Colors.textMuted : Colors.white} />
          </Pressable>
        </View>

        {/* Pointer */}
        {elementPosition && Object.keys(pointerStyle).length > 0 && (
          <View style={[styles.pointer, pointerStyle]} />
        )}
      </Animated.View>
    </>
  );
});

CoachMark.displayName = 'CoachMark';

// Completion Modal Component
const CompletionModal: React.FC<{
  visible: boolean;
  message: string;
  onComplete: () => void;
}> = ({ visible, message, onComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.completionOverlay}>
        <Animated.View
          style={[
            styles.completionModal,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.completionIcon}>
            <CheckCircle size={48} color={Colors.success} />
          </View>
          <Text style={styles.completionTitle}>Tutorial Complete!</Text>
          <Text style={styles.completionMessage}>{message}</Text>
          <Pressable style={styles.completionButton} onPress={onComplete}>
            <Text style={styles.completionButtonText}>Get Started</Text>
            <ArrowRight size={16} color={Colors.white} />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function ContextualTutorialCoachMark() {
  const router = useRouter();
  
  // Use stable selectors with shallow comparison to prevent unnecessary rerenders
  const isTutorialActive = useTutorialStore(selectIsTutorialActive);
  const currentStep = useTutorialStore(selectCurrentStep);
  const stepData = useTutorialStore(selectCurrentStepData);
  
  // Get store actions and state - memoized to prevent recreating
  const storeActions = useMemo(() => {
    const store = useTutorialStore.getState();
    return {
      nextStep: store.nextStep,
      previousStep: store.previousStep,
      completeTutorial: store.completeTutorial,
      skipTutorial: store.skipTutorial,
      pauseTutorial: store.pauseTutorial,
      resumeTutorial: store.resumeTutorial,
      markInteractionComplete: store.markInteractionComplete,
      setShouldRedirectToOnboarding: store.setShouldRedirectToOnboarding,
      setCurrentRoute: store.setCurrentRoute,
      steps: store.steps,
      elementRefs: store.elementRefs,
      shouldRedirectToOnboarding: store.shouldRedirectToOnboarding,
      isPaused: store.isPaused,
      waitingForInteraction: store.waitingForInteraction,
      animationsEnabled: store.animationsEnabled,
      currentRoute: store.currentRoute,
    };
  }, []);
  
  // Stable refs to prevent infinite loops - never reset during component lifecycle
  const hasNavigatedRef = useRef<Record<string, boolean>>({});
  const hasRedirectedRef = useRef(false);
  const hasMeasuredRef = useRef<Record<string, boolean>>({});
  const lastStepRef = useRef<number>(-1);
  
  // Local state for element position and completion
  const [elementPosition, setElementPosition] = useState<ElementPosition | undefined>();
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  
  // Memoize current step data to prevent unnecessary recalculations
  const currentStepInfo = useMemo(() => {
    if (!stepData) return null;
    return stepData;
  }, [stepData]);
  
  // Helper function for fallback positions - memoized and stable
  const getFallbackPosition = useCallback((targetElement: string): ElementPosition | undefined => {
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
  }, []);
  
  // Guard: Reset measurement cache and position when step changes
  useEffect(() => {
    if (lastStepRef.current !== currentStep) {
      lastStepRef.current = currentStep;
      // Clear position immediately when step changes
      setElementPosition(undefined);
      // Reset measurement cache for new step
      hasMeasuredRef.current = {};
    }
  }, [currentStep]);
  
  // Guard: Only measure element position when step changes and has target element
  useEffect(() => {
    if (!isTutorialActive || !currentStepInfo?.step?.targetElement) {
      return;
    }
    
    const { step } = currentStepInfo;
    const measureKey = `${currentStep}-${step.targetElement}`;
    
    // Guard: prevent repeated measurements for same step
    if (hasMeasuredRef.current[measureKey]) {
      return;
    }
    
    const targetRef = storeActions.elementRefs[step.targetElement];
    
    if (targetRef?.current?.measure) {
      // Use ref.current.measure() to get real position
      targetRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        // Double-check we're still on the same step to prevent stale updates
        if (useTutorialStore.getState().currentStep === currentStep) {
          hasMeasuredRef.current[measureKey] = true;
          setElementPosition({ x: pageX, y: pageY, width, height });
        }
      });
    } else {
      // Fallback to predefined positions
      const fallbackPosition = getFallbackPosition(step.targetElement);
      hasMeasuredRef.current[measureKey] = true;
      setElementPosition(fallbackPosition);
    }
  }, [currentStep, isTutorialActive, currentStepInfo?.step?.targetElement, storeActions.elementRefs, getFallbackPosition]);
  
  // Guard: Navigate only when needed and prevent duplicate navigation
  useEffect(() => {
    if (!isTutorialActive || !currentStepInfo?.step) return;
    
    const { step } = currentStepInfo;
    const navigationKey = `${currentStep}-${step.route}`;
    
    // Guard: prevent duplicate navigation for same step/route
    if (step.route && !step.skipNavigation && !hasNavigatedRef.current[navigationKey]) {
      hasNavigatedRef.current[navigationKey] = true;
      
      // Navigate with a small delay to ensure state stability
      const timeoutId = setTimeout(() => {
        // Double-check tutorial is still active before navigating
        const currentState = useTutorialStore.getState();
        if (currentState.isTutorialActive && currentState.currentStep === currentStep) {
          router.replace(step.route as any);
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentStep, isTutorialActive, currentStepInfo?.step, router]);
  
  // Guard: Handle redirect only once after tutorial completion
  useEffect(() => {
    if (!storeActions.shouldRedirectToOnboarding || isTutorialActive || hasRedirectedRef.current) return;
    
    hasRedirectedRef.current = true;
    storeActions.setShouldRedirectToOnboarding(false);
    
    const timeoutId = setTimeout(() => {
      // Double-check tutorial is still inactive before redirecting
      if (!useTutorialStore.getState().isTutorialActive) {
        router.replace('/onboarding/personal-info');
      }
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [storeActions.shouldRedirectToOnboarding, isTutorialActive, router]);
  
  // Track current route for tutorial step alignment
  useEffect(() => {
    const currentPath = router.pathname || '';
    storeActions.setCurrentRoute(currentPath);
  }, [router.pathname]);

  // Stable action handlers with guards - memoized to prevent recreating
  const handleNext = useCallback(() => {
    if (!isTutorialActive || storeActions.isPaused) return;
    
    if (currentStepInfo?.isLast) {
      const message = currentStepInfo.step.completionMessage || '🎉 You\'re all set! Let\'s get started.';
      setCompletionMessage(message);
      setShowCompletion(true);
      
      // Delay completion to show the message
      setTimeout(() => {
        storeActions.completeTutorial();
        setShowCompletion(false);
      }, 3000);
    } else {
      storeActions.nextStep();
    }
  }, [isTutorialActive, currentStepInfo?.isLast, currentStepInfo?.step.completionMessage, storeActions]);
  
  const handlePrevious = useCallback(() => {
    if (!isTutorialActive || currentStepInfo?.isFirst || storeActions.isPaused) return;
    storeActions.previousStep();
  }, [isTutorialActive, currentStepInfo?.isFirst, storeActions]);
  
  const handleSkip = useCallback(() => {
    if (!isTutorialActive) return;
    storeActions.skipTutorial();
  }, [isTutorialActive, storeActions]);
  
  const handlePause = useCallback(() => {
    if (!isTutorialActive) return;
    storeActions.pauseTutorial();
    announceTutorialPause(true);
  }, [isTutorialActive, storeActions]);
  
  const handleResume = useCallback(() => {
    if (!isTutorialActive) return;
    storeActions.resumeTutorial();
    announceTutorialPause(false);
  }, [isTutorialActive, storeActions]);
  
  const handleCompletionFinish = useCallback(() => {
    setShowCompletion(false);
    storeActions.completeTutorial();
    
    // Announce completion
    announceTutorialCompletion(completionMessage);
    
    // Navigate to meal plan tab with spotlight effect
    setTimeout(() => {
      router.replace('/(tabs)/meal-plan');
    }, 500);
  }, [storeActions, router, completionMessage]);
  
  if (!isTutorialActive || !currentStepInfo) {
    return null;
  }
  
  const { step, isFirst, isLast } = currentStepInfo;
  
  return (
    <>
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
          onPause={handlePause}
          onResume={handleResume}
          isFirst={isFirst}
          isLast={isLast}
          currentStep={currentStep}
          totalSteps={storeActions.steps.length}
          elementPosition={elementPosition}
          isPaused={storeActions.isPaused}
          waitingForInteraction={storeActions.waitingForInteraction}
          animationsEnabled={storeActions.animationsEnabled}
        />
      </Modal>
      
      <CompletionModal
        visible={showCompletion}
        message={completionMessage}
        onComplete={handleCompletionFinish}
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
    zIndex: 9998,
  },
  androidBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  spotlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 9999,
  },
  overlayMiddle: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 9999,
  },
  overlayLeft: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  overlayRight: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 9999,
  },
  spotlightCutout: {
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10000,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 24px rgba(76, 205, 196, 0.6)',
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
    fontWeight: '600' as const,
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    zIndex: 10,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skipButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginLeft: 4,
  },
  pauseButton: {
    position: 'absolute',
    top: 16,
    right: 80,
    padding: 8,
    zIndex: 10,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  waitingIndicator: {
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.accent,
    borderRadius: 6,
  },
  waitingText: {
    fontSize: 11,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500' as const,
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
    fontWeight: '500' as const,
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
    fontWeight: '600' as const,
    fontSize: 14,
    marginRight: 6,
  },
  disabledButton: {
    backgroundColor: Colors.borderDark,
  },
  disabledButtonText: {
    color: Colors.textMuted,
  },
  
  // Completion Modal Styles
  completionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completionModal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  completionIcon: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.successLight,
    borderRadius: 32,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  completionMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  completionButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completionButtonText: {
    color: Colors.white,
    fontWeight: '600' as const,
    fontSize: 16,
    marginRight: 8,
  },
});