import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ArrowRight, ArrowLeft, X, ChefHat, Sparkles, ArrowDown, ArrowUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useTutorialStore } from '@/store/tutorialStore';
import Colors from '@/constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Tutorial screenshots data with bubble positions and arrow directions
// Using mockup app screenshots to show users where they'll input their data
const TUTORIAL_SCREENSHOTS = {
  'welcome-intro': {
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'welcome',
      text: 'Welcome to Zestora! Your personal meal planning and nutrition companion',
      position: { top: '20%', left: '10%' },
      arrow: 'down-right',
      size: 'large'
    }]
  },
  'features-nutrition': {
    // Profile screen mockup - shows nutrition tracking interface
    image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&h=800&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'nutrition-header',
      text: 'This is your Profile screen - your nutrition command center',
      position: { top: '10%', left: '5%' },
      arrow: 'down-right',
      size: 'large'
    }, {
      id: 'nutrition-bars',
      text: 'Visual nutrition bars will appear here showing your daily progress',
      position: { top: '40%', right: '5%' },
      arrow: 'down-left',
      size: 'medium'
    }, {
      id: 'add-food-button',
      text: 'Tap "Add Food" here to log your meals and track calories',
      position: { bottom: '30%', left: '50%' },
      arrow: 'up',
      size: 'medium'
    }]
  },
  'features-planning': {
    // Meal planning screen mockup - shows calendar/planning interface
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=800&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'planning-header',
      text: 'This is your Meal Plan screen - where you organize your weekly meals',
      position: { top: '10%', left: '5%' },
      arrow: 'down-right',
      size: 'large'
    }, {
      id: 'meal-slots',
      text: 'Each day shows breakfast, lunch, and dinner slots for easy planning',
      position: { top: '35%', right: '5%' },
      arrow: 'down-left',
      size: 'medium'
    }, {
      id: 'generate-button',
      text: 'Use "Generate" to automatically create meal plans based on your preferences',
      position: { bottom: '20%', left: '20%' },
      arrow: 'up-right',
      size: 'medium'
    }]
  },
  'features-grocery': {
    // Grocery list screen mockup - shows shopping list interface
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=800&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'grocery-header',
      text: 'This is your Grocery List screen - your smart shopping companion',
      position: { top: '10%', left: '5%' },
      arrow: 'down-right',
      size: 'large'
    }, {
      id: 'generate-grocery',
      text: 'Tap "Generate from Meal Plan" to create shopping lists automatically',
      position: { top: '30%', right: '5%' },
      arrow: 'down-left',
      size: 'medium'
    }, {
      id: 'check-items',
      text: 'Check off items as you shop - they\'re organized by store category',
      position: { bottom: '25%', left: '10%' },
      arrow: 'up-right',
      size: 'medium'
    }]
  },
  'features-ai': {
    // Recipe discovery screen mockup - shows recipe browsing interface
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=800&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'home-header',
      text: 'This is your Home screen - discover thousands of personalized recipes',
      position: { top: '10%', left: '5%' },
      arrow: 'down-right',
      size: 'large'
    }, {
      id: 'search-bar',
      text: 'Use the search bar to find recipes by name, ingredient, or dietary need',
      position: { top: '30%', right: '5%' },
      arrow: 'down-left',
      size: 'medium'
    }, {
      id: 'recipe-categories',
      text: 'Browse categories like breakfast, vegetarian, or high-protein meals',
      position: { bottom: '30%', left: '10%' },
      arrow: 'up-right',
      size: 'medium'
    }]
  },
  'ready-to-start': {
    // Profile setup screen mockup - shows onboarding interface
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=800&fit=crop&crop=center&auto=format&q=80',
    bubbles: [{
      id: 'ready-start',
      text: 'Perfect! Now you know where everything is in the app',
      position: { top: '15%', left: '10%' },
      arrow: 'down-right',
      size: 'large'
    }, {
      id: 'profile-setup',
      text: 'Next, set up your profile with dietary preferences and nutrition goals',
      position: { bottom: '20%', right: '10%' },
      arrow: 'up-left',
      size: 'medium'
    }]
  }
};

interface TutorialOverlayProps {
  currentScreen: string;
}

