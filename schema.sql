-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add combat stats to existing beasts table
-- Run this to alter your existing beasts table
ALTER TABLE beasts 
  ADD COLUMN IF NOT EXISTS hp INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_hp INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS attack INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS defense INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS speed INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Moves table (predefined moves)
CREATE TABLE IF NOT EXISTS moves (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  damage INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Beast moves junction table (links beasts to their assigned moves)
CREATE TABLE IF NOT EXISTS beast_moves (
  beast_id INTEGER NOT NULL REFERENCES beasts(id) ON DELETE CASCADE,
  move_id INTEGER NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot >= 1 AND slot <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (beast_id, slot),
  UNIQUE (beast_id, move_id)
);

-- Battles table
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  beast1_id INTEGER REFERENCES beasts(id) ON DELETE CASCADE,
  beast2_id INTEGER REFERENCES beasts(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'waiting',
  current_turn UUID REFERENCES users(id),
  bet_amount DECIMAL(10, 2) DEFAULT 0,
  battle_type TEXT DEFAULT 'pvp' CHECK (battle_type IN ('pvp', 'pve')),
  enemy_id INTEGER,
  reward_amount DECIMAL(18, 9) DEFAULT 0,
  reward_status TEXT CHECK (reward_status IN ('none', 'pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battle moves table (real-time moves)
CREATE TABLE IF NOT EXISTS battle_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  move_id INTEGER REFERENCES moves(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  damage_dealt INTEGER NOT NULL,
  target_hp_remaining INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID REFERENCES battles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  won BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swap transactions table
CREATE TABLE IF NOT EXISTS swap_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  ton_amount DECIMAL(18, 9) NOT NULL,
  rise_amount DECIMAL(18, 9) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coin flips table
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

-- Indexes for performance
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

-- Insert 2 mock users
INSERT INTO users (id, wallet_address) VALUES
  ('11111111-1111-1111-1111-111111111111', '0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
  ('22222222-2222-2222-2222-222222222222', '0:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
ON CONFLICT (wallet_address) DO NOTHING;

-- Insert 2 mock beasts
INSERT INTO beasts (
  id, request_id, name, description, image_ipfs_uri, owner_address, 
  status, hp, max_hp, attack, defense, speed, level, traits
) VALUES
  (
    1, 'mock-beast-1', 'Fire Drake', 'A powerful dragon with flames', 
    'ipfs://mock1', '0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    'completed', 180, 200, 45, 30, 65, 15,
    '{"type": "Fire", "rarity": "Epic"}'
  ),
  (
    2, 'mock-beast-2', 'Thunder Wolf', 'An electric wolf beast',
    'ipfs://mock2', '0:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    'completed', 150, 150, 38, 25, 80, 12,
    '{"type": "Electric", "rarity": "Rare"}'
  )
ON CONFLICT (id) DO NOTHING;

-- Enable real-time for battle_moves table
ALTER PUBLICATION supabase_realtime ADD TABLE battle_moves;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for battles table
CREATE TRIGGER update_battles_updated_at
    BEFORE UPDATE ON battles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for swap_transactions table
CREATE TRIGGER update_swap_transactions_updated_at
    BEFORE UPDATE ON swap_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();