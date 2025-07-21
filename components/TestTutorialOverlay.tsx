import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Colors from '@/constants/colors';

interface TestTutorialOverlayProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function TestTutorialOverlay({ visible, onComplete, onSkip }: TestTutorialOverlayProps) {
  console.log('TestTutorialOverlay render:', { visible });

  if (!visible) {
    console.log('TestTutorialOverlay not visible, returning null');
    return null;
  }

  console.log('TestTutorialOverlay rendering modal');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onShow={() => console.log('TestTutorialOverlay Modal shown')}
      onRequestClose={onSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Test Tutorial</Text>
            <Text style={styles.description}>This is a test tutorial overlay</Text>
            
            <View style={styles.buttons}>
              <Pressable style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
              
              <Pressable style={styles.completeButton} onPress={onComplete}>
                <Text style={styles.completeText}>Complete</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttons: {
    flexDirection: 'row',
    gap: 15,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 10,
  },
  skipText: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  completeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  completeText: {
    color: 'white',
    fontWeight: '600',
  },
});