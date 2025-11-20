import { NextRequest, NextResponse } from 'next/server'

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

// Procedurally generate enemies
const enemyTemplates = [
  { name: 'Goblin Scout', baseLevel: 5, hpMultiplier: 12, attackMultiplier: 2.5, defenseMultiplier: 1.8, rewardMultiplier: 6 },
  { name: 'Dark Mage', baseLevel: 12, hpMultiplier: 15, attackMultiplier: 3.2, defenseMultiplier: 2.0, rewardMultiplier: 10 },
  { name: 'Ancient Dragon', baseLevel: 20, hpMultiplier: 18, attackMultiplier: 3.5, defenseMultiplier: 2.5, rewardMultiplier: 20 },
  { name: 'Shadow Assassin', baseLevel: 10, hpMultiplier: 10, attackMultiplier: 4.0, defenseMultiplier: 1.5, rewardMultiplier: 12 },
  { name: 'Stone Golem', baseLevel: 15, hpMultiplier: 20, attackMultiplier: 2.0, defenseMultiplier: 3.5, rewardMultiplier: 15 },
  { name: 'Frost Giant', baseLevel: 18, hpMultiplier: 16, attackMultiplier: 3.8, defenseMultiplier: 2.8, rewardMultiplier: 18 },
]

function generateEnemies(): Enemy[] {
  return enemyTemplates.map((template, index) => {
    const level = template.baseLevel
    const hp = Math.floor(level * template.hpMultiplier)
    const attack = Math.floor(level * template.attackMultiplier)
    const defense = Math.floor(level * template.defenseMultiplier)
    const reward = Math.floor(level * template.rewardMultiplier)

    return {
      id: index + 1,
      name: template.name,
      level,
      hp,
      maxHp: hp,
      attack,
      defense,
      reward,
    }
  })
}

// Get procedurally generated enemies
export async function GET(request: NextRequest) {
  try {
    const enemies = generateEnemies()
    return NextResponse.json({ enemies })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
