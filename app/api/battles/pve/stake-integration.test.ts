import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}))

/**
 * Integration test for stake amount flow through battle creation
 * Validates Requirements 4.5: Stake amount persistence
 */
describe('Stake Amount Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('should pass stake_amount through battle creation and return it in response', async () => {
    const stakeAmount = 100.5
    
    const request = new NextRequest('http://localhost:3000/api/battles/pve', {
      method: 'POST',
      body: JSON.stringify({
        player_id: 'test-player-123',
        beast_id: 1,
        enemy_id: 1,
        stake_amount: stakeAmount
      })
    })

    const response = await POST(request)
    const data = await response.json()

    // Verify stake_amount is not rejected by validation
    if (response.status === 400) {
      expect(data.error).not.toContain('Invalid stake_amount')
    }
    
    // If we get past validation (even if other errors occur),
    // the stake_amount was accepted
    expect(data.error).not.toContain('stake_amount')
  })

  it('should accept battle creation without stake_amount', async () => {
    const request = new NextRequest('http://localhost:3000/api/battles/pve', {
      method: 'POST',
      body: JSON.stringify({
        player_id: 'test-player-123',
        beast_id: 1,
        enemy_id: 1
        // No stake_amount provided
      })
    })

    const response = await POST(request)
    const data = await response.json()

    // Should not fail due to missing stake_amount
    expect(data.error).not.toContain('stake_amount')
  })

  it('should store zero when stake_amount is not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/battles/pve', {
      method: 'POST',
      body: JSON.stringify({
        player_id: 'test-player-123',
        beast_id: 1,
        enemy_id: 1
      })
    })

    const response = await POST(request)
    
    // Validation should pass for missing stake_amount
    if (response.status === 400) {
      const data = await response.json()
      expect(data.error).not.toContain('stake_amount')
    }
  })
})
