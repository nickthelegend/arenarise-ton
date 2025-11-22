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
  { params }: { params: { id: string } }
) {
  try {
    const battleId = params.id
    const body: CompleteRequest = await request.json()
    const { winner, final_player_hp, final_enemy_hp } = body

    // Validate required fields
    if (!winner || final_player_hp === undefined || final_enemy_hp === undefined) {
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
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single()

    if (battleError || !battle) {
      return NextResponse.json(
        { error: 'Battle not found' },
        { status: 404 }
      )
    }

    // Requirement 6.2: Validate player is participant
    // For PVE battles, player is always player1_id
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

    // Requirement 4.1: Calculate reward (200 RISE for wins, 0 for losses)
    const rewardAmount = calculateReward(winner)

    // Update battle record with completion status and winner
    const winnerId = winner === 'player' ? playerId : null
    
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
      return NextResponse.json(
        { error: `Failed to update battle: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Requirement 4.2: Award RISE tokens
    let rewardStatus: 'completed' | 'failed' | 'pending' | 'none' = 'none'
    let transferDetails: any = null
    
    if (rewardAmount > 0) {
      try {
        // Get player wallet address from database
        const { data: player, error: playerError } = await supabase
          .from('users')
          .select('wallet_address')
          .eq('id', playerId)
          .single()

        if (playerError || !player?.wallet_address) {
          console.error(`Player wallet not found: ${playerError?.message}`)
          rewardStatus = 'pending'
          
          // Mark battle as reward_pending - will retry later
          await supabase
            .from('battles')
            .update({ reward_status: 'pending' })
            .eq('id', battleId)
        } else {
          // Log transfer attempt
          console.log(`Initiating RISE transfer: ${rewardAmount} RISE to player ${playerId} (${player.wallet_address})`)
          
          // Request RISE token transfer
          const transferResult = await requestRiseTokens(
            player.wallet_address,
            rewardAmount
          )
          
          // Log successful transfer details
          console.log(`RISE transfer successful:`, {
            battleId,
            playerId,
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
          playerId,
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
    console.error('Battle completion error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
