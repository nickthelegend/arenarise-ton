import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const BACKEND_URL = 'https://arenarise-backend.vercel.app'

export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/create/beast - Starting request')
  
  try {
    console.log('📥 Parsing request body...')
    const { wallet_address } = await request.json()
    console.log('✅ Request body parsed:', { wallet_address })

    if (!wallet_address) {
      console.log('❌ Missing wallet address')
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Call backend to mint NFT
    console.log('🔗 Calling backend mint API:', `${BACKEND_URL}/api/mint`)
    const mintResponse = await fetch(`${BACKEND_URL}/api/mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address })
    })
    console.log('📡 Mint response status:', mintResponse.status)

    const mintData = await mintResponse.json()
    console.log('📦 Mint data received:', JSON.stringify(mintData, null, 2))

    if (!mintData.success) {
      console.log('❌ Mint failed:', JSON.stringify(mintData, null, 2))
      return NextResponse.json(
        { error: 'Failed to mint beast' },
        { status: 500 }
      )
    }

    // Extract beast data
    console.log('🏗️ Extracting beast data from mint response...')
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
      hp: parseInt(mintData.traits?.find((t: any) => t.trait_type === 'HP')?.value || '100'),
      max_hp: parseInt(mintData.traits?.find((t: any) => t.trait_type === 'HP')?.value || '100'),
      attack: parseInt(mintData.traits?.find((t: any) => t.trait_type === 'Attack')?.value || '50'),
      defense: parseInt(mintData.traits?.find((t: any) => t.trait_type === 'Defense')?.value || '30'),
      speed: parseInt(mintData.traits?.find((t: any) => t.trait_type === 'Speed')?.value || '50'),
      level: 1
    }
    // Remove id field if it exists to avoid conflicts with auto-generated primary key
    delete (beastData as any).id
    console.log('📋 Beast data prepared:', beastData)

    // Insert beast into database
    console.log('💾 Inserting new beast into database...')
    const { data: beast, error: insertError } = await supabase
      .from('beasts')
      .insert(beastData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting beast:', insertError)
      return NextResponse.json(
        { error: 'Failed to save beast to database' },
        { status: 500 }
      )
    }
    console.log('✅ Beast inserted successfully:', beast)

    // Assign default moves to the beast
    console.log('🎯 Starting move assignment for beast:', beast.id)
    let assignedMoves = null
    try {
      // Get all available moves
      console.log('📚 Fetching available moves...')
      const { data: allMoves, error: movesError } = await supabase
        .from('moves')
        .select('id')

      if (movesError || !allMoves || allMoves.length < 4) {
        console.error('❌ Failed to fetch moves for assignment:', movesError)
        console.log('📊 Available moves count:', allMoves?.length || 0)
        // Continue without moves - this is not a critical failure
      } else {
        console.log('✅ Found moves:', allMoves.length)
        // Select 4 random moves
        console.log('🎲 Selecting 4 random moves...')
        const shuffled = [...allMoves].sort(() => Math.random() - 0.5)
        const selectedMoves = shuffled.slice(0, 4)
        console.log('🎯 Selected moves:', selectedMoves)

        // Insert beast_moves records
        const beastMovesRecords = selectedMoves.map((move, index) => ({
          beast_id: beast.id,
          move_id: move.id,
          slot: index + 1
        }))
        console.log('📝 Beast moves records to insert:', beastMovesRecords)

        const { error: insertMovesError } = await supabase
          .from('beast_moves')
          .insert(beastMovesRecords)

        if (insertMovesError) {
          console.error('❌ Failed to assign moves:', insertMovesError)
          // Continue without moves - this is not a critical failure
        } else {
          console.log('✅ Moves assigned successfully')
          // Fetch the full move details for the response
          console.log('📖 Fetching full move details...')
          const { data: movesData, error: fetchError } = await supabase
            .from('beast_moves')
            .select(`
              slot,
              move_id,
              moves (
                id,
                name,
                damage,
                type,
                description
              )
            `)
            .eq('beast_id', beast.id)
            .order('slot')

          if (!fetchError && movesData) {
            assignedMoves = movesData
            console.log('✅ Move details fetched:', assignedMoves)
          } else {
            console.error('❌ Failed to fetch move details:', fetchError)
          }
        }
      }
    } catch (moveError: any) {
      console.error('❌ Error during move assignment:', moveError)
      // Continue without moves - this is not a critical failure
    }

    console.log('🎉 Beast creation completed successfully!')
    return NextResponse.json({
      success: true,
      beast,
      mintData,
      moves: assignedMoves
    }, { status: 201 })

  } catch (error: any) {
    console.error('💥 Beast creation error:', error)
    console.error('📍 Error stack:', error.stack)
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