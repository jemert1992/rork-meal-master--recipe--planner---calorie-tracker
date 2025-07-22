import React, { useEffect, useRef } from 'react';
import { useTutorialStore } from '@/store/tutorialStore';

/**
 * Tutorial Initializer Component
 * Handles loading saved progress and initializing the tutorial system
 * Should be placed in the root layout to ensure proper initialization
 */
export default function TutorialInitializer() {
  const hasInitializedRef = useRef(false);
  const {
    loadProgress,
    checkShouldShowWelcome,
    tutorialCompleted,
    isFirstLaunch,
  } = useTutorialStore();

  // Guard: Initialize tutorial system only once on app start
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      const initializeTutorial = async () => {
        try {
          // Load any saved progress
          const savedProgress = await loadProgress();
          
          // Check if we should show welcome/tutorial
          if (!tutorialCompleted && isFirstLaunch) {
            // For new users, show welcome after onboarding
            checkShouldShowWelcome(false);
          } else if (savedProgress && 'skipped' in savedProgress && savedProgress.skipped && !tutorialCompleted) {
            // For users who skipped, they can resume later
            console.log('Tutorial was previously skipped, can be resumed');
          }
        } catch (error) {
          console.warn('Failed to initialize tutorial:', error);
        }
      };

      initializeTutorial();
    }
  }, []); // Empty dependency array - only run once

  // This component doesn't render anything
  return null;
}