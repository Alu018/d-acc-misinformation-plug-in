-- Create the flagged_content table
CREATE TABLE IF NOT EXISTS flagged_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  page_url TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'other')),
  flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('misinformation', 'harmful', 'misleading', 'other')),
  note TEXT,
  selector TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on page_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_flagged_content_page_url ON flagged_content(page_url);

-- Create index on timestamp
CREATE INDEX IF NOT EXISTS idx_flagged_content_timestamp ON flagged_content(timestamp);

-- Create index on flag_type
CREATE INDEX IF NOT EXISTS idx_flagged_content_flag_type ON flagged_content(flag_type);

-- Enable Row Level Security
ALTER TABLE flagged_content ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read flagged content
CREATE POLICY "Allow public read access" ON flagged_content
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert flagged content
CREATE POLICY "Allow public insert access" ON flagged_content
  FOR INSERT
  WITH CHECK (true);

-- Optional: Create policy to allow updates (if needed in the future)
CREATE POLICY "Allow public update access" ON flagged_content
  FOR UPDATE
  USING (true);

-- Optional: Create policy to allow deletes (if needed in the future)
CREATE POLICY "Allow public delete access" ON flagged_content
  FOR DELETE
  USING (true);
