import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const BACKEND_URL = 'https://arenarise-backend.vercel.app'

export async function POST(request: NextRequest) {
  try {
    const { wallet_address } = await request.json()

    if (!wallet_address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Call backend to mint NFT
    const mintResponse = await fetch(`${BACKEND_URL}/api/mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    const mintData = await mintResponse.json()

    if (!mintData.success) {
      return NextResponse.json(
        { error: 'Failed to mint beast' },
        { status: 500 }
      )
    }

    // Extract beast data
    const beastData = {
      request_id: mintData.requestId,
      name: mintData.name,
      description: mintData.description,
      image_ipfs_uri: mintData.imageIpfsUri,
      nft_address: mintData.mintResponse?.response?.address || null,
      owner_address: wallet_address,
      status: 'pending',
      traits: mintData.traits,
      // Combat stats from traits
      hp: parseInt(mintData.traits.find((t: any) => t.trait_type === 'HP')?.value || '100'),
      max_hp: parseInt(mintData.traits.find((t: any) => t.trait_type === 'HP')?.value || '100'),
      attack: parseInt(mintData.traits.find((t: any) => t.trait_type === 'Attack')?.value || '50'),
      defense: parseInt(mintData.traits.find((t: any) => t.trait_type === 'Defense')?.value || '30'),
      speed: parseInt(mintData.traits.find((t: any) => t.trait_type === 'Speed')?.value || '50'),
      level: 1
    }

    // Insert beast into database
    const { data: beast, error: insertError } = await supabase
      .from('beasts')
      .insert(beastData)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting beast:', insertError)
      return NextResponse.json(
        { error: 'Failed to save beast to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      beast,
      mintData
    }, { status: 201 })

  } catch (error: any) {
    console.error('Beast creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get mint status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const statusResponse = await fetch(`${BACKEND_URL}/api/mint/status/${requestId}`)
    const statusData = await statusResponse.json()

    return NextResponse.json(statusData)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}