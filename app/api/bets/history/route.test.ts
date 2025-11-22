import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from './route'
import { supabase } from '@/lib/supabase'
import { NextRequest } from 'next/server'

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('GET /api/bets/history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return coin flip history for a wallet address', async () => {
    const mockFlips = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        bet_amount: 1.5,
        choice: 'heads',
        result: 'heads',
        won: true,
        payout: 3.0,
        created_at: '2024-01-02T00:00:00Z'
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        bet_amount: 2.0,
        choice: 'tails',
        result: 'heads',
        won: false,
        payout: 0,
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockFlips,
            error: null
          })
        })
      })
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const request = new NextRequest('http://localhost:3000/api/bets/history?wallet_address=0:abc123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.flips).toEqual(mockFlips)
    expect(data.flips).toHaveLength(2)
    // Verify ordering (most recent first)
    expect(new Date(data.flips[0].created_at).getTime()).toBeGreaterThan(
      new Date(data.flips[1].created_at).getTime()
    )
  })

  it('should return 400 if wallet_address is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/bets/history')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('wallet_address is required')
  })

  it('should return empty array when no flips exist for wallet', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const request = new NextRequest('http://localhost:3000/api/bets/history?wallet_address=0:xyz789')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.flips).toEqual([])
  })

  it('should handle database errors gracefully', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const request = new NextRequest('http://localhost:3000/api/bets/history?wallet_address=0:abc123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch betting history')
  })

  it('should include all required fields in response', async () => {
    const mockFlips = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        bet_amount: 5.0,
        choice: 'tails',
        result: 'tails',
        won: true,
        payout: 10.0,
        created_at: '2024-01-03T00:00:00Z'
      }
    ]

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockFlips,
            error: null
          })
        })
      })
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const request = new NextRequest('http://localhost:3000/api/bets/history?wallet_address=0:abc123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.flips[0]).toHaveProperty('id')
    expect(data.flips[0]).toHaveProperty('bet_amount')
    expect(data.flips[0]).toHaveProperty('choice')
    expect(data.flips[0]).toHaveProperty('result')
    expect(data.flips[0]).toHaveProperty('won')
    expect(data.flips[0]).toHaveProperty('payout')
    expect(data.flips[0]).toHaveProperty('created_at')
  })
})
