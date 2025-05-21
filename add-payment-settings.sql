-- Add payment settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by type
CREATE INDEX IF NOT EXISTS settings_type_idx ON settings(type);

-- Add refund_amount, refund_date, refund_reason, and refund_details columns to the orders table
-- if they don't already exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS refund_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_details JSONB;

-- Create payment transactions table for tracking all payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  payment_processor TEXT NOT NULL, -- stripe, paypal, etc.
  transaction_id TEXT, -- ID from payment processor
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by order_id
CREATE INDEX IF NOT EXISTS payment_transactions_order_id_idx ON payment_transactions(order_id);

-- Insert default payment settings
INSERT INTO settings (type, settings)
VALUES (
  'payment', 
  '{
    "stripe_public_key": "",
    "stripe_secret_key": "",
    "stripe_webhook_secret": "",
    "enable_stripe_checkout": true,
    "enable_stripe_elements": true,
    "allow_refunds": true,
    "payment_currency": "usd",
    "auto_capture_payments": true
  }'
)
ON CONFLICT (type) DO NOTHING;
