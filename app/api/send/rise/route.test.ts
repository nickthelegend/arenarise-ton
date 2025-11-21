import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock fetch globally
global.fetch = vi.fn()

describe('POST /api/send/rise', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully proxy request to backend', async () => {
    const mockBackendResponse = {
      success: true,
      message: 'RISE jetton sent!',
      fromWallet: 'EQD77r9HUu7VXdz-l_pgzfDgJWdHKNgk45oza4QZ7Z1CykNY',
      toWallet: '0QBZLTG194NM_tKRI7C_D5fJomCGS7zgjJKe051uomBmn7BA',
      jettonAmount: '200000000000',
      seqno: 5
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockBackendResponse
    })

    const request = new NextRequest('http://localhost:3000/api/send/rise', {
      method: 'POST',
      body: JSON.stringify({
        userWallet: '0QBZLTG194NM_tKRI7C_D5fJomCGS7zgjJKe051uomBmn7BA',
        amount: 200
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockBackendResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://arenarise-backend.vercel.app/api/send/rise',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    )
  })

  it('should return 400 if wallet address is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/send/rise', {
      method: 'POST',
      body: JSON.stringify({
        amount: 200
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('User wallet address is required')
  })

  it('should return 400 if amount is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/send/rise', {
      method: 'POST',
      body: JSON.stringify({
        userWallet: '0QBZLTG194NM_tKRI7C_D5fJomCGS7zgjJKe051uomBmn7BA',
        amount: -10
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid RISE amount is required')
  })

  it('should return 503 for backend 5xx errors', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal server error'
    })

    const request = new NextRequest('http://localhost:3000/api/send/rise', {
      method: 'POST',
      body: JSON.stringify({
        userWallet: '0QBZLTG194NM_tKRI7C_D5fJomCGS7zgjJKe051uomBmn7BA',
        amount: 200
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toBe('Service temporarily unavailable. Please try again.')
  })

  it('should return appropriate error for backend 4xx errors', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => 'Bad request'
    })

    const request = new NextRequest('http://localhost:3000/api/send/rise', {
      method: 'POST',
      body: JSON.stringify({
        userWallet: '0QBZLTG194NM_tKRI7C_D5fJomCGS7zgjJKe051uomBmn7BA',
        amount: 200
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Failed to send RISE tokens')
  })

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const request = new NextRequest('http://localhost:3000/api/send/rise', {
      method: 'POST',
      body: JSON.stringify({
        userWallet: '0QBZLTG194NM_tKRI7C_D5fJomCGS7zgjJKe051uomBmn7BA',
        amount: 200
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Network error')
  })
})
