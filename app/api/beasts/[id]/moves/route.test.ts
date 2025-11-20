import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { supabase } from '@/lib/supabase'

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('POST /api/beasts/[id]/moves', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 for invalid beast ID', async () => {
    const request = new Request('http://localhost:3000/api/beasts/invalid/moves', {
      method: 'POST'
    })
    const params = { id: 'invalid' }

    const response = await POST(request as any, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid beast ID')
  })

  it('should return 404 when beast does not exist', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' }
          })
        })
      })
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const request = new Request('http://localhost:3000/api/beasts/999/moves', {
      method: 'POST'
    })
    const params = { id: '999' }

    const response = await POST(request as any, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Beast not found')
  })

  it('should assign 4 random moves to a beast', async () => {
    const mockMoves = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 }
    ]

    const mockAssignedMoves = [
      { slot: 1, move_id: 1, moves: { id: 1, name: 'Fire Blast', damage: 35, type: 'Fire', description: 'A powerful flame attack' } },
      { slot: 2, move_id: 2, moves: { id: 2, name: 'Thunder Strike', damage: 40, type: 'Electric', description: 'A lightning attack' } },
      { slot: 3, move_id: 3, moves: { id: 3, name: 'Ice Shard', damage: 30, type: 'Ice', description: 'Sharp ice projectiles' } },
      { slot: 4, move_id: 4, moves: { id: 4, name: 'Earthquake', damage: 45, type: 'Earth', description: 'Ground-shaking attack' } }
    ]

    let callCount = 0
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'beasts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 1 },
                error: null
              })
            })
          })
        }
      } else if (table === 'moves') {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockMoves,
            error: null
          })
        }
      } else if (table === 'beast_moves') {
        callCount++
        if (callCount === 1) {
          // First call is insert
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({
                data: [
                  { beast_id: 1, move_id: 1, slot: 1 },
                  { beast_id: 1, move_id: 2, slot: 2 },
                  { beast_id: 1, move_id: 3, slot: 3 },
                  { beast_id: 1, move_id: 4, slot: 4 }
                ],
                error: null
              })
            })
          }
        } else {
          // Second call is select with join
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockAssignedMoves,
                  error: null
                })
              })
            })
          }
        }
      }
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const request = new Request('http://localhost:3000/api/beasts/1/moves', {
      method: 'POST'
    })
    const params = { id: '1' }

    const response = await POST(request as any, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.beast_id).toBe(1)
    expect(data.moves).toHaveLength(4)
    expect(data.moves[0].slot).toBe(1)
    expect(data.moves[3].slot).toBe(4)
  })

  it('should return 500 when not enough moves available', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'beasts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 1 },
                error: null
              })
            })
          })
        }
      } else if (table === 'moves') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ id: 1 }, { id: 2 }], // Only 2 moves
            error: null
          })
        }
      }
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const request = new Request('http://localhost:3000/api/beasts/1/moves', {
      method: 'POST'
    })
    const params = { id: '1' }

    const response = await POST(request as any, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Not enough moves available in database')
  })
})
