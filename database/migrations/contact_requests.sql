-- Create contact_requests table for managing contact form submissions and email verification
CREATE TABLE IF NOT EXISTS contact_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  token_expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending',
  response_subject VARCHAR(255),
  response_message TEXT,
  response_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_verified ON contact_requests(verified);
CREATE INDEX IF NOT EXISTS idx_contact_requests_verification_token ON contact_requests(verification_token);
