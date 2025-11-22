-- Simple table for flagged content
CREATE TABLE IF NOT EXISTS flagged_content (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  page_url TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'other')),
  flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('scam', 'misinformation', 'other')),
  confidence VARCHAR(20) DEFAULT 'certain' CHECK (confidence IN ('certain', 'uncertain')),
  note TEXT,
  selector TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_page_url ON flagged_content(page_url);
CREATE INDEX idx_flag_type ON flagged_content(flag_type);
