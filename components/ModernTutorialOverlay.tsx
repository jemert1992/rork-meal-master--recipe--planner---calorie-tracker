import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
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
  Play,
  Heart,
  Search,
  Plus,
  CheckCircle
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { GlobalStyles } from '@/styles/globalStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  actionText: string;
  icon: string;
  color: string;
  features: string[];
  tip?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Zestora! 🎉',
    description: 'Your personal nutrition companion that makes healthy eating simple and enjoyable.',
    actionText: 'Let\'s explore what you can do',
    icon: 'chef-hat',
    color: Colors.primary,
    features: [
      'Track nutrition with visual insights',
      'Plan meals for the entire week',
      'Generate smart grocery lists',
      'Discover personalized recipes'
    ]
  },
  {
    id: 'recipes',
    title: 'Discover Amazing Recipes 🍽️',
    description: 'Browse thousands of recipes tailored to your dietary preferences and fitness goals.',
    actionText: 'Try searching for "chicken" or "vegetarian"',
    icon: 'search',
    color: Colors.secondary,
    features: [
      'Search by ingredients or cuisine',
      'Filter by dietary preferences',
      'Save favorites with a tap',
      'Get nutrition info for every recipe'
    ],
    tip: 'Tap the heart icon to save recipes you love!'
  },
  {
    id: 'meal-planning',
    title: 'Plan Your Week Ahead 📅',
    description: 'Drag and drop recipes into your weekly meal plan. Never wonder "what\'s for dinner?" again.',
    actionText: 'Tap "Add Meal" to plan your first meal',
    icon: 'calendar',
    color: Colors.accent,
    features: [
      'Visual weekly calendar view',
      'Drag & drop meal planning',
      'AI-powered meal suggestions',
      'Automatic nutrition calculations'
    ],
    tip: 'Plan similar meals for the week to save time shopping!'
  },
  {
    id: 'nutrition',
    title: 'Track Your Nutrition 📊',
    description: 'See your daily calories, macros, and nutrients with beautiful visual charts.',
    actionText: 'Log your first meal to see it in action',
    icon: 'target',
    color: Colors.info,
    features: [
      'Visual calorie and macro tracking',
      'Daily nutrition goals',
      'Progress charts and insights',
      'Meal timing recommendations'
    ],
    tip: 'Set realistic goals and track your progress over time!'
  },
  {
    id: 'grocery',
    title: 'Smart Grocery Lists 🛒',
    description: 'Your shopping list is automatically generated from your meal plan, organized by store sections.',
    actionText: 'Generate your first grocery list',
    icon: 'shopping-cart',
    color: Colors.success,
    features: [
      'Auto-generated from meal plans',
      'Organized by store sections',
      'Check off items as you shop',
      'Add custom items anytime'
    ],
    tip: 'The app groups ingredients by store sections to make shopping faster!'
  },
  {
    id: 'ready',
    title: 'You\'re All Set! 🚀',
    description: 'You now know the basics of Zestora. Start with setting up your profile and nutrition goals.',
    actionText: 'Let\'s set up your profile',
    icon: 'check-circle',
    color: Colors.primary,
    features: [
      'Personalized nutrition goals',
      'Dietary preference settings',
      'Fitness goal tracking',
      'Progress monitoring'
    ],
    tip: 'You can always restart this tutorial from Settings > Help!'
  }
];

interface ModernTutorialOverlayProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function ModernTutorialOverlay({ 
  visible, 
  onComplete, 
  onSkip 
}: ModernTutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  const currentStepData = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;
  
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      // Animate in
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
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      slideAnim.setValue(50);
    }
  }, [visible]);

  // Animate step changes
  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentStep]);
  
  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const getIcon = (iconType: string, size = 32, color = Colors.white) => {
    switch (iconType) {
      case 'chef-hat': return <ChefHat size={size} color={color} />;
      case 'search': return <Search size={size} color={color} />;
      case 'calendar': return <Calendar size={size} color={color} />;
      case 'target': return <Target size={size} color={color} />;
      case 'shopping-cart': return <ShoppingCart size={size} color={color} />;
      case 'check-circle': return <CheckCircle size={size} color={color} />;
      case 'plus': return <Plus size={size} color={color} />;
      case 'heart': return <Heart size={size} color={color} />;
      default: return <ChefHat size={size} color={color} />;
    }
  };

  if (!visible || !currentStepData) {
    return null;
  }

  const renderContent = () => (
    <Animated.View
      style={[
        styles.tutorialCard,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ],
        },
      ]}
    >
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: `${progress}%`,
                backgroundColor: currentStepData.color 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep + 1} of {TUTORIAL_STEPS.length}
        </Text>
      </View>

      {/* Close Button */}
      <Pressable style={styles.closeButton} onPress={onSkip}>
        <X size={20} color={Colors.textSecondary} />
      </Pressable>

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: currentStepData.color }]}>
          {getIcon(currentStepData.icon, 40, Colors.white)}
        </View>

        {/* Title */}
        <Text style={styles.stepTitle}>{currentStepData.title}</Text>

        {/* Description */}
        <Text style={styles.stepDescription}>{currentStepData.description}</Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {currentStepData.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureBullet, { backgroundColor: currentStepData.color }]} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Tip */}
        {currentStepData.tip && (
          <View style={styles.tipContainer}>
            <View style={styles.tipIcon}>
              <Zap size={16} color={Colors.accent} />
            </View>
            <Text style={styles.tipText}>{currentStepData.tip}</Text>
          </View>
        )}

        {/* Action Text */}
        <View style={styles.actionContainer}>
          <Text style={styles.actionText}>{currentStepData.actionText}</Text>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {!isFirstStep && (
          <Pressable style={styles.backButton} onPress={handlePrevious}>
            <ArrowLeft size={16} color={Colors.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        )}
        
        <View style={styles.navigationSpacer} />
        
        <Pressable 
          style={[styles.nextButton, { backgroundColor: currentStepData.color }]} 
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? 'Get Started!' : 'Continue'}
          </Text>
          {isLastStep ? (
            <Play size={16} color={Colors.white} />
          ) : (
            <ArrowRight size={16} color={Colors.white} />
          )}
        </Pressable>
      </View>

      {/* Skip Option */}
      <Pressable style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>Skip tutorial</Text>
      </Pressable>
    </Animated.View>
  );

  // Web version
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.overlay, styles.webOverlay]}>
        <View style={[StyleSheet.absoluteFill, styles.webBlur]} />
        <View style={styles.container}>
          {renderContent()}
        </View>
      </View>
    );
  }

  // Native version
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}
        
        <View style={styles.container}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 9999,
  },
  webOverlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  webBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  tutorialCard: {
    width: Math.min(screenWidth - 40, 400),
    maxHeight: screenHeight * 0.85,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    }),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    zIndex: 10,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  stepTitle: {
    ...GlobalStyles.heading2,
    textAlign: 'center',
    marginBottom: 12,
    color: Colors.text,
  },
  stepDescription: {
    ...GlobalStyles.bodyText,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.accentLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionContainer: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  actionText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
  },
  navigationSpacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '500',
  },
});