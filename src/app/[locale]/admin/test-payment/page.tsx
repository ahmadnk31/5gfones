'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Will be initialized with the actual key from the API
let stripePromise: any = null;

// The test payment form component
const TestPaymentForm = () => {
  const t = useTranslations('checkout');
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setProcessing(true);
    
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/test-payment-success`,
      },
      redirect: 'if_required',
    });
    
    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setProcessing(false);
      return;
    }
    
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      setSucceeded(true);
      setPaymentIntentId(paymentIntent.id);
      setError(null);
    }
    
    setProcessing(false);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement />
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {succeeded && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4">
          Payment succeeded! Payment Intent ID: {paymentIntentId}
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || processing} 
        className="w-full"
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
};

// Test page for refunds
const TestRefundForm = () => {
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [amount, setAmount] = useState('');
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          amount: parseFloat(amount) * 100, // Convert to cents
          orderId: parseInt(orderId),
          reason,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Test Refund Processing</CardTitle>
        <CardDescription>Process a refund for a test payment</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRefund}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentIntentId">Payment Intent ID</Label>
              <Input
                id="paymentIntentId"
                value={paymentIntentId}
                onChange={(e) => setPaymentIntentId(e.target.value)}
                placeholder="pi_..."
                required
              />
            </div>
            
            <div>
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                type="number"
                placeholder="123"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Refund Amount ($)</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                placeholder="10.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="reason">Refund Reason</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Customer request"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md">
                {error}
              </div>
            )}
            
            {result && (
              <div className="bg-green-50 text-green-700 p-3 rounded-md">
                <p>Refund processed successfully!</p>
                <p>Refund ID: {result.refundId}</p>
                <p>Status: {result.status}</p>
                <p>Amount: ${result.amount}</p>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={processing} 
              className="w-full"
            >
              {processing ? 'Processing...' : 'Process Refund'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Main page component
export default function TestPaymentPage() {
  const [clientSecret, setClientSecret] = useState('');
  const [stripeKey, setStripeKey] = useState('');
  const [testAmount, setTestAmount] = useState('10.00');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        // Get payment settings including Stripe public key
        const settingsResponse = await fetch('/api/payment-settings');
        const settingsData = await settingsResponse.json();
        
        if (settingsData.error) {
          throw new Error(settingsData.error);
        }
        
        setStripeKey(settingsData.stripePublicKey);
        
        // Initialize Stripe with the public key
        if (settingsData.stripePublicKey) {
          stripePromise = loadStripe(settingsData.stripePublicKey);
        }
        
      } catch (err: any) {
        setError('Failed to load payment settings: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPaymentSettings();
  }, []);
  
  const createTestPaymentIntent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(testAmount),
          currency: 'usd',
          orderId: 'test-' + Date.now(),
          description: 'Test payment'
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Stripe Test Page</h1>
      <p className="mb-6">
        This page is for development testing of the Stripe integration. It allows you to
        create test payments and refunds without going through the full checkout flow.
      </p>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Test Payment</CardTitle>
          <CardDescription>Generate a payment intent for testing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="testAmount">Test Amount ($)</Label>
              <Input
                id="testAmount"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                type="number"
                step="0.01"
                min="1.00"
                className="mb-4"
              />
            </div>
            
            <Button 
              onClick={createTestPaymentIntent}
              disabled={loading || !stripeKey}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Create Test Payment Intent'}
            </Button>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {clientSecret && stripeKey && stripePromise && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Process Test Payment</CardTitle>
            <CardDescription>Complete the test payment using Stripe Elements</CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
              },
            }}>
              <TestPaymentForm />
            </Elements>
          </CardContent>
        </Card>
      )}
      
      <TestRefundForm />
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Note: This page is for development testing only. Use Stripe test cards:</p>
        <ul className="list-disc ml-5 mt-2">
          <li>Success: 4242 4242 4242 4242</li>
          <li>Requires Authentication: 4000 0025 0000 3155</li>
          <li>Declined: 4000 0000 0000 0002</li>
        </ul>
      </div>
    </div>
  );
}
