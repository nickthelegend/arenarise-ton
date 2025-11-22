import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/bets/history
 * Retrieve coin flip betting history for a wallet
 * Query parameters:
 *   - wallet_address: TON wallet address of the user
 * Requirements: 5.2, 5.4
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet_address')

    // Validate required parameter
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'wallet_address is required' },
        { status: 400 }
      )
    }

    // Requirement 5.2: Query flips by wallet address
    // Requirement 5.4: Order by created_at descending
    const { data: flips, error: flipsError } = await supabase
      .from('coin_flips')
      .select('id, bet_amount, choice, result, won, payout, created_at')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })

    if (flipsError) {
      console.error('Error fetching coin flip history:', flipsError)
      return NextResponse.json(
        { error: 'Failed to fetch betting history' },
        { status: 500 }
      )
    }

    // Requirement 5.3: Return formatted history with all required fields
    return NextResponse.json({
      flips: flips || []
    }, { status: 200 })

  } catch (error: any) {
    console.error('Betting history error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
