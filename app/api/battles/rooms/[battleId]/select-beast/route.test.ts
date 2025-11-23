import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH } from './route'
import { NextRequest } from 'next/server'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

describe('PATCH /api/battles/rooms/[battleId]/select-beast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully select beast for player1', async () => {
    const { supabase } = await import('@/lib/supabase')
    
    const mockBattle = {
      id: 'battle-123',
      player1_id: 'player1',
      player2_id: 'player2',
      beast1_id: null,
      beast2_id: null,
      beast1_locked: false,
      beast2_locked: false,
      status: 'waiting'
    }

    const mockBeast = {
      id: 100,
      owner_address: '0:abc123'
    }

    const mockPlayer = {
      id: 'player1',
      wallet_address: '0:abc123'
    }

    const mockUpdatedBattle = {
      ...mockBattle,
      beast1_id: 100,
      beast1_locked: true
    }

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // Get battle
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBattle, error: null })
        } as any
      } else if (callCount === 2) {
        // Get beast
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBeast, error: null })
        } as any
      } else if (callCount === 3) {
        // Get player
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPlayer, error: null })
        } as any
      } else {
        // Update battle
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedBattle, error: null })
        } as any
      }
    })

    const request = new NextRequest('http://localhost/api/battles/rooms/battle-123/select-beast', {
      method: 'PATCH',
      body: JSON.stringify({
        player_id: 'player1',
        beast_id: 100
      })
    })

    const response = await PATCH(request, { params: { battleId: 'battle-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.battle.beast1_id).toBe(100)
    expect(data.battle.beast1_locked).toBe(true)
  })

  it('should reject if beast is already locked', async () => {
    const { supabase } = await import('@/lib/supabase')
    
    const mockBattle = {
      id: 'battle-123',
      player1_id: 'player1',
      player2_id: 'player2',
      beast1_id: 100,
      beast2_id: null,
      beast1_locked: true,
      beast2_locked: false,
      status: 'waiting'
    }

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockBattle, error: null })
    } as any))

    const request = new NextRequest('http://localhost/api/battles/rooms/battle-123/select-beast', {
      method: 'PATCH',
      body: JSON.stringify({
        player_id: 'player1',
        beast_id: 200
      })
    })

    const response = await PATCH(request, { params: { battleId: 'battle-123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('BEAST_ALREADY_LOCKED')
  })

  it('should reject if player is not part of battle', async () => {
    const { supabase } = await import('@/lib/supabase')
    
    const mockBattle = {
      id: 'battle-123',
      player1_id: 'player1',
      player2_id: 'player2',
      beast1_id: null,
      beast2_id: null,
      beast1_locked: false,
      beast2_locked: false,
      status: 'waiting'
    }

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockBattle, error: null })
    } as any))

    const request = new NextRequest('http://localhost/api/battles/rooms/battle-123/select-beast', {
      method: 'PATCH',
      body: JSON.stringify({
        player_id: 'player3',
        beast_id: 100
      })
    })

    const response = await PATCH(request, { params: { battleId: 'battle-123' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.code).toBe('PLAYER_NOT_IN_BATTLE')
  })

  it('should reject if beast does not belong to player', async () => {
    const { supabase } = await import('@/lib/supabase')
    
    const mockBattle = {
      id: 'battle-123',
      player1_id: 'player1',
      player2_id: 'player2',
      beast1_id: null,
      beast2_id: null,
      beast1_locked: false,
      beast2_locked: false,
      status: 'waiting'
    }

    const mockBeast = {
      id: 100,
      owner_address: '0:different'
    }

    const mockPlayer = {
      id: 'player1',
      wallet_address: '0:abc123'
    }

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // Get battle
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBattle, error: null })
        } as any
      } else if (callCount === 2) {
        // Get beast
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBeast, error: null })
        } as any
      } else {
        // Get player
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPlayer, error: null })
        } as any
      }
    })

    const request = new NextRequest('http://localhost/api/battles/rooms/battle-123/select-beast', {
      method: 'PATCH',
      body: JSON.stringify({
        player_id: 'player1',
        beast_id: 100
      })
    })

    const response = await PATCH(request, { params: { battleId: 'battle-123' } })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.code).toBe('BEAST_NOT_OWNED')
  })

  it('should start battle when both beasts are locked', async () => {
    const { supabase } = await import('@/lib/supabase')
    
    const mockBattle = {
      id: 'battle-123',
      player1_id: 'player1',
      player2_id: 'player2',
      beast1_id: 100,
      beast2_id: null,
      beast1_locked: true,
      beast2_locked: false,
      status: 'waiting'
    }

    const mockBeast = {
      id: 200,
      owner_address: '0:def456'
    }

    const mockPlayer = {
      id: 'player2',
      wallet_address: '0:def456'
    }

    const mockBeast1 = {
      speed: 50
    }

    const mockBeast2 = {
      speed: 60
    }

    const mockUpdatedBattle = {
      ...mockBattle,
      beast2_id: 200,
      beast2_locked: true,
      status: 'in_progress',
      current_turn: 'player2'
    }

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // Get battle
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBattle, error: null })
        } as any
      } else if (callCount === 2) {
        // Get beast
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBeast, error: null })
        } as any
      } else if (callCount === 3) {
        // Get player
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPlayer, error: null })
        } as any
      } else if (callCount === 4) {
        // Get beast1 speed
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBeast1, error: null })
        } as any
      } else if (callCount === 5) {
        // Get beast2 speed
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockBeast2, error: null })
        } as any
      } else {
        // Update battle
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedBattle, error: null })
        } as any
      }
    })

    const request = new NextRequest('http://localhost/api/battles/rooms/battle-123/select-beast', {
      method: 'PATCH',
      body: JSON.stringify({
        player_id: 'player2',
        beast_id: 200
      })
    })

    const response = await PATCH(request, { params: { battleId: 'battle-123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.battle.beast2_id).toBe(200)
    expect(data.battle.beast2_locked).toBe(true)
    expect(data.battle.status).toBe('in_progress')
    expect(data.battle.current_turn).toBe('player2')
  })
})
