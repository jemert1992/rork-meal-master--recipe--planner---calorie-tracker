import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
} from 'react-native';
import Colors from '@/constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TutorialHighlightProps {
  targetElement?: string;
  visible: boolean;
  onPress?: () => void;
}

export default function TutorialHighlight({ 
  targetElement, 
  visible, 
  onPress 
}: TutorialHighlightProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Fade in the highlight
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Start pulsing animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulseAnimation.start();
      
      return () => {
        pulseAnimation.stop();
      };
    } else {
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible, fadeAnim, pulseAnim]);
  
  if (!visible) {
    return null;
  }
  
  return (
    <Animated.View
      style={[
        styles.highlight,
        {
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
      pointerEvents={onPress ? 'auto' : 'none'}
    >
      <View style={styles.highlightRing} />
      <View style={styles.highlightCenter} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  highlight: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  highlightRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  highlightCenter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    opacity: 0.3,
  },
});