-- Migration: Add Room Code Support for Real-time PVP Battles
-- Description: Adds room_code column, indexes, and cleanup function for battle rooms
-- Requirements: 1.1, 1.2
--
-- HOW TO APPLY THIS MIGRATION:
-- 1. Open your Supabase project SQL Editor
-- 2. Copy and paste this entire file
-- 3. Execute the SQL script
-- 4. Verify the room_code column exists: SELECT room_code FROM battles LIMIT 1;
-- 5. Test the cleanup function: SELECT cleanup_stale_battle_rooms();

-- Add room_code column to battles table with unique constraint
ALTER TABLE battles
  ADD COLUMN IF NOT EXISTS room_code VARCHAR(6) UNIQUE;

-- Create index on room_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_battles_room_code ON battles(room_code);

-- Add comment to document the schema change
COMMENT ON COLUMN battles.room_code IS 'Unique 6-digit alphanumeric code for joining battle rooms (only set for waiting/in_progress battles)';

-- Function to cleanup stale battle rooms
-- Removes rooms older than 10 minutes with status='waiting'
CREATE OR REPLACE FUNCTION cleanup_stale_battle_rooms()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM battles 
  WHERE status = 'waiting' 
    AND created_at < NOW() - INTERVAL '10 minutes'
    AND room_code IS NOT NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the cleanup function
COMMENT ON FUNCTION cleanup_stale_battle_rooms() IS 'Deletes battle rooms that have been waiting for more than 10 minutes. Returns the number of deleted rooms.';
