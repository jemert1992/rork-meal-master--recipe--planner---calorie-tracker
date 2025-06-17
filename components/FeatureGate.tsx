import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

interface FeatureGateProps {
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
  showBanner?: boolean;
  bannerMessage?: string;
  compact?: boolean;
}

// Temporarily modified to always allow access to features
export default function FeatureGate({ 
  featureId, 
  children, 
  fallback, 
  showBanner = true,
  bannerMessage,
  compact = false
}: FeatureGateProps) {
  // Always return children for testing purposes
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});