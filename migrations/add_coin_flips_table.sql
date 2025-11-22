-- Migration: Add coin_flips table for coin flip betting feature
-- This table stores all coin flip betting transactions

CREATE TABLE IF NOT EXISTS public.coin_flips (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    wallet_address text NOT NULL,
    user_id uuid,
    bet_amount numeric NOT NULL,
    choice text NOT NULL CHECK (choice IN ('heads', 'tails')),
    result text NOT NULL CHECK (result IN ('heads', 'tails')),
    won boolean NOT NULL,
    payout numeric NOT NULL DEFAULT 0,
    transaction_hash text,
    rise_transfer_hash text,
    status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT coin_flips_pkey PRIMARY KEY (id),
    CONSTRAINT coin_flips_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coin_flips_wallet_address ON public.coin_flips(wallet_address);
CREATE INDEX IF NOT EXISTS idx_coin_flips_user_id ON public.coin_flips(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_flips_created_at ON public.coin_flips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_flips_status ON public.coin_flips(status);

-- Add comment to table
COMMENT ON TABLE public.coin_flips IS 'Stores coin flip betting transactions with bet amounts in TON and payouts in RISE tokens';
