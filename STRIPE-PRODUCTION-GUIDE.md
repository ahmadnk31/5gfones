# Stripe Payment Integration Production Guide

This guide provides instructions for setting up and going live with Stripe payment processing in the 5GPhones e-commerce site.

## Setup Process

### 1. Stripe Account Setup

1. **Create a Stripe account**:
   - Visit [stripe.com](https://stripe.com) and sign up
   - Complete the required business information
   - Verify your identity and business details

2. **Activate your Stripe account**:
   - Provide all required legal information
   - Set up business verification (may require documentation)
   - Connect your bank account for receiving payments

### 2. Configuration in Admin Panel

1. **Access Admin Settings**:
   - Log in to the 5GPhones admin panel
   - Navigate to Settings → Payment Configuration

2. **Enter Stripe API Keys**:
   - Locate API keys in your [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Enter your Publishable Key and Secret Key
   - Save the configuration

3. **Configure Webhook Endpoints**:
   - Create a new webhook endpoint in your [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
   - Set the endpoint URL to: `https://[your-domain]/api/webhooks/stripe`
   - Select these events to monitor:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`
     - `charge.refunded`
   - Copy the webhook signing secret
   - Enter the webhook secret in the admin settings

### 3. Payment Method Configuration

1. **Configure Supported Payment Methods**:
   - Visit [Payment Methods](https://dashboard.stripe.com/settings/payment_methods) in Stripe
   - Enable desired payment methods (credit cards, Apple Pay, Google Pay, etc.)
   - Ensure these are reflected in your Stripe Elements configuration

2. **Configure Payment Options in Admin**:
   - Enable/disable Stripe Checkout or Stripe Elements
   - Set preferred currency and auto-capture preferences

### 4. Testing Before Launch

Before going live, ensure you've tested the full payment flow in Stripe's test mode:

1. **Test Payments**:
   - Use Stripe [test card numbers](https://stripe.com/docs/testing#cards)
   - Verify successful payment flow
   - Check order creation and status updates

2. **Test Refunds**:
   - Process test refunds through admin panel
   - Verify refund amount and status updates

3. **Test Webhooks**:
   - Use Stripe CLI to send test webhook events
   - Verify system properly handles events

### 5. Going Live

When ready to accept real payments:

1. **Switch to Live Mode**:
   - Update API keys from test to live mode in admin settings
   - Double-check webhook configuration for production

2. **Update Webhook Endpoint**:
   - Update your webhook endpoint to use the live webhook secret

3. **Perform End-to-End Test**:
   - Process a small real payment (can be refunded)
   - Verify the entire flow works as expected

## Refund Management

### Processing Refunds

1. **Customer-Initiated Refunds**:
   - Customers can request refunds from their order history
   - Refund requests are stored in the database with pending status
   - Admins can review and approve/deny through the admin panel

2. **Admin-Initiated Refunds**:
   - Admins can initiate refunds from the Order Details page
   - Full or partial refunds are supported
   - Refund reason can be specified

### Refund Policy Configuration

In the admin panel:

1. Navigate to Settings → Payment Configuration → Refunds
2. Configure:
   - Refund time window (default: 14 days after delivery)
   - Refund eligibility criteria
   - Auto-approval thresholds (optional)

## Troubleshooting

### Common Stripe Errors

1. **Authentication Failed**:
   - Check that API keys are correct
   - Ensure keys match environment (test/live)

2. **Webhook Signature Verification Failed**:
   - Verify webhook secret is correct
   - Check timestamp of requests (must be within tolerance)

3. **Payment Intent Creation Failed**:
   - Check customer information completeness
   - Verify currency code is supported

### Database Issues

1. **Transaction Records Missing**:
   - Check payment_transactions table for errors
   - Verify correct logging in webhook handlers

2. **Order Status Not Updating**:
   - Check transaction rollback scenarios
   - Verify Stripe webhook is reaching your endpoint

## Maintenance and Monitoring

1. **Monitor Payment Events**:
   - Set up alerts for failed payments
   - Monitor refund ratio for fraud detection

2. **Regular Testing**:
   - Periodically test payment flow in test mode
   - Verify refund process works correctly

3. **Keeping Up-to-Date**:
   - Watch for Stripe API updates
   - Update Stripe libraries regularly

## Security Considerations

1. **PCI Compliance**:
   - Using Stripe Elements/Checkout handles most PCI requirements
   - Never log full card details
   - Limit access to Stripe dashboard

2. **API Key Security**:
   - Store API keys securely in the database (encrypted)
   - Limit admin access to payment settings

3. **Fraud Prevention**:
   - Enable Stripe Radar for fraud detection
   - Set up rules based on your business needs
   - Monitor suspicious transaction patterns
