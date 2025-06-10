import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe/server';
import { auth } from '@/lib/firebase/admin';
import { STRIPE_CONFIG } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify Firebase token
    if (!auth) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured' },
        { status: 500 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Parse request body
    const { priceId, plan } = await request.json();

    // Validate price ID
    const validPriceIds = Object.values(STRIPE_CONFIG.PRODUCTS);
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      );
    }

    // Get base URL for redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Create checkout session
    const { sessionId, url } = await createCheckoutSession({
      priceId,
      customerEmail: userEmail,
      userId,
      successUrl: `${baseUrl}${STRIPE_CONFIG.URLS.SUCCESS}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}${STRIPE_CONFIG.URLS.CANCEL}`,
    });

    return NextResponse.json({
      sessionId,
      url,
      plan,
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 