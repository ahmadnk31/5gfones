-- Add delivery method and shipping fields to the appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(50) CHECK (delivery_method IN ('pickup', 'in_store', 'shipping'));
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_name VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_address_line2 TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_tracking_number VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_provider VARCHAR(100);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS shipping_date TIMESTAMP;

-- Add stripe payment ID field for tracking shipping payments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(100);

-- Create an index on stripe_payment_id for faster lookup
CREATE INDEX IF NOT EXISTS idx_appointments_stripe_payment_id ON appointments(stripe_payment_id);

-- Update repair statuses to include shipping-related statuses
INSERT INTO repair_statuses (name, description, color)
VALUES
    ('Shipped', 'Device has been shipped back to the customer', 'blue'),
    ('Out for Delivery', 'Device is out for delivery', 'orange'),
    ('Delivered', 'Device has been delivered to the customer', 'green')
ON CONFLICT (name) DO NOTHING;

COMMIT;
