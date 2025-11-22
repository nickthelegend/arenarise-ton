import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}))

describe('POST /api/battles/pve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 if required fields are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/battles/pve', {
      method: 'POST',
      body: JSON.stringify({})
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing required fields')
  })

  it('should return 400 if enemy_id is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/battles/pve', {
      method: 'POST',
      body: JSON.stringify({
        player_id: 'test-player',
        beast_id: 1,
        enemy_id: 999 // Invalid enemy ID
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid enemy_id')
  })

  it('should validate enemy_id is within valid range', async () => {
    const request = new NextRequest('http://localhost:3000/api/battles/pve', {
      method: 'POST',
      body: JSON.stringify({
        player_id: 'test-player',
        beast_id: 1,
        enemy_id: 1 // Valid enemy ID (1-6)
      })
    })

    // This will fail at beast validation, but enemy validation passes
    const response = await POST(request)
    const data = await response.json()

    // Should not be invalid enemy error
    expect(data.error).not.toBe('Invalid enemy_id')
  })
})
