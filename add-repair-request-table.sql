-- Create the device repair requests table
CREATE TABLE IF NOT EXISTS repair_requests (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    device_name TEXT NOT NULL,
    device_type TEXT,
    device_brand TEXT,
    device_color TEXT,
    device_model_year TEXT,
    device_serial_number TEXT,
    problem_description TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
    admin_notes TEXT,
    user_uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy
CREATE POLICY repair_requests_user_isolation ON repair_requests
    FOR ALL USING (user_uid = auth.uid());