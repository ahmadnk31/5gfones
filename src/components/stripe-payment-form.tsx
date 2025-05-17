import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StripePaymentFormProps {
  amount: number;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  metadata?: Record<string, string>;
  customerId: string;
}

export function StripePaymentForm({
  amount,
  onPaymentSuccess,
  onPaymentError,
  metadata = {},
  customerId,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsProcessing(true);

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method
      const { error: createError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
        });

      if (createError) {
        throw new Error(createError.message);
      }

      if (!paymentMethod.id) {
        throw new Error("Payment method creation failed");
      }

      // Create payment intent on the server
      const response = await fetch("/api/payment/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          paymentMethodId: paymentMethod.id,
          customerId,
          metadata,
        }),
      });

      const paymentData = await response.json();

      if (!response.ok) {
        throw new Error(paymentData.error || "Payment processing failed");
      }

      // Handle payment success
      onPaymentSuccess(paymentData.id);
    } catch (error: any) {
      setCardError(error.message || "Payment processing failed");
      onPaymentError(error.message || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='p-4 border rounded-md'>
        <div className='mb-4'>
          <h3 className='font-medium mb-2'>Payment Details</h3>
          <p className='text-sm text-gray-500'>
            Amount: {formatCurrency(amount)}
          </p>
        </div>

        <div className='p-3 border rounded-md bg-white'>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>

        {cardError && (
          <div className='mt-2 text-sm text-red-600'>{cardError}</div>
        )}
      </div>

      <Button
        type='submit'
        disabled={!stripe || isProcessing}
        className='w-full'
      >
        {isProcessing ? (
          <>
            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
            Processing...
          </>
        ) : (
          <>Pay {formatCurrency(amount)}</>
        )}
      </Button>
    </form>
  );
}
