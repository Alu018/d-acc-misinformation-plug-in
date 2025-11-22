-- Create the flagged_links table
CREATE TABLE IF NOT EXISTS flagged_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('scam', 'misinformation', 'other')),
  confidence VARCHAR(20) DEFAULT 'certain' CHECK (confidence IN ('certain', 'uncertain')),
  note TEXT,
  flagged_by_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on url for faster lookups
CREATE INDEX IF NOT EXISTS idx_flagged_links_url ON flagged_links(url);

-- Create index on flag_type
CREATE INDEX IF NOT EXISTS idx_flagged_links_flag_type ON flagged_links(flag_type);

-- Create index on created_at
CREATE INDEX IF NOT EXISTS idx_flagged_links_created_at ON flagged_links(created_at);

-- Enable Row Level Security
ALTER TABLE flagged_links ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read flagged links
CREATE POLICY "Allow public read access" ON flagged_links
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert flagged links
CREATE POLICY "Allow public insert access" ON flagged_links
  FOR INSERT
  WITH CHECK (true);

-- Optional: Create policy to allow updates (if needed in the future)
CREATE POLICY "Allow public update access" ON flagged_links
  FOR UPDATE
  USING (true);

-- Optional: Create policy to allow deletes (if needed in the future)
CREATE POLICY "Allow public delete access" ON flagged_links
  FOR DELETE
  USING (true);
