import { useEffect, useRef } from 'react';
import { useTutorialStore } from '@/store/tutorialStore';

/**
 * Hook to register a ref for tutorial targeting
 * Usage: const ref = useTutorialRef('search-input');
 */
export function useTutorialRef(stepId: string) {
  const ref = useRef(null);
  const { registerRef, unregisterRef } = useTutorialStore();
  
  // Guard: Register ref only once when component mounts
  useEffect(() => {
    registerRef(stepId, ref);
    
    return () => {
      unregisterRef(stepId);
    };
  }, []); // Empty dependency array - only run once
  
  return ref;
}