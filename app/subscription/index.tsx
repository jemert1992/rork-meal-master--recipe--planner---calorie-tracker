import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Crown, 
  Check, 
  X, 
  ChevronLeft, 
  Sparkles, 
  ShoppingCart, 
  BarChart, 
  Edit, 
  Zap, 
  Clock
} from 'lucide-react-native';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SubscriptionPlan, SubscriptionPlanId } from '@/types/subscription';
import Colors from '@/constants/colors';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { 
    plans, 
    subscription, 
    isPurchasing, 
    isRestoring,
    error,
    purchaseSubscription,
    restorePurchases,
    initializeSubscription
  } = useSubscriptionStore();
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>('yearly');
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize subscription data
  useEffect(() => {
    const loadSubscription = async () => {
      setIsLoading(true);
      await initializeSubscription();
      setIsLoading(false);
    };
    
    loadSubscription();
  }, [initializeSubscription]);
  
  const handlePurchase = async () => {
    if (isPurchasing) return;
    
    const result = await purchaseSubscription(selectedPlan);
    
    if (result) {
      Alert.alert(
        'Purchase Successful',
        'Thank you for subscribing to Zestora Premium!',
        [{ text: 'Continue', onPress: () => router.back() }]
      );
    }
  };
  
  const handleRestore = async () => {
    if (isRestoring) return;
    
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
        error || 'No active subscription was found for your account.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  // Check if user already has an active subscription
  const hasActiveSubscription = 
    subscription.status === 'active' || 
    subscription.isLifetime;
  
  // Find the selected plan details
  const selectedPlanDetails = plans.find(plan => plan.id === selectedPlan);
  
  // Get features for the selected plan
  const planFeatures = selectedPlanDetails?.features || [];
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ChevronLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Premium Subscription</Text>
        <View style={styles.placeholder} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      ) : hasActiveSubscription ? (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.activeSubscriptionContainer}>
            <View style={styles.crownIconContainer}>
              <Crown size={40} color={Colors.white} />
            </View>
            <Text style={styles.activeTitle}>You're a Premium Member!</Text>
            <Text style={styles.activeSubtitle}>
              {subscription.isLifetime 
                ? 'You have lifetime access to all premium features.' 
                : `Your ${subscription.plan} subscription is active.`}
            </Text>
            
            {subscription.expiryDate && !subscription.isLifetime && (
              <Text style={styles.expiryText}>
                Renews on {new Date(subscription.expiryDate).toLocaleDateString()}
              </Text>
            )}
            
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Your Premium Benefits</Text>
              
              {planFeatures.map((feature, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Check size={16} color={Colors.success} />
                  <Text style={styles.benefitText}>{feature}</Text>
                </View>
              ))}
            </View>
            
            <Text style={styles.managementText}>
              {Platform.OS === 'ios' 
                ? 'Manage your subscription in the App Store settings.' 
                : 'Manage your subscription in the Google Play Store.'}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroContainer}>
            <View style={styles.crownIconContainer}>
              <Crown size={40} color={Colors.white} />
            </View>
            <Text style={styles.heroTitle}>Upgrade to Premium</Text>
            <Text style={styles.heroSubtitle}>
              Unlock all premium features and take your meal planning to the next level
            </Text>
          </View>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#A5D6A7' }]}>
                <Sparkles size={20} color={Colors.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>AI Meal Generation</Text>
                <Text style={styles.featureDescription}>
                  Generate personalized meal plans based on your preferences
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#BBDEFB' }]}>
                <ShoppingCart size={20} color={Colors.secondary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Grocery List Generation</Text>
                <Text style={styles.featureDescription}>
                  Automatically create shopping lists from your meal plans
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FFE0B2' }]}>
                <BarChart size={20} color="#FF9800" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Advanced Nutrition Tracking</Text>
                <Text style={styles.featureDescription}>
                  Track detailed macros and micronutrients
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#E1BEE7' }]}>
                <Edit size={20} color="#9C27B0" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Recipe Customization</Text>
                <Text style={styles.featureDescription}>
                  Create and customize your own recipes
                </Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FFCCBC' }]}>
                <Zap size={20} color="#FF5722" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Ad-Free Experience</Text>
                <Text style={styles.featureDescription}>
                  Enjoy the app without any advertisements
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.plansContainer}>
            <Text style={styles.plansTitle}>Choose Your Plan</Text>
            
            <View style={styles.planOptions}>
              {plans.map((plan) => (
                <Pressable
                  key={plan.id}
                  style={[
                    styles.planOption,
                    selectedPlan === plan.id && styles.planOptionSelected,
                    plan.popular && styles.planOptionPopular
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  )}
                  
                  <Text style={[
                    styles.planTitle,
                    selectedPlan === plan.id && styles.planTitleSelected
                  ]}>
                    {plan.title}
                  </Text>
                  
                  <Text style={[
                    styles.planPrice,
                    selectedPlan === plan.id && styles.planPriceSelected
                  ]}>
                    {plan.price || ''}
                  </Text>
                  
                  {plan.period !== 'lifetime' && (
                    <Text style={[
                      styles.planPeriod,
                      selectedPlan === plan.id && styles.planPeriodSelected
                    ]}>
                      per {plan.period}
                    </Text>
                  )}
                  
                  {plan.discount && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>SAVE {plan.discount}%</Text>
                    </View>
                  )}
                  
                  {plan.trialDays && (
                    <View style={styles.trialContainer}>
                      <Clock size={12} color={selectedPlan === plan.id ? Colors.white : Colors.primary} />
                      <Text style={[
                        styles.trialText,
                        selectedPlan === plan.id && styles.trialTextSelected
                      ]}>
                        {plan.trialDays}-day free trial
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
            
            <Pressable 
              style={[styles.purchaseButton, isPurchasing && styles.purchaseButtonDisabled]}
              onPress={handlePurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Crown size={20} color={Colors.white} />
                  <Text style={styles.purchaseButtonText}>
                    {selectedPlanDetails?.trialDays 
                      ? `Start ${selectedPlanDetails.trialDays}-Day Free Trial` 
                      : `Subscribe Now`}
                  </Text>
                </>
              )}
            </Pressable>
            
            <Pressable 
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              )}
            </Pressable>
          </View>
          
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By subscribing, you agree to our Terms of Service and Privacy Policy. Subscriptions will automatically renew unless canceled at least 24 hours before the end of the current period. You can cancel anytime in your App Store settings.
            </Text>
          </View>
        </ScrollView>
      )}
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
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textLight,
  },
  heroContainer: {
    alignItems: 'center',
    padding: 24,
  },
  crownIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
  },
  featuresContainer: {
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  plansContainer: {
    padding: 20,
  },
  plansTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  planOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  planOption: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planOptionSelected: {
    backgroundColor: Colors.primary,
  },
  planOptionPopular: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  planTitleSelected: {
    color: Colors.white,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  planPriceSelected: {
    color: Colors.white,
  },
  planPeriod: {
    fontSize: 12,
    color: Colors.textLight,
  },
  planPeriodSelected: {
    color: Colors.white,
  },
  discountBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  discountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.success,
  },
  trialContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trialText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
  },
  trialTextSelected: {
    color: Colors.white,
  },
  purchaseButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginLeft: 8,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreButtonText: {
    fontSize: 14,
    color: Colors.primary,
  },
  termsContainer: {
    padding: 20,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
  activeSubscriptionContainer: {
    alignItems: 'center',
    padding: 24,
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  activeSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  expiryText: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 24,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  managementText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
});