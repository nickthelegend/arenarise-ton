import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface Enemy {
  id: number
  name: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  reward: number
}

// Enemy templates for validation
const enemyTemplates = [
  { name: 'Goblin Scout', baseLevel: 5, hpMultiplier: 12, attackMultiplier: 2.5, defenseMultiplier: 1.8, rewardMultiplier: 6 },
  { name: 'Dark Mage', baseLevel: 12, hpMultiplier: 15, attackMultiplier: 3.2, defenseMultiplier: 2.0, rewardMultiplier: 10 },
  { name: 'Ancient Dragon', baseLevel: 20, hpMultiplier: 18, attackMultiplier: 3.5, defenseMultiplier: 2.5, rewardMultiplier: 20 },
  { name: 'Shadow Assassin', baseLevel: 10, hpMultiplier: 10, attackMultiplier: 4.0, defenseMultiplier: 1.5, rewardMultiplier: 12 },
  { name: 'Stone Golem', baseLevel: 15, hpMultiplier: 20, attackMultiplier: 2.0, defenseMultiplier: 3.5, rewardMultiplier: 15 },
  { name: 'Frost Giant', baseLevel: 18, hpMultiplier: 16, attackMultiplier: 3.8, defenseMultiplier: 2.8, rewardMultiplier: 18 },
]

function generateEnemy(id: number): Enemy | null {
  const index = id - 1
  if (index < 0 || index >= enemyTemplates.length) {
    return null
  }

  const template = enemyTemplates[index]
  const level = template.baseLevel
  const hp = Math.floor(level * template.hpMultiplier)
  const attack = Math.floor(level * template.attackMultiplier)
  const defense = Math.floor(level * template.defenseMultiplier)
  const reward = Math.floor(level * template.rewardMultiplier)

  return {
    id,
    name: template.name,
    level,
    hp,
    maxHp: hp,
    attack,
    defense,
    reward,
  }
}

// Create a new PVE battle
export async function POST(request: NextRequest) {
  try {
    const { player_id, beast_id, enemy_id } = await request.json()

    // Validate required fields
    if (!player_id || !beast_id || !enemy_id) {
      return NextResponse.json(
        { error: 'Missing required fields: player_id, beast_id, and enemy_id are required' },
        { status: 400 }
      )
    }

    // Validate enemy exists
    const enemy = generateEnemy(enemy_id)
    if (!enemy) {
      return NextResponse.json(
        { error: 'Invalid enemy_id' },
        { status: 400 }
      )
    }

    // Validate beast exists and belongs to player
    const { data: beast, error: beastError } = await supabase
      .from('beasts')
      .select('id, owner_address, max_hp')
      .eq('id', beast_id)
      .single()

    if (beastError || !beast) {
      return NextResponse.json(
        { error: 'Beast not found' },
        { status: 404 }
      )
    }

    // Validate player exists
    const { data: player, error: playerError } = await supabase
      .from('users')
      .select('id, wallet_address')
      .eq('id', player_id)
      .single()

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Verify beast belongs to player
    if (beast.owner_address !== player.wallet_address) {
      return NextResponse.json(
        { error: 'Beast does not belong to player' },
        { status: 403 }
      )
    }

    // Create battle record with battle_type='pve'
    // Initialize HP values to max_hp for both combatants
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .insert({
        player1_id: player_id,
        player2_id: null, // No second player in PVE
        beast1_id: beast_id,
        beast2_id: null, // No second beast in PVE
        battle_type: 'pve',
        enemy_id: enemy_id,
        status: 'in_progress',
        current_turn: player_id, // Player starts
        bet_amount: 0,
        reward_amount: 0,
        reward_status: 'none'
      })
      .select()
      .single()

    if (battleError) {
      return NextResponse.json(
        { error: battleError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      battle: {
        id: battle.id,
        player_id: battle.player1_id,
        beast_id: battle.beast1_id,
        enemy_id: battle.enemy_id,
        status: battle.status,
        battle_type: battle.battle_type
      }
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
