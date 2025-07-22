import { useEffect, useRef, useCallback } from 'react';
import { useTutorialStore } from '@/store/tutorialStore';

/**
 * Enhanced hook to safely register a ref with the tutorial system
 * Prevents infinite loops by using stable refs and guards
 * Supports interaction completion marking for advanced tutorial flow
 * Usage: const { ref, markInteractionComplete } = useTutorialRef('search-input');
 */
export function useTutorialRef(stepId: string) {
  const ref = useRef<any>(null);
  const hasRegisteredRef = useRef(false);
  const { registerRef, unregisterRef, markInteractionComplete } = useTutorialStore();

  // Guard: Only register once per stepId to prevent infinite loops
  useEffect(() => {
    if (!hasRegisteredRef.current && stepId) {
      hasRegisteredRef.current = true;
      registerRef(stepId, ref);
    }

    // Cleanup: unregister on unmount
    return () => {
      if (hasRegisteredRef.current && stepId) {
        unregisterRef(stepId);
        hasRegisteredRef.current = false;
      }
    };
  }, []); // Empty dependency array - only run once

  // Callback to mark interaction as complete for this step
  const handleInteractionComplete = useCallback(() => {
    markInteractionComplete();
  }, [markInteractionComplete]);

  return {
    ref,
    markInteractionComplete: handleInteractionComplete,
  };
}

/**
 * Backward compatibility - returns just the ref
 * @deprecated Use the new object return format for enhanced features
 */
export function useTutorialRefLegacy(stepId: string) {
  const { ref } = useTutorialRef(stepId);
  return ref;
}