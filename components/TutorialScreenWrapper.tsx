import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTutorialStore } from '@/store/tutorialStore';
import ContextualTutorialCoachMark from './ContextualTutorialCoachMark';

interface TutorialScreenWrapperProps {
  children: React.ReactNode;
  screenName: string;
  route: string;
}

/**
 * Tutorial Screen Wrapper
 * Wraps screens that participate in the tutorial system
 * Handles route tracking and gesture support
 */
export default function TutorialScreenWrapper({
  children,
  screenName,
  route,
}: TutorialScreenWrapperProps) {
  const hasSetRouteRef = useRef(false);
  const { setCurrentRoute, isTutorialActive } = useTutorialStore();

  // Guard: Set current route only when it changes
  useEffect(() => {
    if (!hasSetRouteRef.current || route !== useTutorialStore.getState().currentRoute) {
      hasSetRouteRef.current = true;
      setCurrentRoute(route);
    }
  }, [route, setCurrentRoute]);

  // For web, we don't need GestureHandlerRootView
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {children}
        {isTutorialActive && <ContextualTutorialCoachMark />}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      {isTutorialActive && <ContextualTutorialCoachMark />}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});