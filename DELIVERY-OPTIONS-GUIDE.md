# Delivery Options Implementation Guide

This guide explains how to implement the delivery options feature in FinOpenPOS, which includes customer pickup, in-store pickup, and shipping with address validation and payment processing.

## 1. Database Changes

Run the SQL script to add the necessary fields to the database:

```bash
psql -U your_username -d your_database_name -f sql/add-shipping-fields.sql
```

This script adds:

- `delivery_method` field to appointments
- Shipping address fields
- Shipping cost and tracking fields
- Additional repair statuses for shipping

## 2. Configure Environment Variables

Add the Stripe API keys to your `.env.local` file:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
```

## 3. Implemented Features

### Delivery Options

- Customer can choose between pickup, in-store, or shipping for device delivery
- Selection appears during repair scheduling process
- Cost summary updates to include shipping when selected

### Address Validation with Stripe Elements

- Stripe Address Element provides international address validation
- Automatically formats and validates shipping addresses
- Supports multiple languages

### Shipping Payments via Stripe

- Payments for shipping costs processed securely
- Transaction records created for shipping payments
- Supports standard payment methods (credit cards, etc.)

### Multilingual Support

- Delivery options available in multiple languages
- Translations available in messages/en.json and other language files

## 4. Testing the Implementation

1. Navigate to the repair scheduling page
2. Follow the steps to schedule a repair
3. On the delivery step, try each delivery method
4. For shipping, enter a test address
5. Complete the process and verify the appointment details

## 5. Admin Management

Administrators can:

- View delivery method in appointment details
- Update shipping information if needed
- Track shipping status
- Process shipping payments

## 6. Future Enhancements

- Integration with shipping providers for automatic label generation
- Real-time shipping cost calculation based on destination
- Shipping status updates via webhooks from carriers
