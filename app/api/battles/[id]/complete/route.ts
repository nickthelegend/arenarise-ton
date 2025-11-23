import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateReward, recordReward } from '@/lib/battle-utils'
import { requestRiseTokens, RiseTransferError } from '@/lib/swap-utils'

interface CompleteRequest {
  winner: 'player' | 'enemy'
  final_player_hp: number
  final_enemy_hp: number
}

/**
 * POST /api/battles/[id]/complete
 * Complete a PVE battle and award rewards
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15+
    const params = await context.params
    const battleId = params.id
    
    // Add detailed logging
    console.log('=== Battle Complete API Called ===')
    console.log('Battle ID:', battleId)
    console.log('Request URL:', request.url)
    
    const body: CompleteRequest = await request.json()
    const { winner, final_player_hp, final_enemy_hp } = body
    
    console.log('Request body:', { winner, final_player_hp, final_enemy_hp })

    // Validate required fields
    if (!winner || final_player_hp === undefined || final_enemy_hp === undefined) {
      console.error('Validation failed: Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: winner, final_player_hp, and final_enemy_hp are required' },
        { status: 400 }
      )
    }

    // Validate winner value
    if (winner !== 'player' && winner !== 'enemy') {
      return NextResponse.json(
        { error: 'Invalid winner value. Must be "player" or "enemy"' },
        { status: 400 }
      )
    }

    // Requirement 6.1: Validate battle exists
    console.log('Fetching battle from database...')
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single()

    if (battleError || !battle) {
      console.error('Battle not found:', battleError?.message || 'No battle data')
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      )
    }
    
    console.log('Battle found:', { id: battle.id, status: battle.status, player1_id: battle.player1_id })

    // Requirement 6.2: Validate player is participant
    // For PVE battles, player is always player1_id
    // For PVP battles, player can be player1_id or player2_id
    const isPVP = battle.battle_type === 'pvp'
    const playerId = battle.player1_id
    if (!playerId) {
      return NextResponse.json(
        { error: 'Player not found in battle' },
        { status: 403 }
      )
    }

    // Requirement 6.3: Validate battle status
    // Battle must not already be completed
    if (battle.status === 'completed') {
      return NextResponse.json(
        { error: 'Battle is already completed' },
        { status: 400 }
      )
    }

    // Requirement 6.4: Validate winner
    // Ensure winner matches the HP values
    const isPlayerWinner = final_enemy_hp === 0 && final_player_hp > 0
    const isEnemyWinner = final_player_hp === 0 && final_enemy_hp > 0

    if (winner === 'player' && !isPlayerWinner) {
      return NextResponse.json(
        { error: 'Winner validation failed: player cannot win if enemy HP is not zero' },
        { status: 400 }
      )
    }

    if (winner === 'enemy' && !isEnemyWinner) {
      return NextResponse.json(
        { error: 'Winner validation failed: enemy cannot win if player HP is not zero' },
        { status: 400 }
      )
    }

    // Requirement 4.1 & 8.4: Calculate reward (200 RISE for wins, 0 for losses)
    const rewardAmount = calculateReward(winner)
    console.log('Calculated reward:', rewardAmount, 'RISE')

    // Requirement 8.2: Update battle record with completion status and winner
    // For PVE: winner_id is player1_id if player wins, null if enemy wins
    // For PVP: winner_id is player1_id if player wins, player2_id if opponent wins
    let winnerId: string | null = null
    if (winner === 'player') {
      winnerId = playerId
    } else if (isPVP && battle.player2_id) {
      // For PVP, if player loses, the opponent (player2) wins
      winnerId = battle.player2_id
    }
    // For PVE, if enemy wins, winnerId remains null
    
    console.log('Updating battle status to completed...')
    const { error: updateError } = await supabase
      .from('battles')
      .update({
        status: 'completed',
        winner_id: winnerId,
        reward_amount: rewardAmount,
        reward_status: rewardAmount > 0 ? 'pending' : 'none'
      })
      .eq('id', battleId)

    if (updateError) {
      console.error('Failed to update battle:', updateError.message)
      return NextResponse.json(
        { error: `Failed to update battle: ${updateError.message}` },
        { status: 500 }
      )
    }
    
    console.log('Battle updated successfully')

    // Requirement 4.2 & 8.4: Award RISE tokens to winner
    let rewardStatus: 'completed' | 'failed' | 'pending' | 'none' = 'none'
    let transferDetails: any = null
    
    if (rewardAmount > 0 && winnerId) {
      try {
        // Get winner's wallet address from database
        const { data: winnerUser, error: winnerError } = await supabase
          .from('users')
          .select('wallet_address')
          .eq('id', winnerId)
          .single()

        if (winnerError || !winnerUser?.wallet_address) {
          console.error(`Winner wallet not found: ${winnerError?.message}`)
          rewardStatus = 'pending'
          
          // Mark battle as reward_pending - will retry later
          await supabase
            .from('battles')
            .update({ reward_status: 'pending' })
            .eq('id', battleId)
        } else {
          // Log transfer attempt
          console.log(`Initiating RISE transfer: ${rewardAmount} RISE to winner ${winnerId} (${winnerUser.wallet_address})`)
          
          // Request RISE token transfer
          const transferResult = await requestRiseTokens(
            winnerUser.wallet_address,
            rewardAmount
          )
          
          // Log successful transfer details
          console.log(`RISE transfer successful:`, {
            battleId,
            winnerId,
            amount: rewardAmount,
            fromWallet: transferResult.fromWallet,
            toWallet: transferResult.toWallet,
            jettonAmount: transferResult.jettonAmount,
            seqno: transferResult.seqno
          })
          
          transferDetails = transferResult
          rewardStatus = 'completed'
          
          // Record the reward in the database
          const recordResult = await recordReward(
            supabase,
            battleId,
            rewardAmount,
            rewardStatus
          )

          if (!recordResult.success) {
            console.error(`Failed to record reward: ${recordResult.error}`)
            // Don't fail the request, but log the error
          }
        }
      } catch (transferError: any) {
        // Requirement 6.5: Handle transfer failures gracefully
        console.error(`RISE transfer failed:`, {
          battleId,
          winnerId,
          amount: rewardAmount,
          error: transferError.message,
          isRetryable: transferError instanceof RiseTransferError ? transferError.isRetryable : false
        })
        
        // Determine if error is retryable
        if (transferError instanceof RiseTransferError && transferError.isRetryable) {
          // Mark as pending for retry
          rewardStatus = 'pending'
          console.log(`Transfer marked as pending for retry`)
        } else {
          // Mark as failed for non-retryable errors
          rewardStatus = 'failed'
          console.log(`Transfer marked as failed (non-retryable)`)
        }
        
        // Update battle with appropriate reward status
        await supabase
          .from('battles')
          .update({ reward_status: rewardStatus })
          .eq('id', battleId)
      }
    } else {
      // No reward for losses
      rewardStatus = 'none'
    }

    // Return success response
    console.log('=== Battle Complete Success ===')
    console.log('Reward status:', rewardStatus)
    console.log('Reward amount:', rewardAmount)
    
    return NextResponse.json({
      success: true,
      won: winner === 'player',
      reward: rewardAmount,
      battle: {
        id: battleId,
        status: 'completed',
        winner: winner,
        winner_id: winnerId,
        reward_amount: rewardAmount,
        reward_status: rewardStatus
      },
      ...(transferDetails && { transfer: transferDetails })
    }, { status: 200 })

  } catch (error: any) {
    console.error('=== Battle Completion Error ===')
    console.error('Error:', error)
    console.error('Stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
