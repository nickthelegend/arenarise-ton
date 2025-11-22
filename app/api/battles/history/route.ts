import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Enemy templates (same as in enemies/route.ts and pve/route.ts)
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
 * GET /api/battles/history
 * Retrieve battle history for a player
 * Query parameters:
 *   - player_id: UUID of the player
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('player_id')

    // Validate required parameter
    if (!playerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: player_id' },
        { status: 400 }
      )
    }

    // Requirement 5.2: Query battles by player ID
    // Requirement 5.4: Order by created_at descending
    // Filter for PVE battles only
    const { data: battles, error: battlesError } = await supabase
      .from('battles')
      .select('id, enemy_id, winner_id, player1_id, reward_amount, created_at, status')
      .eq('player1_id', playerId)
      .eq('battle_type', 'pve')
      .order('created_at', { ascending: false })

    if (battlesError) {
      return NextResponse.json(
        { error: battlesError.message },
        { status: 500 }
      )
    }

    // Requirement 5.3: Include enemy name, outcome, and reward
    const battleHistory = battles.map(battle => {
      const enemyName = battle.enemy_id ? getEnemyName(battle.enemy_id) : 'Unknown Enemy'
      const won = battle.winner_id === battle.player1_id
      
      return {
        id: battle.id,
        enemy_name: enemyName,
        won: won,
        reward: battle.reward_amount || 0,
        created_at: battle.created_at
      }
    })

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
