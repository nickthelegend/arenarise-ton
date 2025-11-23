import { describe, it, expect } from 'vitest'
import {
  generateRoomCode,
  isValidRoomCodeFormat,
  roomCodeExists,
  generateUniqueRoomCode,
  cleanupStaleRooms
} from './room-code-utils'

describe('room-code-utils', () => {
  describe('generateRoomCode', () => {
    it('should generate a 6-character code', () => {
      const code = generateRoomCode()
      expect(code).toHaveLength(6)
    })

    it('should only contain valid characters', () => {
      const code = generateRoomCode()
      const validChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      
      for (const char of code) {
        expect(validChars).toContain(char)
      }
    })

    it('should not contain ambiguous characters', () => {
      const code = generateRoomCode()
      const ambiguousChars = ['0', 'O', 'I', '1', 'l']
      
      for (const char of ambiguousChars) {
        expect(code).not.toContain(char)
      }
    })

    it('should generate different codes on multiple calls', () => {
      const codes = new Set()
      for (let i = 0; i < 100; i++) {
        codes.add(generateRoomCode())
      }
      
      // With 32^6 combinations, 100 codes should be unique
      expect(codes.size).toBeGreaterThan(90)
    })
  })

  describe('isValidRoomCodeFormat', () => {
    it('should return true for valid 6-character code', () => {
      expect(isValidRoomCodeFormat('ABC234')).toBe(true)
      expect(isValidRoomCodeFormat('XYZ789')).toBe(true)
      expect(isValidRoomCodeFormat('HKLMNP')).toBe(true)
    })

    it('should return false for codes with wrong length', () => {
      expect(isValidRoomCodeFormat('ABC')).toBe(false)
      expect(isValidRoomCodeFormat('ABCDEFG')).toBe(false)
      expect(isValidRoomCodeFormat('')).toBe(false)
    })

    it('should return false for codes with invalid characters', () => {
      expect(isValidRoomCodeFormat('ABC01O')).toBe(false) // Contains 0, 1, O
      expect(isValidRoomCodeFormat('ABCI1l')).toBe(false) // Contains I, 1, l
      expect(isValidRoomCodeFormat('abc234')).toBe(false) // Lowercase
      expect(isValidRoomCodeFormat('AB@234')).toBe(false) // Special char
    })

    it('should return false for null or undefined', () => {
      expect(isValidRoomCodeFormat(null as any)).toBe(false)
      expect(isValidRoomCodeFormat(undefined as any)).toBe(false)
    })
  })

  describe('roomCodeExists', () => {
    it('should return false when code does not exist', async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ 
                data: null, 
                error: { code: 'PGRST116' } 
              })
            })
          })
        })
      }

      const exists = await roomCodeExists(mockSupabase, 'ABC234')
      expect(exists).toBe(false)
    })

    it('should return true when code exists', async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ 
                data: { id: 'battle-123' }, 
                error: null 
              })
            })
          })
        })
      }

      const exists = await roomCodeExists(mockSupabase, 'ABC234')
      expect(exists).toBe(true)
    })

    it('should return true on database errors (safe default)', async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ 
                data: null, 
                error: { code: 'UNKNOWN_ERROR' } 
              })
            })
          })
        })
      }

      const exists = await roomCodeExists(mockSupabase, 'ABC234')
      expect(exists).toBe(true)
    })
  })

  describe('generateUniqueRoomCode', () => {
    it('should return a code when first attempt is unique', async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ 
                data: null, 
                error: { code: 'PGRST116' } 
              })
            })
          })
        })
      }

      const code = await generateUniqueRoomCode(mockSupabase)
      expect(code).not.toBeNull()
      expect(code).toHaveLength(6)
    })

    it('should retry on collision and return unique code', async () => {
      let attempts = 0
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => {
                attempts++
                // First 2 attempts fail (collision), 3rd succeeds
                if (attempts <= 2) {
                  return Promise.resolve({ 
                    data: { id: 'battle-123' }, 
                    error: null 
                  })
                }
                return Promise.resolve({ 
                  data: null, 
                  error: { code: 'PGRST116' } 
                })
              }
            })
          })
        })
      }

      const code = await generateUniqueRoomCode(mockSupabase)
      expect(code).not.toBeNull()
      expect(attempts).toBe(3)
    })

    it('should return null after max retries', async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ 
                data: { id: 'battle-123' }, 
                error: null 
              })
            })
          })
        })
      }

      const code = await generateUniqueRoomCode(mockSupabase)
      expect(code).toBeNull()
    })
  })

  describe('cleanupStaleRooms', () => {
    it('should return number of deleted rooms on success', async () => {
      const mockSupabase = {
        rpc: () => Promise.resolve({ data: 3, error: null })
      }

      const deleted = await cleanupStaleRooms(mockSupabase)
      expect(deleted).toBe(3)
    })

    it('should return null on database error', async () => {
      const mockSupabase = {
        rpc: () => Promise.resolve({ 
          data: null, 
          error: { message: 'Database error' } 
        })
      }

      const deleted = await cleanupStaleRooms(mockSupabase)
      expect(deleted).toBeNull()
    })

    it('should return 0 when no rooms to cleanup', async () => {
      const mockSupabase = {
        rpc: () => Promise.resolve({ data: 0, error: null })
      }

      const deleted = await cleanupStaleRooms(mockSupabase)
      expect(deleted).toBe(0)
    })
  })
})
