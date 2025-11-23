-- SQL Migration to update flag_type constraints and field lengths
-- Run this in Supabase SQL Editor before seeding the database

-- 1. Drop existing check constraints on flag_type (if they exist)
ALTER TABLE public.flagged_links DROP CONSTRAINT IF EXISTS flagged_links_flag_type_check;
ALTER TABLE public.flagged_content DROP CONSTRAINT IF EXISTS flagged_content_flag_type_check;

-- 2. Add new check constraints with updated flag types
ALTER TABLE public.flagged_links
ADD CONSTRAINT flagged_links_flag_type_check
CHECK (flag_type IN ('scam', 'misinformation', 'fake_profile', 'other'));

ALTER TABLE public.flagged_content
ADD CONSTRAINT flagged_content_flag_type_check
CHECK (flag_type IN ('scam', 'misinformation', 'fake_profile', 'other'));

-- 3. Update content_type constraints (if needed)
ALTER TABLE public.flagged_content DROP CONSTRAINT IF EXISTS flagged_content_content_type_check;
ALTER TABLE public.flagged_content
ADD CONSTRAINT flagged_content_content_type_check
CHECK (content_type IN ('text', 'image', 'video', 'other'));

-- 4. Increase VARCHAR length for note field (was 50, now 500)
ALTER TABLE public.flagged_links
ALTER COLUMN note TYPE VARCHAR(500);

ALTER TABLE public.flagged_content
ALTER COLUMN note TYPE VARCHAR(500);

-- 5. Verify the changes
SELECT
  ccu.table_name,
  ccu.column_name,
  cc.constraint_name,
  cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu
  ON cc.constraint_name = ccu.constraint_name
WHERE ccu.table_schema = 'public'
  AND (ccu.table_name = 'flagged_links' OR ccu.table_name = 'flagged_content')
ORDER BY ccu.table_name, ccu.column_name;