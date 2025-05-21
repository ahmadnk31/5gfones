# 5GPhones Stripe Payment Integration

This document describes the payment processing implementation for the 5GPhones e-commerce store using Stripe.

## Overview

The payment system consists of the following components:

1. **Admin Settings Interface** - Allows administrators to configure payment options and process refunds
2. **Stripe Elements Integration** - Embedded payment form for collecting card details securely
3. **Stripe Checkout Integration** - Alternative payment flow using Stripe's hosted checkout page
4. **Webhook Handler** - Processes asynchronous payment events from Stripe
5. **Refund Processing** - Allows administrators to issue refunds

## Configuration

Payment settings are stored in the database in the `settings` table with type='payment'. These settings include:

- Stripe API keys (public, secret, webhook secret)
- Currency configuration
- Payment method options
- Refund policy

In production environments, API keys should be stored in environment variables for security.

## Database Schema

The following database tables support the payment system:

1. `settings` - Stores payment configuration
2. `orders` - Includes payment and refund-related fields
3. `payment_transactions` - Records all payment activities

## Payment Flows

### Customer Checkout with Stripe Elements

1. Customer adds items to cart
2. Customer proceeds to checkout
3. Application loads payment settings from database
4. Payment intent is created via the Stripe API
5. Customer enters payment details in Stripe Elements
6. Payment is processed and order status updated

### Customer Checkout with Stripe Checkout

1. Customer adds items to cart
2. Customer proceeds to checkout
3. Application creates a checkout session via Stripe API
4. Customer is redirected to Stripe's hosted checkout page
5. After payment, customer is redirected back to the order confirmation page

### Webhook Processing

The Stripe webhook handler processes the following events:

- `payment_intent.succeeded` - Updates order status to 'paid'
- `checkout.session.completed` - Updates order status to 'paid'
- `charge.refunded` - Updates order status to 'refunded' or 'partially_refunded'
- `payment_intent.payment_failed` - Updates order status to 'failed'

## Refund Processing

Administrators can issue refunds through the admin interface:

1. Navigate to Admin Settings > Refunds
2. Find the order to refund
3. Enter refund amount and reason
4. Submit refund request
5. Webhook captures the refund event and updates order status

## Security Considerations

- API keys are stored securely and masked in the interface
- Admin interface is protected by authentication and authorization
- Webhook signatures are validated to prevent tampering
- Payment processing happens server-side for security

## Testing

Use Stripe test mode for development and testing:

- Test cards: 4242 4242 4242 4242 (success) or 4000 0000 0000 0002 (decline)
- Test webhooks using the Stripe CLI
- Test refunds using test mode orders
