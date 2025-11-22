import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/battles/stake?transaction_hash={hash}
 * Retrieves a stake transaction by its transaction hash
 * 
 * Query parameters:
 * - transaction_hash: Blockchain transaction hash to look up
 * 
 * Requirements: 2.4 (transaction timeout handling)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transaction_hash = searchParams.get('transaction_hash')

    if (!transaction_hash) {
      return NextResponse.json(
        { error: 'transaction_hash is required' },
        { status: 400 }
      )
    }

    // Query stake transaction by hash
    const { data: stakeTransaction, error: queryError } = await supabase
      .from('stake_transactions')
      .select('*')
      .eq('transaction_hash', transaction_hash)
      .single()

    if (queryError || !stakeTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      stake_transaction: stakeTransaction
    }, { status: 200 })

  } catch (error: any) {
    console.error('Stake transaction query error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/battles/stake
 * Records a stake transaction for a battle
 * 
 * Request body:
 * - battle_id: UUID of the battle
 * - player_id: UUID of the player making the stake
 * - amount: Amount of RISE tokens staked
 * - transaction_hash: Blockchain transaction hash
 * 
 * Requirements: 2.3
 */
export async function POST(request: NextRequest) {
  try {
    const { battle_id, player_id, amount, transaction_hash } = await request.json()

    // Validate all required fields
    if (!battle_id) {
      return NextResponse.json(
        { error: 'battle_id is required' },
        { status: 400 }
      )
    }

    if (!player_id) {
      return NextResponse.json(
        { error: 'player_id is required' },
        { status: 400 }
      )
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'amount is required' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    if (!transaction_hash) {
      return NextResponse.json(
        { error: 'transaction_hash is required' },
        { status: 400 }
      )
    }

    // Verify the battle exists and get battle details
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select('id, player1_id, player2_id, player1_stake_tx, player2_stake_tx')
      .eq('id', battle_id)
      .single()

    if (battleError || !battle) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      )
    }

    // Verify the player is a participant in this battle
    if (battle.player1_id !== player_id && battle.player2_id !== player_id) {
      return NextResponse.json(
        { error: 'Player is not a participant in this battle' },
        { status: 403 }
      )
    }

    // Insert stake transaction record into database
    const { data: stakeTransaction, error: insertError } = await supabase
      .from('stake_transactions')
      .insert({
        battle_id,
        player_id,
        amount,
        transaction_hash,
        status: 'completed'
      })
      .select()
      .single()

    if (insertError) {
      // Check if it's a duplicate transaction hash
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Transaction hash already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    // Update battles table with transaction hash
    const isPlayer1 = battle.player1_id === player_id
    const updateField = isPlayer1 ? 'player1_stake_tx' : 'player2_stake_tx'
    
    const { error: updateError } = await supabase
      .from('battles')
      .update({ [updateField]: transaction_hash })
      .eq('id', battle_id)

    if (updateError) {
      // Log the error but don't fail the request since the stake transaction was recorded
      console.error('Failed to update battle with transaction hash:', updateError)
    }

    // Return success response with transaction data
    return NextResponse.json({
      success: true,
      stake_transaction: stakeTransaction
    }, { status: 201 })

  } catch (error: any) {
    console.error('Stake transaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
