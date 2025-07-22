import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useTutorialStore } from '@/store/tutorialStore';
import { createWebLiveRegion } from '@/utils/tutorialAccessibility';
import TutorialInitializer from './TutorialInitializer';
import ContextualTutorialCoachMark from './ContextualTutorialCoachMark';

/**
 * Tutorial Manager
 * Central component that manages the entire tutorial system
 * Should be placed in the root layout (_layout.tsx)
 */
export default function TutorialManager() {
  const hasInitializedWebRef = useRef(false);
  const { isTutorialActive } = useTutorialStore();

  // Initialize web accessibility features
  useEffect(() => {
    if (Platform.OS === 'web' && !hasInitializedWebRef.current) {
      hasInitializedWebRef.current = true;
      createWebLiveRegion();
    }
  }, []);

  return (
    <>
      {/* Initialize tutorial system */}
      <TutorialInitializer />
      
      {/* Render tutorial overlay when active */}
      {isTutorialActive && <ContextualTutorialCoachMark />}
    </>
  );
}