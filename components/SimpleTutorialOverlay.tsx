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

// Create fallback images with better designs
const createFallbackImage = (stepId: string): string => {
  const designs = {
    'welcome-intro': {
      gradient: { start: '#FF6B6B', end: '#4ECDC4' },
      icon: '👋',
      title: 'Welcome to Zestora',
      subtitle: 'Your nutrition companion'
    },
    'features-nutrition': {
      gradient: { start: '#4ECDC4', end: '#45B7D1' },
      icon: '📊',
      title: 'Nutrition Tracking',
      subtitle: 'Monitor your daily intake'
    },
    'features-planning': {
      gradient: { start: '#96CEB4', end: '#FFEAA7' },
      icon: '📅',
      title: 'Meal Planning',
      subtitle: 'Plan your weekly meals'
    },
    'features-grocery': {
      gradient: { start: '#DDA0DD', end: '#98D8C8' },
      icon: '🛒',
      title: 'Grocery Lists',
      subtitle: 'Auto-generated shopping'
    },
    'features-ai': {
      gradient: { start: '#F7DC6F', end: '#BB8FCE' },
      icon: '✨',
      title: 'AI Recommendations',
      subtitle: 'Personalized suggestions'
    },
    'ready-to-start': {
      gradient: { start: '#85C1E9', end: '#F8C471' },
      icon: '🚀',
      title: 'Ready to Start',
      subtitle: 'Begin your journey'
    }
  };
  
  const design = designs[stepId as keyof typeof designs] || designs['welcome-intro'];
  
  return 'data:image/svg+xml;base64,' + btoa(`
    <svg width="280" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${design.gradient.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${design.gradient.end};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.2)"/>
        </filter>
      </defs>
      <rect width="280" height="400" rx="20" fill="url(#grad)" />
      
      <!-- Phone mockup frame -->
      <rect x="20" y="40" width="240" height="320" rx="16" fill="white" filter="url(#shadow)" />
      <rect x="30" y="50" width="220" height="300" rx="12" fill="#f8f9fa" />
      
      <!-- Icon -->
      <text x="140" y="120" text-anchor="middle" font-size="32" fill="#333">${design.icon}</text>
      
      <!-- Title -->
      <text x="140" y="160" text-anchor="middle" fill="#333" font-size="16" font-family="Arial, sans-serif" font-weight="bold">${design.title}</text>
      
      <!-- Subtitle -->
      <text x="140" y="180" text-anchor="middle" fill="#666" font-size="12" font-family="Arial, sans-serif">${design.subtitle}</text>
      
      <!-- Mock UI elements -->
      <rect x="50" y="200" width="180" height="8" rx="4" fill="#e9ecef" />
      <rect x="50" y="220" width="140" height="8" rx="4" fill="#e9ecef" />
      <rect x="50" y="240" width="160" height="8" rx="4" fill="#e9ecef" />
      
      <!-- Mock buttons -->
      <rect x="50" y="280" width="60" height="24" rx="12" fill="${design.gradient.start}" opacity="0.8" />
      <rect x="120" y="280" width="60" height="24" rx="12" fill="${design.gradient.end}" opacity="0.8" />
      
      <!-- Zestora branding -->
      <text x="140" y="380" text-anchor="middle" fill="white" font-size="14" font-family="Arial, sans-serif" font-weight="bold" opacity="0.9">Zestora</text>
    </svg>
  `);
};

// Image generation service with better error handling
const generateTutorialImage = async (prompt: string, stepId: string): Promise<string> => {
  // For now, always use fallback images to avoid HTTP 500 errors
  // This ensures the tutorial works reliably
  return createFallbackImage(stepId);
  
  /* Commented out API call until image generation service is stable
  try {
    const response = await fetch('https://toolkit.rork.com/images/generate/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt + ' mobile app screenshot, clean modern UI design, professional interface',
        size: '512x512'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return `data:${data.image.mimeType};base64,${data.image.base64Data}`;
  } catch (error) {
    console.error(`Error generating tutorial image for ${stepId}:`, error);
    return createFallbackImage(stepId);
  }
  */
};

