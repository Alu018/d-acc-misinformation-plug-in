-- Create supabase_admin user
CREATE USER supabase_admin WITH PASSWORD 'postgres' SUPERUSER;

-- Simple table for flagged content
CREATE TABLE IF NOT EXISTS flagged_content (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  page_url TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'other')),
  flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('scam', 'misinformation', 'fake_profile', 'other')),
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  note TEXT,
  selector TEXT,
  username TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_page_url ON flagged_content(page_url);
CREATE INDEX idx_flag_type ON flagged_content(flag_type);

-- Table for flagged links/URLs
CREATE TABLE IF NOT EXISTS flagged_links (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('scam', 'misinformation', 'fake_profile', 'other')),
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  note TEXT,
  flagged_by_url TEXT,
  username TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_flagged_url ON flagged_links(url);
CREATE INDEX idx_link_flag_type ON flagged_links(flag_type);
