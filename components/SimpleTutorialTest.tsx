import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useTutorialStore } from '@/store/tutorialStore';
import Colors from '@/constants/colors';

interface SimpleTutorialTestProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function SimpleTutorialTest({ visible, onComplete, onSkip }: SimpleTutorialTestProps) {
  const { currentStep, steps, nextStep, previousStep } = useTutorialStore();
  
  console.log('[SimpleTutorialTest] Render:', { visible, currentStep, stepsLength: steps.length });
  console.log('[SimpleTutorialTest] Steps array:', steps);
  console.log('[SimpleTutorialTest] Current step data:', steps[currentStep]);
  
  if (!visible) return null;
  
  const currentStepData = steps[currentStep];
  
  if (!currentStepData) {
    console.log('[SimpleTutorialTest] No step data for step:', currentStep);
    return (
      <Modal visible={visible} transparent>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.errorText}>No step data found!</Text>
            <Text>Current step: {currentStep}</Text>
            <Text>Steps length: {steps.length}</Text>
            <Pressable style={styles.button} onPress={onSkip}>
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }
  
  const isLastStep = currentStep === steps.length - 1;
  
  const handleNext = () => {
    console.log('[SimpleTutorialTest] Next button pressed, isLastStep:', isLastStep);
    if (isLastStep) {
      console.log('[SimpleTutorialTest] Calling onComplete');
      onComplete();
    } else {
      console.log('[SimpleTutorialTest] Calling nextStep');
      nextStep();
    }
  };
  
  const handlePrevious = () => {
    console.log('[SimpleTutorialTest] Previous button pressed');
    previousStep();
  };
  
  const handleSkip = () => {
    console.log('[SimpleTutorialTest] Skip button pressed');
    onSkip();
  };
  
  return (
    <Modal visible={visible} transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.progress}>Step {currentStep + 1} of {steps.length}</Text>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>
          
          <View style={styles.buttons}>
            {currentStep > 0 && (
              <Pressable style={styles.button} onPress={handlePrevious}>
                <Text style={styles.buttonText}>Back</Text>
              </Pressable>
            )}
            
            <Pressable 
              style={[styles.button, styles.primaryButton]} 
              onPress={handleNext}
            >
              <Text style={[styles.buttonText, { color: Colors.white }]}>
                {isLastStep ? 'Complete' : 'Next'}
              </Text>
            </Pressable>
          </View>
          
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip Tutorial</Text>
          </Pressable>
        </View>
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
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: Colors.text,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.backgroundLight,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.text,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: Colors.textLight,
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progress: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
    textAlign: 'center',
  },
});