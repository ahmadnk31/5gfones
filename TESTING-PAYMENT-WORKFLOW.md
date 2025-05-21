# Testing the Stripe Payment and Refund Workflow

This document outlines the steps to test the payment processing and refund functionality for the 5GPhones e-commerce project.

## 1. Apply Database Schema Changes

First, we need to apply the SQL scripts to create the necessary database tables and columns.

### Steps:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following SQL scripts in order:
   - `add-payment-settings.sql`
   - `add-refund-requests-table.sql`
4. Verify the tables were created by checking the Table Editor

## 2. Configure Stripe API Keys

Before testing, ensure your Stripe API keys are properly configured.

### Steps:

1. Log in to the Admin panel
2. Navigate to Settings → Payment Configuration
3. Enter your Stripe test API keys:
   - Stripe Public Key
   - Stripe Secret Key
   - Stripe Webhook Secret
4. Save the configuration

## 3. Test the Checkout Process

### Prerequisites:
- Create a test user account or log in with an existing account
- Add products to the cart

### Steps:

1. **Process a test order:**
   - Add items to the cart
   - Proceed to checkout
   - Use Stripe test card: `4242 4242 4242 4242` (expiry: any future date, CVC: any 3 digits)
   - Complete the purchase

2. **Verify order creation:**
   - Check the orders table in Supabase
   - Verify payment_status = "paid"
   - Verify transaction is recorded in payment_transactions table

3. **Check Stripe Dashboard:**
   - Log in to your Stripe dashboard
   - Verify the payment appears in the Payments section
   - Note down the Payment Intent ID for later use in refund testing

## 4. Test User-Initiated Refund Requests

### Steps:

1. **Request a refund as a user:**
   - Log in to the customer account
   - Navigate to Orders
   - Select the order created in the previous step
   - Click "Request Refund"
   - Fill out the refund reason and submit

2. **Verify refund request:**
   - Check refund_requests table in Supabase
   - Verify status = "pending"
   - Check the orders table for refund_status = "pending"

## 5. Test Admin Refund Processing

### Steps:

1. **Process the refund request:**
   - Log in to Admin panel
   - Navigate to Orders or Refund Management
   - Find the pending refund request
   - Approve the refund
   - Enter refund amount (full or partial)

2. **Verify refund processing:**
   - Check the order in Supabase
   - Verify payment_status updated to "refunded" or "partially_refunded"
   - Verify refund transaction in payment_transactions table
   - Check Stripe dashboard to confirm refund was processed

## 6. Test Refund Eligibility Rules

### Steps:

1. **Test refund time window:**
   - Create an order with a delivery date older than 14 days
   - Attempt to request a refund
   - Verify the system prevents the request due to time window

2. **Test refund for non-delivered orders:**
   - Create an order with status "processing" or "shipped" but not "delivered"
   - Attempt to request a refund
   - Verify the system shows appropriate messaging

## 7. Test Edge Cases

1. **Multiple partial refunds:**
   - Process a partial refund for an order
   - Process another partial refund for the same order
   - Verify the running refund total doesn't exceed the original payment

2. **Webhook handling:**
   - Use the Stripe CLI to simulate webhook events:
     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```
   - Trigger test events like `payment_intent.succeeded` and `charge.refunded`
   - Verify the application properly handles these events

## 8. Troubleshooting Common Issues

### Stripe API Errors:
- Check the server logs for detailed error messages
- Verify API keys are correctly set up in the admin settings
- Ensure the Stripe webhook secret is correctly configured

### Database Issues:
- Check for foreign key constraint errors in the payment_transactions table
- Verify the orders table has the necessary refund columns

### Payment Processing Issues:
- Verify the correct currency is being used for both payments and refunds
- Check that amount calculations are consistent between the application and Stripe

## 9. Production Readiness Checklist

Before going to production:

- [ ] Switch from Stripe test API keys to production API keys
- [ ] Test the entire payment flow in a staging environment
- [ ] Implement appropriate error handling and notifications
- [ ] Set up monitoring for Stripe webhooks
- [ ] Document the refund policy for customers
- [ ] Ensure all sensitive data is properly secured
