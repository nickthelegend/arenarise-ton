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

describe('GET /api/profile/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return combined transaction history from swaps and coin flips', async () => {
    const mockSwaps = [
      {
        id: 'swap-1',
        ton_amount: 10.5,
        rise_amount: 1050,
        status: 'completed',
        created_at: '2024-01-03T00:00:00Z'
      }
    ]

    const mockFlips = [
      {
        id: 'flip-1',
        won: true,
        payout: 20.0,
        created_at: '2024-01-02T00:00:00Z',
        status: 'completed'
      }
    ]

    const mockFrom = vi.fn((table: string) => {
      if (table === 'swap_transactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockSwaps,
                error: null
              })
            })
          })
        }
      } else if (table === 'coin_flips') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockFlips,
                  error: null
                })
              })
            })
          })
        }
      }
    })

    ;(supabase.from as any) = mockFrom

    const request = new NextRequest('http://localhost:3000/api/profile/transactions?wallet_address=0:abc123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.transactions).toHaveLength(2)
    
    // Verify swap transaction format
    const swapTx = data.transactions.find((tx: any) => tx.type === 'swap')
    expect(swapTx).toBeDefined()
    expect(swapTx.id).toBe('swap-1')
    expect(swapTx.rise_amount).toBe(1050)
    expect(swapTx.ton_amount).toBe(10.5)
    expect(swapTx.status).toBe('completed')
    
    // Verify reward transaction format
    const rewardTx = data.transactions.find((tx: any) => tx.type === 'reward')
    expect(rewardTx).toBeDefined()
    expect(rewardTx.id).toBe('flip-1')
    expect(rewardTx.rise_amount).toBe(20.0)
    expect(rewardTx.status).toBe('completed')
  })

  it('should return 400 if wallet_address is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/profile/transactions')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('wallet_address is required')
  })

  it('should return empty array when no transactions exist', async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === 'swap_transactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        }
      } else if (table === 'coin_flips') {
        return {
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
        }
      }
    })

    ;(supabase.from as any) = mockFrom

    const request = new NextRequest('http://localhost:3000/api/profile/transactions?wallet_address=0:xyz789')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.transactions).toEqual([])
  })

  it('should handle swap_transactions database errors gracefully', async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === 'swap_transactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' }
              })
            })
          })
        }
      }
    })

    ;(supabase.from as any) = mockFrom

    const request = new NextRequest('http://localhost:3000/api/profile/transactions?wallet_address=0:abc123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch transaction history')
  })

  it('should handle coin_flips database errors gracefully', async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === 'swap_transactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        }
      } else if (table === 'coin_flips') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database connection failed' }
                })
              })
            })
          })
        }
      }
    })

    ;(supabase.from as any) = mockFrom

    const request = new NextRequest('http://localhost:3000/api/profile/transactions?wallet_address=0:abc123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch transaction history')
  })

  it('should sort transactions by timestamp descending (most recent first)', async () => {
    const mockSwaps = [
      {
        id: 'swap-1',
        ton_amount: 5.0,
        rise_amount: 500,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    const mockFlips = [
      {
        id: 'flip-1',
        won: true,
        payout: 10.0,
        created_at: '2024-01-03T00:00:00Z',
        status: 'completed'
      }
    ]

    const mockFrom = vi.fn((table: string) => {
      if (table === 'swap_transactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockSwaps,
                error: null
              })
            })
          })
        }
      } else if (table === 'coin_flips') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockFlips,
                  error: null
                })
              })
            })
          })
        }
      }
    })

    ;(supabase.from as any) = mockFrom

    const request = new NextRequest('http://localhost:3000/api/profile/transactions?wallet_address=0:abc123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.transactions).toHaveLength(2)
    
    // Verify most recent transaction is first
    expect(data.transactions[0].id).toBe('flip-1')
    expect(data.transactions[1].id).toBe('swap-1')
    
    // Verify timestamp ordering
    expect(new Date(data.transactions[0].timestamp).getTime()).toBeGreaterThan(
      new Date(data.transactions[1].timestamp).getTime()
    )
  })

  it('should only include winning coin flips as rewards', async () => {
    const mockSwaps: any[] = []

    const mockFlips = [
      {
        id: 'flip-win',
        won: true,
        payout: 20.0,
        created_at: '2024-01-02T00:00:00Z',
        status: 'completed'
      }
    ]

    const mockFrom = vi.fn((table: string) => {
      if (table === 'swap_transactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockSwaps,
                error: null
              })
            })
          })
        }
      } else if (table === 'coin_flips') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockFlips,
                  error: null
                })
              })
            })
          })
        }
      }
    })

    ;(supabase.from as any) = mockFrom

    const request = new NextRequest('http://localhost:3000/api/profile/transactions?wallet_address=0:abc123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.transactions).toHaveLength(1)
    expect(data.transactions[0].type).toBe('reward')
    expect(data.transactions[0].id).toBe('flip-win')
  })

  it('should include all required fields in transaction response', async () => {
    const mockSwaps = [
      {
        id: 'swap-1',
        ton_amount: 10.0,
        rise_amount: 1000,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    const mockFrom = vi.fn((table: string) => {
      if (table === 'swap_transactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockSwaps,
                error: null
              })
            })
          })
        }
      } else if (table === 'coin_flips') {
        return {
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
        }
      }
    })

    ;(supabase.from as any) = mockFrom

    const request = new NextRequest('http://localhost:3000/api/profile/transactions?wallet_address=0:abc123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.transactions[0]).toHaveProperty('id')
    expect(data.transactions[0]).toHaveProperty('type')
    expect(data.transactions[0]).toHaveProperty('rise_amount')
    expect(data.transactions[0]).toHaveProperty('timestamp')
    expect(data.transactions[0]).toHaveProperty('status')
  })
})
