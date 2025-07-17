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
import { ArrowRight, ArrowLeft, X, ChefHat, Target, Calendar, ShoppingCart, Zap, Play } from 'lucide-react-native';
import Colors from '@/constants/colors';

// Utility function to properly encode SVG strings with Unicode characters
const utf8ToBase64 = (str: string): string => {
  if (typeof btoa !== 'undefined') {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (error) {
      // Fallback for problematic characters
      return btoa(str.replace(/[\u0080-\uFFFF]/g, '?'));
    }
  }
  // Node.js fallback (shouldn't be needed in React Native)
  return Buffer.from(str, 'utf8').toString('base64');
};

// Create realistic app mockup images
const createAppMockup = (stepId: string): string => {
  const mockups = {
    'welcome-intro': {
      title: 'Welcome to Zestora',
      subtitle: 'Your nutrition companion',
      primaryColor: '#FF6B6B',
      secondaryColor: '#4ECDC4',
      showWelcome: true
    },
    'features-nutrition': {
      title: 'Nutrition Dashboard',
      subtitle: 'Track your daily intake',
      primaryColor: '#4ECDC4',
      secondaryColor: '#FFD166',
      showNutrition: true
    },
    'features-planning': {
      title: 'Meal Planner',
      subtitle: 'Plan your weekly meals',
      primaryColor: '#96CEB4',
      secondaryColor: '#FFEAA7',
      showPlanning: true
    },
    'features-grocery': {
      title: 'Grocery List',
      subtitle: 'Auto-generated shopping',
      primaryColor: '#DDA0DD',
      secondaryColor: '#98D8C8',
      showGrocery: true
    },
    'features-ai': {
      title: 'Recipe Discovery',
      subtitle: 'AI-powered suggestions',
      primaryColor: '#F7DC6F',
      secondaryColor: '#BB8FCE',
      showRecipes: true
    },
    'ready-to-start': {
      title: 'Ready to Start!',
      subtitle: 'Begin your journey',
      primaryColor: '#85C1E9',
      secondaryColor: '#F8C471',
      showSuccess: true
    }
  };
  
  const mockup = mockups[stepId as keyof typeof mockups] || mockups['welcome-intro'];
  
  const svgString = `
    <svg width="320" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${mockup.primaryColor};stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:${mockup.secondaryColor};stop-opacity:0.05" />
        </linearGradient>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.1)"/>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="320" height="600" fill="url(#bgGrad)" />
      
      <!-- Status bar -->
      <rect x="0" y="0" width="320" height="44" fill="white" opacity="0.95" />
      <text x="20" y="28" font-size="14" font-weight="600" fill="#1A202C">9:41</text>
      <text x="280" y="28" font-size="12" fill="#4A5568" text-anchor="end">100%</text>
      
      <!-- Header -->
      <rect x="0" y="44" width="320" height="80" fill="white" filter="url(#cardShadow)" />
      <circle cx="40" cy="84" r="16" fill="${mockup.primaryColor}" />
      <text x="40" y="90" text-anchor="middle" font-size="16" fill="white">🍽️</text>
      <text x="70" y="80" font-size="18" font-weight="700" fill="#1A202C">${mockup.title}</text>
      <text x="70" y="98" font-size="13" fill="#4A5568">${mockup.subtitle}</text>
      
      ${mockup.showWelcome ? `
        <!-- Welcome content -->
        <rect x="20" y="150" width="280" height="120" rx="16" fill="white" filter="url(#cardShadow)" />
        <text x="160" y="180" text-anchor="middle" font-size="20" font-weight="600" fill="#1A202C">Welcome! 👋</text>
        <text x="160" y="205" text-anchor="middle" font-size="14" fill="#4A5568">Let's start your healthy</text>
        <text x="160" y="225" text-anchor="middle" font-size="14" fill="#4A5568">eating journey together</text>
        <rect x="120" y="240" width="80" height="20" rx="10" fill="${mockup.primaryColor}" />
        <text x="160" y="253" text-anchor="middle" font-size="12" font-weight="600" fill="white">Get Started</text>
      ` : ''}
      
      ${mockup.showNutrition ? `
        <!-- Nutrition tracking -->
        <rect x="20" y="150" width="130" height="100" rx="12" fill="white" filter="url(#cardShadow)" />
        <text x="85" y="175" text-anchor="middle" font-size="14" font-weight="600" fill="#1A202C">Calories</text>
        <circle cx="85" cy="200" r="25" fill="none" stroke="#E2E8F0" stroke-width="4" />
        <circle cx="85" cy="200" r="25" fill="none" stroke="${mockup.primaryColor}" stroke-width="4" stroke-dasharray="78 157" transform="rotate(-90 85 200)" />
        <text x="85" y="205" text-anchor="middle" font-size="12" font-weight="600" fill="#1A202C">1,847</text>
        <text x="85" y="230" text-anchor="middle" font-size="10" fill="#4A5568">of 2,000</text>
        
        <rect x="170" y="150" width="130" height="100" rx="12" fill="white" filter="url(#cardShadow)" />
        <text x="235" y="175" text-anchor="middle" font-size="14" font-weight="600" fill="#1A202C">Macros</text>
        <rect x="185" y="185" width="100" height="6" rx="3" fill="#E2E8F0" />
        <rect x="185" y="185" width="65" height="6" rx="3" fill="${mockup.secondaryColor}" />
        <text x="185" y="205" font-size="10" fill="#4A5568">Protein: 65%</text>
        <rect x="185" y="210" width="100" height="6" rx="3" fill="#E2E8F0" />
        <rect x="185" y="210" width="80" height="6" rx="3" fill="${mockup.primaryColor}" />
        <text x="185" y="230" font-size="10" fill="#4A5568">Carbs: 80%</text>
      ` : ''}
      
      ${mockup.showPlanning ? `
        <!-- Meal planning -->
        <rect x="20" y="150" width="280" height="200" rx="12" fill="white" filter="url(#cardShadow)" />
        <text x="30" y="175" font-size="16" font-weight="600" fill="#1A202C">This Week</text>
        
        <!-- Day cards -->
        <rect x="30" y="190" width="60" height="50" rx="8" fill="${mockup.primaryColor}" opacity="0.1" />
        <text x="60" y="205" text-anchor="middle" font-size="10" font-weight="600" fill="#1A202C">MON</text>
        <text x="60" y="220" text-anchor="middle" font-size="8" fill="#4A5568">Breakfast</text>
        <text x="60" y="232" text-anchor="middle" font-size="8" fill="#4A5568">Lunch</text>
        
        <rect x="100" y="190" width="60" height="50" rx="8" fill="${mockup.secondaryColor}" opacity="0.1" />
        <text x="130" y="205" text-anchor="middle" font-size="10" font-weight="600" fill="#1A202C">TUE</text>
        <text x="130" y="220" text-anchor="middle" font-size="8" fill="#4A5568">Breakfast</text>
        <text x="130" y="232" text-anchor="middle" font-size="8" fill="#4A5568">Lunch</text>
        
        <rect x="170" y="190" width="60" height="50" rx="8" fill="#E2E8F0" />
        <text x="200" y="205" text-anchor="middle" font-size="10" font-weight="600" fill="#1A202C">WED</text>
        <text x="200" y="220" text-anchor="middle" font-size="8" fill="#4A5568">+ Add meal</text>
        
        <rect x="240" y="190" width="50" height="50" rx="8" fill="#E2E8F0" />
        <text x="265" y="205" text-anchor="middle" font-size="10" font-weight="600" fill="#1A202C">THU</text>
        
        <!-- Generate button -->
        <rect x="30" y="260" width="260" height="36" rx="18" fill="${mockup.primaryColor}" />
        <text x="160" y="282" text-anchor="middle" font-size="14" font-weight="600" fill="white">✨ Generate Meal Plan</text>
      ` : ''}
      
      ${mockup.showGrocery ? `
        <!-- Grocery list -->
        <rect x="20" y="150" width="280" height="250" rx="12" fill="white" filter="url(#cardShadow)" />
        <text x="30" y="175" font-size="16" font-weight="600" fill="#1A202C">Shopping List</text>
        <text x="270" y="175" text-anchor="end" font-size="12" fill="${mockup.primaryColor}">8 items</text>
        
        <!-- Grocery items -->
        <rect x="30" y="190" width="260" height="30" fill="#F7FAFC" rx="6" />
        <circle cx="45" cy="205" r="6" fill="${mockup.primaryColor}" />
        <text x="45" y="209" text-anchor="middle" font-size="10" fill="white">✓</text>
        <text x="60" y="209" font-size="13" fill="#4A5568" text-decoration="line-through">Chicken breast - 2 lbs</text>
        
        <rect x="30" y="230" width="260" height="30" fill="white" />
        <circle cx="45" cy="245" r="6" fill="none" stroke="#E2E8F0" stroke-width="2" />
        <text x="60" y="249" font-size="13" fill="#1A202C">Broccoli - 1 head</text>
        <text x="270" y="249" text-anchor="end" font-size="11" fill="#4A5568">Produce</text>
        
        <rect x="30" y="270" width="260" height="30" fill="white" />
        <circle cx="45" cy="285" r="6" fill="none" stroke="#E2E8F0" stroke-width="2" />
        <text x="60" y="289" font-size="13" fill="#1A202C">Brown rice - 2 cups</text>
        <text x="270" y="289" text-anchor="end" font-size="11" fill="#4A5568">Grains</text>
        
        <rect x="30" y="310" width="260" height="30" fill="white" />
        <circle cx="45" cy="325" r="6" fill="none" stroke="#E2E8F0" stroke-width="2" />
        <text x="60" y="329" font-size="13" fill="#1A202C">Greek yogurt - 32oz</text>
        <text x="270" y="329" text-anchor="end" font-size="11" fill="#4A5568">Dairy</text>
        
        <!-- Add item button -->
        <rect x="30" y="360" width="260" height="30" rx="15" fill="${mockup.secondaryColor}" opacity="0.1" stroke="${mockup.secondaryColor}" stroke-width="1" stroke-dasharray="4,4" />
        <text x="160" y="379" text-anchor="middle" font-size="13" fill="${mockup.secondaryColor}">+ Add custom item</text>
      ` : ''}
      
      ${mockup.showRecipes ? `
        <!-- Recipe discovery -->
        <rect x="20" y="150" width="280" height="250" rx="12" fill="white" filter="url(#cardShadow)" />
        <text x="30" y="175" font-size="16" font-weight="600" fill="#1A202C">Discover Recipes</text>
        
        <!-- Search bar -->
        <rect x="30" y="185" width="260" height="32" rx="16" fill="#F7FAFC" />
        <text x="45" y="205" font-size="13" fill="#A0AEC0">🔍 Search recipes...</text>
        
        <!-- Filter chips -->
        <rect x="30" y="230" width="50" height="24" rx="12" fill="${mockup.primaryColor}" />
        <text x="55" y="245" text-anchor="middle" font-size="11" font-weight="600" fill="white">Healthy</text>
        
        <rect x="90" y="230" width="45" height="24" rx="12" fill="#E2E8F0" />
        <text x="112" y="245" text-anchor="middle" font-size="11" fill="#4A5568">Quick</text>
        
        <rect x="145" y="230" width="60" height="24" rx="12" fill="#E2E8F0" />
        <text x="175" y="245" text-anchor="middle" font-size="11" fill="#4A5568">Vegetarian</text>
        
        <!-- Recipe cards -->
        <rect x="30" y="270" width="125" height="80" rx="8" fill="${mockup.secondaryColor}" opacity="0.1" />
        <rect x="35" y="275" width="115" height="40" rx="6" fill="${mockup.secondaryColor}" opacity="0.3" />
        <text x="92" y="300" text-anchor="middle" font-size="10" fill="white">🥗</text>
        <text x="92" y="325" text-anchor="middle" font-size="11" font-weight="600" fill="#1A202C">Greek Salad</text>
        <text x="92" y="340" text-anchor="middle" font-size="9" fill="#4A5568">15 min • 320 cal</text>
        
        <rect x="165" y="270" width="125" height="80" rx="8" fill="${mockup.primaryColor}" opacity="0.1" />
        <rect x="170" y="275" width="115" height="40" rx="6" fill="${mockup.primaryColor}" opacity="0.3" />
        <text x="227" y="300" text-anchor="middle" font-size="10" fill="white">🍗</text>
        <text x="227" y="325" text-anchor="middle" font-size="11" font-weight="600" fill="#1A202C">Grilled Chicken</text>
        <text x="227" y="340" text-anchor="middle" font-size="9" fill="#4A5568">25 min • 450 cal</text>
      ` : ''}
      
      ${mockup.showSuccess ? `
        <!-- Success screen -->
        <rect x="20" y="180" width="280" height="200" rx="16" fill="white" filter="url(#cardShadow)" />
        <circle cx="160" cy="230" r="30" fill="${mockup.primaryColor}" opacity="0.1" />
        <text x="160" y="240" text-anchor="middle" font-size="24" fill="${mockup.primaryColor}">🎉</text>
        <text x="160" y="270" text-anchor="middle" font-size="18" font-weight="600" fill="#1A202C">You're All Set!</text>
        <text x="160" y="295" text-anchor="middle" font-size="14" fill="#4A5568">Ready to start your healthy</text>
        <text x="160" y="315" text-anchor="middle" font-size="14" fill="#4A5568">eating journey</text>
        
        <rect x="80" y="340" width="160" height="30" rx="15" fill="${mockup.primaryColor}" />
        <text x="160" y="359" text-anchor="middle" font-size="14" font-weight="600" fill="white">🚀 Let's Begin!</text>
      ` : ''}
      
      <!-- Bottom navigation -->
      <rect x="0" y="520" width="320" height="80" fill="white" filter="url(#cardShadow)" />
      <circle cx="64" cy="545" r="12" fill="${mockup.primaryColor}" opacity="0.1" />
      <text x="64" y="550" text-anchor="middle" font-size="12" fill="${mockup.primaryColor}">🏠</text>
      <text x="64" y="565" text-anchor="middle" font-size="9" fill="${mockup.primaryColor}">Home</text>
      
      <text x="128" y="550" text-anchor="middle" font-size="12" fill="#A0AEC0">📊</text>
      <text x="128" y="565" text-anchor="middle" font-size="9" fill="#A0AEC0">Nutrition</text>
      
      <text x="192" y="550" text-anchor="middle" font-size="12" fill="#A0AEC0">📅</text>
      <text x="192" y="565" text-anchor="middle" font-size="9" fill="#A0AEC0">Planner</text>
      
      <text x="256" y="550" text-anchor="middle" font-size="12" fill="#A0AEC0">👤</text>
      <text x="256" y="565" text-anchor="middle" font-size="9" fill="#A0AEC0">Profile</text>
    </svg>
  `;
  
  return 'data:image/svg+xml;base64,' + utf8ToBase64(svgString);
};

