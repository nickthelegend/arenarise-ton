import { NextRequest, NextResponse } from 'next/server'
import { fetchRiseJettonWallet } from '@/lib/jetton-utils'

/**
 * GET /api/jetton-wallet
 * Fetch the RISE jetton wallet address for a given owner address
 * Query params:
 *   - owner_address: The TON wallet address to get jetton wallet for
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerAddress = searchParams.get('owner_address')

    if (!ownerAddress) {
      return NextResponse.json(
        { error: 'owner_address parameter is required' },
        { status: 400 }
      )
    }

    // Fetch jetton wallet address
    const jettonWalletAddress = await fetchRiseJettonWallet(ownerAddress)

    if (!jettonWalletAddress) {
      return NextResponse.json(
        { error: 'Jetton wallet not found for this address' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      owner_address: ownerAddress,
      jetton_wallet_address: jettonWalletAddress
    })
  } catch (error: any) {
    console.error('Error in jetton-wallet API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
