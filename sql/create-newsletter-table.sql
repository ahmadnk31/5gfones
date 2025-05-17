-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  token_expires_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  locale VARCHAR(5) DEFAULT 'en',
  unsubscribed BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- Create index on verification token
CREATE INDEX IF NOT EXISTS idx_newsletter_verification_token ON newsletter_subscribers(verification_token);

-- Set up RLS policies for newsletter_subscribers table
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to create subscribers (for subscription)
CREATE POLICY insert_newsletter_subscribers ON newsletter_subscribers
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

-- Only allow admins to view, update, and delete subscribers
CREATE POLICY admin_newsletter_subscribers ON newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
  );

-- Allow self-service unsubscribe with token
CREATE POLICY unsubscribe_newsletter_subscribers ON newsletter_subscribers
  FOR UPDATE
  TO anon
  USING (verification_token IS NOT NULL)
  WITH CHECK (verification_token IS NOT NULL AND unsubscribed = true);
