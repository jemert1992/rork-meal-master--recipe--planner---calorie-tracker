import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTutorialStore } from '@/store/tutorialStore';

interface TutorialProgressIndicatorProps {
  visible?: boolean;
  compact?: boolean;
}

/**
 * Tutorial Progress Indicator
 * Shows current tutorial progress and provides controls
 * Can be placed in headers or as a floating indicator
 */
export default function TutorialProgressIndicator({
  visible = true,
  compact = false,
}: TutorialProgressIndicatorProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    isTutorialActive,
    currentStep,
    steps,
    isPaused,
    pauseTutorial,
    resumeTutorial,
    skipTutorial,
    startTutorial,
    tutorialCompleted,
    progress,
  } = useTutorialStore();

  const shouldShow = visible && (isTutorialActive || (progress && !tutorialCompleted));
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 0 ? (currentStep + 1) / totalSteps : 0;

  // Animate progress bar
  useEffect(() => {
    if (shouldShow) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: progressPercent,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [shouldShow, progressPercent]);

  if (!shouldShow) {
    return null;
  }

  const handleResumeTutorial = () => {
    if (!isTutorialActive && progress) {
      startTutorial();
    } else if (isPaused) {
      resumeTutorial();
    } else {
      pauseTutorial();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.compactContainer,
        { opacity: fadeAnim },
      ]}
    >
      {/* Progress Bar */}
      <View style={[styles.progressTrack, compact && styles.compactProgressTrack]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {!compact && (
        <>
          {/* Step Info */}
          <Text style={styles.stepText}>
            {isTutorialActive ? `Step ${currentStep + 1} of ${totalSteps}` : 'Tutorial Available'}
          </Text>

          {/* Controls */}
          <View style={styles.controls}>
            <Pressable
              style={styles.controlButton}
              onPress={handleResumeTutorial}
              accessible={true}
              accessibilityLabel={
                !isTutorialActive
                  ? 'Resume tutorial'
                  : isPaused
                  ? 'Resume tutorial'
                  : 'Pause tutorial'
              }
            >
              {!isTutorialActive ? (
                <RotateCcw size={16} color={Colors.primary} />
              ) : isPaused ? (
                <Play size={16} color={Colors.primary} />
              ) : (
                <Pause size={16} color={Colors.primary} />
              )}
            </Pressable>

            {isTutorialActive && (
              <Pressable
                style={styles.controlButton}
                onPress={skipTutorial}
                accessible={true}
                accessibilityLabel="Skip tutorial"
              >
                <SkipForward size={16} color={Colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    margin: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }),
  },
  compactContainer: {
    padding: 6,
    margin: 4,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginRight: 12,
  },
  compactProgressTrack: {
    marginRight: 0,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginRight: 8,
    minWidth: 80,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 6,
    marginLeft: 4,
    borderRadius: 6,
    backgroundColor: Colors.backgroundLight,
  },
});