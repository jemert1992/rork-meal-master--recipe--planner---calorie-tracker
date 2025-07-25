import { useEffect, useRef, useCallback } from 'react';
import { useTutorialStore } from '@/store/tutorialStore';

/**
 * Enhanced hook to safely register a ref with the tutorial system
 * Prevents infinite loops by using stable refs and guards
 * Supports interaction completion marking for advanced tutorial flow
 * Usage: const tutorialRef = useTutorialRef('search-input');
 */
export function useTutorialRef(stepId: string) {
  const ref = useRef<any>(null);
  const hasRegisteredRef = useRef(false);
  const { registerRef, unregisterRef } = useTutorialStore();

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

  // Return the ref object directly - this works with both FlatList and other components
  return ref;
}

/**
 * Enhanced hook that returns both ref callback and interaction completion handler
 * Usage: const { ref, markInteractionComplete } = useTutorialRefWithActions('search-input');
 */
export function useTutorialRefWithActions(stepId: string) {
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

  // Return a ref callback function that can be used directly with components
  const refCallback = useCallback((node: any) => {
    ref.current = node;
    // Re-register the ref when the node changes to ensure tutorial system has the latest reference
    if (node && stepId && hasRegisteredRef.current) {
      registerRef(stepId, ref);
    }
  }, [stepId, registerRef]);

  return {
    ref: refCallback,
    markInteractionComplete: handleInteractionComplete,
  };
}