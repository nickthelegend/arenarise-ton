-- Migration to add missing tables and columns from schema.sql

-- Create beast_moves table (missing)
CREATE TABLE IF NOT EXISTS beast_moves (
  beast_id INTEGER NOT NULL REFERENCES beasts(id) ON DELETE CASCADE,
  move_id INTEGER NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (beast_id, slot),
  UNIQUE (beast_id, move_id)
);

-- Add missing columns to battles table
ALTER TABLE battles 
  ADD COLUMN IF NOT EXISTS battle_type TEXT DEFAULT 'pvp' CHECK (battle_type IN ('pvp', 'pve')),
  ADD COLUMN IF NOT EXISTS enemy_id INTEGER,
  ADD COLUMN IF NOT EXISTS reward_amount DECIMAL(18, 9) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_status TEXT CHECK (reward_status IN ('none', 'pending', 'completed', 'failed'));

-- Update foreign key constraints for battles table (add ON DELETE CASCADE/SET NULL)
ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_player1_id_fkey;
ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_player2_id_fkey;
ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_beast1_id_fkey;
ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_beast2_id_fkey;
ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_winner_id_fkey;
ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_current_turn_fkey;

ALTER TABLE battles 
  ADD CONSTRAINT battles_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT battles_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT battles_beast1_id_fkey FOREIGN KEY (beast1_id) REFERENCES beasts(id) ON DELETE CASCADE,
  ADD CONSTRAINT battles_beast2_id_fkey FOREIGN KEY (beast2_id) REFERENCES beasts(id) ON DELETE CASCADE,
  ADD CONSTRAINT battles_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT battles_current_turn_fkey FOREIGN KEY (current_turn) REFERENCES users(id);

-- Update foreign key constraints for battle_moves table (add ON DELETE CASCADE)
ALTER TABLE battle_moves DROP CONSTRAINT IF EXISTS battle_moves_battle_id_fkey;
ALTER TABLE battle_moves DROP CONSTRAINT IF EXISTS battle_moves_player_id_fkey;
ALTER TABLE battle_moves DROP CONSTRAINT IF EXISTS battle_moves_move_id_fkey;

ALTER TABLE battle_moves 
  ADD CONSTRAINT battle_moves_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE,
  ADD CONSTRAINT battle_moves_player_id_fkey FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT battle_moves_move_id_fkey FOREIGN KEY (move_id) REFERENCES moves(id) ON DELETE CASCADE;

-- Update foreign key constraints for bets table (add ON DELETE CASCADE)
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_battle_id_fkey;
ALTER TABLE bets DROP CONSTRAINT IF EXISTS bets_user_id_fkey;

ALTER TABLE bets 
  ADD CONSTRAINT bets_battle_id_fkey FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE,
  ADD CONSTRAINT bets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update swap_transactions table precision
ALTER TABLE swap_transactions 
  ALTER COLUMN ton_amount TYPE DECIMAL(18, 9),
  ALTER COLUMN rise_amount TYPE DECIMAL(18, 9);

-- Create coin_flips table (missing)
CREATE TABLE IF NOT EXISTS coin_flips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  bet_amount DECIMAL(18, 9) NOT NULL,
  choice TEXT NOT NULL CHECK (choice IN ('heads', 'tails')),
  result TEXT NOT NULL CHECK (result IN ('heads', 'tails')),
  won BOOLEAN NOT NULL,
  payout DECIMAL(18, 9) DEFAULT 0,
  transaction_hash TEXT NOT NULL,
  rise_transfer_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_player1 ON battles(player1_id);
CREATE INDEX IF NOT EXISTS idx_battles_player2 ON battles(player2_id);
CREATE INDEX IF NOT EXISTS idx_battles_type ON battles(battle_type);
CREATE INDEX IF NOT EXISTS idx_battles_player_history ON battles(player1_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battle_moves_battle ON battle_moves(battle_id);
CREATE INDEX IF NOT EXISTS idx_bets_battle ON bets(battle_id);
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_beasts_owner ON beasts(owner_address);
CREATE INDEX IF NOT EXISTS idx_beast_moves_beast ON beast_moves(beast_id);
CREATE INDEX IF NOT EXISTS idx_beast_moves_move ON beast_moves(move_id);
CREATE INDEX IF NOT EXISTS idx_swap_wallet ON swap_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_swap_created ON swap_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_flips_wallet ON coin_flips(wallet_address);
CREATE INDEX IF NOT EXISTS idx_coin_flips_created ON coin_flips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_flips_status ON coin_flips(status);

-- Insert predefined moves
INSERT INTO moves (name, damage, type, description) VALUES
  ('Fire Blast', 35, 'Fire', 'A powerful flame attack that burns the enemy'),
  ('Thunder Strike', 40, 'Electric', 'A lightning attack with high damage'),
  ('Ice Shard', 30, 'Ice', 'Sharp ice projectiles that pierce defense'),
  ('Earthquake', 45, 'Earth', 'Ground-shaking attack with massive power'),
  ('Wind Slash', 25, 'Wind', 'Quick slashing attack with high speed'),
  ('Poison Sting', 20, 'Poison', 'Inflicts damage with poison effect'),
  ('Shadow Claw', 38, 'Dark', 'A dark energy claw attack'),
  ('Healing Light', -30, 'Holy', 'Restores HP instead of dealing damage'),
  ('Basic Attack', 15, 'Normal', 'A standard physical attack'),
  ('Power Smash', 50, 'Normal', 'An extremely powerful physical strike')
ON CONFLICT DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for battles table
DROP TRIGGER IF EXISTS update_battles_updated_at ON battles;
CREATE TRIGGER update_battles_updated_at
    BEFORE UPDATE ON battles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for swap_transactions table
DROP TRIGGER IF EXISTS update_swap_transactions_updated_at ON swap_transactions;
CREATE TRIGGER update_swap_transactions_updated_at
    BEFORE UPDATE ON swap_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();