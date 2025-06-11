import { Platform } from 'react-native';

// Subscription plan identifiers - must match App Store Connect product IDs
export const SUBSCRIPTION_SKUS = {
  MONTHLY: Platform.select({
    ios: 'com.zestora.subscription.monthly',
    android: 'com.zestora.subscription.monthly',
    default: 'com.zestora.subscription.monthly',
  }),
  YEARLY: Platform.select({
    ios: 'com.zestora.subscription.yearly',
    android: 'com.zestora.subscription.yearly',
    default: 'com.zestora.subscription.yearly',
  }),
  LIFETIME: Platform.select({
    ios: 'com.zestora.subscription.lifetime',
    android: 'com.zestora.subscription.lifetime',
    default: 'com.zestora.subscription.lifetime',
  }),
};

// Subscription plan types
export type SubscriptionPlanId = 
  | 'monthly'
  | 'yearly'
  | 'lifetime';

// Subscription status types
export type SubscriptionStatus = 
  | 'none'       // No subscription
  | 'active'     // Active subscription
  | 'expired'    // Expired subscription
  | 'trial'      // In trial period
  | 'grace'      // In grace period (payment failed but still has access)
  | 'pending';   // Purchase in progress

// Subscription plan details
export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  sku: string;
  title: string;
  description: string;
  price?: string;
  priceValue?: number;
  currency?: string;
  period: string;
  features: string[];
  popular?: boolean;
  trialDays?: number;
  discount?: number; // Percentage discount compared to monthly
}

// User subscription information
export interface UserSubscription {
  status: SubscriptionStatus;
  plan?: SubscriptionPlanId;
  expiryDate?: string;
  startDate?: string;
  isLifetime?: boolean;
  trialEndDate?: string;
  renewalDate?: string;
  originalTransactionId?: string;
  latestTransactionId?: string;
  isInGracePeriod?: boolean;
  gracePeriodEndDate?: string;
}

// Default subscription plans
export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    sku: SUBSCRIPTION_SKUS.MONTHLY,
    title: 'Monthly',
    description: 'Full access to all premium features',
    period: 'month',
    features: [
      'Unlimited meal plans',
      'AI meal generation',
      'Grocery list generation',
      'Advanced nutrition tracking',
      'Recipe customization',
      'Ad-free experience'
    ],
    trialDays: 7
  },
  {
    id: 'yearly',
    sku: SUBSCRIPTION_SKUS.YEARLY,
    title: 'Yearly',
    description: 'Save 50% compared to monthly',
    period: 'year',
    features: [
      'Unlimited meal plans',
      'AI meal generation',
      'Grocery list generation',
      'Advanced nutrition tracking',
      'Recipe customization',
      'Ad-free experience',
      'Priority support'
    ],
    popular: true,
    discount: 50,
    trialDays: 7
  },
  {
    id: 'lifetime',
    sku: SUBSCRIPTION_SKUS.LIFETIME,
    title: 'Lifetime',
    description: 'One-time purchase, lifetime access',
    period: 'lifetime',
    features: [
      'Unlimited meal plans',
      'AI meal generation',
      'Grocery list generation',
      'Advanced nutrition tracking',
      'Recipe customization',
      'Ad-free experience',
      'Priority support',
      'Future updates included'
    ]
  }
];

// Features that require subscription
export const PREMIUM_FEATURES = {
  MEAL_PLAN_GENERATION: 'meal_plan_generation',
  GROCERY_LIST: 'grocery_list',
  ADVANCED_NUTRITION: 'advanced_nutrition',
  RECIPE_CUSTOMIZATION: 'recipe_customization',
  UNLIMITED_RECIPES: 'unlimited_recipes',
  AD_FREE: 'ad_free',
  EXPORT: 'export',
  PRIORITY_SUPPORT: 'priority_support'
};

// Map features to subscription plans
export const FEATURE_PLAN_MAP: Record<string, SubscriptionPlanId[]> = {
  [PREMIUM_FEATURES.MEAL_PLAN_GENERATION]: ['monthly', 'yearly', 'lifetime'],
  [PREMIUM_FEATURES.GROCERY_LIST]: ['monthly', 'yearly', 'lifetime'],
  [PREMIUM_FEATURES.ADVANCED_NUTRITION]: ['monthly', 'yearly', 'lifetime'],
  [PREMIUM_FEATURES.RECIPE_CUSTOMIZATION]: ['monthly', 'yearly', 'lifetime'],
  [PREMIUM_FEATURES.UNLIMITED_RECIPES]: ['monthly', 'yearly', 'lifetime'],
  [PREMIUM_FEATURES.AD_FREE]: ['monthly', 'yearly', 'lifetime'],
  [PREMIUM_FEATURES.EXPORT]: ['yearly', 'lifetime'],
  [PREMIUM_FEATURES.PRIORITY_SUPPORT]: ['yearly', 'lifetime']
};

// Free tier limits
export const FREE_TIER_LIMITS = {
  RECIPES_PER_DAY: 5,
  MEAL_PLANS_PER_WEEK: 1,
  GROCERY_LISTS_PER_MONTH: 1,
  NUTRITION_TRACKING_DAYS: 7
};