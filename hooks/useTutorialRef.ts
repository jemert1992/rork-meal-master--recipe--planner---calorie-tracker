import { useEffect, useRef } from 'react';
import { useTutorialStore } from '@/store/tutorialStore';

/**
 * Hook to safely register a ref with the tutorial system
 * Prevents infinite loops by using stable refs and guards
 * Usage: const ref = useTutorialRef('search-input');
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

  return ref;
}