import { describe, it, expect } from 'vitest'
import {
  calculateDamage,
  reduceHp,
  switchTurn,
  checkPlayerWin,
  checkPlayerLoss,
  handleBattleCompletion,
  calculateReward,
  recordReward,
  type Combatant,
  type Move,
  type Turn,
  type Winner
} from './battle-utils'

describe('battle-utils', () => {
  describe('calculateDamage', () => {
    it('should calculate damage based on attack, defense, and move power', () => {
      const attacker: Combatant = { attack: 50, defense: 30, hp: 100, maxHp: 100 }
      const defender: Combatant = { attack: 40, defense: 20, hp: 100, maxHp: 100 }
      const move: Move = { power: 10, name: 'Tackle' }

      const damage = calculateDamage(attacker, defender, move)

      // (50 * 10 / 10) - (20 / 2) = 50 - 10 = 40
      expect(damage).toBe(40)
    })

    it('should return minimum damage of 1', () => {
      const attacker: Combatant = { attack: 10, defense: 30, hp: 100, maxHp: 100 }
      const defender: Combatant = { attack: 40, defense: 100, hp: 100, maxHp: 100 }
      const move: Move = { power: 5, name: 'Weak Attack' }

      const damage = calculateDamage(attacker, defender, move)

      expect(damage).toBeGreaterThanOrEqual(1)
    })
  })

  describe('reduceHp', () => {
    it('should reduce HP by damage amount', () => {
      const currentHp = 100
      const damage = 30

      const newHp = reduceHp(currentHp, damage)

      expect(newHp).toBe(70)
    })

    it('should not go below zero', () => {
      const currentHp = 20
      const damage = 50

      const newHp = reduceHp(currentHp, damage)

      expect(newHp).toBe(0)
    })

    it('should handle exact zero', () => {
      const currentHp = 30
      const damage = 30

      const newHp = reduceHp(currentHp, damage)

      expect(newHp).toBe(0)
    })
  })

  describe('switchTurn', () => {
    it('should switch from player to enemy', () => {
      const currentTurn: Turn = 'player'

      const nextTurn = switchTurn(currentTurn)

      expect(nextTurn).toBe('enemy')
    })

    it('should switch from enemy to player', () => {
      const currentTurn: Turn = 'enemy'

      const nextTurn = switchTurn(currentTurn)

      expect(nextTurn).toBe('player')
    })
  })

  describe('checkPlayerWin', () => {
    it('should return true when enemy HP is zero', () => {
      const enemyHp = 0

      const hasWon = checkPlayerWin(enemyHp)

      expect(hasWon).toBe(true)
    })

    it('should return false when enemy HP is greater than zero', () => {
      const enemyHp = 1

      const hasWon = checkPlayerWin(enemyHp)

      expect(hasWon).toBe(false)
    })

    it('should return false when enemy HP is at full health', () => {
      const enemyHp = 100

      const hasWon = checkPlayerWin(enemyHp)

      expect(hasWon).toBe(false)
    })
  })

  describe('checkPlayerLoss', () => {
    it('should return true when player HP is zero', () => {
      const playerHp = 0

      const hasLost = checkPlayerLoss(playerHp)

      expect(hasLost).toBe(true)
    })

    it('should return false when player HP is greater than zero', () => {
      const playerHp = 1

      const hasLost = checkPlayerLoss(playerHp)

      expect(hasLost).toBe(false)
    })

    it('should return false when player HP is at full health', () => {
      const playerHp = 100

      const hasLost = checkPlayerLoss(playerHp)

      expect(hasLost).toBe(false)
    })
  })

  describe('handleBattleCompletion', () => {
    it('should declare player as winner when enemy HP is zero', () => {
      const playerHp = 50
      const enemyHp = 0

      const result = handleBattleCompletion(playerHp, enemyHp)

      expect(result.isComplete).toBe(true)
      expect(result.winner).toBe('player')
    })

    it('should declare enemy as winner when player HP is zero', () => {
      const playerHp = 0
      const enemyHp = 50

      const result = handleBattleCompletion(playerHp, enemyHp)

      expect(result.isComplete).toBe(true)
      expect(result.winner).toBe('enemy')
    })

    it('should return incomplete when both have HP remaining', () => {
      const playerHp = 50
      const enemyHp = 50

      const result = handleBattleCompletion(playerHp, enemyHp)

      expect(result.isComplete).toBe(false)
      expect(result.winner).toBe(null)
    })

    it('should prioritize player win when both HP are zero', () => {
      const playerHp = 0
      const enemyHp = 0

      const result = handleBattleCompletion(playerHp, enemyHp)

      // Player win is checked first, so player wins in simultaneous defeat
      expect(result.isComplete).toBe(true)
      expect(result.winner).toBe('player')
    })

    it('should return incomplete when both at full health', () => {
      const playerHp = 100
      const enemyHp = 100

      const result = handleBattleCompletion(playerHp, enemyHp)

      expect(result.isComplete).toBe(false)
      expect(result.winner).toBe(null)
    })
  })

  describe('calculateReward', () => {
    it('should return 200 RISE for player win', () => {
      const winner: Winner = 'player'

      const reward = calculateReward(winner)

      expect(reward).toBe(200)
    })

    it('should return 0 RISE for enemy win', () => {
      const winner: Winner = 'enemy'

      const reward = calculateReward(winner)

      expect(reward).toBe(0)
    })

    it('should return 0 RISE for null winner', () => {
      const winner: Winner = null

      const reward = calculateReward(winner)

      expect(reward).toBe(0)
    })
  })

  describe('recordReward', () => {
    it('should successfully record reward in database', async () => {
      const mockSupabase = {
        from: () => ({
          update: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        })
      }

      const result = await recordReward(mockSupabase, 'battle-123', 200, 'completed')

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should handle database errors', async () => {
      const mockSupabase = {
        from: () => ({
          update: () => ({
            eq: () => Promise.resolve({ error: { message: 'Database error' } })
          })
        })
      }

      const result = await recordReward(mockSupabase, 'battle-123', 200, 'completed')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })

    it('should record zero reward for losses', async () => {
      const mockSupabase = {
        from: () => ({
          update: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        })
      }

      const result = await recordReward(mockSupabase, 'battle-123', 0, 'none')

      expect(result.success).toBe(true)
    })

    it('should handle pending reward status', async () => {
      const mockSupabase = {
        from: () => ({
          update: () => ({
            eq: () => Promise.resolve({ error: null })
          })
        })
      }

      const result = await recordReward(mockSupabase, 'battle-123', 200, 'pending')

      expect(result.success).toBe(true)
    })
  })
})