// Cache for generated images
const imageCache: { [key: string]: string } = {};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Add CSS animation for web spinner
if ((Platform.OS as string) === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// Tutorial screenshots data with bubble positions and arrow directions
// Using custom generated images that represent actual Zestora app screens
const TUTORIAL_SCREENSHOTS = {
  'welcome-intro': {
    bubbles: [{
      id: 'welcome',
      text: 'Welcome to Zestora - your personal nutrition companion!',
      position: { top: '25%', left: '10%' },
      arrow: 'down-right',
      size: 'large'
    }]
  },
  'features-nutrition': {
    bubbles: [{
      id: 'nutrition-tracking',
      text: 'Track daily nutrition with visual progress indicators',
      position: { top: '20%', right: '10%' },
      arrow: 'down-left',
      size: 'medium'
    }, {
      id: 'nutrition-goals',
      text: 'Set and monitor your calorie and macro goals',
      position: { top: '60%', left: '15%' },
      arrow: 'up-right',
      size: 'small'
    }]
  },
  'features-planning': {
    bubbles: [{
      id: 'meal-planning',
      text: 'Plan breakfast, lunch, and dinner for each day',
      position: { top: '25%', left: '15%' },
      arrow: 'down-right',
      size: 'large'
    }, {
      id: 'generate-button',
      text: 'Auto-generate meal plans with smart suggestions',
      position: { top: '75%', right: '10%' },
      arrow: 'up-left',
      size: 'small'
    }]
  },
  'features-grocery': {
    bubbles: [{
      id: 'grocery-generation',
      text: 'Generate shopping lists automatically from meal plans',
      position: { top: '20%', right: '15%' },
      arrow: 'down-left',
      size: 'medium'
    }, {
      id: 'grocery-organization',
      text: 'Items organized by store categories for efficiency',
      position: { bottom: '30%', left: '10%' },
      arrow: 'up-right',
      size: 'small'
    }]
  },
  'features-ai': {
    bubbles: [{
      id: 'recipe-discovery',
      text: 'Discover thousands of recipes tailored to your preferences',
      position: { top: '15%', left: '20%' },
      arrow: 'down-right',
      size: 'large'
    }, {
      id: 'recipe-filtering',
      text: 'Filter by dietary needs, meal type, and cooking time',
      position: { bottom: '25%', right: '15%' },
      arrow: 'up-left',
      size: 'medium'
    }]
  },
  'ready-to-start': {
    bubbles: [{
      id: 'tutorial-complete',
      text: 'Great! You\'re ready to start your healthy eating journey',
      position: { top: '25%', left: '10%' },
      arrow: 'down-right',
      size: 'large'
    }, {
      id: 'profile-setup',
      text: 'Next, we\'ll set up your profile and dietary preferences',
      position: { bottom: '20%', right: '10%' },
      arrow: 'up-left',
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
    description: 'Your personal meal planning and nutrition tracking companion. We\'re here to make healthy eating simple and enjoyable!',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-nutrition',
    title: 'Smart Nutrition Tracking 📊',
    description: 'Track calories, macros, and nutrients effortlessly. Our AI analyzes your eating patterns and provides personalized insights.',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-planning',
    title: 'Weekly Meal Planning 📅',
    description: 'Plan your entire week with drag-and-drop simplicity. Get personalized recipe recommendations based on your goals.',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-grocery',
    title: 'Auto Grocery Lists 🛒',
    description: 'Never forget ingredients again! Your shopping list is automatically generated from your meal plans.',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-ai',
    title: 'AI Recommendations ✨',
    description: 'Get personalized meal suggestions, recipe modifications, and nutrition advice tailored to your preferences and goals.',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'ready-to-start',
    title: 'Ready to Transform Your Health? 🚀',
    description: 'Let\'s set up your profile and start your journey to better nutrition. Your healthiest self is just a few steps away!',
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
  const [generatedImages, setGeneratedImages] = useState<{ [key: string]: string }>({});
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const spinAnim = React.useRef(new Animated.Value(0)).current;
  
  const currentStepData = TUTORIAL_STEPS[currentStep];
  const shouldShow = visible && !!currentStepData;
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;
  
  // Generate tutorial images when component mounts
  useEffect(() => {
    const generateImages = async () => {
      if (isGeneratingImages || Object.keys(generatedImages).length > 0) return;
      
      setIsGeneratingImages(true);
      
      const imagePrompts = {
        'welcome-intro': 'Mobile app welcome screen for Zestora nutrition app, clean modern UI with chef hat logo, welcome text, green and orange color scheme, mobile phone mockup, professional app design',
        'features-nutrition': 'Mobile app nutrition tracking screen, circular progress bars for calories and macros, daily nutrition dashboard, food logging interface, modern UI design, mobile phone mockup',
        'features-planning': 'Mobile app meal planning screen, weekly calendar view with breakfast lunch dinner slots, meal planning interface, recipe cards, modern mobile UI design',
        'features-grocery': 'Mobile app grocery shopping list screen, organized food items by categories, checkboxes, clean list interface, shopping cart icon, modern mobile app design',
        'features-ai': 'Mobile app recipe discovery screen, grid of recipe cards with food photos, search and filter options, modern cooking app interface, mobile phone mockup',
        'ready-to-start': 'Mobile app onboarding completion screen, success checkmark, ready to start message, modern app interface, celebration design, mobile phone mockup'
      };

      const newImages: { [key: string]: string } = {};
      
      for (const [key, prompt] of Object.entries(imagePrompts)) {
        if (imageCache[key]) {
          newImages[key] = imageCache[key];
        } else {
          try {
            const imageData = await generateTutorialImage(prompt, key);
            imageCache[key] = imageData;
            newImages[key] = imageData;
          } catch (error) {
            console.error(`Failed to generate image for ${key}:`, error);
            // Use fallback gradient
            const imageData = await generateTutorialImage('', key);
            imageCache[key] = imageData;
            newImages[key] = imageData;
          }
        }
      }
      
      setGeneratedImages(newImages);
      setIsGeneratingImages(false);
    };

    generateImages();
  }, []);

  // Spinner animation
  useEffect(() => {
    if (isGeneratingImages && (Platform.OS as string) !== 'web') {
      const spinAnimation = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    }
  }, [isGeneratingImages]);

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
  const currentImage = generatedImages[currentStepData?.id];
  
  if (!shouldShow || !currentStepData) {
    return null;
  }
  
  const TutorialCard = () => (
    <View style={styles.screenshotContainer}>
      {/* Screenshot Background */}
      {currentScreenshot && (
        <View style={styles.screenshotBackground}>
          {currentImage ? (
            <ImageBackground
              source={{ uri: currentImage }}
              style={styles.screenshotBackground}
              imageStyle={styles.screenshotImage}
            >
              {/* Overlay bubbles */}
              {currentScreenshot.bubbles.map((bubble, index) => renderBubble(bubble, index))}
            </ImageBackground>
          ) : (
            <View style={[styles.screenshotBackground, styles.loadingContainer]}>
              <Text style={styles.loadingText}>Generating preview...</Text>
              {(Platform.OS as string) === 'web' ? (
                <View style={styles.loadingSpinner} />
              ) : (
                <Animated.View
                  style={[
                    styles.loadingSpinner,
                    {
                      transform: [{
                        rotate: spinAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      }],
                    },
                  ]}
                />
              )}
            </View>
          )}
        </View>
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
              <Text style={styles.primaryButtonText}>Get Started</Text>
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
  if ((Platform.OS as string) === 'web') {
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
      statusBarTranslucent={(Platform.OS as string) !== 'web'}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : (Platform.OS as string) !== 'web' ? (
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  screenshotBackground: {
    width: Math.min(screenWidth * 0.65, 280),
    height: Math.min(screenHeight * 0.45, 400),
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  screenshotImage: {
    borderRadius: 20,
  },
  speechBubble: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    ...((Platform.OS as string) === 'web' && {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
    }),
  },
  bubbleSmall: {
    padding: 8,
    minWidth: 80,
    maxWidth: 120,
  },
  bubbleMedium: {
    padding: 12,
    minWidth: 100,
    maxWidth: 160,
  },
  bubbleLarge: {
    padding: 16,
    minWidth: 120,
    maxWidth: 200,
  },
  bubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubbleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    lineHeight: 16,
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
    bottom: -8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.white,
  },
  bubbleTailDown: {
    top: -8,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.white,
  },
  bubbleTailLeft: {
    left: 20,
  },
  bubbleTailRight: {
    right: 20,
  },
  controlPanel: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    width: screenWidth - 32,
    maxWidth: 400,
    alignSelf: 'center',
    maxHeight: screenHeight * 0.5,
    ...((Platform.OS as string) === 'web' && {
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
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
    ...((Platform.OS as string) === 'web' && {
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }),
  },
  brandingHeader: {
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
    lineHeight: 26,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    fontWeight: '400',
  },

  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 12,
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
    ...((Platform.OS as string) === 'web' && {
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
    ...((Platform.OS as string) === 'web' && {
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
    ...((Platform.OS as string) === 'web' && {
      cursor: 'pointer',
    }),
  },
  skipButtonText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  loadingSpinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderTopColor: Colors.primary,
    ...((Platform.OS as string) === 'web' && {
      animation: 'spin 1s linear infinite',
    }),
  },
});