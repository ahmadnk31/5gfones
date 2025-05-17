-- This SQL adds missing fields to the profiles table and ensures consistency with the code
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS language VARCHAR(10),
ALTER COLUMN preferred_language DROP DEFAULT;

-- If you want to rename preferred_language to language for consistency:
-- (Uncomment if you prefer this approach)
-- ALTER TABLE profiles RENAME COLUMN preferred_language TO language;

-- Update permissions
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Make sure RLS policies are in place
DROP POLICY IF EXISTS profiles_users_read ON profiles;
DROP POLICY IF EXISTS profiles_users_update ON profiles;

-- Users can read their own profile
CREATE POLICY profiles_users_read 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_users_update 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Admin users can read and modify all profiles
DROP POLICY IF EXISTS profiles_admin_access ON profiles;
CREATE POLICY profiles_admin_access 
ON profiles 
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Make sure the role field has the correct constraints
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check,
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer', 'technician', 'admin'));
