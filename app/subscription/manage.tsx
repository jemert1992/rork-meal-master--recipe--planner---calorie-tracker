import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Alert,
  Platform,
  Linking,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Crown, Calendar, Clock, CreditCard, HelpCircle } from 'lucide-react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import Colors from '@/constants/colors';

export default function ManageSubscriptionScreen() {
  const router = useRouter();
  const { subscription, isRestoring, restorePurchases } = useSubscriptionStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleOpenSubscriptionSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('itms-apps://apps.apple.com/account/subscriptions');
    } else if (Platform.OS === 'android') {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    } else {
      Alert.alert(
        'Not Available',
        'Subscription management is only available on mobile devices.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const handleRestorePurchases = async () => {
    const result = await restorePurchases();
    
    if (result) {
      Alert.alert(
        'Purchases Restored',
        'Your subscription has been successfully restored.',
        [{ text: 'Continue', onPress: () => router.back() }]
      );
    } else {
      Alert.alert(
        'Restore Failed',
        'No active subscription was found for your account.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@zestora.com?subject=Subscription%20Support');
  };
  
  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Subscription</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.statusContainer}>
          <View style={styles.crownIconContainer}>
            <Crown size={32} color={Colors.white} />
          </View>
          
          <Text style={styles.statusTitle}>
            {subscription.status === 'active' 
              ? 'Active Subscription' 
              : subscription.isLifetime 
                ? 'Lifetime Access' 
                : subscription.status === 'trial' 
                  ? 'Trial Period' 
                  : subscription.status === 'grace' 
                    ? 'Grace Period' 
                    : 'No Active Subscription'}
          </Text>
          
          <Text style={styles.planName}>
            {subscription.plan 
              ? `${subscription.plan.charAt(0).toUpperCase()}${subscription.plan.slice(1)} Plan` 
              : 'No Plan'}
          </Text>
        </View>
        
        <View style={styles.detailsContainer}>
          {subscription.startDate && (
            <View style={styles.detailItem}>
              <Calendar size={20} color={Colors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>{formatDate(subscription.startDate)}</Text>
              </View>
            </View>
          )}
          
          {subscription.expiryDate && !subscription.isLifetime && (
            <View style={styles.detailItem}>
              <Clock size={20} color={Colors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Renewal Date</Text>
                <Text style={styles.detailValue}>{formatDate(subscription.expiryDate)}</Text>
              </View>
            </View>
          )}
          
          {subscription.originalTransactionId && (
            <View style={styles.detailItem}>
              <CreditCard size={20} color={Colors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Transaction ID</Text>
                <Text style={styles.detailValue}>{subscription.originalTransactionId}</Text>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          <Pressable 
            style={styles.actionButton}
            onPress={handleOpenSubscriptionSettings}
          >
            <Text style={styles.actionButtonText}>Manage Subscription in App Store</Text>
          </Pressable>
          
          <Pressable 
            style={styles.actionButton}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.actionButtonText}>Restore Purchases</Text>
            )}
          </Pressable>
          
          <Pressable 
            style={styles.actionButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.actionButtonText}>Contact Support</Text>
          </Pressable>
        </View>
        
        <View style={styles.helpContainer}>
          <HelpCircle size={20} color={Colors.textLight} />
          <Text style={styles.helpText}>
            To cancel or modify your subscription, please visit the App Store or Google Play Store subscription settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statusContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  crownIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    color: Colors.textLight,
  },
  detailsContainer: {
    backgroundColor: Colors.white,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  actionsContainer: {
    backgroundColor: Colors.white,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginBottom: 24,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 12,
    flex: 1,
  },
});