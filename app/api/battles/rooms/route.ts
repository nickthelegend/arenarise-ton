import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateUniqueRoomCode } from '@/lib/room-code-utils'

/**
 * POST /api/battles/rooms
 * Create a new battle room with a unique room code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    
    if (!body) {
      return NextResponse.json(
        { 
          error: 'Invalid request. Please check your connection and try again.',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      )
    }
    
    const { player_id, beast_id } = body

    // Validate required fields - only player_id is required now
    if (!player_id) {
      return NextResponse.json(
        { 
          error: 'Player information is missing. Please reconnect your wallet and try again.',
          code: 'MISSING_PLAYER_ID'
        },
        { status: 400 }
      )
    }

    // If beast_id is provided (backward compatibility), verify it exists and belongs to the player
    if (beast_id) {
      const { data: beast, error: beastError } = await supabase
        .from('beasts')
        .select('*')
        .eq('id', beast_id)
        .single()

      if (beastError || !beast) {
        console.error('Beast not found:', beastError)
        return NextResponse.json(
          { 
            error: 'The selected beast could not be found. Please refresh and try again.',
            code: 'BEAST_NOT_FOUND'
          },
          { status: 404 }
        )
      }
    }

    // Generate a unique room code with retry logic
    const roomCode = await generateUniqueRoomCode(supabase)
    
    if (!roomCode) {
      console.error('Failed to generate unique room code after retries')
      return NextResponse.json(
        { 
          error: 'Unable to create a room at this time. Please try again in a moment.',
          code: 'ROOM_CODE_GENERATION_FAILED'
        },
        { status: 500 }
      )
    }

    // Create the battle room
    // Requirement 9.5: player2_id is null until a real player joins via /api/battles/rooms/join
    // New flow: beast_id is optional. If provided (old flow), set beast1_locked to true
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .insert({
        player1_id: player_id,
        player2_id: null, // No mock matchmaking - remains null until real player joins
        beast1_id: beast_id || null, // null if not provided (new flow)
        beast2_id: null, // Set when player2 joins
        beast1_locked: beast_id ? true : false, // Lock if beast provided (old flow)
        beast2_locked: false,
        status: 'waiting',
        room_code: roomCode,
        battle_type: 'pvp',
        bet_amount: 0,
        current_turn: null // Set when battle starts
      })
      .select()
      .single()

    if (battleError) {
      console.error('Failed to create battle room:', battleError)
      return NextResponse.json(
        { 
          error: 'Failed to create battle room. Please check your connection and try again.',
          code: 'ROOM_CREATION_FAILED'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      battle: {
        id: battle.id,
        room_code: battle.room_code,
        player1_id: battle.player1_id,
        beast1_id: battle.beast1_id,
        beast1_locked: battle.beast1_locked,
        beast2_locked: battle.beast2_locked,
        status: battle.status,
        created_at: battle.created_at
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error in room creation:', error)
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/battles/rooms
 * List all available battle rooms (status='waiting')
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all waiting rooms with beast and player details
    const { data: rooms, error } = await supabase
      .from('battles')
      .select(`
        id,
        room_code,
        player1_id,
        beast1_id,
        created_at,
        beast1:beasts!battles_beast1_id_fkey(
          id,
          name,
          level,
          hp,
          max_hp,
          attack,
          defense,
          speed,
          traits,
          image_ipfs_uri
        ),
        player1:users!battles_player1_id_fkey(
          id,
          wallet_address
        )
      `)
      .eq('status', 'waiting')
      .eq('battle_type', 'pvp')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { 
          error: 'Failed to load available rooms. Please check your connection and try again.',
          code: 'ROOMS_FETCH_FAILED'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ rooms: rooms || [] })
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while loading rooms. Please try again.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
