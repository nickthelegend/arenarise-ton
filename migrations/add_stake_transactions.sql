-- Migration: Add Stake Transactions Support
-- Description: Creates stake_transactions table and adds transaction tracking to battles
-- Requirements: 2.3

-- Create stake_transactions table to track blockchain transactions for battle stakes
CREATE TABLE IF NOT EXISTS public.stake_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL,
  player_id UUID NOT NULL,
  amount DECIMAL(20, 9) NOT NULL,
  transaction_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT stake_transactions_battle_fkey FOREIGN KEY (battle_id) REFERENCES public.battles(id) ON DELETE CASCADE,
  CONSTRAINT stake_transactions_player_fkey FOREIGN KEY (player_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_stake_transactions_battle ON public.stake_transactions(battle_id);
CREATE INDEX IF NOT EXISTS idx_stake_transactions_player ON public.stake_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_stake_transactions_hash ON public.stake_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_stake_transactions_status ON public.stake_transactions(status);
CREATE INDEX IF NOT EXISTS idx_stake_transactions_created_at ON public.stake_transactions(created_at DESC);

-- Add stake transaction columns to battles table to track player stakes
ALTER TABLE public.battles 
  ADD COLUMN IF NOT EXISTS player1_stake_tx TEXT,
  ADD COLUMN IF NOT EXISTS player2_stake_tx TEXT;

-- Add comments to document the schema
COMMENT ON TABLE public.stake_transactions IS 'Stores blockchain transaction records for battle stakes';
COMMENT ON COLUMN public.stake_transactions.battle_id IS 'Reference to the battle this stake is for';
COMMENT ON COLUMN public.stake_transactions.player_id IS 'Reference to the player who made the stake';
COMMENT ON COLUMN public.stake_transactions.amount IS 'Amount of RISE tokens staked (with 9 decimal places)';
COMMENT ON COLUMN public.stake_transactions.transaction_hash IS 'Blockchain transaction hash for verification';
COMMENT ON COLUMN public.stake_transactions.status IS 'Transaction status: pending, completed, or failed';
COMMENT ON COLUMN public.battles.player1_stake_tx IS 'Transaction hash for player 1 stake';
COMMENT ON COLUMN public.battles.player2_stake_tx IS 'Transaction hash for player 2 stake';
