# Stripe Webhook Integration - SQL Commands

To set up the necessary database tables and fields for the Stripe webhook integration, you'll need to run the following SQL commands. You can execute these commands using the Supabase dashboard, SQL editor, or with the Supabase CLI once it's properly installed.

## 1. Add Stripe Payment Fields to Orders Table

```sql
-- Add Stripe payment fields to the orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_name VARCHAR(100);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_id ON orders(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
```

## 2. Create Discount Usage Tracking Table and Add Refund Fields

```sql
-- Create a table for tracking discount usage
CREATE TABLE IF NOT EXISTS discount_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_id UUID NOT NULL,
    order_id UUID NOT NULL,
    user_id UUID,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discount_usage_discount_id ON discount_usage(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_order_id ON discount_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_user_id ON discount_usage(user_id);

-- Add columns for refund tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_details JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_details JSONB;
```

## 3. Apply SQL Using Supabase Dashboard

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Paste each SQL block separately and run it
5. Verify the changes were applied by checking the table structure

## 4. Apply SQL Using Supabase CLI (Alternative)

Once you have the Supabase CLI properly installed, you can run:

```bash
# For the first SQL file
npx supabase db execute -f add-stripe-payment-fields.sql

# For the second SQL file
npx supabase db execute -f add-discount-usage-tracking.sql
```
