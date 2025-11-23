import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface User {
  id: string
  wallet_address: string
  created_at: string
}

export interface Beast {
  id: number
  request_id: string
  name: string
  description: string | null
  image_ipfs_uri: string
  nft_address: string | null
  owner_address: string
  status: string
  nft_index: number | null
  getgems_url: string | null
  traits: any
  created_at: string
  updated_at: string
  // Combat stats
  hp?: number
  max_hp?: number
  attack?: number
  defense?: number
  speed?: number
  level?: number
}

export interface Move {
  id: number
  name: string
  damage: number
  type: string
  description: string
  created_at: string
}

export interface Battle {
  id: string
  player1_id: string
  player2_id: string | null
  beast1_id: number
  beast2_id: number | null
  winner_id: string | null
  status: 'waiting' | 'in_progress' | 'completed'
  current_turn: string | null
  bet_amount: number
  room_code?: string | null
  battle_type?: 'pvp' | 'pve'
  enemy_id?: number | null
  reward_amount?: number
  reward_status?: 'none' | 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export interface BattleMove {
  id: string
  battle_id: string
  player_id: string
  move_id: number
  turn_number: number
  damage_dealt: number
  target_hp_remaining: number
  created_at: string
}

export interface Bet {
  id: string
  battle_id: string
  user_id: string
  amount: number
  won: boolean | null
  created_at: string
}

export interface SwapTransaction {
  id: string
  wallet_address: string
  ton_amount: string
  rise_amount: string
  status: 'pending' | 'completed' | 'failed'
  transaction_hash?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface StakeTransaction {
  id: string
  battle_id: string
  player_id: string
  amount: number
  transaction_hash: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}