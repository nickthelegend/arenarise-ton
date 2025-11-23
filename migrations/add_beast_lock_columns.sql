-- Migration: Add Beast Lock Columns for PVP Battle Flow Improvements
-- Description: Adds beast1_locked and beast2_locked columns to track beast selection status
-- Requirements: 9.1, 9.2
--
-- HOW TO APPLY THIS MIGRATION:
-- 1. Open your Supabase project SQL Editor
-- 2. Copy and paste this entire file
-- 3. Execute the SQL script
-- 4. Verify the columns exist: SELECT beast1_locked, beast2_locked FROM battles LIMIT 1;
-- 5. Verify the index exists: SELECT indexname FROM pg_indexes WHERE tablename = 'battles' AND indexname = 'idx_battles_status_type';

-- Add beast1_locked column to battles table
ALTER TABLE battles
  ADD COLUMN IF NOT EXISTS beast1_locked BOOLEAN DEFAULT FALSE;

-- Add beast2_locked column to battles table
ALTER TABLE battles
  ADD COLUMN IF NOT EXISTS beast2_locked BOOLEAN DEFAULT FALSE;

-- Create composite index on (status, battle_type) for performance
-- This index optimizes queries that filter by both status and battle_type
CREATE INDEX IF NOT EXISTS idx_battles_status_type ON battles(status, battle_type);

-- Add comments to document the schema changes
COMMENT ON COLUMN battles.beast1_locked IS 'Indicates if player1''s beast selection is locked and cannot be changed';
COMMENT ON COLUMN battles.beast2_locked IS 'Indicates if player2''s beast selection is locked and cannot be changed';

-- Update existing battles to set locked=true if beast is already selected
-- This ensures backward compatibility with existing battle records
UPDATE battles
SET beast1_locked = TRUE
WHERE beast1_id IS NOT NULL AND beast1_locked = FALSE;

UPDATE battles
SET beast2_locked = TRUE
WHERE beast2_id IS NOT NULL AND beast2_locked = FALSE;
