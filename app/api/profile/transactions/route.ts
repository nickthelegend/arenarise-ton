import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/profile/transactions
 * Retrieve transaction history for a user's wallet
 * Query parameters:
 *   - wallet_address: TON wallet address of the user
 * Requirements: 4.1, 7.1, 7.2
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')

    // Requirement 7.1: Validate wallet address parameter
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'wallet_address is required' },
        { status: 400 }
      )
    }

    // Requirement 4.1, 7.2: Query swap_transactions table for the authenticated user
    const { data: swapTransactions, error: swapError } = await supabase
      .from('swap_transactions')
      .select('id, ton_amount, rise_amount, status, created_at')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })

    if (swapError) {
      console.error('Error fetching swap transactions:', swapError)
      return NextResponse.json(
        { error: 'Failed to fetch transaction history' },
        { status: 500 }
      )
    }

    // Requirement 4.1, 7.2: Query coin_flips table for rewards
    const { data: coinFlips, error: flipsError } = await supabase
      .from('coin_flips')
      .select('id, won, payout, created_at, status')
      .eq('wallet_address', walletAddress)
      .eq('won', true) // Only include winning flips as rewards
      .order('created_at', { ascending: false })

    if (flipsError) {
      console.error('Error fetching coin flip rewards:', flipsError)
      return NextResponse.json(
        { error: 'Failed to fetch transaction history' },
        { status: 500 }
      )
    }

    // Requirement 4.1: Combine and format results
    const formattedSwaps = (swapTransactions || []).map(swap => ({
      id: swap.id,
      type: 'swap' as const,
      rise_amount: Number(swap.rise_amount),
      ton_amount: Number(swap.ton_amount),
      timestamp: swap.created_at,
      status: swap.status
    }))

    const formattedRewards = (coinFlips || []).map(flip => ({
      id: flip.id,
      type: 'reward' as const,
      rise_amount: Number(flip.payout),
      timestamp: flip.created_at,
      status: flip.status
    }))

    // Requirement 4.1: Combine all transactions
    const allTransactions = [...formattedSwaps, ...formattedRewards]

    // Requirement 4.4: Sort by timestamp descending (most recent first)
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return dateB - dateA
    })

    // Return formatted transaction list
    return NextResponse.json({
      transactions: allTransactions
    }, { status: 200 })

  } catch (error: any) {
    console.error('Transaction history error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
