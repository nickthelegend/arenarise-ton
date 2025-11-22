import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Enemy templates (same as in enemies/route.ts)
const enemyTemplates = [
  { name: 'Goblin Scout', baseLevel: 5, hpMultiplier: 12, attackMultiplier: 2.5, defenseMultiplier: 1.8, rewardMultiplier: 6 },
  { name: 'Dark Mage', baseLevel: 12, hpMultiplier: 15, attackMultiplier: 3.2, defenseMultiplier: 2.0, rewardMultiplier: 10 },
  { name: 'Ancient Dragon', baseLevel: 20, hpMultiplier: 18, attackMultiplier: 3.5, defenseMultiplier: 2.5, rewardMultiplier: 20 },
  { name: 'Shadow Assassin', baseLevel: 10, hpMultiplier: 10, attackMultiplier: 4.0, defenseMultiplier: 1.5, rewardMultiplier: 12 },
  { name: 'Stone Golem', baseLevel: 15, hpMultiplier: 20, attackMultiplier: 2.0, defenseMultiplier: 3.5, rewardMultiplier: 15 },
  { name: 'Frost Giant', baseLevel: 18, hpMultiplier: 16, attackMultiplier: 3.8, defenseMultiplier: 2.8, rewardMultiplier: 18 },
]

function getEnemyName(enemyId: number): string {
  const index = enemyId - 1
  if (index >= 0 && index < enemyTemplates.length) {
    return enemyTemplates[index].name
  }
  return 'Unknown Enemy'
}

/**
 * GET /api/profile/battles
 * Retrieve battle history for a user
 * Query parameters:
 *   - user_id: UUID of the user
 * Requirements: 5.1, 7.1, 7.3
 * 
 * Note: This endpoint relies on client-side authentication via TON wallet connection.
 * The frontend is responsible for only requesting data for the authenticated user.
 * Server-side authentication would require implementing a session/token system.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    // Requirement 7.1: Validate user_id parameter
    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user_id format' },
        { status: 400 }
      )
    }

    // Requirement 5.1, 7.3: Query battles table where user is a participant
    // Get battles where user is player1 or player2
    const { data: battles, error: battlesError } = await supabase
      .from('battles')
      .select(`
        id,
        player1_id,
        player2_id,
        winner_id,
        battle_type,
        enemy_id,
        reward_amount,
        created_at,
        status
      `)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (battlesError) {
      console.error('Error fetching battles:', battlesError)
      return NextResponse.json(
        { error: 'Failed to fetch battle history' },
        { status: 500 }
      )
    }

    // Requirement 5.1: Join with enemy/player data and format results
    const battleHistory = await Promise.all(
      (battles || []).map(async (battle) => {
        let opponentName = 'Unknown'
        
        // Determine opponent based on battle type
        if (battle.battle_type === 'pve') {
          // PVE battle - opponent is an enemy
          opponentName = battle.enemy_id ? getEnemyName(battle.enemy_id) : 'Unknown Enemy'
        } else {
          // PVP battle - opponent is the other player
          const opponentId = battle.player1_id === userId ? battle.player2_id : battle.player1_id
          
          if (opponentId) {
            // Fetch opponent user data
            const { data: opponentUser } = await supabase
              .from('users')
              .select('wallet_address')
              .eq('id', opponentId)
              .single()
            
            if (opponentUser) {
              // Use shortened wallet address as opponent name
              const addr = opponentUser.wallet_address
              opponentName = `${addr.slice(0, 6)}...${addr.slice(-4)}`
            }
          }
        }

        // Requirement 5.2, 5.3, 5.4: Determine outcome and reward
        const won = battle.winner_id === userId
        const reward = battle.reward_amount ? Number(battle.reward_amount) : 0

        return {
          id: battle.id,
          opponent_name: opponentName,
          battle_type: battle.battle_type,
          won: won,
          reward: reward,
          created_at: battle.created_at
        }
      })
    )

    // Requirement 5.5: Results are already ordered by created_at descending
    return NextResponse.json({
      battles: battleHistory
    }, { status: 200 })

  } catch (error: any) {
    console.error('Battle history error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
