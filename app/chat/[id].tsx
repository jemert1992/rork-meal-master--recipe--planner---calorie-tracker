import { useEffect, useRef, useState, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

let renderCount = 0;

export default function ChatScreen() {
  renderCount += 1;

  console.log('🌀 ChatScreen rendered', renderCount);

  const params = useLocalSearchParams();
  
  // Memoize the extracted values to prevent infinite re-renders
  const { id, creatorId } = useMemo(() => {
    const rawId = params.id;
    const rawCreatorId = params.creatorId;
    
    return {
      id: typeof rawId === 'string' ? rawId : '',
      creatorId: typeof rawCreatorId === 'string' ? rawCreatorId : ''
    };
  }, [params.id, params.creatorId]);

  const effectRunCount = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const hasInitialized = useRef(false);

  // Only run effect once when params are available and not already initialized
  useEffect(() => {
    if (!hasInitialized.current && id && creatorId) {
      effectRunCount.current += 1;
      hasInitialized.current = true;
      
      console.log('⚡️ useEffect triggered', effectRunCount.current, { id, creatorId });
      
      // Safe to set loaded state now with guard
      setLoaded(true);
    }
  }, [id, creatorId]);

  return (
    <View>
      <Text>Render #{renderCount}</Text>
      <Text>Effect runs: {effectRunCount.current}</Text>
      <Text>ID: {id}</Text>
      <Text>Creator ID: {creatorId}</Text>
      <Text>Loaded: {loaded ? 'Yes' : 'No'}</Text>
    </View>
  );
}