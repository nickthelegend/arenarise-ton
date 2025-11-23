import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock supabase
vi.mock('@/lib/supabase', () => {
  const mockFrom = vi.fn()
  return {
    supabase: {
      from: mockFrom
    }
  }
})

// Import mocked supabase after mocking
import { supabase as mockSupabase } from '@/lib/supabase'

const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>

describe('POST /api/battles/moves', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('should return 400 if required fields are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/battles/moves', {
      method: 'POST',
      body: JSON.stringify({})
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('should record a move and switch turns when battle continues', async () => {
    // Mock battle move insert
    mockFrom.mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'move-1',
              battle_id: 'battle-1',
              player_id: 'player-1',
              move_id: 1,
              turn_number: 1,
              damage_dealt: 30,
              target_hp_remaining: 70
            },
            error: null
          }))
        }))
      }))
    })

    // Mock battle fetch
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'battle-1',
              player1_id: 'player-1',
              player2_id: 'player-2',
              current_turn: 'player-1',
              status: 'in_progress'
            },
            error: null
          }))
        }))
      }))
    })

    // Mock battle update (switch turn)
    mockFrom.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })

    const request = new NextRequest('http://localhost:3000/api/battles/moves', {
      method: 'POST',
      body: JSON.stringify({
        battle_id: 'battle-1',
        player_id: 'player-1',
        move_id: 1,
        turn_number: 1,
        damage_dealt: 30,
        target_hp_remaining: 70
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.battle_ended).toBe(false)
    expect(data.battleMove).toBeDefined()
  })

  it('should complete battle and award rewards when opponent HP reaches 0', async () => {
    // Mock battle move insert
    mockFrom.mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'move-1',
              battle_id: 'battle-1',
              player_id: 'player-1',
              move_id: 1,
              turn_number: 5,
              damage_dealt: 50,
              target_hp_remaining: 0
            },
            error: null
          }))
        }))
      }))
    })

    // Mock battle fetch
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'battle-1',
              player1_id: 'player-1',
              player2_id: 'player-2',
              current_turn: 'player-1',
              status: 'in_progress',
              battle_type: 'pvp'
            },
            error: null
          }))
        }))
      }))
    })

    // Mock battle update (set completed)
    mockFrom.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })

    // Mock winner fetch
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'player-1',
              wallet_address: 'mock-wallet'
            },
            error: null
          }))
        }))
      }))
    })

    // Mock battle update (set reward)
    mockFrom.mockReturnValueOnce({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })

    const request = new NextRequest('http://localhost:3000/api/battles/moves', {
      method: 'POST',
      body: JSON.stringify({
        battle_id: 'battle-1',
        player_id: 'player-1',
        move_id: 1,
        turn_number: 5,
        damage_dealt: 50,
        target_hp_remaining: 0
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.battle_ended).toBe(true)
    expect(data.winner_id).toBe('player-1')
    expect(data.reward_amount).toBe(200)
    expect(data.reward_status).toBe('pending')
  })
})
