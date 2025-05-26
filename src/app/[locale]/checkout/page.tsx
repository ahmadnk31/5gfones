'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useCart } from '@/lib/cart-provider';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Checkout Form Component
interface CheckoutFormProps {
  clientSecret: string;
}

const CheckoutForm = ({ clientSecret }: CheckoutFormProps) => {
  const t = useTranslations('checkout');
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // Calculate additional amounts
  const shippingCost = subtotal >= 50 ? 0 : 5.99;
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };
  
  // No need to create payment intent here - it's handled by the parent component
  
  // Check current user
  useEffect(() => {    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        // Get user info from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('email_notifications, preferred_language')
          .eq('id', data.session.user.id)
          .single();
          
        // Set email from user session
        setEmail(data.session.user.email || '');
        
        // Set name from user metadata if available
        if (data.session.user.user_metadata?.full_name) {
          setName(data.session.user.user_metadata.full_name);
        }
      }
    };
    
    getCurrentUser();
  }, [supabase]);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'An error occurred with your payment details');
        setProcessing(false);
        return;
      }
      
      // Create the order in the database
      const { data: orderData, error: orderError } = await supabase.rpc('create_order_from_items', {
        items_json: JSON.stringify(items),
        shipping_amount: shippingCost,
        tax_amount: taxAmount
      });
      
      if (orderError) {
        setError('Failed to create your order. Please try again.');
        console.error('Order creation error:', orderError);
        setProcessing(false);
        return;
      }
        const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/en/order-confirmation?order_id=${orderData.order_id}`,
        },
      });
      
      if (confirmError) {
        setError(confirmError.message || 'Payment failed. Please try again.');
      } else {
        // Payment succeeded, but redirect wasn't triggered
        clearCart();
        router.push(`/en/order-confirmation?order_id=${orderData.order_id}`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };
  
  // If cart is empty, redirect to cart page
  if (!items.length) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
        <p className="mb-6 text-gray-600">Add some items to your cart before proceeding to checkout</p>
        <Link href="/en/products">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }
  
  // While loading stripe, show loading state
  if (!stripe || !elements || !clientSecret) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Initializing checkout...</p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {/* Customer Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('billingAddress')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <AddressElement
                  options={{
                    mode: 'shipping',
                    allowedCountries: ['US', 'CA'],
                    fields: {
                      phone: 'always',
                    },
                    defaultValues: {
                      name,
                      email
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>{t('payment')}</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentElement />
            </CardContent>
          </Card>
        </div>
        
        {/* Order Summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>{t('orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={`${item.product_id}-${item.variant_id || 'no-variant'}`} className="flex justify-between py-1">
                    <span className="text-sm">
                      {item.name} {item.variant_name ? `(${item.variant_value})` : ''} × {item.quantity}
                    </span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Shipping</span>
                    <span>
                      {shippingCost === 0 
                        ? 'Free' 
                        : formatCurrency(shippingCost)
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Tax</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="mt-6">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!stripe || processing}
                >
                  {processing ? 'Processing...' : t('placeOrder')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
};

const CheckoutPage = () => {
  const { items } = useCart();
  const clientSecretState = useState<string>('');
  const clientSecret = clientSecretState[0]; 
  const setClientSecret = clientSecretState[1];
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create payment intent when component mounts to get client secret
  useEffect(() => {
    if (!items || items.length === 0) {
      setLoading(false);
      return;
    }
    
    const fetchPaymentIntent = async () => {
      try {
        // Calculate additional amounts for the API call
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingCost = subtotal >= 50 ? 0 : 5.99;
        const taxRate = 0.08;
        const taxAmount = subtotal * taxRate;
        
        const response = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round((subtotal + shippingCost + taxAmount) * 100), // Convert to cents
            currency: 'eur',
            items: items, // Send cart items
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create payment intent');
        }
        
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentIntent();
  }, [items]);
  
  // If cart is empty, show message
  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>
        <div className="text-center py-12">
          <p className="text-lg mb-4">Your cart is empty</p>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p className="font-medium">Error</p>
          <p>{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  // Only render Elements when we have a client secret
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>      {clientSecret && (
        <Elements 
          stripe={stripePromise} 
          options={{
            clientSecret: clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#10b981', // emerald-600
              },
            },
          }}
        >
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      )}
    </div>
  );
};

export default CheckoutPage;
