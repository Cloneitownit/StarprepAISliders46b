-- StarPrepAI Supabase Setup
-- Run this in Supabase → SQL Editor → New Query → Run

-- Voice Models table
-- Stores RVC training status for each user
-- Webhook updates this when Replicate finishes training

CREATE TABLE IF NOT EXISTS voice_models (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       TEXT NOT NULL,
  prediction_id TEXT,
  status        TEXT DEFAULT 'training',  -- 'training', 'ready', 'failed'
  model_url     TEXT,                     -- trained model URL from Replicate
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS voice_models_user_id_idx ON voice_models(user_id);

-- Allow public read/write (no auth for now — add auth later)
ALTER TABLE voice_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON voice_models
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voice_models_updated_at
  BEFORE UPDATE ON voice_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
