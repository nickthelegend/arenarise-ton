import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isValidRoomCodeFormat } from '@/lib/room-code-utils'

/**
 * POST /api/battles/rooms/join
 * Join a battle room by room code
 * Handles concurrent join attempts with database-level locking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const { room_code, player_id, beast_id } = body

    // Validate required fields
    if (!room_code || !player_id || !beast_id) {
      return NextResponse.json(
        { error: 'Missing required fields: room_code, player_id, and beast_id are required' },
        { status: 400 }
      )
    }

    // Validate room code format (client-side validation)
    if (!isValidRoomCodeFormat(room_code)) {
      return NextResponse.json(
        { error: 'Invalid room code format. Code must be 6 alphanumeric characters.' },
        { status: 400 }
      )
    }

    // Verify the beast exists
    const { data: beast, error: beastError } = await supabase
      .from('beasts')
      .select('*')
      .eq('id', beast_id)
      .single()

    if (beastError || !beast) {
      console.error('Beast not found:', beastError)
      return NextResponse.json(
        { error: 'Beast not found' },
        { status: 404 }
      )
    }

    // Find the battle room by code
    const { data: battle, error: findError } = await supabase
      .from('battles')
      .select('*')
      .eq('room_code', room_code)
      .single()

    if (findError || !battle) {
      console.error('Room not found:', findError)
      return NextResponse.json(
        { error: 'Room not found. Please check the code and try again.' },
        { status: 404 }
      )
    }

    // Check if the room is still waiting
    if (battle.status !== 'waiting') {
      return NextResponse.json(
        { error: 'This room has already started or is no longer available.' },
        { status: 400 }
      )
    }

    // Check if the player is trying to join their own room
    if (battle.player1_id === player_id) {
      return NextResponse.json(
        { error: 'You cannot join your own battle room.' },
        { status: 400 }
      )
    }

    // Determine first turn based on beast speed
    const { data: beast1, error: beast1Error } = await supabase
      .from('beasts')
      .select('speed')
      .eq('id', battle.beast1_id)
      .single()

    if (beast1Error) {
      console.error('Failed to load beast1 information:', beast1Error)
      return NextResponse.json(
        { error: 'Failed to load beast information' },
        { status: 500 }
      )
    }

    const beast1Speed = beast1.speed || 0
    const beast2Speed = beast.speed || 0
    
    // Higher speed goes first, player1 goes first on tie (Requirement 6.2)
    const firstTurn = beast2Speed > beast1Speed ? player_id : battle.player1_id

    // Update the battle with player2 and change status to in_progress
    // Use database-level locking by checking status in WHERE clause
    // This prevents concurrent join attempts (Requirement: concurrent join handling)
    const { data: updatedBattle, error: updateError } = await supabase
      .from('battles')
      .update({
        player2_id: player_id,
        beast2_id: beast_id,
        status: 'in_progress',
        current_turn: firstTurn
      })
      .eq('id', battle.id)
      .eq('status', 'waiting') // Only update if still waiting (prevents race condition)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update battle:', updateError)
      
      // Check if it's because the room was already joined
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'This room has already been joined by another player.' },
          { status: 409 } // 409 Conflict for concurrent join
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to join room. Please try again.' },
        { status: 500 }
      )
    }

    if (!updatedBattle) {
      // No rows updated means the room was already joined
      return NextResponse.json(
        { error: 'This room has already been joined by another player.' },
        { status: 409 } // 409 Conflict for concurrent join
      )
    }

    console.log(`Player ${player_id} successfully joined battle ${battle.id}`)

    return NextResponse.json({ 
      success: true,
      battle_id: updatedBattle.id,
      battle: updatedBattle
    })
  } catch (error: any) {
    console.error('Unexpected error in room join:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
