-- Add unique constraint to request_id in beasts table to prevent duplicate beast creation
-- This ensures that each mint request can only create one beast

-- First, remove any duplicate beasts that might exist (keeping the oldest one)
-- This is a safety measure in case duplicates already exist
DELETE FROM beasts a
USING beasts b
WHERE a.id > b.id 
  AND a.request_id = b.request_id 
  AND a.request_id IS NOT NULL;

-- Add unique constraint to request_id column
ALTER TABLE beasts 
  ADD CONSTRAINT beasts_request_id_unique UNIQUE (request_id);

-- Create an index on request_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_beasts_request_id ON beasts(request_id);
