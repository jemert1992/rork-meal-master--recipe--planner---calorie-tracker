import React from 'react';
import ModernTutorialOverlay from './ModernTutorialOverlay';

interface UserFriendlyTutorialProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function UserFriendlyTutorial(props: UserFriendlyTutorialProps) {
  return <ModernTutorialOverlay {...props} />;
}