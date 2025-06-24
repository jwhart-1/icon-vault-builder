
-- Icons table
CREATE TABLE icons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  svg_content TEXT NOT NULL,
  category VARCHAR,
  description TEXT,
  keywords TEXT[],
  license VARCHAR,
  author VARCHAR,
  file_size INTEGER,
  dimensions JSONB, -- {width: number, height: number}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table for organized tagging
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your use case)
CREATE POLICY "Allow all operations on icons" ON icons FOR ALL USING (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_icons_name ON icons(name);
CREATE INDEX idx_icons_category ON icons(category);
CREATE INDEX idx_icons_keywords ON icons USING GIN(keywords);
CREATE INDEX idx_icons_created_at ON icons(created_at);
