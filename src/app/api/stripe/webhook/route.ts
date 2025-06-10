import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { adminDb } from '@/lib/firebase/admin';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  if (!stripe) {
    console.error('Stripe not configured');
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

// Handle subscription creation/update
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  if (!adminDb) {
    console.error('Firebase Admin not configured');
    return;
  }
  
  try {
    const userId = subscription.metadata.userId;
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    const subscriptionData = {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      status: subscription.status,
      priceId: subscription.items.data[0]?.price.id,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      updatedAt: new Date(),
    };

    // Update user subscription in Firestore
    await adminDb
      .collection('users')
      .doc(userId)
      .set({ subscription: subscriptionData }, { merge: true });

    console.log(`Subscription updated for user ${userId}:`, subscription.status);

  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (!adminDb) {
    console.error('Firebase Admin not configured');
    return;
  }
  
  try {
    const userId = subscription.metadata.userId;
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    // Remove subscription from user document
    await adminDb
      .collection('users')
      .doc(userId)
      .update({
        'subscription.status': 'canceled',
        'subscription.updatedAt': new Date(),
      });

    console.log(`Subscription deleted for user ${userId}`);

  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!stripe || !adminDb) return;
  
  try {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.userId;

    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    // Update payment status
    await adminDb
      .collection('users')
      .doc(userId)
      .update({
        'subscription.status': 'active',
        'subscription.lastPayment': new Date(),
        'subscription.updatedAt': new Date(),
      });

    console.log(`Payment succeeded for user ${userId}`);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!stripe || !adminDb) return;
  
  try {
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) return;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.userId;

    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    // Update payment status
    await adminDb
      .collection('users')
      .doc(userId)
      .update({
        'subscription.status': 'past_due',
        'subscription.updatedAt': new Date(),
      });

    console.log(`Payment failed for user ${userId}`);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
} 