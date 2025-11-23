-- Add ai_verification_status column to flagged_content table
ALTER TABLE flagged_content
ADD COLUMN IF NOT EXISTS ai_verification_status VARCHAR(50) CHECK (ai_verification_status IN ('ai_agreed', 'ai_disagreed', 'verification_disabled'));
