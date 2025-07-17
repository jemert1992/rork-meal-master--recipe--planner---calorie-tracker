import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
  Platform,
  ImageBackground,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowRight, ArrowLeft, X, ChefHat, Sparkles, ArrowDown, ArrowUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Tutorial screenshots data with bubble positions and arrow directions
const TUTORIAL_SCREENSHOTS = {
  'welcome-intro': {
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=900&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'welcome',
      text: 'Welcome to Zestora! Your personal meal planning companion',
      position: { top: '15%', left: '5%' },
      arrow: 'down-right',
      size: 'large'
    }]
  },
  'features-nutrition': {
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=900&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'nutrition',
      text: 'Tap the Profile tab at the bottom to track your daily nutrition',
      position: { bottom: '8%', left: '50%' },
      arrow: 'up',
      size: 'medium'
    }, {
      id: 'nutrition-bars',
      text: 'Visual nutrition bars will appear here showing your daily intake progress',
      position: { top: '35%', left: '5%' },
      arrow: 'down-right',
      size: 'small'
    }]
  },
  'features-planning': {
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=900&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'planning',
      text: 'Tap the Meal Plan tab at the bottom to access weekly planning',
      position: { bottom: '8%', left: '25%' },
      arrow: 'up',
      size: 'large'
    }, {
      id: 'meal-slots',
      text: 'You\'ll see breakfast, lunch, and dinner slots for each day where you can add meals',
      position: { top: '25%', right: '5%' },
      arrow: 'down-left',
      size: 'medium'
    }]
  },
  'features-grocery': {
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=900&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'grocery',
      text: 'Tap the Grocery tab at the bottom to view your auto-generated shopping lists',
      position: { bottom: '8%', right: '25%' },
      arrow: 'up',
      size: 'large'
    }, {
      id: 'grocery-check',
      text: 'Check off items as you shop - they\'ll be organized by category',
      position: { top: '30%', left: '5%' },
      arrow: 'down-right',
      size: 'small'
    }]
  },
  'features-ai': {
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=900&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'ai',
      text: 'The Home tab shows recipe recommendations based on your dietary preferences',
      position: { bottom: '8%', left: '5%' },
      arrow: 'up',
      size: 'large'
    }, {
      id: 'search',
      text: 'Use this search bar to find thousands of recipes by name or ingredient',
      position: { top: '20%', right: '5%' },
      arrow: 'down-left',
      size: 'medium'
    }]
  },
  'ready-to-start': {
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=900&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'start',
      text: 'Ready to start your healthy eating journey?',
      position: { top: '12%', left: '5%' },
      arrow: 'down-right',
      size: 'large'
    }, {
      id: 'profile',
      text: 'First, tap the Profile tab to set up your dietary preferences and nutrition goals',
      position: { bottom: '8%', right: '5%' },
      arrow: 'up',
      size: 'medium'
    }]
  }
};

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  screen: string;
  position?: 'top' | 'bottom' | 'center';
  action?: 'tap' | 'swipe' | 'scroll';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome-intro',
    title: 'Welcome to Zestora! 🎉',
    description: 'Your personal meal planning and nutrition tracking companion. Discover thousands of recipes and plan your perfect week!',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-nutrition',
    title: 'Track Your Nutrition 📊',
    description: 'Monitor your daily calories, protein, carbs, and fats with beautiful visual progress bars. Stay on track with your health goals!',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-planning',
    title: 'Plan Your Week 📅',
    description: 'Drag and drop recipes into your weekly meal plan. Organize breakfast, lunch, dinner, and snacks for the entire week ahead.',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-grocery',
    title: 'Smart Grocery Lists 🛒',
    description: 'Automatically generate shopping lists from your meal plans. Check off items as you shop and never forget ingredients again!',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-ai',
    title: 'Discover Recipes ✨',
    description: 'Browse thousands of recipes with smart search and filtering. Find meals that match your dietary preferences and fitness goals.',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'ready-to-start',
    title: 'Let\'s Get Started! 🚀',
    description: 'Set up your profile with dietary preferences and nutrition goals to get personalized recipe recommendations.',
    screen: 'welcome',
    position: 'center',
  },
];

interface SimpleTutorialOverlayProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  currentScreen: string;
}

