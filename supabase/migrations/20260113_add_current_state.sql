-- Add current_state field to profiles table
-- This captures where the user is NOW relative to their goal

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_state TEXT;

COMMENT ON COLUMN profiles.current_state IS 'User''s current state relative to their 90-day goal - what is done, what is next, what is unclear';
