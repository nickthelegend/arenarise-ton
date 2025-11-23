import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Record a battle move
export async function POST(request: NextRequest) {
  try {
    const { battle_id, player_id, move_id, turn_number, damage_dealt, target_hp_remaining } = await request.json()

    if (!battle_id || !player_id || !move_id || turn_number === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Record the move
    const { data: battleMove, error: moveError } = await supabase
      .from('battle_moves')
      .insert({
        battle_id,
        player_id,
        move_id,
        turn_number,
        damage_dealt,
        target_hp_remaining
      })
      .select()
      .single()

    if (moveError) {
      return NextResponse.json(
        { error: moveError.message },
        { status: 500 }
      )
    }

    // Get battle to determine next turn
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battle_id)
      .single()

    if (battleError) {
      return NextResponse.json(
        { error: battleError.message },
        { status: 500 }
      )
    }

    // Check if battle should end (Requirement 8.1)
    if (target_hp_remaining <= 0) {
      // Battle ended - opponent's HP reached 0
      // The player who made this move is the winner
      
      // Update battle as completed (Requirement 8.2)
      await supabase
        .from('battles')
        .update({
          status: 'completed',
          winner_id: player_id
        })
        .eq('id', battle_id)

      // For PVP battles, award rewards (Requirement 8.4)
      // Calculate reward (200 RISE for winner)
      const rewardAmount = 200
      
      // Get winner's wallet address
      const { data: winner, error: winnerError } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', player_id)
        .single()

      let rewardStatus: 'completed' | 'failed' | 'pending' | 'none' = 'none'
      
      if (!winnerError && winner?.wallet_address) {
        // For now, mark as pending - actual token transfer would happen here
        // In production, you'd call requestRiseTokens here
        rewardStatus = 'pending'
        
        // Update battle with reward info (Requirement 8.4)
        await supabase
          .from('battles')
          .update({
            reward_amount: rewardAmount,
            reward_status: rewardStatus
          })
          .eq('id', battle_id)
      }

      return NextResponse.json({ 
        battleMove, 
        battle_ended: true, 
        winner_id: player_id,
        reward_amount: rewardAmount,
        reward_status: rewardStatus
      })
    }

    // Switch turn
    const next_turn = battle.current_turn === battle.player1_id 
      ? battle.player2_id 
      : battle.player1_id

    await supabase
      .from('battles')
      .update({ current_turn: next_turn })
      .eq('id', battle_id)

    return NextResponse.json({ battleMove, battle_ended: false })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get moves for a battle
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const battle_id = searchParams.get('battle_id')

    if (!battle_id) {
      return NextResponse.json(
        { error: 'Battle ID is required' },
        { status: 400 }
      )
    }

    const { data: moves, error } = await supabase
      .from('battle_moves')
      .select(`
        *,
        move:moves(*)
      `)
      .eq('battle_id', battle_id)
      .order('turn_number', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ moves })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}