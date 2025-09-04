import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, Platform, Animated } from 'react-native';
import { Calendar, Pencil, Share2, X, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

interface OneShotOnboardingCardProps {
  visible: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'oneShotOnboardingSeen';

export async function getOneShotSeen(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    return v === '1';
  } catch (e) {
    console.log('getOneShotSeen error', e);
    return false;
  }
}

export async function setOneShotSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, '1');
  } catch (e) {
    console.log('setOneShotSeen error', e);
  }
}

export default function OneShotOnboardingCard({ visible, onClose }: OneShotOnboardingCardProps) {
  const [internalVisible, setInternalVisible] = useState<boolean>(visible);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    setInternalVisible(visible);
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 120 })
      ]).start();
    } else {
      fade.setValue(0);
      scale.setValue(0.95);
    }
  }, [visible]);

  const close = async () => {
    try {
      await setOneShotSeen();
    } finally {
      onClose();
    }
  };

  if (!internalVisible) return null;

  const Card = (
    <View style={styles.center}>
      <Animated.View style={[styles.card, { opacity: fade, transform: [{ scale }] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close intro"
          onPress={close}
          style={styles.close}
          testID="intro-close"
        >
          <X size={18} color={Colors.white} />
        </Pressable>

        <Text style={styles.title} accessibilityRole="header">Welcome to Zestora</Text>
        <Text style={styles.subtitle}>In one minute you can:</Text>

        <View style={styles.row}>
          <View style={styles.bullet}>
            <View style={styles.iconWrap}><Calendar size={18} color={Colors.white} /></View>
            <View style={styles.bulletTextWrap}>
              <Text style={styles.bulletTitle}>Generate meals</Text>
              <Text style={styles.bulletDesc}>Tap Generate Week in Meal Plan</Text>
            </View>
          </View>
          <View style={styles.bullet}>
            <View style={styles.iconWrap}><Pencil size={18} color={Colors.white} /></View>
            <View style={styles.bulletTextWrap}>
              <Text style={styles.bulletTitle}>Edit plans</Text>
              <Text style={styles.bulletDesc}>Swap recipes, adjust servings</Text>
            </View>
          </View>
          <View style={styles.bullet}>
            <View style={styles.iconWrap}><Share2 size={18} color={Colors.white} /></View>
            <View style={styles.bulletTextWrap}>
              <Text style={styles.bulletTitle}>Export list</Text>
              <Text style={styles.bulletDesc}>Auto grocery list, share anywhere</Text>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Got it, start using the app"
          onPress={close}
          style={styles.cta}
          testID="intro-cta"
        >
          <Text style={styles.ctaText}>Got it</Text>
          <ArrowRight size={16} color={Colors.white} />
        </Pressable>
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[StyleSheet.absoluteFill, styles.overlay]} testID="intro-overlay-web" accessibilityViewIsModal>
        <View accessible accessibilityLabel="Intro overlay">{Card}</View>
      </View>
    );
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}>
      <View style={[StyleSheet.absoluteFill, styles.overlay]} testID="intro-overlay-modal">
        <View accessible accessibilityLabel="Intro overlay">{Card}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  center: {
    width: '100%',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
    maxWidth: 420,
    alignSelf: 'center',
  },
  close: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  row: {
    gap: 10,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginVertical: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bulletTextWrap: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  bulletDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cta: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
});