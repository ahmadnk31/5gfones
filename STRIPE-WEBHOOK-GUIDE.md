# Stripe Webhook Integration Guide

This guide explains how to set up and use Stripe webhooks in the 5GPhones e-commerce platform.

## Overview

Stripe webhooks allow your application to receive notifications when events occur in your Stripe account, such as successful payments, refunds, or subscription updates. The 5GPhones platform uses webhooks to update order statuses and track payment events.

## Implementation Details

### Webhook Endpoint

The webhook endpoint is located at:
```
/api/webhooks/stripe
```

This endpoint handles various Stripe events, including:
- `checkout.session.completed` - When a payment is successful
- `charge.refunded` - When a refund is processed
- `payment_intent.payment_failed` - When a payment fails

### Event Handling

When a webhook event is received:

1. The endpoint verifies the webhook signature using the Stripe secret
2. Based on the event type, it updates the corresponding order in the database
3. For successful payments, it updates the order status to 'paid'
4. For refunds, it updates the order status to 'refunded' or 'partially_refunded'
5. For failed payments, it updates the order status to 'failed'

## Configuration

To configure Stripe webhooks for your environment:

### Development Environment

1. Install the Stripe CLI from [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Log in with: `stripe login`
3. Forward events to your local server:
   ```
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```
4. The CLI will display a webhook signing secret. Add this to your `.env.local` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Production Environment

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Select the events to listen for:
   - `checkout.session.completed`
   - `charge.refunded`
   - `payment_intent.payment_failed`
5. After creating the endpoint, reveal the signing secret and add it to your environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Testing

To test the webhook integration:

1. Use the included test script: `node test-stripe-webhook.js`
2. This creates a test checkout session and provides a command to trigger a webhook event
3. Run the provided command in a new terminal to simulate the event
4. Check your application logs to verify the webhook was processed correctly

## Database Schema

The webhook integration uses the following database tables and fields:

### Orders Table
- `stripe_payment_id` - The Stripe payment intent or session ID
- `payment_status` - Status of the payment (pending, paid, failed, refunded, etc.)
- `payment_method_name` - Name of the payment method used
- `refund_amount` - Amount refunded (if applicable)
- `refund_details` - JSON object with refund details
- `payment_details` - JSON object with payment details

### Discount Usage Table
- `discount_id` - ID of the discount that was applied
- `order_id` - ID of the order where the discount was used
- `user_id` - ID of the user who used the discount
- `used_at` - Timestamp when the discount was used

## Common Issues

### Webhook Signature Verification Failed

If you see "Webhook signature verification failed" errors:

1. Ensure the `STRIPE_WEBHOOK_SECRET` environment variable is correctly set
2. For local development, restart the Stripe CLI to get a new webhook secret
3. Verify you're using the correct secret for the environment (test/production)

### Missing Order Updates

If orders aren't being updated after payments:

1. Check that the `orderId` is correctly included in the checkout session metadata
2. Verify the webhook endpoint is receiving events (check server logs)
3. Ensure the database has the necessary columns for payment tracking

## Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Testing Webhooks with the Stripe CLI](https://stripe.com/docs/webhooks/test)
- [Stripe API Reference](https://stripe.com/docs/api)
