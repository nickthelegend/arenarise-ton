import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  validateBetAmount,
  generateCoinFlipResult,
  calculatePayout,
  checkWinCondition,
  type CoinSide
} from '@/lib/coin-flip-utils'

/**
 * POST /api/bets/flip
 * Execute a coin flip bet
 * Requirements: 3.2, 4.1, 4.5, 5.1
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet_address, bet_amount, choice, transaction_hash } = body

    // Validate request parameters
    if (!wallet_address || typeof wallet_address !== 'string') {
      return NextResponse.json(
        { error: 'wallet_address is required and must be a string' },
        { status: 400 }
      )
    }

    if (!bet_amount || typeof bet_amount !== 'number') {
      return NextResponse.json(
        { error: 'bet_amount is required and must be a number' },
        { status: 400 }
      )
    }

    if (!choice || (choice !== 'heads' && choice !== 'tails')) {
      return NextResponse.json(
        { error: 'choice is required and must be either "heads" or "tails"' },
        { status: 400 }
      )
    }

    if (!transaction_hash || typeof transaction_hash !== 'string') {
      return NextResponse.json(
        { error: 'transaction_hash is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate bet amount (Requirements 2.3, 2.4)
    // Note: In a real implementation, we would fetch the actual wallet balance
    // For now, we'll use a placeholder balance check
    const walletBalance = 1000 // Placeholder - should be fetched from TON blockchain
    const validation = validateBetAmount(bet_amount, walletBalance)
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Verify TON transaction
    // Note: In production, this should verify the transaction on the TON blockchain
    // For now, we'll accept any non-empty transaction hash
    if (transaction_hash.length === 0) {
      return NextResponse.json(
        { error: 'Invalid transaction hash' },
        { status: 400 }
      )
    }

    // Generate random result (Requirements 6.1, 6.2)
    const result = generateCoinFlipResult()

    // Check win condition (Requirements 3.5, 4.4)
    const won = checkWinCondition(choice as CoinSide, result)

    // Calculate payout (Requirement 4.1)
    const payout = calculatePayout(bet_amount, won)

    // Look up user_id from wallet_address (optional)
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', wallet_address)
      .single()

    // Store flip record in database (Requirements 5.1, 6.3)
    const { data: flip, error: flipError } = await supabase
      .from('coin_flips')
      .insert({
        wallet_address,
        user_id: user?.id || null,
        bet_amount,
        choice,
        result,
        won,
        payout,
        transaction_hash,
        status: 'completed'
      })
      .select()
      .single()

    if (flipError) {
      console.error('Database error:', flipError)
      return NextResponse.json(
        { error: 'Failed to record flip in database' },
        { status: 500 }
      )
    }

    // TODO: Transfer RISE tokens to winner (Requirement 4.2)
    // This will be implemented in task 8
    // For now, we just log the transfer details
    if (won && payout > 0) {
      console.log(`RISE transfer needed: ${payout} RISE to ${wallet_address}`)
    }

    // Return result to client (Requirement 4.5)
    return NextResponse.json({
      success: true,
      result,
      won,
      payout: won ? payout : undefined,
      flip_id: flip.id
    }, { status: 200 })

  } catch (error: any) {
    console.error('Coin flip error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
