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

vi.mock('@/lib/battle-utils', () => ({
  calculateReward: vi.fn((winner: string) => winner === 'player' ? 200 : 0),
  recordReward: vi.fn(() => Promise.resolve({ success: true }))
}))

vi.mock('@/lib/swap-utils', () => ({
  requestRiseTokens: vi.fn(() => Promise.resolve({
    success: true,
    message: 'Transfer successful',
    fromWallet: 'mock-from-wallet',
    toWallet: 'mock-to-wallet',
    jettonAmount: '200',
    seqno: 12345
  })),
  RiseTransferError: class RiseTransferError extends Error {
    constructor(message: string, public statusCode?: number, public isRetryable: boolean = false) {
      super(message)
      this.name = 'RiseTransferError'
    }
  }
}))

// Import mocked supabase after mocking
import { supabase as mockSupabase } from '@/lib/supabase'
import { requestRiseTokens } from '@/lib/swap-utils'

const mockFrom = mockSupabase.from as ReturnType<typeof vi.fn>

describe('POST /api/battles/[id]/complete', () => {
  beforeEach(() => {
    // Reset mocks but don't clear the mock queue
    mockFrom.mockReset()
    vi.mocked(requestRiseTokens).mockReset()
    
    // Set default mock implementation for supabase.from
    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
    
    // Reset requestRiseTokens to default successful behavior
    vi.mocked(requestRiseTokens).mockResolvedValue({
      success: true,
      message: 'Transfer successful',
      fromWallet: 'mock-from-wallet',
      toWallet: 'mock-to-wallet',
      jettonAmount: '200',
      seqno: 12345
    })
  })

  it('should return 400 if required fields are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/battles/123/complete', {
      method: 'POST',
      body: JSON.stringify({})
    })

    const response = await POST(request, { params: { id: '123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Battle completion data is incomplete')
    expect(data.code).toBe('MISSING_REQUIRED_FIELDS')
  })

  it('should return 400 if winner is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/battles/123/complete', {
      method: 'POST',
      body: JSON.stringify({
        winner: 'invalid',
        final_player_hp: 100,
        final_enemy_hp: 0
      })
    })

    const response = await POST(request, { params: { id: '123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid battle result')
    expect(data.code).toBe('INVALID_WINNER_VALUE')
  })

  it('should return 404 if battle does not exist', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } }))
        }))
      }))
    })

    const request = new NextRequest('http://localhost:3000/api/battles/123/complete', {
      method: 'POST',
      body: JSON.stringify({
        winner: 'player',
        final_player_hp: 100,
        final_enemy_hp: 0
      })
    })

    const response = await POST(request, { params: { id: '123' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('Battle not found')
    expect(data.code).toBe('BATTLE_NOT_FOUND')
  })

  it('should return 400 if battle is already completed', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: '123',
              player1_id: 'player-1',
              status: 'completed',
              battle_type: 'pve'
            },
            error: null
          }))
        }))
      }))
    })

    const request = new NextRequest('http://localhost:3000/api/battles/123/complete', {
      method: 'POST',
      body: JSON.stringify({
        winner: 'player',
        final_player_hp: 100,
        final_enemy_hp: 0
      })
    })

    const response = await POST(request, { params: { id: '123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('This battle has already ended')
    expect(data.code).toBe('BATTLE_ALREADY_COMPLETED')
  })

  it('should return 400 if winner validation fails (player wins but enemy HP not zero)', async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: '123',
              player1_id: 'player-1',
              status: 'in_progress',
              battle_type: 'pve'
            },
            error: null
          }))
        }))
      }))
    })

    const request = new NextRequest('http://localhost:3000/api/battles/123/complete', {
      method: 'POST',
      body: JSON.stringify({
        winner: 'player',
        final_player_hp: 100,
        final_enemy_hp: 50 // Enemy still has HP
      })
    })

    const response = await POST(request, { params: { id: '123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Battle result is invalid')
    expect(data.code).toBe('INVALID_BATTLE_RESULT')
  })

  it('should successfully complete battle when player wins', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: '123',
                player1_id: 'player-1',
                status: 'in_progress',
                battle_type: 'pve'
              },
              error: null
            }))
          }))
        }))
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'player-1',
                wallet_address: 'mock-wallet-address'
              },
              error: null
            }))
          }))
        }))
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      })

    const request = new NextRequest('http://localhost:3000/api/battles/123/complete', {
      method: 'POST',
      body: JSON.stringify({
        winner: 'player',
        final_player_hp: 100,
        final_enemy_hp: 0
      })
    })

    const response = await POST(request, { params: { id: '123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.won).toBe(true)
    expect(data.reward).toBe(200)
    expect(data.battle.reward_status).toBe('completed')
  })

  it('should successfully complete battle when player loses', async () => {
    // Mock the battle fetch
    mockFrom.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: '123',
              player1_id: 'player-1',
              status: 'in_progress',
              battle_type: 'pve'
            },
            error: null
          }))
        }))
      })),
      update: vi.fn()
    } as any)
    
    // Mock the battle update
    mockFrom.mockReturnValueOnce({
      select: vi.fn(),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    } as any)

    const request = new NextRequest('http://localhost:3000/api/battles/123/complete', {
      method: 'POST',
      body: JSON.stringify({
        winner: 'enemy',
        final_player_hp: 0,
        final_enemy_hp: 50
      })
    })

    const response = await POST(request, { params: { id: '123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.won).toBe(false)
    expect(data.reward).toBe(0)
  })

  it('should mark battle as pending when player wallet is not found', async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: '123',
                player1_id: 'player-1',
                status: 'in_progress',
                battle_type: 'pve'
              },
              error: null
            }))
          }))
        }))
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Player not found' }
            }))
          }))
        }))
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      })

    const request = new NextRequest('http://localhost:3000/api/battles/123/complete', {
      method: 'POST',
      body: JSON.stringify({
        winner: 'player',
        final_player_hp: 100,
        final_enemy_hp: 0
      })
    })

    const response = await POST(request, { params: { id: '123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.battle.reward_status).toBe('pending')
  })

  it('should handle RISE transfer failures gracefully', async () => {
    const { requestRiseTokens, RiseTransferError } = await import('@/lib/swap-utils')
    
    vi.mocked(requestRiseTokens).mockRejectedValueOnce(
      new RiseTransferError('Transfer failed', 500, true)
    )

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: '123',
                player1_id: 'player-1',
                status: 'in_progress',
                battle_type: 'pve'
              },
              error: null
            }))
          }))
        }))
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'player-1',
                wallet_address: 'mock-wallet-address'
              },
              error: null
            }))
          }))
        }))
      })
      .mockReturnValueOnce({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null }))
        }))
      })

    const request = new NextRequest('http://localhost:3000/api/battles/123/complete', {
      method: 'POST',
      body: JSON.stringify({
        winner: 'player',
        final_player_hp: 100,
        final_enemy_hp: 0
      })
    })

    const response = await POST(request, { params: { id: '123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.battle.reward_status).toBe('pending')
  })
})
