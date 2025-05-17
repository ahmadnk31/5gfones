-- This script creates test users with different roles for testing purposes
-- Run this only in development environments, not in production

-- Function to create a test user with a specific role
CREATE OR REPLACE FUNCTION create_test_user(
  email_address TEXT,
  password TEXT,
  user_role TEXT,
  full_name TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create user in auth.users (requires admin privileges)
  INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
  VALUES (
    email_address,
    crypt(password, gen_salt('bf')),  -- Encrypt the password
    now()                             -- Mark the email as confirmed
  )
  RETURNING id INTO new_user_id;
  
  -- Create profile record with the specified role
  INSERT INTO profiles (
    id,
    role,
    full_name,
    phone,
    email_notifications,
    sms_notifications,
    preferred_language,
    language
  )
  VALUES (
    new_user_id,
    user_role,
    COALESCE(full_name, 'Test ' || INITCAP(user_role)),
    COALESCE(phone, '+1234567890'),
    TRUE,
    FALSE,
    'en',
    'en'
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create test users with different roles
-- Note: In a production environment, you should use more secure passwords
SELECT create_test_user('test.admin@example.com', 'Admin@123', 'admin', 'Test Admin', '+15551234567');
SELECT create_test_user('test.technician@example.com', 'Tech@123', 'technician', 'Test Technician', '+15557654321');
SELECT create_test_user('test.customer@example.com', 'Customer@123', 'customer', 'Test Customer', '+15559876543');

-- Drop the function after use to clean up
DROP FUNCTION IF EXISTS create_test_user;
