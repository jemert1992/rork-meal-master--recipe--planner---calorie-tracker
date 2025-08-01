import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  CheckCircle
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTutorialStore } from '@/store/tutorialStore';


const { height: screenHeight } = Dimensions.get('window');

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
}

const CoachMark: React.FC<CoachMarkProps> = React.memo(({
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
  const progressAnim = useRef(new Animated.Value(0)).current;



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



  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / totalSteps,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps, progressAnim]);

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
    return {
      position: { 
        top: (screenHeight - 300) / 2, 
        left: padding, 
        right: padding 
      },
      pointerStyle: {}
    };
  }, []);

  if (!visible) return null;

  const { position } = getCoachMarkPosition();

  return (
    <>
      {/* Enhanced backdrop with blur */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={15} style={styles.backdrop} />
      ) : (
        <View style={[styles.backdrop, styles.androidBackdrop]} />
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
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Tutorial step ${currentStep + 1} of ${totalSteps}: ${step.title}`}
        accessibilityHint={step.description}
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
          <X size={16} color={Colors.textSecondary} />
          <Text style={styles.skipButtonText}>Skip</Text>
        </Pressable>

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: step.color || Colors.primary }]}>
          {getIcon(step.icon || 'chef-hat', 24, Colors.white)}
        </View>

        {/* Content */}
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>



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
              { backgroundColor: step.color || Colors.primary }
            ]} 
            onPress={onNext}
            accessible={true}
            accessibilityLabel={isLast ? 'Finish tutorial' : 'Next step'}
          >
            <Text style={styles.nextButtonText}>
              {isLast ? 'Finish' : 'Next'}
            </Text>
            <ArrowRight size={14} color={Colors.white} />
          </Pressable>
        </View>


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
  }, [visible, fadeAnim, scaleAnim]);

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
  
  const showTutorial = useTutorialStore((state) => state.showTutorial);
  const stepIndex = useTutorialStore((state) => state.stepIndex);
  const steps = useTutorialStore((state) => state.steps);
  const nextStep = useTutorialStore((state) => state.nextStep);
  const previousStep = useTutorialStore((state) => state.previousStep);
  const skipTutorial = useTutorialStore((state) => state.skipTutorial);
  const completeTutorial = useTutorialStore((state) => state.completeTutorial);
  
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  
  const currentStep = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  
  const handleNext = useCallback(() => {
    if (isLast) {
      const message = '🎉 You\'re all set! Let\'s get started.';
      setCompletionMessage(message);
      setShowCompletion(true);
      
      setTimeout(() => {
        completeTutorial();
        setShowCompletion(false);
      }, 3000);
    } else {
      nextStep();
    }
  }, [isLast, nextStep, completeTutorial]);
  
  const handlePrevious = useCallback(() => {
    if (!isFirst) {
      previousStep();
    }
  }, [isFirst, previousStep]);
  
  const handleSkip = useCallback(() => {
    skipTutorial();
  }, [skipTutorial]);
  
  const handleCompletionFinish = useCallback(() => {
    setShowCompletion(false);
    completeTutorial();
    
    setTimeout(() => {
      router.replace('/onboarding/personal-info');
    }, 500);
  }, [completeTutorial, router]);
  
  if (!showTutorial || !currentStep) {
    return null;
  }
  
  return (
    <>
      <Modal
        visible={showTutorial}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <CoachMark
          visible={showTutorial}
          step={currentStep}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
          isFirst={isFirst}
          isLast={isLast}
          currentStep={stepIndex}
          totalSteps={steps.length}
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