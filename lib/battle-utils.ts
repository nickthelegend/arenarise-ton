/**
 * Battle Combat Utilities
 * Provides functions for damage calculation, HP management, and turn switching
 */

export interface Combatant {
  attack: number
  defense: number
  hp: number
  maxHp: number
}

export interface Move {
  power: number
  name: string
}

export type Turn = 'player' | 'enemy'

/**
 * Calculate damage from attacker stats and move power
 * Formula: damage = (attack * movePower / 10) - (defense / 2)
 * Minimum damage is 1
 * 
 * @param attacker - The attacking combatant
 * @param defender - The defending combatant
 * @param move - The move being used
 * @returns The calculated damage amount (minimum 1)
 */
export function calculateDamage(
  attacker: Combatant,
  defender: Combatant,
  move: Move
): number {
  // Base damage calculation
  const baseDamage = (attacker.attack * move.power) / 10
  
  // Apply defense modifier
  const defenseReduction = defender.defense / 2
  
  // Calculate final damage
  const damage = Math.floor(baseDamage - defenseReduction)
  
  // Ensure minimum damage of 1
  return Math.max(1, damage)
}

/**
 * Reduce HP by damage amount
 * Ensures HP doesn't go below zero
 * 
 * @param currentHp - The current HP value
 * @param damage - The damage amount to subtract
 * @returns The new HP value (minimum 0)
 */
export function reduceHp(currentHp: number, damage: number): number {
  const newHp = currentHp - damage
  return Math.max(0, newHp)
}

/**
 * Switch between player and enemy turns
 * 
 * @param currentTurn - The current turn ('player' or 'enemy')
 * @returns The next turn ('enemy' or 'player')
 */
export function switchTurn(currentTurn: Turn): Turn {
  return currentTurn === 'player' ? 'enemy' : 'player'
}

/**
 * Check if player has won the battle
 * Player wins when enemy HP reaches zero
 * 
 * @param enemyHp - The enemy's current HP
 * @returns true if player has won (enemy HP is zero), false otherwise
 */
export function checkPlayerWin(enemyHp: number): boolean {
  return enemyHp === 0
}

/**
 * Check if player has lost the battle
 * Player loses when their beast's HP reaches zero
 * 
 * @param playerHp - The player's current HP
 * @returns true if player has lost (player HP is zero), false otherwise
 */
export function checkPlayerLoss(playerHp: number): boolean {
  return playerHp === 0
}

export type Winner = 'player' | 'enemy' | null

export interface BattleCompletionResult {
  isComplete: boolean
  winner: Winner
}

/**
 * Handle battle completion logic
 * Determines if battle is complete and who won
 * 
 * @param playerHp - The player's current HP
 * @param enemyHp - The enemy's current HP
 * @returns Object containing completion status and winner
 */
export function handleBattleCompletion(
  playerHp: number,
  enemyHp: number
): BattleCompletionResult {
  if (checkPlayerWin(enemyHp)) {
    return {
      isComplete: true,
      winner: 'player'
    }
  }
  
  if (checkPlayerLoss(playerHp)) {
    return {
      isComplete: true,
      winner: 'enemy'
    }
  }
  
  return {
    isComplete: false,
    winner: null
  }
}

/**
 * Calculate reward amount based on battle outcome
 * Returns 200 RISE for wins, 0 RISE for losses
 * 
 * @param winner - The winner of the battle ('player' or 'enemy')
 * @returns The reward amount in RISE tokens
 */
export function calculateReward(winner: Winner): number {
  if (winner === 'player') {
    return 200
  }
  return 0
}

export type RewardStatus = 'none' | 'pending' | 'completed' | 'failed'

export interface RewardRecordingResult {
  success: boolean
  error?: string
}

/**
 * Record reward in database
 * Updates battle record with reward amount and status
 * 
 * @param supabaseClient - The Supabase client instance
 * @param battleId - The ID of the battle
 * @param rewardAmount - The reward amount to record
 * @param rewardStatus - The status of the reward ('pending', 'completed', 'failed')
 * @returns Result indicating success or failure
 */
export async function recordReward(
  supabaseClient: any,
  battleId: string,
  rewardAmount: number,
  rewardStatus: RewardStatus
): Promise<RewardRecordingResult> {
  try {
    const { error } = await supabaseClient
      .from('battles')
      .update({
        reward_amount: rewardAmount,
        reward_status: rewardStatus
      })
      .eq('id', battleId)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    }
  }
}
