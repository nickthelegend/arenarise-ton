import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

// Mock coin flip utils to make tests deterministic
vi.mock('@/lib/coin-flip-utils', async () => {
  const actual = await vi.importActual('@/lib/coin-flip-utils')
  return {
    ...actual,
    generateCoinFlipResult: vi.fn(() => 'heads')
  }
})

import { supabase } from '@/lib/supabase'

const mockSupabase = supabase as any

describe('POST /api/bets/flip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock responses
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({ data: null, error: null }))
            }))
          }))
        }
      }
      if (table === 'coin_flips') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'test-flip-id',
                  wallet_address: 'test-wallet',
                  bet_amount: 10,
                  choice: 'heads',
                  result: 'heads',
                  won: true,
                  payout: 20,
                  transaction_hash: 'test-hash',
                  status: 'completed'
                },
                error: null
              }))
            }))
          }))
        }
      }
      return mockSupabase.from()
    })
  })

  it('should return 400 if wallet_address is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/bets/flip', {
      method: 'POST',
      body: JSON.stringify({
        bet_amount: 10,
        choice: 'heads',
        transaction_hash: 'test-hash'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('wallet_address')
  })

  it('should return 400 if bet_amount is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/bets/flip', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: 'test-wallet',
        choice: 'heads',
        transaction_hash: 'test-hash'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('bet_amount')
  })

  it('should return 400 if choice is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/bets/flip', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: 'test-wallet',
        bet_amount: 10,
        choice: 'invalid',
        transaction_hash: 'test-hash'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('choice')
  })

  it('should return 400 if transaction_hash is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/bets/flip', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: 'test-wallet',
        bet_amount: 10,
        choice: 'heads'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('transaction_hash')
  })

  it('should return 400 if bet amount is zero or negative', async () => {
    const request = new NextRequest('http://localhost:3000/api/bets/flip', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: 'test-wallet',
        bet_amount: -5,
        choice: 'heads',
        transaction_hash: 'test-hash'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('greater than zero')
  })

  it('should successfully process a winning flip', async () => {
    const request = new NextRequest('http://localhost:3000/api/bets/flip', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: 'test-wallet',
        bet_amount: 10,
        choice: 'heads',
        transaction_hash: 'test-hash'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.result).toBe('heads')
    expect(data.won).toBe(true)
    expect(data.payout).toBe(20)
    expect(data.flip_id).toBe('test-flip-id')
  })

  it('should successfully process a losing flip', async () => {
    const request = new NextRequest('http://localhost:3000/api/bets/flip', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: 'test-wallet',
        bet_amount: 10,
        choice: 'tails', // Will lose since mock returns 'heads'
        transaction_hash: 'test-hash'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.result).toBe('heads')
    expect(data.won).toBe(false)
    expect(data.payout).toBeUndefined()
  })
})
