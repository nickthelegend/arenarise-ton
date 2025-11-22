import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}))

describe('GET /api/battles/history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 if player_id is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/battles/history')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required parameter: player_id')
  })

  it('should return battle history for a valid player_id', async () => {
    const playerId = '11111111-1111-1111-1111-111111111111'
    
    // Mock the supabase response
    const mockBattles = [
      {
        id: 'battle-1',
        enemy_id: 1,
        winner_id: playerId,
        player1_id: playerId,
        reward_amount: 200,
        created_at: '2024-01-01T00:00:00Z',
        status: 'completed'
      },
      {
        id: 'battle-2',
        enemy_id: 2,
        winner_id: null,
        player1_id: playerId,
        reward_amount: 0,
        created_at: '2024-01-02T00:00:00Z',
        status: 'completed'
      }
    ]

    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockBattles,
              error: null
            })
          })
        })
      })
    } as any)

    const request = new NextRequest(`http://localhost:3000/api/battles/history?player_id=${playerId}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.battles).toHaveLength(2)
    expect(data.battles[0]).toMatchObject({
      id: 'battle-1',
      enemy_name: 'Goblin Scout',
      won: true,
      reward: 200
    })
    expect(data.battles[1]).toMatchObject({
      id: 'battle-2',
      enemy_name: 'Dark Mage',
      won: false,
      reward: 0
    })
  })

  it('should handle database errors gracefully', async () => {
    const playerId = '11111111-1111-1111-1111-111111111111'
    
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      })
    } as any)

    const request = new NextRequest(`http://localhost:3000/api/battles/history?player_id=${playerId}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error')
  })

  it('should return empty array when player has no battles', async () => {
    const playerId = '11111111-1111-1111-1111-111111111111'
    
    const { supabase } = await import('@/lib/supabase')
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      })
    } as any)

    const request = new NextRequest(`http://localhost:3000/api/battles/history?player_id=${playerId}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.battles).toEqual([])
  })
})
