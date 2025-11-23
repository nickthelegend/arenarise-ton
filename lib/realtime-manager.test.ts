import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { subscribeToBattle, subscribeToRooms, ConnectionManager } from './realtime-manager'
import { supabase } from './supabase'

// Mock supabase
vi.mock('./supabase', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn()
  }
}))

// Mock fetch
global.fetch = vi.fn()

describe('Real-time Subscription Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('subscribeToBattle', () => {
    it('should create a channel with correct battle ID', () => {
      const battleId = 'test-battle-123'
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis()
      }
      
      vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)

      subscribeToBattle(battleId, {})

      expect(supabase.channel).toHaveBeenCalledWith(`battle_${battleId}`)
    })

    it('should subscribe to battle UPDATE events', () => {
      const battleId = 'test-battle-123'
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis()
      }
      
      vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)

      subscribeToBattle(battleId, {})

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'UPDATE',
          table: 'battles',
          filter: `id=eq.${battleId}`
        }),
        expect.any(Function)
      )
    })

    it('should subscribe to battle_moves INSERT events', () => {
      const battleId = 'test-battle-123'
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis()
      }
      
      vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)

      subscribeToBattle(battleId, {})

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          table: 'battle_moves',
          filter: `battle_id=eq.${battleId}`
        }),
        expect.any(Function)
      )
    })

    it('should call onBattleUpdate callback when battle is updated', () => {
      const battleId = 'test-battle-123'
      const onBattleUpdate = vi.fn()
      let battleUpdateHandler: any

      const mockChannel = {
        on: vi.fn((event, config, handler) => {
          if (config.table === 'battles') {
            battleUpdateHandler = handler
          }
          return mockChannel
        }),
        subscribe: vi.fn().mockReturnThis()
      }
      
      vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)

      subscribeToBattle(battleId, { onBattleUpdate })

      // Simulate battle update
      const updatedBattle = { id: battleId, status: 'in_progress', player2_id: 'player2' }
      battleUpdateHandler({ new: updatedBattle })

      expect(onBattleUpdate).toHaveBeenCalledWith(updatedBattle)
    })

    it('should call onPlayerJoined when player2 joins', () => {
      const battleId = 'test-battle-123'
      const onPlayerJoined = vi.fn()
      let battleUpdateHandler: any

      const mockChannel = {
        on: vi.fn((event, config, handler) => {
          if (config.table === 'battles') {
            battleUpdateHandler = handler
          }
          return mockChannel
        }),
        subscribe: vi.fn().mockReturnThis()
      }
      
      vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)

      subscribeToBattle(battleId, { onPlayerJoined })

      // Simulate player2 joining
      const updatedBattle = { id: battleId, status: 'in_progress', player2_id: 'player2' }
      battleUpdateHandler({ new: updatedBattle })

      expect(onPlayerJoined).toHaveBeenCalledWith(updatedBattle)
    })

    it('should return cleanup function that removes channel', () => {
      const battleId = 'test-battle-123'
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis()
      }
      
      vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)

      const cleanup = subscribeToBattle(battleId, {})
      cleanup()

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })
  })

  describe('subscribeToRooms', () => {
    it('should create a channel for battle rooms', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis()
      }
      
      vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ rooms: [] })
      } as Response)

      subscribeToRooms({ onRoomsUpdate: vi.fn() })

      expect(supabase.channel).toHaveBeenCalledWith('battle_rooms')
    })

    it('should fetch initial rooms on subscription', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis()
      }
      
      vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)
      const mockRooms = [{ id: '1', room_code: 'ABC123' }]
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ rooms: mockRooms })
      } as Response)

      const onRoomsUpdate = vi.fn()
      subscribeToRooms({ onRoomsUpdate })

      // Wait for async fetch
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(global.fetch).toHaveBeenCalledWith('/api/battles/rooms')
      expect(onRoomsUpdate).toHaveBeenCalledWith(mockRooms)
    })

    it('should subscribe to INSERT, UPDATE, and DELETE events', () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis()
      }
      
      vi.mocked(supabase.channel).mockReturnValue(mockChannel as any)
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ rooms: [] })
      } as Response)

      subscribeToRooms({ onRoomsUpdate: vi.fn() })

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ event: 'INSERT' }),
        expect.any(Function)
      )
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ event: 'UPDATE' }),
        expect.any(Function)
      )
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({ event: 'DELETE' }),
        expect.any(Function)
      )
    })
  })

  describe('ConnectionManager', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should call reconnect callback on disconnect', () => {
      const reconnectCallback = vi.fn()
      const manager = new ConnectionManager(reconnectCallback)

      manager.handleDisconnect()
      
      // Fast-forward time to trigger reconnection
      vi.advanceTimersByTime(3000)

      expect(reconnectCallback).toHaveBeenCalled()
    })

    it('should use exponential backoff for reconnection attempts', () => {
      const reconnectCallback = vi.fn()
      const manager = new ConnectionManager(reconnectCallback)

      manager.handleDisconnect()
      
      // First attempt after 3 seconds
      vi.advanceTimersByTime(3000)
      expect(reconnectCallback).toHaveBeenCalledTimes(1)

      // Second attempt after 6 seconds (3 * 2^1)
      vi.advanceTimersByTime(6000)
      expect(reconnectCallback).toHaveBeenCalledTimes(2)

      // Third attempt after 12 seconds (3 * 2^2)
      vi.advanceTimersByTime(12000)
      expect(reconnectCallback).toHaveBeenCalledTimes(3)
    })

    it('should stop reconnecting after max attempts', () => {
      const reconnectCallback = vi.fn()
      const statusCallback = vi.fn()
      const manager = new ConnectionManager(reconnectCallback, statusCallback)

      manager.handleDisconnect()

      // Simulate 10 failed reconnection attempts
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(30000) // Use max delay
      }

      // Should have called reconnect 10 times (max attempts)
      expect(reconnectCallback).toHaveBeenCalledTimes(10)
      
      // Should call status callback with 'disconnected' after max attempts
      expect(statusCallback).toHaveBeenCalledWith('disconnected')
    })

    it('should reset reconnection attempts on successful connection', () => {
      const reconnectCallback = vi.fn()
      const manager = new ConnectionManager(reconnectCallback)

      manager.handleDisconnect()
      vi.advanceTimersByTime(3000)
      
      // Simulate successful connection
      manager.handleConnect()

      // Start new disconnect cycle
      manager.handleDisconnect()
      vi.advanceTimersByTime(3000)

      // Should use initial delay again (not exponential)
      expect(reconnectCallback).toHaveBeenCalledTimes(2)
    })

    it('should clean up timers on cleanup', () => {
      const reconnectCallback = vi.fn()
      const manager = new ConnectionManager(reconnectCallback)

      manager.handleDisconnect()
      manager.cleanup()

      // Advance time - should not trigger reconnection
      vi.advanceTimersByTime(10000)
      expect(reconnectCallback).not.toHaveBeenCalled()
    })
  })
})
