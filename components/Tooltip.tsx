import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Colors from '@/constants/colors';

interface TooltipProps {
  x: number;
  y: number;
  width: number;
  height: number;
  copy: string;
  details?: string;
  onNext: () => void;
  onSkip: () => void;
  isPaused?: boolean;
}

export default function Tooltip({ 
  x, 
  y, 
  width, 
  height, 
  copy, 
  details, 
  onNext, 
  onSkip, 
  isPaused 
}: TooltipProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
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
  }, [fadeAnim, scaleAnim]);

  return (
    <Animated.View 
      style={[
        styles.coach, 
        { 
          top: y + height + 12, 
          left: Math.max(16, Math.min(x, 300)), // Keep within screen bounds
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      {/* Arrow pointing to target */}
      <View style={styles.arrow} />
      
      <Text style={styles.heading}>{copy}</Text>
      {details ? <Text style={styles.subtext}>{details}</Text> : null}
      
      <View style={styles.controls}>
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
        
        {isPaused ? (
          <Text style={styles.wait}>Complete action to continue</Text>
        ) : (
          <TouchableOpacity onPress={onNext} style={styles.nextButton}>
            <Text style={styles.cta}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  coach: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    maxWidth: 320,
    minWidth: 280,
  },
  arrow: {
    position: 'absolute',
    top: -8,
    left: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.white,
  },
  heading: { 
    fontWeight: '700' as const,
    fontSize: 18,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  subtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skip: { 
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cta: { 
    fontWeight: '700' as const,
    color: Colors.white,
    fontSize: 14,
  },
  wait: { 
    color: Colors.warning,
    fontWeight: '600' as const,
    fontSize: 14,
    fontStyle: 'italic',
  },
});