# Stripe Payment Integration for FinOpenPOS

This guide explains how to set up Stripe payment processing in FinOpenPOS.

## Step 1: Install Required Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```

## Step 2: Set Up Environment Variables

Create or update your `.env.local` file with your Stripe API keys:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
```

You can get these keys from your [Stripe Dashboard](https://dashboard.stripe.com/apikeys).

## Step 3: Database Updates

Run the SQL script to add Stripe payment fields to your database:

```sql
-- Add Stripe payment fields to the orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_name VARCHAR(100);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_id ON orders(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
```

## Step 4: Features and Implementation Details

The integration provides the following features:

1. **Credit Card Payment Option** - Adds a toggle between standard payment methods and credit card payments
2. **Secure Payment Processing** - Uses Stripe Elements for PCI-compliant credit card collection
3. **Payment Records** - Stores Stripe payment IDs with orders for tracking and reconciliation

## Step 5: Configuration and Customization

You can customize the appearance of the payment form by editing the `StripePaymentForm` component. For example:

```jsx
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
```

## Testing

For testing, use the following test card details:

- Card Number: 4242 4242 4242 4242
- Expiration: Any future date
- CVC: Any 3 digits

For more test cards, see the [Stripe testing documentation](https://stripe.com/docs/testing).
