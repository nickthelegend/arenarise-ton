import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}))

describe('GET /api/beasts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return a beast by ID', async () => {
    const mockBeast = {
      id: 1,
      name: 'Test Beast',
      hp: 100,
      max_hp: 100,
      attack: 50,
      defense: 30,
      speed: 40,
      level: 5,
      owner_address: 'test-address',
      traits: { type: 'Fire' }
    }

    const { supabase } = await import('@/lib/supabase')
    const mockSingle = vi.fn().mockResolvedValue({ data: mockBeast, error: null })
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

    const request = new NextRequest('http://localhost:3000/api/beasts/1')
    const response = await GET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.beast).toEqual(mockBeast)
    expect(supabase.from).toHaveBeenCalledWith('beasts')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('id', '1')
  })

  it('should return 404 when beast not found', async () => {
    const { supabase } = await import('@/lib/supabase')
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

    const request = new NextRequest('http://localhost:3000/api/beasts/999')
    const response = await GET(request, { params: { id: '999' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Beast not found')
  })

  it('should return 500 on database error', async () => {
    const { supabase } = await import('@/lib/supabase')
    const mockSingle = vi.fn().mockResolvedValue({ 
      data: null, 
      error: { message: 'Database error' } 
    })
    const mockEq = vi.fn(() => ({ single: mockSingle }))
    const mockSelect = vi.fn(() => ({ eq: mockEq }))
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any)

    const request = new NextRequest('http://localhost:3000/api/beasts/1')
    const response = await GET(request, { params: { id: '1' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error')
  })
})
