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

// Initialize Stripe (will be configured later with settings)
const stripePromise = null;

// Checkout Form Component
const CheckoutForm = ({ currency = 'usd' }) => {
  const t = useTranslations('checkout');
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // Calculate additional amounts
  const shippingCost = subtotal >= 50 ? 0 : 5.99;
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;
  
  // Format currency using the currency from settings
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };
    // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!items.length) return;
      
      try {
        // First we need to create an order in the database
        const { data: orderData, error: orderError } = await supabase.rpc('create_order_from_items', {
          items_json: JSON.stringify(items),
          shipping_amount: shippingCost,
          tax_amount: taxAmount
        });
        
        if (orderError || !orderData?.order_id) {
          throw new Error('Failed to create order');
        }
        
        // Now create a payment intent for this order
        const response = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderData.order_id,
            amount: total,
            currency: currency.toLowerCase(),
            description: `Order #${orderData.order_id}`
          }),
        });
        
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          return;
        }
        
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError('Failed to initialize payment. Please try again.');
        console.error('Error creating payment intent:', err);
      }
    };
    
    createPaymentIntent();
  }, [items, shippingCost, taxAmount, total, currency, supabase]);
  
  // Check current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        const { data: profile } = await supabase
          .from('customers')
          .select('name, email')
          .eq('id', data.session.user.id)
          .single();
          
        if (profile) {
          setName(profile.name || '');
          setEmail(profile.email || data.session.user.email || '');
        } else {
          setEmail(data.session.user.email || '');
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
        clientSecret,
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
              <div className="mb-6">                <AddressElement
                  options={{
                    mode: 'shipping',
                    allowedCountries: ['US', 'CA'],
                    fields: {
                      phone: 'always',
                    },
                    defaultValues: {
                      name
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
  const router= useRouter();
  const [options, setOptions] = useState({
    clientSecret: '',
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#3b82f6',
      },
    },
  });
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<{
    stripe_public_key: string;
    payment_currency: string;
    enable_stripe_checkout: boolean;
    enable_stripe_elements: boolean;
  }>({
    stripe_public_key: '',
    payment_currency: 'eur',
    enable_stripe_checkout: true,
    enable_stripe_elements: true,
  });
  const [loading, setLoading] = useState(true);
  
  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await fetch('/api/payment-settings');
        const data = await response.json();
        
        if (data.settings) {
          setPaymentSettings(data.settings);
          
          // Initialize Stripe with the public key from settings
          if (data.settings.stripe_public_key) {
            setStripeInstance(loadStripe(data.settings.stripe_public_key));
          }
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
        // Fallback to environment variable
        setStripeInstance(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''));
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentSettings();
  }, []);
  
  // If cart is empty, no need to load Stripe
  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>
        <CheckoutForm />
      </div>
    );
  }
  
  // While loading settings
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>
        <div className="text-center py-16">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading payment options...</p>
        </div>
      </div>
    );
  }
    // If Stripe Checkout is enabled and Elements is disabled, redirect to Stripe Checkout
  useEffect(() => {
    if (paymentSettings.enable_stripe_checkout && !paymentSettings.enable_stripe_elements) {
      router.push('/checkout/stripe');
    }
  }, [paymentSettings, router]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>
      {stripeInstance ? (
        <Elements stripe={stripeInstance} options={options as any}>
          <CheckoutForm currency={paymentSettings.payment_currency} />
        </Elements>
      ) : (
        <div className="text-center py-16">
          <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
            <p>Payment system is currently unavailable. Please try again later.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
