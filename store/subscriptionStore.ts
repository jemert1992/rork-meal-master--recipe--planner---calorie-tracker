import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  UserSubscription, 
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionPlanId,
  DEFAULT_SUBSCRIPTION_PLANS,
  PREMIUM_FEATURES,
  FEATURE_PLAN_MAP
} from '@/types/subscription';
import * as subscriptionService from '@/services/subscriptionService';

interface SubscriptionState {
  subscription: UserSubscription;
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
  isPurchasing: boolean;
  isRestoring: boolean;
  hasInitialized: boolean;
  
  // Actions
  initializeSubscription: () => Promise<void>;
  purchaseSubscription: (planId: SubscriptionPlanId) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkFeatureAccess: (featureId: string) => boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  setSubscription: (subscription: UserSubscription) => void;
  
  // Development helpers
  setMockSubscription: (status: SubscriptionStatus, plan?: SubscriptionPlanId) => Promise<void>;
  clearSubscription: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: {
        status: 'none',
        plan: undefined,
        expiryDate: undefined,
        startDate: undefined,
        isLifetime: false
      },
      plans: DEFAULT_SUBSCRIPTION_PLANS,
      isLoading: false,
      error: null,
      isPurchasing: false,
      isRestoring: false,
      hasInitialized: false,
      
      initializeSubscription: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Initialize the subscription service
          await subscriptionService.initSubscriptionService();
          
          // Get current subscription status
          const subscription = await subscriptionService.getCurrentSubscription();
          
          // Get available plans with prices
          const plans = await subscriptionService.getSubscriptionPlans();
          
          set({ 
            subscription, 
            plans, 
            isLoading: false,
            hasInitialized: true
          });
        } catch (error) {
          console.error('Failed to initialize subscription:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to initialize subscription',
            hasInitialized: true
          });
        }
      },
      
      purchaseSubscription: async (planId) => {
        try {
          set({ isPurchasing: true, error: null });
          
          const result = await subscriptionService.purchaseSubscription(planId);
          
          if (result.success) {
            // Refresh subscription status
            await get().refreshSubscriptionStatus();
            set({ isPurchasing: false });
            return true;
          } else {
            set({ 
              isPurchasing: false, 
              error: result.error || 'Failed to complete purchase'
            });
            return false;
          }
        } catch (error) {
          console.error('Failed to purchase subscription:', error);
          set({ 
            isPurchasing: false, 
            error: 'Failed to complete purchase'
          });
          return false;
        }
      },
      
      restorePurchases: async () => {
        try {
          set({ isRestoring: true, error: null });
          
          const result = await subscriptionService.restorePurchases();
          
          if (result.success && result.subscription) {
            set({ 
              subscription: result.subscription,
              isRestoring: false
            });
            return true;
          } else {
            set({ 
              isRestoring: false, 
              error: result.error || 'No active subscription found'
            });
            return false;
          }
        } catch (error) {
          console.error('Failed to restore purchases:', error);
          set({ 
            isRestoring: false, 
            error: 'Failed to restore purchases'
          });
          return false;
        }
      },
      
      checkFeatureAccess: (featureId) => {
        const { subscription } = get();
        
        // Free features are always available
        if (featureId === 'free') return true;
        
        // Check if the feature requires a subscription
        const requiredPlans = FEATURE_PLAN_MAP[featureId];
        if (!requiredPlans) return true; // If not specified, assume it's free
        
        // If user has an active subscription or lifetime access
        if (subscription.status === 'active' || subscription.isLifetime) {
          // Check if their plan includes this feature
          return subscription.plan ? requiredPlans.includes(subscription.plan) : false;
        }
        
        // If in trial period
        if (subscription.status === 'trial') {
          return true; // All features available during trial
        }
        
        // If in grace period
        if (subscription.status === 'grace' && subscription.isInGracePeriod) {
          return subscription.plan ? requiredPlans.includes(subscription.plan) : false;
        }
        
        return false;
      },
      
      refreshSubscriptionStatus: async () => {
        try {
          const subscription = await subscriptionService.getCurrentSubscription();
          set({ subscription });
        } catch (error) {
          console.error('Failed to refresh subscription status:', error);
        }
      },
      
      setSubscription: (subscription) => {
        set({ subscription });
      },
      
      // Development helpers
      setMockSubscription: async (status, plan) => {
        try {
          await subscriptionService.setMockSubscriptionStatus(status, plan);
          await get().refreshSubscriptionStatus();
        } catch (error) {
          console.error('Failed to set mock subscription:', error);
        }
      },
      
      clearSubscription: async () => {
        try {
          await subscriptionService.clearSubscriptionData();
          set({
            subscription: {
              status: 'none',
              plan: undefined,
              expiryDate: undefined,
              startDate: undefined,
              isLifetime: false
            }
          });
        } catch (error) {
          console.error('Failed to clear subscription:', error);
        }
      }
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
        plans: state.plans,
        hasInitialized: state.hasInitialized
      })
    }
  )
);