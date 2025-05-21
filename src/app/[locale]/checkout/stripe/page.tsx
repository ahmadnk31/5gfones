'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-provider';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function StripeCheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations('checkout');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSettings, setPaymentSettings] = useState({
    stripe_public_key: '',
    payment_currency: 'usd',
  });
  
  // Calculate additional amounts
  const shippingCost = subtotal >= 50 ? 0 : 5.99;
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;
  
  // Format currency using the currency from settings
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: paymentSettings.payment_currency.toUpperCase(),
    }).format(amount);
  };
  
  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await fetch('/api/payment-settings');
        const data = await response.json();
        
        if (data.settings) {
          setPaymentSettings({
            stripe_public_key: data.settings.stripe_public_key,
            payment_currency: data.settings.payment_currency,
          });
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
      }
    };
    
    fetchPaymentSettings();
  }, []);
  
  // If cart is empty, don't proceed
  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">{t('title')}</h1>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-4">{t('emptyCart')}</h2>
          <p className="mb-6 text-gray-600">{t('emptyCartMessage')}</p>
          <Link href="/products">
            <Button>{t('continueShopping')}</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Handle checkout with Stripe Checkout
  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    
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
      
      // Format the line items for Stripe
      const lineItems = items.map((item) => ({
        price_data: {
          currency: paymentSettings.payment_currency.toLowerCase(),
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : undefined,
            description: item.variant_name ? `${item.variant_name}: ${item.variant_value}` : undefined,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      }));
      
      // Add shipping and tax as separate line items if needed
      if (shippingCost > 0) {
        lineItems.push({
          price_data: {
            currency: paymentSettings.payment_currency.toLowerCase(),
            product_data: {
              name: 'Shipping',
            },
            unit_amount: Math.round(shippingCost * 100),
          },
          quantity: 1,
        });
      }
      
      if (taxAmount > 0) {
        lineItems.push({
          price_data: {
            currency: paymentSettings.payment_currency.toLowerCase(),
            product_data: {
              name: 'Tax',
            },
            unit_amount: Math.round(taxAmount * 100),
          },
          quantity: 1,
        });
      }
      
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderData.order_id,
          items: lineItems,
          successUrl: `${window.location.origin}/order-confirmation?order_id=${orderData.order_id}`,
          cancelUrl: `${window.location.origin}/checkout`,
        }),
      });
      
      const checkoutData = await response.json();
      
      if (checkoutData.error) {
        throw new Error(checkoutData.error);
      }
      
      // Redirect to Stripe Checkout
      if (checkoutData.url) {
        clearCart();
        window.location.href = checkoutData.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">{t('title')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('orderItems')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.product_id}-${item.variant_id || 'no-variant'}`} className="flex justify-between items-center py-2 border-b">
                    <div className="flex items-center">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded mr-4"
                        />
                      )}
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.variant_name && (
                          <p className="text-sm text-gray-500">{item.variant_name}: {item.variant_value}</p>
                        )}
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>{t('orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCheckout} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? t('processing') : t('proceedToCheckout')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
