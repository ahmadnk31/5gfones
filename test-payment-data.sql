-- Test data for payment and refund testing
-- Run this script after applying the schema changes

-- Sample payment settings
UPDATE settings
SET settings = jsonb_set(
  settings,
  '{stripe_public_key}',
  '"pk_test_51NxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"'
)
WHERE type = 'payment';

UPDATE settings
SET settings = jsonb_set(
  settings,
  '{stripe_secret_key}',
  '"sk_test_51NxXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"'
)
WHERE type = 'payment';

UPDATE settings
SET settings = jsonb_set(
  settings,
  '{stripe_webhook_secret}',
  '"whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"'
)
WHERE type = 'payment';

-- Sample order for testing refunds (replace user_uid with an actual user ID from your system)
INSERT INTO orders (
  user_uid,
  status,
  payment_status,
  payment_id,
  total_amount,
  items,
  shipping_address,
  created_at
)
VALUES (
  'replace-with-real-user-id',
  'delivered',
  'paid',
  'pi_test_123456789',
  99.99,
  '[{"id": 1, "name": "Test Phone", "price": 99.99, "quantity": 1}]',
  '{"name": "Test User", "address1": "123 Test St", "city": "Test City", "state": "TS", "zip": "12345", "country": "US"}',
  (NOW() - INTERVAL '5 days')
)
RETURNING id;

-- Add a sample payment transaction for the order
-- Note: Make sure to replace 'order_id_here' with the ID from the previous INSERT statement
INSERT INTO payment_transactions (
  order_id,
  transaction_type,
  amount,
  payment_processor,
  transaction_id,
  status,
  details
)
VALUES (
  -- Replace with actual order ID from above
  (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1),
  'payment',
  99.99,
  'stripe',
  'pi_test_123456789',
  'completed',
  '{"payment_method": "card", "card_brand": "visa", "last4": "4242"}'
);

-- Insert a sample refund request (optional, only if testing from admin side directly)
-- Note: Make sure to replace 'order_id_here' and 'user_id_here' with real values
INSERT INTO refund_requests (
  order_id,
  user_uid,
  payment_id,
  reason,
  additional_info,
  status
)
VALUES (
  -- Replace with actual order ID from above
  (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1),
  'replace-with-real-user-id',
  'pi_test_123456789',
  'Item not as described',
  'The phone color is different than what was shown on the website',
  'pending'
);
