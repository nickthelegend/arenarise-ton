import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

// Mock the room-code-utils module
vi.mock('@/lib/room-code-utils', () => ({
  isValidRoomCodeFormat: vi.fn((code: string) => code.length === 6)
}))

describe('POST /api/battles/rooms/join', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should accept join request without beast_id', async () => {
    const { supabase } = await import('@/lib/supabase')
    
    // Mock the database responses
    const mockBattle = {
      id: 'battle-123',
      player1_id: 'player1',
      player2_id: null,
      beast1_id: 100,
      beast2_id: null,
      status: 'waiting',
      room_code: 'ABC123'
    }

    const mockUpdatedBattle = {
      ...mockBattle,
      player2_id: 'player2',
      beast2_id: null,
      status: 'waiting'
    }

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // First call: find battle
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBattle, error: null })
        } as any
      } else {
        // Second call: update battle
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockUpdatedBattle, error: null })
                })
              })
            })
          })
        } as any
      }
    })

    const request = new NextRequest('http://localhost/api/battles/rooms/join', {
      method: 'POST',
      body: JSON.stringify({
        room_code: 'ABC123',
        player_id: 'player2'
        // No beast_id provided
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.battle.player2_id).toBe('player2')
    expect(data.battle.beast2_id).toBe(null)
    expect(data.battle.status).toBe('waiting')
  })

  it('should accept join request with beast_id for backward compatibility', async () => {
    const { supabase } = await import('@/lib/supabase')
    
    // Mock the database responses
    const mockBeast = {
      id: 200,
      speed: 50
    }

    const mockBattle = {
      id: 'battle-123',
      player1_id: 'player1',
      player2_id: null,
      beast1_id: 100,
      beast2_id: null,
      status: 'waiting',
      room_code: 'ABC123'
    }

    const mockBeast1 = {
      speed: 40
    }

    const mockUpdatedBattle = {
      ...mockBattle,
      player2_id: 'player2',
      beast2_id: 200,
      status: 'in_progress',
      current_turn: 'player2'
    }

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      callCount++
      
      if (callCount === 1) {
        // First call: verify beast exists
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBeast, error: null })
        } as any
      } else if (callCount === 2) {
        // Second call: find battle
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBattle, error: null })
        } as any
      } else if (callCount === 3) {
        // Third call: get beast1 speed
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBeast1, error: null })
        } as any
      } else {
        // Fourth call: update battle
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedBattle, error: null })
        } as any
      }
    })

    const request = new NextRequest('http://localhost/api/battles/rooms/join', {
      method: 'POST',
      body: JSON.stringify({
        room_code: 'ABC123',
        player_id: 'player2',
        beast_id: 200
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.battle.player2_id).toBe('player2')
    expect(data.battle.beast2_id).toBe(200)
    expect(data.battle.status).toBe('in_progress')
    expect(data.battle.current_turn).toBe('player2')
  })

  it('should reject request without required fields', async () => {
    const request = new NextRequest('http://localhost/api/battles/rooms/join', {
      method: 'POST',
      body: JSON.stringify({
        room_code: 'ABC123'
        // Missing player_id
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Room code and player information are required')
  })
})
