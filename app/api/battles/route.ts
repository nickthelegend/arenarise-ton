import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Create a new battle
export async function POST(request: NextRequest) {
  try {
    const { player1_id, player2_id, beast1_id, beast2_id, bet_amount } = await request.json()

    if (!player1_id || !player2_id || !beast1_id || !beast2_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: battle, error } = await supabase
      .from('battles')
      .insert({
        player1_id,
        player2_id,
        beast1_id,
        beast2_id,
        bet_amount: bet_amount || 0,
        status: 'in_progress',
        current_turn: player1_id // Player 1 starts
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ battle }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get battles for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const battle_id = searchParams.get('battle_id')

    if (battle_id) {
      // Get specific battle with beast details
      const { data: battle, error } = await supabase
        .from('battles')
        .select(`
          *,
          player1:users!battles_player1_id_fkey(*),
          player2:users!battles_player2_id_fkey(*),
          beast1:beasts!battles_beast1_id_fkey(*),
          beast2:beasts!battles_beast2_id_fkey(*)
        `)
        .eq('id', battle_id)
        .single()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ battle })
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data: battles, error } = await supabase
      .from('battles')
      .select('*')
      .or(`player1_id.eq.${user_id},player2_id.eq.${user_id}`)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ battles })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}