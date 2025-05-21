# Stripe Elements Integration Guide

This guide explains how to integrate Stripe Elements into your 5GPhones e-commerce platform for processing payments directly on your website.

## Overview

Stripe Elements provides pre-built UI components for collecting payment information securely. This approach allows you to keep customers on your website during the payment process, rather than redirecting them to Stripe's checkout page.

## Implementation Steps

### 1. Frontend Setup

First, install the required dependencies:

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

### 2. Create a Stripe Provider

In your app, create a Stripe provider that will initialize the Stripe library:

```tsx
// src/providers/StripeProvider.tsx
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ReactNode } from 'react';

// Load Stripe outside of a component render to avoid recreating the Stripe object
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripeProvider({
  children
}: {
  children: ReactNode;
}) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
```

### 3. Create a Payment Form Component

Create a component to render the Stripe Elements:

```tsx
// src/components/ui/CheckoutForm.tsx
'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

export default function CheckoutForm({
  clientSecret,
  orderTotal,
  onSuccess,
  onError
}: {
  clientSecret: string;
  orderTotal: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    const { error: submitError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    setProcessing(false);

    if (submitError) {
      setError(submitError.message || 'An error occurred while processing your payment');
      onError(submitError.message || 'Payment failed');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      setError('An unexpected error occurred');
      onError('Payment failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-md p-4 border">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      <div className="flex justify-between items-center">
        <div className="font-semibold">
          Total: ${orderTotal.toFixed(2)}
        </div>
        <Button 
          type="submit" 
          disabled={!stripe || processing}
        >
          {processing ? 'Processing...' : 'Pay Now'}
        </Button>
      </div>
    </form>
  );
}
```

### 4. Implement Checkout Page

Update your checkout page to create a payment intent and render the checkout form:

```tsx
// src/app/[locale]/checkout/payment/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CheckoutForm from '@/components/ui/CheckoutForm';
import StripeProvider from '@/providers/StripeProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    // Fetch order details and create payment intent
    const fetchPaymentIntent = async () => {
      try {
        const response = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            amount: 0, // This will be replaced by the actual order amount from the server
            // The server already knows the order amount based on the orderId
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        
        // Fetch order details to get total amount
        const orderResponse = await fetch(`/api/orders/${orderId}`);
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          setOrderTotal(orderData.total_amount);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to set up payment');
        console.error('Error setting up payment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [orderId]);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    // Redirect to success page
    router.push(`/checkout/success?orderId=${orderId}&paymentId=${paymentIntentId}`);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !clientSecret) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-destructive">Payment Error</h1>
        <p className="mt-2">{error || 'Unable to set up payment'}</p>
        <button 
          onClick={() => router.back()} 
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <StripeProvider>
      <div className="max-w-md mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckoutForm
              clientSecret={clientSecret}
              orderTotal={orderTotal}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </CardContent>
        </Card>
      </div>
    </StripeProvider>
  );
}
```

### 5. Environment Variables

Add the necessary environment variables to your project:

```
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Webhook Handling

The webhook handler is already set up to process payment intent events. It will:

1. Validate the incoming webhook signature
2. Process payment_intent.succeeded events to update order status
3. Record discount usage if applicable
4. Process refund events

## Testing

To test your Stripe Elements integration:

1. Use Stripe's test card numbers:
   - 4242 4242 4242 4242 (success)
   - 4000 0000 0000 0002 (card declined)
2. Use any future date for expiry and any 3 digits for CVC
3. Use any name and postal code

## Common Issues

### Payment Fails Silently

If payments fail without error messages:

1. Ensure your Stripe publishable key is correct
2. Check that the client secret is being properly retrieved
3. Verify the payment intent was created successfully in the Stripe dashboard

### Webhooks Not Working

If webhooks aren't updating your orders:

1. Make sure your STRIPE_WEBHOOK_SECRET is correct
2. Check that the webhook endpoint is properly exposed at `/api/webhooks/stripe`
3. Use the Stripe CLI to test webhooks locally

## Security Considerations

1. Always create payment intents on the server, never the client
2. Never log or store full card details
3. Always use Stripe Elements to collect payment information, which ensures PCI compliance
4. Use Stripe's test mode for development and testing
