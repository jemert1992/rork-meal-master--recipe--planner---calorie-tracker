import React from 'react';
import { StyleSheet } from 'react-native';

interface SubscriptionBannerProps {
  featureId?: string;
  message?: string;
  compact?: boolean;
}

// Temporarily modified to return null
export default function SubscriptionBanner({ 
  featureId, 
  message, 
  compact = false 
}: SubscriptionBannerProps) {
  // Return null for testing purposes
  return null;
}

const styles = StyleSheet.create({
  // Keeping styles for future reference
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
    marginHorizontal: 6,
  },
});