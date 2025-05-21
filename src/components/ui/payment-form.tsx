'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Load Stripe outside of component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutFormProps {
  amount: number;
  orderId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

// Form to collect payment details
function CheckoutForm({ amount, orderId, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    async function createPaymentIntent() {
      try {
        const response = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            amount, 
            orderId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        onError('Could not initialize payment. Please try again.');
      }
    }

    createPaymentIntent();
  }, [amount, orderId, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // You can collect these details elsewhere in your form
          },
        },
      });

      if (error) {
        throw error;
      }

      if (paymentIntent.status === 'succeeded') {
        toast({
          title: 'Payment successful',
          description: `Payment of $${(amount).toFixed(2)} has been processed successfully.`,
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Payment failed',
        description: error.message || 'An error occurred processing your payment.',
      });
      onError(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted rounded-md p-4">
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
      <Button 
        type="submit" 
        disabled={!stripe || loading || !clientSecret}
        className="w-full"
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
}

export default function PaymentComponent({
  amount,
  orderId,
  onSuccess,
  onError,
}: CheckoutFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Complete your payment</h2>
        <CheckoutForm 
          amount={amount} 
          orderId={orderId} 
          onSuccess={onSuccess} 
          onError={onError}
        />
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Your card details are securely processed by Stripe. We do not store your card information.
          </p>
        </div>
      </div>
    </Elements>
  );
}
