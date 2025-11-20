/**
 * Integration tests for complete battle flow
 * Tests: stake → arena → outcome → return flow
 * Validates: Requirements All
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setStakeData, getStakeData, clearStakeData, validateStakeData } from '@/lib/stake-storage'

// Mock sessionStorage for Node environment
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

// Setup global mocks
global.window = { sessionStorage: sessionStorageMock } as any
global.sessionStorage = sessionStorageMock as any

describe('Battle Flow Integration Tests', () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('Stake → Arena → Outcome → Return Flow', () => {
    it('should complete full flow: set stake, validate in arena, clear after outcome', () => {
      const battleId = 'test-battle-123'
      const stakeAmount = 100

      // Step 1: User sets stake on start page
      setStakeData({
        amount: stakeAmount,
        battleId: battleId,
        timestamp: Date.now()
      })

      // Verify stake was stored
      const storedStake = getStakeData()
      expect(storedStake).not.toBeNull()
      expect(storedStake?.amount).toBe(stakeAmount)
      expect(storedStake?.battleId).toBe(battleId)

      // Step 2: Arena page validates stake
      const isValid = validateStakeData(battleId)
      expect(isValid).toBe(true)

      // Step 3: Battle completes, outcome shown, stake cleared
      clearStakeData()

      // Verify stake was cleared
      const clearedStake = getStakeData()
      expect(clearedStake).toBeNull()

      // Step 4: Verify validation fails after clearing
      const isValidAfterClear = validateStakeData(battleId)
      expect(isValidAfterClear).toBe(false)
    })

    it('should reject arena access without valid stake', () => {
      const battleId = 'test-battle-456'

      // Try to validate without setting stake
      const isValid = validateStakeData(battleId)
      expect(isValid).toBe(false)
    })

    it('should reject arena access with mismatched battle ID', () => {
      const correctBattleId = 'battle-123'
      const wrongBattleId = 'battle-456'

      // Set stake for one battle
      setStakeData({
        amount: 100,
        battleId: correctBattleId,
        timestamp: Date.now()
      })

      // Try to validate with different battle ID
      const isValid = validateStakeData(wrongBattleId)
      expect(isValid).toBe(false)
    })

    it('should reject expired stake data', () => {
      const battleId = 'battle-789'
      const oneHourInMs = 60 * 60 * 1000

      // Set stake with old timestamp (2 hours ago)
      setStakeData({
        amount: 100,
        battleId: battleId,
        timestamp: Date.now() - (2 * oneHourInMs)
      })

      // Validation should fail and clear expired data
      const isValid = validateStakeData(battleId)
      expect(isValid).toBe(false)

      // Verify data was cleared
      const clearedStake = getStakeData()
      expect(clearedStake).toBeNull()
    })
  })

  describe('Session Storage Cleanup', () => {
    it('should properly clean up stake data after battle completion', () => {
      const battleId = 'cleanup-test'
      
      // Set stake
      setStakeData({
        amount: 250,
        battleId: battleId,
        timestamp: Date.now()
      })

      // Verify it exists
      expect(getStakeData()).not.toBeNull()

      // Simulate battle completion and cleanup
      clearStakeData()

      // Verify complete cleanup
      expect(getStakeData()).toBeNull()
      expect(validateStakeData(battleId)).toBe(false)
    })

    it('should handle multiple stake operations correctly', () => {
      const battle1 = 'battle-1'
      const battle2 = 'battle-2'

      // Set stake for battle 1
      setStakeData({
        amount: 100,
        battleId: battle1,
        timestamp: Date.now()
      })

      // Verify battle 1 stake
      expect(validateStakeData(battle1)).toBe(true)

      // Set stake for battle 2 (should overwrite)
      setStakeData({
        amount: 200,
        battleId: battle2,
        timestamp: Date.now()
      })

      // Battle 1 should no longer be valid
      expect(validateStakeData(battle1)).toBe(false)
      
      // Battle 2 should be valid
      expect(validateStakeData(battle2)).toBe(true)

      // Verify correct amount
      const stake = getStakeData()
      expect(stake?.amount).toBe(200)
      expect(stake?.battleId).toBe(battle2)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle missing stake data gracefully', () => {
      // Don't set any stake
      const result = getStakeData()
      expect(result).toBeNull()
    })

    it('should handle corrupted session storage data', () => {
      // Manually corrupt the data
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('battle_stake', 'invalid-json{')
      }

      // Should return null instead of throwing
      const result = getStakeData()
      expect(result).toBeNull()
    })

    it('should validate stake amount boundaries', () => {
      const battleId = 'boundary-test'

      // Test minimum stake
      setStakeData({
        amount: 10, // MIN_STAKE
        battleId: battleId,
        timestamp: Date.now()
      })
      expect(validateStakeData(battleId)).toBe(true)

      // Test maximum stake
      setStakeData({
        amount: 10000, // MAX_STAKE
        battleId: battleId,
        timestamp: Date.now()
      })
      expect(validateStakeData(battleId)).toBe(true)
    })

    it('should handle rapid stake updates', () => {
      const battleId = 'rapid-test'

      // Rapidly update stake multiple times
      for (let i = 0; i < 10; i++) {
        setStakeData({
          amount: i * 10,
          battleId: battleId,
          timestamp: Date.now()
        })
      }

      // Should have the last value
      const stake = getStakeData()
      expect(stake?.amount).toBe(90)
      expect(validateStakeData(battleId)).toBe(true)
    })
  })

  describe('Timestamp Validation', () => {
    it('should accept fresh stake data', () => {
      const battleId = 'fresh-test'
      
      setStakeData({
        amount: 100,
        battleId: battleId,
        timestamp: Date.now()
      })

      expect(validateStakeData(battleId)).toBe(true)
    })

    it('should accept stake data within 1 hour', () => {
      const battleId = 'recent-test'
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000)
      
      setStakeData({
        amount: 100,
        battleId: battleId,
        timestamp: thirtyMinutesAgo
      })

      expect(validateStakeData(battleId)).toBe(true)
    })

    it('should reject stake data older than 1 hour', () => {
      const battleId = 'old-test'
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000)
      
      setStakeData({
        amount: 100,
        battleId: battleId,
        timestamp: twoHoursAgo
      })

      expect(validateStakeData(battleId)).toBe(false)
    })
  })
})
