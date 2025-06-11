import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import SubscriptionBanner from './SubscriptionBanner';

interface FeatureGateProps {
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
  showBanner?: boolean;
  bannerMessage?: string;
  compact?: boolean;
}

export default function FeatureGate({ 
  featureId, 
  children, 
  fallback, 
  showBanner = true,
  bannerMessage,
  compact = false
}: FeatureGateProps) {
  const { checkFeatureAccess } = useSubscriptionStore();
  
  const hasAccess = checkFeatureAccess(featureId);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  return (
    <View style={styles.container}>
      {showBanner && (
        <SubscriptionBanner 
          featureId={featureId} 
          message={bannerMessage}
          compact={compact}
        />
      )}
      {fallback || null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});