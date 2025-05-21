-- Create a refund_requests table to track customer refund requests
CREATE TABLE IF NOT EXISTS refund_requests (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) NOT NULL,
  user_uid UUID REFERENCES auth.users(id),
  payment_id TEXT,
  reason TEXT NOT NULL,
  additional_info TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS refund_requests_order_id_idx ON refund_requests(order_id);
CREATE INDEX IF NOT EXISTS refund_requests_user_uid_idx ON refund_requests(user_uid);
CREATE INDEX IF NOT EXISTS refund_requests_status_idx ON refund_requests(status);

-- Add refund request fields to the orders table if they don't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS refund_status TEXT CHECK (refund_status IN ('pending', 'approved', 'rejected'));

-- Enable RLS for the refund_requests table
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view and create their own refund requests
CREATE POLICY users_manage_own_refund_requests ON refund_requests 
FOR ALL TO authenticated 
USING (user_uid = auth.uid());

-- Create policy to allow users to view refund requests for their orders
CREATE POLICY users_view_order_refund_requests ON refund_requests 
FOR SELECT TO authenticated 
USING (order_id IN (SELECT id FROM orders WHERE user_uid = auth.uid()));

-- Create policy to allow admins to view and manage all refund requests
CREATE POLICY admins_manage_all_refund_requests ON refund_requests 
FOR ALL TO authenticated 
USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));
