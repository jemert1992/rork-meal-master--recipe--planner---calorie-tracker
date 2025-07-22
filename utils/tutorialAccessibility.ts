import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Tutorial Accessibility Utilities
 * Provides enhanced accessibility support for the tutorial system
 */

export interface AccessibilityAnnouncement {
  message: string;
  priority?: 'low' | 'high';
}

/**
 * Announces a message to screen readers
 */
export const announceToScreenReader = (announcement: AccessibilityAnnouncement) => {
  if (Platform.OS === 'web') {
    // For web, we can use ARIA live regions
    const liveRegion = document.getElementById('tutorial-live-region');
    if (liveRegion) {
      liveRegion.textContent = announcement.message;
      liveRegion.setAttribute('aria-live', announcement.priority === 'high' ? 'assertive' : 'polite');
    }
  } else {
    // For native platforms
    AccessibilityInfo.announceForAccessibility(announcement.message);
  }
};

/**
 * Creates accessibility props for tutorial elements
 */
export const createTutorialAccessibilityProps = (
  stepNumber: number,
  totalSteps: number,
  title: string,
  description: string,
  isInteractive: boolean = false
) => {
  const baseProps = {
    accessible: true,
    accessibilityRole: 'dialog' as const,
    accessibilityLabel: `Tutorial step ${stepNumber} of ${totalSteps}: ${title}`,
    accessibilityHint: description,
  };

  if (isInteractive) {
    return {
      ...baseProps,
      accessibilityActions: [
        { name: 'activate', label: 'Continue tutorial' },
        { name: 'escape', label: 'Skip tutorial' },
      ],
    };
  }

  return baseProps;
};

/**
 * Creates accessibility props for tutorial target elements
 */
export const createTargetAccessibilityProps = (
  elementName: string,
  isHighlighted: boolean,
  waitingForInteraction: boolean = false
) => {
  let hint = `This ${elementName} is highlighted in the tutorial.`;
  
  if (waitingForInteraction) {
    hint += ' Interact with this element to continue.';
  }

  return {
    accessibilityLabel: `${elementName}${isHighlighted ? ' (tutorial highlight)' : ''}`,
    accessibilityHint: hint,
    accessibilityState: {
      selected: isHighlighted,
    },
  };
};

/**
 * Announces tutorial step changes
 */
export const announceTutorialStep = (
  stepNumber: number,
  totalSteps: number,
  title: string,
  waitingForInteraction: boolean = false
) => {
  let message = `Tutorial step ${stepNumber} of ${totalSteps}: ${title}`;
  
  if (waitingForInteraction) {
    message += '. Please interact with the highlighted element to continue.';
  }

  announceToScreenReader({
    message,
    priority: 'high',
  });
};

/**
 * Announces tutorial completion
 */
export const announceTutorialCompletion = (completionMessage?: string) => {
  const message = completionMessage || 'Tutorial completed successfully!';
  
  announceToScreenReader({
    message,
    priority: 'high',
  });
};

/**
 * Announces tutorial pause/resume
 */
export const announceTutorialPause = (isPaused: boolean) => {
  const message = isPaused ? 'Tutorial paused' : 'Tutorial resumed';
  
  announceToScreenReader({
    message,
    priority: 'low',
  });
};

/**
 * Creates a live region element for web accessibility
 * Should be called once in the app root
 */
export const createWebLiveRegion = () => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const existingRegion = document.getElementById('tutorial-live-region');
    if (!existingRegion) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'tutorial-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
  }
};

/**
 * Checks if screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    // For web, we can't reliably detect screen readers
    // but we can check for reduced motion preference
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  try {
    return await AccessibilityInfo.isScreenReaderEnabled();
  } catch {
    return false;
  }
};

/**
 * Gets recommended animation duration based on accessibility settings
 */
export const getAccessibleAnimationDuration = async (defaultDuration: number): Promise<number> => {
  const screenReaderEnabled = await isScreenReaderEnabled();
  
  if (screenReaderEnabled) {
    // Reduce animation duration for screen reader users
    return Math.min(defaultDuration * 0.5, 200);
  }
  
  return defaultDuration;
};