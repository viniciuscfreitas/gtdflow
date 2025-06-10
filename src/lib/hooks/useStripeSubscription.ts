import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { STRIPE_CONFIG } from '@/lib/stripe/config';

export interface SubscriptionData {
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'incomplete';
  priceId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  lastPayment?: Date;
  updatedAt?: Date;
}

export function useStripeSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({ status: 'free' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscription({ status: 'free' });
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        try {
          const userData = doc.data();
          const subscriptionData = userData?.subscription;

          if (subscriptionData) {
            setSubscription({
              ...subscriptionData,
              currentPeriodStart: subscriptionData.currentPeriodStart?.toDate(),
              currentPeriodEnd: subscriptionData.currentPeriodEnd?.toDate(),
              lastPayment: subscriptionData.lastPayment?.toDate(),
              updatedAt: subscriptionData.updatedAt?.toDate(),
            });
          } else {
            setSubscription({ status: 'free' });
          }
          
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error loading subscription:', err);
          setError('Failed to load subscription');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Subscription listener error:', err);
        setError('Failed to load subscription');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Create checkout session
  const createCheckoutSession = async (priceId: string, plan: 'monthly' | 'yearly') => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId, plan }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      throw new Error('Failed to start checkout process');
    }
  };

  // Upgrade to Pro (monthly)
  const upgradeToProMonthly = () => {
    return createCheckoutSession(STRIPE_CONFIG.PRODUCTS.GTD_PRO_MONTHLY, 'monthly');
  };

  // Upgrade to Pro (yearly)
  const upgradeToProYearly = () => {
    return createCheckoutSession(STRIPE_CONFIG.PRODUCTS.GTD_PRO_YEARLY, 'yearly');
  };

  // Check if user has active subscription
  const isProUser = subscription.status === 'active';
  const isFreeUser = subscription.status === 'free';
  const isPastDue = subscription.status === 'past_due';
  const isCanceled = subscription.status === 'canceled';

  // Get plan type
  const planType = subscription.priceId === STRIPE_CONFIG.PRODUCTS.GTD_PRO_YEARLY ? 'yearly' : 'monthly';

  // Check if subscription is ending soon (within 7 days)
  const isEndingSoon = subscription.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  return {
    subscription,
    loading,
    error,
    isProUser,
    isFreeUser,
    isPastDue,
    isCanceled,
    planType,
    isEndingSoon,
    upgradeToProMonthly,
    upgradeToProYearly,
    createCheckoutSession,
  };
} 