export default function SimpleTutorialOverlay({ 
  visible, 
  onComplete, 
  onSkip, 
  currentScreen 
}: SimpleTutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  
  const currentStepData = TUTORIAL_STEPS[currentStep];
  const isCurrentScreen = currentStepData?.screen === currentScreen;
  const shouldShow = visible && isCurrentScreen && !!currentStepData;
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;
  
  // Reset step when tutorial becomes visible
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
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);
  
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
  
  const getArrowIcon = (direction: string, size = 20, color = Colors.primary) => {
    switch (direction) {
      case 'up': return <ArrowUp size={size} color={color} />;
      case 'down': return <ArrowDown size={size} color={color} />;
      case 'up-right': return <ArrowUpRight size={size} color={color} />;
      case 'down-left': return <ArrowDownLeft size={size} color={color} />;
      case 'down-right': return <ArrowDownLeft size={size} color={color} style={{ transform: [{ scaleX: -1 }] }} />;
      default: return <ArrowDown size={size} color={color} />;
    }
  };

  const renderBubble = (bubble: any, index: number) => {
    const bubbleSize = bubble.size === 'large' ? styles.bubbleLarge : 
                     bubble.size === 'small' ? styles.bubbleSmall : styles.bubbleMedium;
    
    return (
      <Animated.View
        key={bubble.id}
        style={[
          styles.speechBubble,
          bubbleSize,
          bubble.position,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={styles.bubbleContent}>
          <Text style={styles.bubbleText}>{bubble.text}</Text>
          <View style={styles.arrowContainer}>
            {getArrowIcon(bubble.arrow, 16, Colors.primary)}
          </View>
        </View>
        
        {/* Speech bubble tail */}
        <View style={[
          styles.bubbleTail,
          bubble.arrow.includes('up') ? styles.bubbleTailUp : styles.bubbleTailDown,
          bubble.arrow.includes('right') ? styles.bubbleTailRight : styles.bubbleTailLeft
        ]} />
      </Animated.View>
    );
  };

  const currentScreenshot = TUTORIAL_SCREENSHOTS[currentStepData?.id as keyof typeof TUTORIAL_SCREENSHOTS];
  
  if (!shouldShow || !currentStepData) {
    return null;
  }
  
  const TutorialCard = () => (
    <View style={styles.screenshotContainer}>
      {/* Screenshot Background */}
      {currentScreenshot && (
        <ImageBackground
          source={{ uri: currentScreenshot.image }}
          style={styles.screenshotBackground}
          imageStyle={styles.screenshotImage}
        >
          {/* Dark overlay for better bubble visibility */}
          <View style={styles.screenshotOverlay} />
          
          {/* Overlay bubbles */}
          {currentScreenshot.bubbles.map((bubble, index) => renderBubble(bubble, index))}
        </ImageBackground>
      )}
      
      {/* Control Panel */}
      <Animated.View
        style={[
          styles.controlPanel,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {TUTORIAL_STEPS.length}
          </Text>
        </View>
        
        {/* Close Button */}
        <Pressable style={styles.closeButton} onPress={onSkip}>
          <X size={20} color={Colors.textLight} />
        </Pressable>
        
        {/* Branding Header */}
        <View style={styles.brandingHeader}>
          <View style={styles.brandLogoContainer}>
            <View style={styles.brandLogo}>
              <ChefHat size={24} color={Colors.white} />
            </View>
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandName}>Zestora</Text>
              <View style={styles.sparkleIcon}>
                <Sparkles size={12} color={Colors.primary} />
              </View>
            </View>
          </View>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>
        </View>
        
        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {!isFirstStep && (
            <Pressable style={styles.secondaryButton} onPress={handlePrevious}>
              <ArrowLeft size={16} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Back</Text>
            </Pressable>
          )}
          
          <View style={styles.buttonSpacer} />
          
          {isLastStep ? (
            <Pressable style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Set Up Profile</Text>
              <ArrowRight size={16} color={Colors.white} />
            </Pressable>
          ) : (
            <Pressable style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Next</Text>
              <ArrowRight size={16} color={Colors.white} />
            </Pressable>
          )}
        </View>
        
        {/* Skip Button */}
        <Pressable style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip Tutorial</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
  
  // Web fallback - render as absolute positioned overlay
  if (Platform.OS === 'web') {
    return shouldShow ? (
      <View style={[styles.overlay, styles.webOverlay]}>
        <View style={[StyleSheet.absoluteFill, styles.webBlur]} />
        <TutorialCard />
      </View>
    ) : null;
  }
  
  return (
    <Modal
      visible={shouldShow}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={Platform.OS !== ('web' as any)}
      presentationStyle={Platform.OS === ('web' as any) ? undefined : 'overFullScreen'}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : Platform.OS === 'android' ? (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webBlur]} />
        )}
        
        <TutorialCard />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 9999,
  },
  webOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  webBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(10px)',
  },
  screenshotContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  screenshotBackground: {
    width: screenWidth,
    height: screenHeight * 0.75,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  screenshotImage: {
    borderRadius: 0,
  },
  screenshotOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  speechBubble: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: Colors.primary,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.25)',
    }),
  },
  bubbleSmall: {
    padding: 12,
    minWidth: 120,
    maxWidth: 180,
  },
  bubbleMedium: {
    padding: 16,
    minWidth: 160,
    maxWidth: 240,
  },
  bubbleLarge: {
    padding: 20,
    minWidth: 200,
    maxWidth: 300,
  },
  bubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
    textAlign: 'left',
  },
  arrowContainer: {
    marginLeft: 8,
    padding: 2,
  },
  bubbleTail: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  bubbleTailUp: {
    bottom: -12,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.white,
  },
  bubbleTailDown: {
    top: -12,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.white,
  },
  bubbleTailLeft: {
    left: 30,
  },
  bubbleTailRight: {
    right: 30,
  },
  controlPanel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 20,
    paddingBottom: 30,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    width: screenWidth,
    alignSelf: 'center',
    maxHeight: screenHeight * 0.35,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
    }),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 40, // Add padding to avoid overlap with close button
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    zIndex: 10,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 18,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }),
  },
  brandingHeader: {
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 4,
  },
  brandLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  sparkleIcon: {
    marginLeft: 6,
    marginTop: -2,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
    marginBottom: 12,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    fontWeight: '400',
  },

  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 8,
  },
  buttonSpacer: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)',
    }),
  },
  primaryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
    marginRight: 6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }),
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontWeight: '500',
    fontSize: 15,
    marginLeft: 6,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  skipButtonText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});