// Coin Flip Betting Game types

interface CoinFlip {
  id: string
  wallet_address: string
  user_id: string | null
  bet_amount: number
  choice: 'heads' | 'tails'
  result: 'heads' | 'tails'
  won: boolean
  payout: number
  transaction_hash: string
  rise_transfer_hash: string | null
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

type CoinFlipChoice = 'heads' | 'tails'
type CoinFlipStatus = 'pending' | 'completed' | 'failed'
