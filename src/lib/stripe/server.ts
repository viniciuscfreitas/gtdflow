import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === 'production') {
  console.warn('STRIPE_SECRET_KEY is not defined - Stripe features will be disabled');
}

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
}) : null;

// Create checkout session for subscription
export async function createCheckoutSession({
  priceId,
  customerId,
  customerEmail,
  userId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerId?: string;
  customerEmail: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      metadata: {
        userId,
        priceId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

// Create customer portal session
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw new Error('Failed to create customer portal session');
  }
}

// Get customer with subscription
export async function getCustomerWithSubscription(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  try {
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['subscriptions'],
    });

    if (customer.deleted) {
      return null;
    }

    return customer as Stripe.Customer & {
      subscriptions: Stripe.ApiList<Stripe.Subscription>;
    };
  } catch (error) {
    console.error('Error retrieving customer:', error);
    return null;
  }
}

// Get subscription by ID
export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

// Reactivate subscription
export async function reactivateSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return subscription;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw new Error('Failed to reactivate subscription');
  }
} 