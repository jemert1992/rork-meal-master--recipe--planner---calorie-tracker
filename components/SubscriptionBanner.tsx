import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Crown, ChevronRight } from 'lucide-react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import Colors from '@/constants/colors';

interface SubscriptionBannerProps {
  featureId?: string;
  message?: string;
  compact?: boolean;
}

export default function SubscriptionBanner({ 
  featureId, 
  message, 
  compact = false 
}: SubscriptionBannerProps) {
  const router = useRouter();
  const { subscription, checkFeatureAccess } = useSubscriptionStore();
  
  // If user has access to this feature, don't show the banner
  if (featureId && checkFeatureAccess(featureId)) {
    return null;
  }
  
  // If user has an active subscription, don't show the banner
  if (subscription.status === 'active' || subscription.isLifetime) {
    return null;
  }
  
  const handlePress = () => {
    router.push('/subscription');
  };
  
  if (compact) {
    return (
      <Pressable 
        style={styles.compactContainer}
        onPress={handlePress}
      >
        <Crown size={16} color={Colors.white} />
        <Text style={styles.compactText}>
          {message || 'Upgrade to Premium'}
        </Text>
        <ChevronRight size={16} color={Colors.white} />
      </Pressable>
    );
  }
  
  return (
    <Pressable 
      style={styles.container}
      onPress={handlePress}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Crown size={24} color={Colors.white} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.message}>
            {message || 'Unlock all premium features and take your meal planning to the next level'}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={Colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: Colors.primary,
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
    color: Colors.text,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: Colors.textLight,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.white,
    marginHorizontal: 6,
  },
});