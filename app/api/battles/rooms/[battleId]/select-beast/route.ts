import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ battleId: string }> }
) {
  try {
    const { player_id, beast_id } = await request.json()
    const params = await context.params
    const battleId = params.battleId

    if (!player_id || !beast_id) {
      return NextResponse.json(
        { 
          error: 'Player and beast information are required. Please try again.',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      )
    }

    // Get battle details
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single()

    if (battleError) {
      console.error('Battle query error:', battleError)
      return NextResponse.json(
        { 
          error: 'Battle room not found. It may have been cancelled or expired.',
          code: 'BATTLE_NOT_FOUND',
          details: process.env.NODE_ENV === 'development' ? battleError.message : undefined
        },
        { status: 404 }
      )
    }

    if (!battle) {
      console.error('Battle not found for ID:', battleId)
      return NextResponse.json(
        { 
          error: 'Battle room not found. It may have been cancelled or expired.',
          code: 'BATTLE_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Validate player is part of the battle
    const isPlayer1 = battle.player1_id === player_id
    const isPlayer2 = battle.player2_id === player_id

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json(
        { 
          error: 'You are not part of this battle. Please join a room first.',
          code: 'PLAYER_NOT_IN_BATTLE'
        },
        { status: 403 }
      )
    }

    // Validate battle status
    if (battle.status === 'completed') {
      return NextResponse.json(
        { 
          error: 'This battle has already ended. You cannot change your beast selection.',
          code: 'BATTLE_COMPLETED'
        },
        { status: 400 }
      )
    }

    // Check if beast selection is already locked
    if (isPlayer1 && battle.beast1_locked) {
      return NextResponse.json(
        { 
          error: 'Your beast selection is already locked. You cannot change it now.',
          code: 'BEAST_ALREADY_LOCKED'
        },
        { status: 400 }
      )
    }

    if (isPlayer2 && battle.beast2_locked) {
      return NextResponse.json(
        { 
          error: 'Your beast selection is already locked. You cannot change it now.',
          code: 'BEAST_ALREADY_LOCKED'
        },
        { status: 400 }
      )
    }

    // Validate beast ownership
    const { data: beast, error: beastError } = await supabase
      .from('beasts')
      .select('owner_address')
      .eq('id', beast_id)
      .single()

    if (beastError || !beast) {
      return NextResponse.json(
        { 
          error: 'The selected beast could not be found. Please refresh and try again.',
          code: 'BEAST_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Get player's wallet address
    const { data: player, error: playerError } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', player_id)
      .single()

    if (playerError || !player) {
      return NextResponse.json(
        { 
          error: 'Player information not found. Please reconnect your wallet.',
          code: 'PLAYER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    if (beast.owner_address !== player.wallet_address) {
      return NextResponse.json(
        { 
          error: 'This beast does not belong to you. Please select one of your own beasts.',
          code: 'BEAST_NOT_OWNED'
        },
        { status: 403 }
      )
    }

    // Update battle with beast selection
    const updateData: any = {}

    if (isPlayer1) {
      updateData.beast1_id = beast_id
      updateData.beast1_locked = true
    } else {
      updateData.beast2_id = beast_id
      updateData.beast2_locked = true
    }

    // Check if both beasts are now selected
    const beast1Selected = isPlayer1 ? true : battle.beast1_locked
    const beast2Selected = isPlayer2 ? true : battle.beast2_locked

    if (beast1Selected && beast2Selected) {
      // Both beasts selected, start the battle
      updateData.status = 'in_progress'

      // Determine who goes first based on speed
      const { data: beast1Data } = await supabase
        .from('beasts')
        .select('speed')
        .eq('id', isPlayer1 ? beast_id : battle.beast1_id)
        .single()

      const { data: beast2Data } = await supabase
        .from('beasts')
        .select('speed')
        .eq('id', isPlayer2 ? beast_id : battle.beast2_id)
        .single()

      if (beast1Data && beast2Data) {
        // Faster beast goes first, if tied, random
        if (beast1Data.speed > beast2Data.speed) {
          updateData.current_turn = battle.player1_id
        } else if (beast2Data.speed > beast1Data.speed) {
          updateData.current_turn = battle.player2_id
        } else {
          updateData.current_turn = Math.random() > 0.5 ? battle.player1_id : battle.player2_id
        }
      }
    }

    // Update the battle
    const { data: updatedBattle, error: updateError } = await supabase
      .from('battles')
      .update(updateData)
      .eq('id', battleId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update battle:', updateError)
      return NextResponse.json(
        { 
          error: 'Failed to select beast. Please check your connection and try again.',
          code: 'UPDATE_FAILED'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      battle: updatedBattle
    })
  } catch (error: any) {
    console.error('Error selecting beast:', error)
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
