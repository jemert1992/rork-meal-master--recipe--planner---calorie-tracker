import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Switch,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bug } from 'lucide-react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SubscriptionStatus, SubscriptionPlanId } from '@/types/subscription';
import Colors from '@/constants/colors';

// This screen is for development purposes only and should be removed in production
export default function SubscriptionDebugScreen() {
  const router = useRouter();
  const { 
    subscription, 
    setMockSubscription, 
    clearSubscription,
    refreshSubscriptionStatus
  } = useSubscriptionStore();
  
  const [status, setStatus] = useState<SubscriptionStatus>(subscription.status);
  const [plan, setPlan] = useState<SubscriptionPlanId | undefined>(subscription.plan);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleApplyChanges = async () => {
    await setMockSubscription(status, plan);
    Alert.alert(
      'Changes Applied',
      `Subscription status set to: ${status}${plan ? `, Plan: ${plan}` : ''}`,
      [{ text: 'OK' }]
    );
  };
  
  const handleClearSubscription = async () => {
    await clearSubscription();
    setStatus('none');
    setPlan(undefined);
    Alert.alert(
      'Subscription Cleared',
      'Subscription data has been reset.',
      [{ text: 'OK' }]
    );
  };
  
  const handleRefreshStatus = async () => {
    await refreshSubscriptionStatus();
    Alert.alert(
      'Status Refreshed',
      'Subscription status has been refreshed.',
      [{ text: 'OK' }]
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscription Debug</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.warningContainer}>
          <Bug size={24} color={Colors.warning} />
          <Text style={styles.warningText}>
            This screen is for development purposes only and should be removed in production.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Subscription</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.infoValue}>{subscription.status}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Plan:</Text>
            <Text style={styles.infoValue}>{subscription.plan || 'None'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Start Date:</Text>
            <Text style={styles.infoValue}>
              {subscription.startDate 
                ? new Date(subscription.startDate).toLocaleDateString() 
                : 'None'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Expiry Date:</Text>
            <Text style={styles.infoValue}>
              {subscription.expiryDate 
                ? new Date(subscription.expiryDate).toLocaleDateString() 
                : 'None'}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Lifetime:</Text>
            <Text style={styles.infoValue}>{subscription.isLifetime ? 'Yes' : 'No'}</Text>
          </View>
          
          <Pressable 
            style={styles.actionButton}
            onPress={handleRefreshStatus}
          >
            <Text style={styles.actionButtonText}>Refresh Status</Text>
          </Pressable>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set Mock Subscription</Text>
          
          <Text style={styles.optionTitle}>Status</Text>
          <View style={styles.optionsContainer}>
            {(['none', 'active', 'trial', 'grace', 'expired'] as SubscriptionStatus[]).map((s) => (
              <Pressable
                key={s}
                style={[styles.optionButton, status === s && styles.optionButtonSelected]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.optionText, status === s && styles.optionTextSelected]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
          
          <Text style={styles.optionTitle}>Plan</Text>
          <View style={styles.optionsContainer}>
            {(['monthly', 'yearly', 'lifetime'] as SubscriptionPlanId[]).map((p) => (
              <Pressable
                key={p}
                style={[styles.optionButton, plan === p && styles.optionButtonSelected]}
                onPress={() => setPlan(p)}
              >
                <Text style={[styles.optionText, plan === p && styles.optionTextSelected]}>
                  {p}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.optionButton, plan === undefined && styles.optionButtonSelected]}
              onPress={() => setPlan(undefined)}
            >
              <Text style={[styles.optionText, plan === undefined && styles.optionTextSelected]}>
                None
              </Text>
            </Pressable>
          </View>
          
          <View style={styles.actionsContainer}>
            <Pressable 
              style={[styles.actionButton, styles.applyButton]}
              onPress={handleApplyChanges}
            >
              <Text style={[styles.actionButtonText, styles.applyButtonText]}>Apply Changes</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.actionButton, styles.clearButton]}
              onPress={handleClearSubscription}
            >
              <Text style={[styles.actionButtonText, styles.clearButtonText]}>Clear Subscription</Text>
            </Pressable>
          </View>
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: Colors.warning,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.textLight,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.white,
  },
  actionsContainer: {
    marginTop: 16,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: Colors.primary,
  },
  applyButtonText: {
    color: Colors.white,
  },
  clearButton: {
    backgroundColor: Colors.danger,
  },
  clearButtonText: {
    color: Colors.white,
  },
});