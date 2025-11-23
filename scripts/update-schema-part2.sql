-- Additional SQL Migration to fix page_url field length
-- Run this in Supabase SQL Editor

-- Increase VARCHAR length for page_url field in flagged_content (was 50, now 500)
ALTER TABLE public.flagged_content
ALTER COLUMN page_url TYPE VARCHAR(500);

-- Also increase flagged_by_url in flagged_links if needed
ALTER TABLE public.flagged_links
ALTER COLUMN flagged_by_url TYPE VARCHAR(500);

-- Increase url fields to support longer URLs
ALTER TABLE public.flagged_links
ALTER COLUMN url TYPE VARCHAR(500);

-- Verify the changes
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (table_name = 'flagged_links' OR table_name = 'flagged_content')
  AND column_name IN ('url', 'page_url', 'flagged_by_url', 'note')
ORDER BY table_name, column_name;