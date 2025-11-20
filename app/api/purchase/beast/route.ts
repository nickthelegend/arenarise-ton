import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const BACKEND_URL = 'https://arenarise-backend.vercel.app'
const PAYMENT_ADDRESS = '0QD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CyqUX'

export async function POST(request: NextRequest) {
  try {
    const { beast_id, wallet_address, nft_address, payment_verified } = await request.json()

    if (!beast_id || !wallet_address || !nft_address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify payment was made (in production, verify on-chain)
    if (!payment_verified) {
      return NextResponse.json(
        { error: 'Payment not verified' },
        { status: 400 }
      )
    }

    // Transfer NFT to buyer using backend
    const transferResponse = await fetch(`${BACKEND_URL}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nftAddress: nft_address,
        toAddress: wallet_address
      })
    })

    const transferData = await transferResponse.json()

    if (!transferData.success) {
      return NextResponse.json(
        { error: 'Failed to transfer NFT' },
        { status: 500 }
      )
    }

    // Update beast ownership
    const { error: updateError } = await supabase
      .from('beasts')
      .update({ 
        owner_address: wallet_address,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', beast_id)

    if (updateError) {
      console.error('Error updating beast ownership:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Beast purchased and transferred successfully',
      transferData
    })

  } catch (error: any) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}