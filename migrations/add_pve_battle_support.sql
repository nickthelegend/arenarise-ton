-- Migration: Add PVE Battle Support
-- Description: Adds columns and indexes to support PVE battles with rewards
-- Requirements: 1.2, 4.5, 5.1

-- Add battle_type column to distinguish between PVP and PVE battles
ALTER TABLE battles
  ADD COLUMN IF NOT EXISTS battle_type TEXT DEFAULT 'pvp' CHECK (battle_type IN ('pvp', 'pve'));

-- Add enemy_id column for PVE battles (references enemies table or can be NULL for PVP)
ALTER TABLE battles
  ADD COLUMN IF NOT EXISTS enemy_id INTEGER;

-- Add reward_amount column to store RISE token rewards
ALTER TABLE battles
  ADD COLUMN IF NOT EXISTS reward_amount DECIMAL(18, 9) DEFAULT 0;

-- Add reward_status column to track reward distribution state
ALTER TABLE battles
  ADD COLUMN IF NOT EXISTS reward_status TEXT CHECK (reward_status IN ('none', 'pending', 'completed', 'failed'));

-- Create index on battle_type for efficient filtering of PVE vs PVP battles
CREATE INDEX IF NOT EXISTS idx_battles_type ON battles(battle_type);

-- Create composite index for player battle history queries (ordered by most recent)
CREATE INDEX IF NOT EXISTS idx_battles_player_history ON battles(player1_id, created_at DESC);

-- Add comment to document the schema changes
COMMENT ON COLUMN battles.battle_type IS 'Type of battle: pvp (player vs player) or pve (player vs environment)';
COMMENT ON COLUMN battles.enemy_id IS 'ID of the enemy for PVE battles, NULL for PVP battles';
COMMENT ON COLUMN battles.reward_amount IS 'Amount of RISE tokens awarded for winning (200 for PVE wins, 0 otherwise)';
COMMENT ON COLUMN battles.reward_status IS 'Status of reward distribution: none, pending, completed, or failed';
