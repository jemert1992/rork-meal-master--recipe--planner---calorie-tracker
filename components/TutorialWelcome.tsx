import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowRight, Sparkles, Target, Calendar, ShoppingCart } from 'lucide-react-native';
import { useTutorialStore } from '@/store/tutorialStore';
import Colors from '@/constants/colors';

export default function TutorialWelcome() {
  const { isFirstLaunch, startTutorial, skipTutorial } = useTutorialStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    if (isFirstLaunch) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFirstLaunch, fadeAnim, slideAnim]);
  
  if (!isFirstLaunch) {
    return null;
  }
  
  const handleStartTutorial = () => {
    startTutorial();
  };
  
  const handleSkip = () => {
    skipTutorial();
  };
  
  return (
    <Modal
      visible={isFirstLaunch}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' }} 
          style={styles.backgroundImage} 
        />
        
        {Platform.OS === 'ios' ? (
          <BlurView intensity={30} style={styles.overlay} />
        ) : (
          <View style={[styles.overlay, styles.androidOverlay]} />
        )}
        
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Sparkles size={40} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Welcome to Zestora!</Text>
            <Text style={styles.subtitle}>
              Your personal meal planning and nutrition tracking companion
            </Text>
          </View>
          
          {/* Features Preview */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Target size={24} color={Colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Smart Nutrition</Text>
                <Text style={styles.featureDescription}>Track calories and macros effortlessly</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Calendar size={24} color={Colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Meal Planning</Text>
                <Text style={styles.featureDescription}>Plan your week with personalized recipes</Text>
              </View>
            </View>
            
            <View style={styles.featureRow}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <ShoppingCart size={24} color={Colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Auto Grocery Lists</Text>
                <Text style={styles.featureDescription}>Never forget ingredients again</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Sparkles size={24} color={Colors.primary} />
                </View>
                <Text style={styles.featureTitle}>AI Recommendations</Text>
                <Text style={styles.featureDescription}>Get meals picked just for you</Text>
              </View>
            </View>
          </View>
          
          {/* Call to Action */}
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaText}>
              Ready to transform your eating habits?
            </Text>
            <Text style={styles.ctaSubtext}>
              Let's take a quick tour to get you started!
            </Text>
          </View>
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable style={styles.primaryButton} onPress={handleStartTutorial}>
              <Text style={styles.primaryButtonText}>Start Tutorial</Text>
              <ArrowRight size={20} color={Colors.white} />
            </Pressable>
            
            <Pressable style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  androidOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
  ctaContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  ctaText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minWidth: 200,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});