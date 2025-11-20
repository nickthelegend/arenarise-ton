import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from './route'
import { supabase } from '@/lib/supabase'

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return statistics with all counts', async () => {
    const mockBattles = [
      { bet_amount: 10.5 },
      { bet_amount: 20.0 },
      { bet_amount: 15.75 }
    ]

    let battlesCallCount = 0
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'beasts') {
        return {
          select: vi.fn().mockResolvedValue({
            count: 42,
            error: null
          })
        }
      } else if (table === 'users') {
        return {
          select: vi.fn().mockResolvedValue({
            count: 15,
            error: null
          })
        }
      } else if (table === 'battles') {
        battlesCallCount++
        if (battlesCallCount === 1) {
          // First call is for count
          return {
            select: vi.fn().mockResolvedValue({
              count: 8,
              error: null
            })
          }
        } else {
          // Second call is for bet_amount data
          return {
            select: vi.fn().mockResolvedValue({
              data: mockBattles,
              error: null
            })
          }
        }
      }
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalBeasts).toBe(42)
    expect(data.activePlayers).toBe(15)
    expect(data.battlesFought).toBe(8)
    expect(data.totalVolume).toBe('46.25')
  })

  it('should handle zero counts gracefully', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'beasts') {
        return {
          select: vi.fn().mockResolvedValue({
            count: 0,
            error: null
          })
        }
      } else if (table === 'users') {
        return {
          select: vi.fn().mockResolvedValue({
            count: 0,
            error: null
          })
        }
      } else if (table === 'battles') {
        const selectMock = vi.fn()
        let callCount = 0
        selectMock.mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve({
              count: 0,
              error: null
            })
          } else {
            return Promise.resolve({
              data: [],
              error: null
            })
          }
        })
        return {
          select: selectMock
        }
      }
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalBeasts).toBe(0)
    expect(data.activePlayers).toBe(0)
    expect(data.battlesFought).toBe(0)
    expect(data.totalVolume).toBe('0.00')
  })

  it('should handle database errors', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        count: null,
        error: { message: 'Database connection failed' }
      })
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database connection failed')
  })
})
