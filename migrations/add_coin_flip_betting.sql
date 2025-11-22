-- Migration: Add Coin Flip Betting Support
-- Description: Creates coin_flips table for tracking betting game transactions
-- Requirements: 5.1, 6.3

-- Create coin_flips table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coin_flips_wallet ON coin_flips(wallet_address);
CREATE INDEX IF NOT EXISTS idx_coin_flips_created ON coin_flips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_flips_status ON coin_flips(status);

-- Add comments to document the schema
COMMENT ON TABLE coin_flips IS 'Stores coin flip betting game transactions';
COMMENT ON COLUMN coin_flips.wallet_address IS 'TON wallet address of the user placing the bet';
COMMENT ON COLUMN coin_flips.user_id IS 'Reference to users table, NULL if user not registered';
COMMENT ON COLUMN coin_flips.bet_amount IS 'Amount of TON tokens wagered';
COMMENT ON COLUMN coin_flips.choice IS 'User selection: heads or tails';
COMMENT ON COLUMN coin_flips.result IS 'Actual coin flip result: heads or tails';
COMMENT ON COLUMN coin_flips.won IS 'Whether the user won the bet';
COMMENT ON COLUMN coin_flips.payout IS 'Amount of RISE tokens awarded (2x bet_amount for wins, 0 for losses)';
COMMENT ON COLUMN coin_flips.transaction_hash IS 'TON blockchain transaction hash for the bet';
COMMENT ON COLUMN coin_flips.rise_transfer_hash IS 'Transaction hash for RISE token transfer (if applicable)';
COMMENT ON COLUMN coin_flips.status IS 'Status of the flip: pending, completed, or failed';
COMMENT ON COLUMN coin_flips.created_at IS 'Timestamp when the flip was executed';
