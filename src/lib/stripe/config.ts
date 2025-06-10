import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key (safe to expose in frontend)
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey && process.env.NODE_ENV === 'production') {
  console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined - Stripe features will be disabled');
}

// Initialize Stripe
export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Stripe configuration
export const STRIPE_CONFIG = {
  // Product IDs (will be created in Stripe Dashboard)
  PRODUCTS: {
    GTD_PRO_MONTHLY: 'price_gtd_pro_monthly', // $12/month
    GTD_PRO_YEARLY: 'price_gtd_pro_yearly',   // $99/year
  },
  
  // Success/Cancel URLs
  URLS: {
    SUCCESS: '/billing/success',
    CANCEL: '/billing/cancel',
    CUSTOMER_PORTAL: '/billing/portal',
  },
  
  // Subscription metadata
  METADATA: {
    PRODUCT_NAME: 'GTD Flow Pro',
    FEATURES: [
      'Unlimited tasks and projects',
      'Advanced methodologies (Pomodoro, Pareto, OKRs)',
      'Team collaboration features',
      'Priority support',
      'Export capabilities',
      'Custom themes'
    ]
  }
} as const;

// Types
export interface StripeSubscription {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  price_id: string;
  customer_id: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  subscription?: StripeSubscription;
} 