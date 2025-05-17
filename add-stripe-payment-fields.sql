-- Add Stripe payment fields to the orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method_name VARCHAR(100);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_id ON orders(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
