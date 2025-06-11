import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  SubscriptionPlan, 
  SubscriptionPlanId, 
  SubscriptionStatus, 
  UserSubscription,
  DEFAULT_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_SKUS
} from '@/types/subscription';

// Mock implementation - in a real app, you would use:
// iOS: react-native-purchases (RevenueCat) or react-native-iap
// Android: react-native-iap

// Storage keys
const SUBSCRIPTION_STORAGE_KEY = 'subscription_data';
const PRODUCTS_STORAGE_KEY = 'subscription_products';

// Mock subscription data for development
const MOCK_SUBSCRIPTION: UserSubscription = {
  status: 'none',
  plan: undefined,
  expiryDate: undefined,
  startDate: undefined,
  isLifetime: false
};

// Initialize subscription service
export const initSubscriptionService = async (): Promise<void> => {
  try {
    console.log('Initializing subscription service...');
    
    // In a real implementation, you would:
    // 1. Initialize the purchase library (RevenueCat or IAP)
    // 2. Fetch available products
    // 3. Check existing purchases
    // 4. Update subscription status
    
    // For development, check if we have stored mock data
    const storedSubscription = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!storedSubscription) {
      // Store initial mock subscription data
      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(MOCK_SUBSCRIPTION));
    }
    
    // Fetch and store product details (prices would come from App Store in real implementation)
    const mockProducts = DEFAULT_SUBSCRIPTION_PLANS.map(plan => ({
      ...plan,
      price: plan.id === 'monthly' ? '$9.99' : plan.id === 'yearly' ? '$59.99' : '$149.99',
      priceValue: plan.id === 'monthly' ? 9.99 : plan.id === 'yearly' ? 59.99 : 149.99,
      currency: 'USD'
    }));
    
    await AsyncStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(mockProducts));
    
    console.log('Subscription service initialized');
  } catch (error) {
    console.error('Failed to initialize subscription service:', error);
  }
};

// Get current subscription status
export const getCurrentSubscription = async (): Promise<UserSubscription> => {
  try {
    const storedSubscription = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (storedSubscription) {
      return JSON.parse(storedSubscription);
    }
    return MOCK_SUBSCRIPTION;
  } catch (error) {
    console.error('Failed to get current subscription:', error);
    return MOCK_SUBSCRIPTION;
  }
};

// Get available subscription plans with prices
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const storedProducts = await AsyncStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (storedProducts) {
      return JSON.parse(storedProducts);
    }
    return DEFAULT_SUBSCRIPTION_PLANS;
  } catch (error) {
    console.error('Failed to get subscription plans:', error);
    return DEFAULT_SUBSCRIPTION_PLANS;
  }
};

// Purchase a subscription
export const purchaseSubscription = async (planId: SubscriptionPlanId): Promise<{success: boolean, error?: string}> => {
  try {
    console.log(`Purchasing subscription: ${planId}`);
    
    // In a real implementation, you would:
    // 1. Call the purchase API (RevenueCat or IAP)
    // 2. Handle the purchase flow
    // 3. Verify the receipt with your server
    // 4. Update the subscription status
    
    // For development, simulate a successful purchase
    const plans = await getSubscriptionPlans();
    const selectedPlan = plans.find(plan => plan.id === planId);
    
    if (!selectedPlan) {
      return { success: false, error: 'Plan not found' };
    }
    
    // Simulate purchase delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Calculate expiry date based on plan
    const now = new Date();
    let expiryDate: Date | undefined;
    
    if (planId === 'monthly') {
      expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (planId === 'yearly') {
      expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    // Update subscription data
    const newSubscription: UserSubscription = {
      status: 'active',
      plan: planId,
      startDate: now.toISOString(),
      expiryDate: expiryDate?.toISOString(),
      isLifetime: planId === 'lifetime',
      originalTransactionId: `mock-transaction-${Date.now()}`,
      latestTransactionId: `mock-transaction-${Date.now()}`
    };
    
    await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(newSubscription));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to purchase subscription:', error);
    return { success: false, error: 'Failed to complete purchase' };
  }
};

// Restore purchases
export const restorePurchases = async (): Promise<{success: boolean, subscription?: UserSubscription, error?: string}> => {
  try {
    console.log('Restoring purchases...');
    
    // In a real implementation, you would:
    // 1. Call the restore purchases API
    // 2. Verify the restored receipts
    // 3. Update the subscription status
    
    // For development, simulate a restore
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get current subscription
    const currentSubscription = await getCurrentSubscription();
    
    // If no active subscription, return error
    if (currentSubscription.status !== 'active' && !currentSubscription.isLifetime) {
      return { success: false, error: 'No active subscription found' };
    }
    
    return { success: true, subscription: currentSubscription };
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return { success: false, error: 'Failed to restore purchases' };
  }
};

// Check if a feature is available based on subscription
export const isFeatureAvailable = async (featureId: string): Promise<boolean> => {
  try {
    const subscription = await getCurrentSubscription();
    
    // Free features are always available
    if (featureId === 'free') return true;
    
    // If user has an active subscription or lifetime access
    if (subscription.status === 'active' || subscription.isLifetime) {
      return true;
    }
    
    // If in trial period
    if (subscription.status === 'trial') {
      return true;
    }
    
    // If in grace period
    if (subscription.status === 'grace' && subscription.isInGracePeriod) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to check feature availability:', error);
    return false;
  }
};

// For development: Set a mock subscription status
export const setMockSubscriptionStatus = async (
  status: SubscriptionStatus, 
  plan?: SubscriptionPlanId
): Promise<void> => {
  try {
    const now = new Date();
    let expiryDate: Date | undefined;
    
    if (plan === 'monthly') {
      expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (plan === 'yearly') {
      expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    const mockSubscription: UserSubscription = {
      status,
      plan,
      startDate: now.toISOString(),
      expiryDate: expiryDate?.toISOString(),
      isLifetime: plan === 'lifetime'
    };
    
    await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(mockSubscription));
  } catch (error) {
    console.error('Failed to set mock subscription:', error);
  }
};

// Clear subscription data (for testing)
export const clearSubscriptionData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear subscription data:', error);
  }
};