
import Stripe from 'stripe';

// Function to get Stripe instance with proper configuration
async function getStripeInstance() {
  try {
    // First try to get settings from database
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/stripe-keys`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    
    const data = await response.json();
    
    if (data.error || !data.stripeSecretKey) {
      throw new Error('Failed to get Stripe keys from settings');
    }
    
    return new Stripe(data.stripeSecretKey, {
      apiVersion: '2025-04-30.basil',
      typescript: true,
    });
    
  } catch (error) {
    // Fallback to environment variables
    console.warn('Using environment variables for Stripe keys');
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion:'2025-04-30.basil',
      typescript: true,
    });
  }
}

// This is a singleton cache for the Stripe instance
let stripeInstance: Stripe | null = null;

// Get a configured Stripe instance (fetches keys from DB if available)
export default async function getStripe(): Promise<Stripe> {
  if (stripeInstance) {
    return stripeInstance;
  }
  
  try {
    // First try to get settings from database
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/admin/stripe-keys`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    
    const data = await response.json();
    
    if (data.error || !data.stripeSecretKey) {
      throw new Error('Failed to get Stripe keys from settings');
    }
    
    stripeInstance = new Stripe(data.stripeSecretKey, {
      apiVersion: '2025-04-30.basil',
      typescript: true,
    });
    
    return stripeInstance;
    
  } catch (error) {
    // Fallback to environment variables
    console.warn('Using environment variables for Stripe keys');
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion:'2025-04-30.basil',
      typescript: true,
    });
    
    return stripeInstance;
  }
}

// Helper function to create a Payment Intent for Stripe Elements
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  orderId,
  discounts = [],
  userId,
  customerEmail,
  paymentMethodTypes = ['card'],
  description,
}: {
  amount: number;
  currency?: string;
  orderId: string;
  discounts?: string[];
  userId?: string;
  customerEmail?: string;
  paymentMethodTypes?: string[];
  description?: string;
}) {  try {
    // Amount should be in cents (e.g., $10.00 = 1000)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents and ensure it's an integer
      currency,
      payment_method_types: paymentMethodTypes,
      description,
      metadata: {
        orderId,
        userId: userId || null,
        discountIds: discounts.length > 0 ? JSON.stringify(discounts) : null,
      },
      receipt_email: customerEmail || undefined,
    });

    return { 
      success: true, 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    };
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return { 
      success: false, 
      error: error.message || 'An error occurred creating the payment intent' 
    };
  }
}

// Helper function to create a Stripe checkout session
export async function createCheckoutSession({
  items,
  orderId,
  discounts = [],
  userId,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  items: {
    price: string;
    quantity: number;
  }[];
  orderId: string;
  discounts?: string[];
  userId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        orderId,
        userId,
        discountIds: discounts.length > 0 ? JSON.stringify(discounts) : undefined,
      },
    });

    return { success: true, url: session.url, sessionId: session.id };
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return { 
      success: false, 
      error: error.message || 'An error occurred creating the checkout session' 
    };
  }
}

// Helper function to validate a Stripe webhook signature
export function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string
) {
  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    return { valid: true, event };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

// Function to create or retrieve a customer
export async function getOrCreateCustomer(email: string, name?: string) {
  try {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return { success: true, customerId: customers.data[0].id };
    }

    // Create a new customer if one doesn't exist
    const newCustomer = await stripe.customers.create({
      email,
      name,
    });

    return { success: true, customerId: newCustomer.id };
  } catch (error: any) {
    console.error('Error creating or retrieving Stripe customer:', error);
    return {
      success: false,
      error: error.message || 'Error creating or retrieving customer',
    };
  }
}

// Helper function to process refunds through Stripe
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: string
) {
  try {
    const stripe = await getStripe();
    
    try {
      // First try to get the payment intent to get the charge ID
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.latest_charge) {
        const chargeId = typeof paymentIntent.latest_charge === 'string' 
          ? paymentIntent.latest_charge 
          : paymentIntent.latest_charge.id;
        
        // Process the refund using charge ID (preferred method)
        const refundParams: Stripe.RefundCreateParams = {
          charge: chargeId,
          reason: (reason as Stripe.RefundCreateParams.Reason) || undefined,
        };
        
        // If amount is provided, it's a partial refund
        if (amount !== undefined) {
          refundParams.amount = amount;
        }
        
        const refund = await stripe.refunds.create(refundParams);
        
        return {
          success: true,
          refund,
        };
      }
    } catch (piError) {
      // If retrieving payment intent fails, fallback to direct refund
      console.warn('Failed to retrieve payment intent, falling back to direct refund');
    }
    
    // Fallback approach: direct refund by payment_intent
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = amount;
    }

    if (reason) {
      refundParams.reason = reason as Stripe.RefundCreateParams.Reason;
    }

    const refund = await stripe.refunds.create(refundParams);
    return { success: true, refund };
    
  } catch (error: any) {
    console.error('Error creating refund:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while processing the refund',
    };
  }
}
