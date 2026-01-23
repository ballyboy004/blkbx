-- Add strategic input fields to interpretations table
-- Run this in Supabase SQL Editor

ALTER TABLE interpretations 
ADD COLUMN strategic_input_used TEXT,
ADD COLUMN strategic_question_used TEXT;

-- Optional: Add comment for documentation
COMMENT ON COLUMN interpretations.strategic_input_used IS 'The user''s strategic input text that was used to generate the current task';
COMMENT ON COLUMN interpretations.strategic_question_used IS 'The strategic question that prompted the user input';