export default function TutorialOverlay({ currentScreen }: TutorialOverlayProps) {
  const {
    showTutorial,
    currentStep,
    steps,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    tutorialCompleted,
  } = useTutorialStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [forceRender, setForceRender] = useState(0);
  
  const currentStepData = steps[currentStep] || steps[0];
  const isCurrentScreen = currentStepData?.screen === currentScreen;
  const shouldShow = showTutorial && isCurrentScreen && !tutorialCompleted && !!currentStepData;
  
  // Force re-render on web when state changes
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('Web tutorial overlay state change:', { shouldShow, showTutorial, isCurrentScreen, tutorialCompleted, currentStep, currentStepData });
      
      // Force component re-render
      setForceRender(prev => prev + 1);
      
      // Force re-render by updating animation values
      if (shouldShow) {
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);
        
        setTimeout(() => {
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
        }, 10);
      }
    }
  }, [shouldShow, showTutorial, isCurrentScreen, tutorialCompleted, currentStep]);
  
  console.log('TutorialOverlay render:', { 
    showTutorial, 
    currentScreen, 
    currentStep, 
    currentStepScreen: currentStepData?.screen,
    isCurrentScreen, 
    shouldShow,
    tutorialCompleted,
    stepsLength: steps.length
  });
  
  useEffect(() => {
    if (shouldShow) {
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
  }, [shouldShow, fadeAnim, scaleAnim]);
  
  if (!shouldShow || !currentStepData) {
    console.log('TutorialOverlay not showing because:', { 
      shouldShow, 
      hasCurrentStepData: !!currentStepData,
      showTutorial,
      isCurrentScreen,
      tutorialCompleted,
      currentStepData: currentStepData ? { id: currentStepData.id, screen: currentStepData.screen } : null
    });
    return null;
  }
  
  console.log('TutorialOverlay WILL SHOW with step:', currentStepData);
  
  // Safety check - don't show if tutorial is completed
  if (tutorialCompleted) {
    return null;
  }
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;
  
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
  
  // Web fallback - render as absolute positioned overlay instead of modal
  if (Platform.OS === 'web') {
    return shouldShow ? (
      <View style={[styles.overlay, styles.webOverlay]} key={`tutorial-${currentStep}-${Date.now()}`}>
        <View style={[StyleSheet.absoluteFill, styles.webBlur]} />
        
        <View style={styles.screenshotContainer}>
          {/* Screenshot Background */}
          {currentScreenshot && (
            <ImageBackground
              source={{ uri: currentScreenshot.image }}
              style={styles.screenshotBackground}
              imageStyle={styles.screenshotImage}
            >
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
                {currentStep + 1} of {steps.length}
              </Text>
            </View>
            
            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={skipTutorial}>
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
                <Pressable style={styles.secondaryButton} onPress={previousStep}>
                  <ArrowLeft size={16} color={Colors.primary} />
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
              )}
              
              <View style={styles.buttonSpacer} />
              
              {isLastStep ? (
                <Pressable style={styles.primaryButton} onPress={completeTutorial}>
                  <Text style={styles.primaryButtonText}>
                    {currentScreen === 'welcome' ? 'Set Up Profile' : 'Get Started'}
                  </Text>
                  <ArrowRight size={16} color={Colors.white} />
                </Pressable>
              ) : (
                <Pressable style={styles.primaryButton} onPress={nextStep}>
                  <Text style={styles.primaryButtonText}>Next</Text>
                  <ArrowRight size={16} color={Colors.white} />
                </Pressable>
              )}
            </View>
            
            {/* Skip Button */}
            <Pressable style={styles.skipButton} onPress={skipTutorial}>
              <Text style={styles.skipButtonText}>Skip Tutorial</Text>
            </Pressable>
          </Animated.View>
        </View>
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
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : Platform.OS === 'android' ? (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webBlur]} />
        )}
        
        <View style={styles.screenshotContainer}>
          {/* Screenshot Background */}
          {currentScreenshot && (
            <ImageBackground
              source={{ uri: currentScreenshot.image }}
              style={styles.screenshotBackground}
              imageStyle={styles.screenshotImage}
            >
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
              },
            ]}
          >
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {currentStep + 1} of {steps.length}
              </Text>
            </View>
            
            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={skipTutorial}>
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
                <Pressable style={styles.secondaryButton} onPress={previousStep}>
                  <ArrowLeft size={16} color={Colors.primary} />
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
              )}
              
              <View style={styles.buttonSpacer} />
              
              {isLastStep ? (
                <Pressable style={styles.primaryButton} onPress={completeTutorial}>
                  <Text style={styles.primaryButtonText}>
                    {currentScreen === 'welcome' ? 'Set Up Profile' : 'Get Started'}
                  </Text>
                  <ArrowRight size={16} color={Colors.white} />
                </Pressable>
              ) : (
                <Pressable style={styles.primaryButton} onPress={nextStep}>
                  <Text style={styles.primaryButtonText}>Next</Text>
                  <ArrowRight size={16} color={Colors.white} />
                </Pressable>
              )}
            </View>
            
            {/* Skip Button */}
            <Pressable style={styles.skipButton} onPress={skipTutorial}>
              <Text style={styles.skipButtonText}>Skip Tutorial</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
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
    ...(Platform.OS === 'web' && {
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
    ...(Platform.OS === 'web' && {
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
    ...(Platform.OS === 'web' && {
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