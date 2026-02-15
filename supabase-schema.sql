-- Bahrain Premium Deals - Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Create the deals table
CREATE TABLE deals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  original_price NUMERIC,
  discounted_price NUMERIC,
  discount NUMERIC,
  store TEXT NOT NULL,
  category TEXT DEFAULT 'Groceries',
  location TEXT DEFAULT 'Bahrain',
  image TEXT,
  expiry_date TEXT,
  stock TEXT DEFAULT 'Available',
  is_yellow_sticker BOOLEAN DEFAULT FALSE,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- 3. Allow anyone (anon key) to read deals
CREATE POLICY "Public read access"
  ON deals
  FOR SELECT
  USING (true);

-- 4. Only service_role can insert/update/delete (used by GitHub Actions scraper)
CREATE POLICY "Service role insert"
  ON deals
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role update"
  ON deals
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role delete"
  ON deals
  FOR DELETE
  USING (auth.role() = 'service_role');

-- 5. Index for common queries
CREATE INDEX idx_deals_store ON deals (store);
CREATE INDEX idx_deals_category ON deals (category);
CREATE INDEX idx_deals_updated_at ON deals (updated_at);
