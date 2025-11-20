import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { BACKEND_URL, PAYMENT_ADDRESS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const { beast_id, wallet_address, nft_address, payment_verified } = await request.json()

    // Validate required fields
    if (!beast_id || !wallet_address || !nft_address) {
      return NextResponse.json(
        { error: 'Missing required fields: beast_id, wallet_address, and nft_address are required' },
        { status: 400 }
      )
    }

    // Verify payment was made (in production, verify on-chain)
    if (!payment_verified) {
      return NextResponse.json(
        { error: 'Payment not verified. Please complete the payment transaction first.' },
        { status: 400 }
      )
    }

    // Verify beast exists and is available for purchase
    const { data: beast, error: beastError } = await supabase
      .from('beasts')
      .select('id, nft_address, owner_address, status')
      .eq('id', beast_id)
      .single()

    if (beastError || !beast) {
      return NextResponse.json(
        { error: 'Beast not found' },
        { status: 404 }
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

    if (!transferResponse.ok) {
      const errorText = await transferResponse.text()
      console.error('Backend transfer failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to transfer NFT. Please try again later.' },
        { status: 500 }
      )
    }

    const transferData = await transferResponse.json()

    // Check if transfer was successful
    if (!transferData.success) {
      console.error('Transfer unsuccessful:', transferData)
      return NextResponse.json(
        { error: transferData.error || 'Failed to transfer NFT' },
        { status: 500 }
      )
    }

    // Update beast ownership in database
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
      return NextResponse.json(
        { error: 'NFT transferred but failed to update database. Please contact support.' },
        { status: 500 }
      )
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