// Generate tutorial images using app mockups
const generateTutorialImage = async (prompt: string, stepId: string): Promise<string> => {
  // Use realistic app mockups instead of generic images
  return createAppMockup(stepId);
};

// Cache for generated images
const imageCache: { [key: string]: string } = {};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Add CSS animations for web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const existingStyle = document.getElementById('tutorial-animations');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'tutorial-animations';
    style.textContent = `
      @keyframes tutorial-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes tutorial-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes tutorial-bounce {
        0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
        40%, 43% { transform: translate3d(0,-8px,0); }
        70% { transform: translate3d(0,-4px,0); }
        90% { transform: translate3d(0,-2px,0); }
      }
      .tutorial-loading-spinner {
        animation: tutorial-spin 1s linear infinite;
      }
      .tutorial-highlight-pulse {
        animation: tutorial-pulse 2s ease-in-out infinite;
      }
      .tutorial-bounce {
        animation: tutorial-bounce 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }
}

// Tutorial feature highlights with precise positioning
const TUTORIAL_HIGHLIGHTS = {
  'welcome-intro': {
    highlights: [{
      id: 'app-logo',
      text: 'Meet Zestora - your personal nutrition companion',
      position: { top: '15%', left: '50%', transform: 'translateX(-50%)' },
      type: 'callout',
      icon: 'chef-hat'
    }]
  },
  'features-nutrition': {
    highlights: [{
      id: 'calorie-circle',
      text: 'Visual calorie tracking with daily goals',
      position: { top: '35%', left: '25%' },
      type: 'pointer',
      icon: 'target'
    }, {
      id: 'macro-bars',
      text: 'Monitor protein, carbs, and fat intake',
      position: { top: '35%', right: '15%' },
      type: 'pointer',
      icon: 'target'
    }]
  },
  'features-planning': {
    highlights: [{
      id: 'weekly-view',
      text: 'Plan meals for the entire week at a glance',
      position: { top: '40%', left: '50%', transform: 'translateX(-50%)' },
      type: 'callout',
      icon: 'calendar'
    }, {
      id: 'generate-btn',
      text: 'AI-powered meal plan generation',
      position: { bottom: '25%', left: '50%', transform: 'translateX(-50%)' },
      type: 'pointer',
      icon: 'zap'
    }]
  },
  'features-grocery': {
    highlights: [{
      id: 'auto-list',
      text: 'Automatically generated from your meal plans',
      position: { top: '25%', right: '10%' },
      type: 'callout',
      icon: 'shopping-cart'
    }, {
      id: 'categories',
      text: 'Organized by store sections for efficient shopping',
      position: { bottom: '35%', left: '15%' },
      type: 'pointer',
      icon: 'shopping-cart'
    }]
  },
  'features-ai': {
    highlights: [{
      id: 'search-bar',
      text: 'Smart recipe search with dietary filters',
      position: { top: '35%', left: '50%', transform: 'translateX(-50%)' },
      type: 'pointer',
      icon: 'zap'
    }, {
      id: 'recipe-cards',
      text: 'Personalized recommendations based on your preferences',
      position: { bottom: '30%', left: '50%', transform: 'translateX(-50%)' },
      type: 'callout',
      icon: 'sparkles'
    }]
  },
  'ready-to-start': {
    highlights: [{
      id: 'success-icon',
      text: 'You\'re all set to begin your healthy eating journey!',
      position: { top: '45%', left: '50%', transform: 'translateX(-50%)' },
      type: 'celebration',
      icon: 'play'
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
    title: 'Welcome to Zestora!',
    description: 'Your personal nutrition companion that makes healthy eating simple, enjoyable, and sustainable.',
    screen: 'welcome',
    position: 'center',
  },
  {
    id: 'features-nutrition',
    title: 'Smart Nutrition Tracking',
    description: 'Effortlessly track calories, macros, and nutrients with visual progress indicators and personalized insights.',
    screen: 'nutrition',
    position: 'center',
  },
  {
    id: 'features-planning',
    title: 'Weekly Meal Planning',
    description: 'Plan your entire week with intuitive tools. Get AI-powered recipe recommendations tailored to your goals.',
    screen: 'planning',
    position: 'center',
  },
  {
    id: 'features-grocery',
    title: 'Smart Grocery Lists',
    description: 'Never forget ingredients again! Shopping lists are automatically generated and organized by store sections.',
    screen: 'grocery',
    position: 'center',
  },
  {
    id: 'features-ai',
    title: 'AI-Powered Discovery',
    description: 'Discover thousands of recipes with smart filtering. Get personalized suggestions based on your dietary preferences.',
    screen: 'recipes',
    position: 'center',
  },
  {
    id: 'ready-to-start',
    title: 'Ready to Begin?',
    description: 'You\'re all set! Let\'s create your profile and start your journey to better nutrition and health.',
    screen: 'success',
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
    if (isGeneratingImages && Platform.OS !== 'web') {
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
  
  const getHighlightIcon = (iconType: string, size = 20, color = Colors.primary) => {
    switch (iconType) {
      case 'chef-hat': return <ChefHat size={size} color={color} />;
      case 'target': return <Target size={size} color={color} />;
      case 'calendar': return <Calendar size={size} color={color} />;
      case 'shopping-cart': return <ShoppingCart size={size} color={color} />;
      case 'zap': return <Zap size={size} color={color} />;
      case 'sparkles': return <Sparkles size={size} color={color} />;
      case 'play': return <Play size={size} color={color} />;
      default: return <Target size={size} color={color} />;
    }
  };

  const renderHighlight = (highlight: any, index: number) => {
    const isCallout = highlight.type === 'callout';
    const isCelebration = highlight.type === 'celebration';
    
    return (
      <Animated.View
        key={highlight.id}
        style={[
          isCallout ? styles.calloutHighlight : 
          isCelebration ? styles.celebrationHighlight : styles.pointerHighlight,
          highlight.position,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={[
          isCallout ? styles.calloutContent : 
          isCelebration ? styles.celebrationContent : styles.pointerContent
        ]}>
          <View style={styles.highlightIconContainer}>
            {getHighlightIcon(highlight.icon, isCallout ? 20 : 16, 
              isCelebration ? Colors.accent : Colors.primary)}
          </View>
          <Text style={[
            isCallout ? styles.calloutText : 
            isCelebration ? styles.celebrationText : styles.pointerText
          ]}>
            {highlight.text}
          </Text>
        </View>
        
        {/* Pointer arrow for pointer type */}
        {highlight.type === 'pointer' && (
          <View style={styles.pointerArrow} />
        )}
      </Animated.View>
    );
  };

  const currentHighlights = TUTORIAL_HIGHLIGHTS[currentStepData?.id as keyof typeof TUTORIAL_HIGHLIGHTS];
  const currentImage = generatedImages[currentStepData?.id];
  
  if (!shouldShow || !currentStepData) {
    return null;
  }
  
  const TutorialCard = () => (
    <View style={styles.screenshotContainer}>
      {/* Single Card with Image Background and Overlaid Content */}
      <Animated.View
        style={[
          styles.tutorialCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Background Image */}
        {currentImage ? (
          <ImageBackground
            source={{ uri: currentImage }}
            style={styles.cardImageBackground}
            imageStyle={styles.cardImage}
          >
            {/* Subtle overlay for better contrast */}
            <View style={styles.imageOverlay} />
            
            {/* Feature highlights */}
            {currentHighlights?.highlights.map((highlight, index) => renderHighlight(highlight, index))}
            
            {/* Progress indicator - Top */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {currentStep + 1} / {TUTORIAL_STEPS.length}
              </Text>
            </View>
            
            {/* Close button - Top Right */}
            <Pressable style={styles.closeButton} onPress={onSkip}>
              <X size={18} color={Colors.white} />
            </Pressable>
            
            {/* Main content overlay - Bottom */}
            <View style={styles.contentOverlay}>
              <View style={styles.contentCard}>
                <Text style={styles.stepTitle}>{currentStepData.title}</Text>
                <Text style={styles.stepDescription}>{currentStepData.description}</Text>
                
                {/* Navigation */}
                <View style={styles.navigationContainer}>
                  {!isFirstStep && (
                    <Pressable style={styles.backButton} onPress={handlePrevious}>
                      <ArrowLeft size={16} color={Colors.textSecondary} />
                      <Text style={styles.backButtonText}>Back</Text>
                    </Pressable>
                  )}
                  
                  <View style={styles.navigationSpacer} />
                  
                  <Pressable style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                      {isLastStep ? 'Get Started' : 'Continue'}
                    </Text>
                    <ArrowRight size={16} color={Colors.white} />
                  </Pressable>
                </View>
                
                {/* Skip option */}
                <Pressable style={styles.skipButton} onPress={onSkip}>
                  <Text style={styles.skipButtonText}>Skip tutorial</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.cardImageBackground, styles.loadingContainer]}>
            <View style={styles.loadingContent}>
              <Text style={styles.loadingText}>Loading preview...</Text>
              {Platform.OS === 'web' ? (
                <View 
                  style={styles.loadingSpinner}
                  // @ts-ignore - Web-specific className
                  className="tutorial-loading-spinner"
                />
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
          </View>
        )}
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
      statusBarTranslucent={Platform.OS !== 'web'}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : Platform.OS !== 'web' ? (
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  webBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    backdropFilter: 'blur(20px)',
  },
  screenshotContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  tutorialCard: {
    width: Math.min(screenWidth - 40, 380),
    height: Math.min(screenHeight * 0.85, 720),
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
    }),
  },
  cardImageBackground: {
    flex: 1,
    position: 'relative',
  },
  cardImage: {
    borderRadius: 28,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 28,
  },
  // Progress indicator
  progressContainer: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 70,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Close button
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  // Feature highlights
  calloutHighlight: {
    position: 'absolute',
    zIndex: 5,
  },
  pointerHighlight: {
    position: 'absolute',
    zIndex: 5,
  },
  celebrationHighlight: {
    position: 'absolute',
    zIndex: 5,
  },
  calloutContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 280,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    }),
  },
  pointerContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 220,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    }),
  },
  celebrationContent: {
    backgroundColor: 'rgba(255, 215, 102, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 6px 24px rgba(255, 215, 102, 0.3)',
    }),
  },
  highlightIconContainer: {
    marginRight: 8,
  },
  calloutText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },
  pointerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    lineHeight: 16,
  },
  celebrationText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  pointerArrow: {
    position: 'absolute',
    bottom: -6,
    left: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
  },
  // Content overlay
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  contentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.1)',
    }),
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  stepDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
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
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      boxShadow: '0 4px 20px rgba(255, 107, 107, 0.3)',
    }),
  },
  nextButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  skipButtonText: {
    color: Colors.textLight,
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontWeight: '500',
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    borderTopColor: Colors.primary,
  },
});