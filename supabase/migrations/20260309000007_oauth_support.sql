-- Add OAuth support to customers table
-- Migration: 20260309000007_oauth_support.sql

-- Add OAuth provider columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Make password optional for OAuth users
ALTER TABLE customers 
ALTER COLUMN password_hash DROP NOT NULL;

-- Create unique index for OAuth provider + provider ID combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_oauth 
ON customers(oauth_provider, oauth_provider_id) 
WHERE oauth_provider IS NOT NULL;

-- Add index on email_verified for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_email_verified 
ON customers(email_verified);

-- Update existing customers to have email_verified = true (they registered with password)
UPDATE customers 
SET email_verified = true 
WHERE oauth_provider IS NULL AND password_hash IS NOT NULL;

-- Comments
COMMENT ON COLUMN customers.oauth_provider IS 'OAuth provider name (google, facebook, etc.)';
COMMENT ON COLUMN customers.oauth_provider_id IS 'Unique identifier from OAuth provider';
COMMENT ON COLUMN customers.avatar_url IS 'Profile picture URL from OAuth provider';
COMMENT ON COLUMN customers.email_verified IS 'Whether email has been verified';
