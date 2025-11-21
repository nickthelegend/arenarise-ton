import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from './route'
import { supabase } from '@/lib/supabase'
import { NextRequest } from 'next/server'

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('GET /api/swap/history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return transactions for a wallet address', async () => {
    const mockTransactions = [
      {
        id: '123',
        wallet_address: '0:abc123',
        ton_amount: '1.5',
        rise_amount: '4500',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockTransactions,
            error: null
          })
        })
      })
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const request = new NextRequest('http://localhost:3000/api/swap/history?wallet_address=0:abc123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.transactions).toEqual(mockTransactions)
  })

  it('should return 400 if wallet address is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/swap/history')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Wallet address is required')
  })

  it('should return empty array when no transactions exist', async () => {
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

    const request = new NextRequest('http://localhost:3000/api/swap/history?wallet_address=0:xyz789')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.transactions).toEqual([])
  })
})

describe('POST /api/swap/history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a new transaction record', async () => {
    const mockTransaction = {
      id: '456',
      wallet_address: '0:abc123',
      ton_amount: '2.0',
      rise_amount: '6000',
      status: 'completed',
      transaction_hash: 'hash123',
      created_at: '2024-01-01T00:00:00Z'
    }

    const mockFrom = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockTransaction,
            error: null
          })
        })
      })
    })

    vi.mocked(supabase.from).mockImplementation(mockFrom)

    const request = new NextRequest('http://localhost:3000/api/swap/history', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: '0:abc123',
        ton_amount: '2.0',
        rise_amount: '6000',
        status: 'completed',
        transaction_hash: 'hash123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.transaction).toEqual(mockTransaction)
  })

  it('should return 400 if wallet address is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/swap/history', {
      method: 'POST',
      body: JSON.stringify({
        ton_amount: '2.0',
        rise_amount: '6000',
        status: 'completed'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Wallet address is required')
  })

  it('should return 400 if ton_amount is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/swap/history', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: '0:abc123',
        ton_amount: 'invalid',
        rise_amount: '6000',
        status: 'completed'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid TON amount is required')
  })

  it('should return 400 if status is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/swap/history', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: '0:abc123',
        ton_amount: '2.0',
        rise_amount: '6000',
        status: 'invalid_status'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid status is required (pending, completed, or failed)')
  })
})
