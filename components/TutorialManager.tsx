import React from 'react';
import { useTutorialStore } from '@/store/tutorialStore';
import ModernTutorialOverlay from './ModernTutorialOverlay';

/**
 * Tutorial Manager
 * Central component that manages the entire tutorial system
 * Should be placed in the root layout (_layout.tsx)
 */
export default function TutorialManager() {
  const { showTutorial } = useTutorialStore();

  return (
    <>
      {/* Render tutorial overlay when active */}
      {showTutorial && <ModernTutorialOverlay />}
    </>
  );
}