-- Add module access fields to profiles
-- These control which modules a user can access based on subscription

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' 
  CHECK (subscription_status IN ('free', 'active', 'cancelled', 'past_due'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT DEFAULT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS modules_enabled TEXT[] DEFAULT '{}';

-- Index for quick Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

COMMENT ON COLUMN profiles.subscription_status IS 'free | active | cancelled | past_due';
COMMENT ON COLUMN profiles.subscription_tier IS 'The subscription tier name (e.g., campaign, full)';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN profiles.modules_enabled IS 'Array of enabled module IDs';
