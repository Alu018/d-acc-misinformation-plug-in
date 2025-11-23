-- Add LLM verification fields to flagged_content table
ALTER TABLE flagged_content
ADD COLUMN IF NOT EXISTS llm_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS llm_agrees BOOLEAN,
ADD COLUMN IF NOT EXISTS llm_reasoning TEXT,
ADD COLUMN IF NOT EXISTS llm_sources TEXT,
ADD COLUMN IF NOT EXISTS user_confirmed_despite_llm BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS llm_error TEXT;

-- Add confidence column (0-100 integer value)
ALTER TABLE flagged_content
ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100);

-- Update flag_type constraints to include new types
ALTER TABLE flagged_content
DROP CONSTRAINT IF EXISTS flagged_content_flag_type_check;

ALTER TABLE flagged_content
ADD CONSTRAINT flagged_content_flag_type_check
CHECK (flag_type IN ('scam', 'misinformation', 'fake_profile', 'other'));

-- Add username column for tracking who flagged content
ALTER TABLE flagged_content
ADD COLUMN IF NOT EXISTS username VARCHAR(255);

-- Create index on llm_verified for faster filtering
CREATE INDEX IF NOT EXISTS idx_flagged_content_llm_verified ON flagged_content(llm_verified);
