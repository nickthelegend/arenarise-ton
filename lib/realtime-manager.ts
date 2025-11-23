import { supabase, Battle, BattleMove } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Real-time subscription manager for battle rooms and updates
 * Handles WebSocket connections for battle state synchronization
 */

export interface BattleCallbacks {
  onBattleUpdate?: (battle: Battle) => void
  onMoveReceived?: (move: BattleMove) => void
  onPlayerJoined?: (battle: Battle) => void
  onConnectionStatusChange?: (status: 'connected' | 'disconnected' | 'reconnecting') => void
}

export interface RoomsCallbacks {
  onRoomsUpdate: (rooms: any[]) => void
  onConnectionStatusChange?: (status: 'connected' | 'disconnected' | 'reconnecting') => void
}

/**
 * Subscribe to a specific battle for real-time updates
 * Monitors battle status changes, moves, and player joins
 * Handles connection errors and provides status updates
 * 
 * @param battleId - The ID of the battle to subscribe to
 * @param callbacks - Callback functions for different events
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToBattle(
  battleId: string,
  callbacks: BattleCallbacks
): () => void {
  const channelName = `battle_${battleId}`
  
  console.log(`Subscribing to battle ${battleId}`)
  
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'battles',
      filter: `id=eq.${battleId}`
    }, (payload) => {
      try {
        const updatedBattle = payload.new as Battle
        
        // Notify about battle update
        if (callbacks.onBattleUpdate) {
          callbacks.onBattleUpdate(updatedBattle)
        }
        
        // Check if player2 joined (status changed to in_progress)
        if (updatedBattle.status === 'in_progress' && updatedBattle.player2_id && callbacks.onPlayerJoined) {
          callbacks.onPlayerJoined(updatedBattle)
        }
      } catch (error) {
        console.error('Error handling battle update:', error)
      }
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'battle_moves',
      filter: `battle_id=eq.${battleId}`
    }, (payload) => {
      try {
        const newMove = payload.new as BattleMove
        
        if (callbacks.onMoveReceived) {
          callbacks.onMoveReceived(newMove)
        }
      } catch (error) {
        console.error('Error handling move received:', error)
      }
    })
    .subscribe((status, err) => {
      console.log(`Battle subscription status: ${status}`)
      
      if (err) {
        console.error('Battle subscription error:', err)
      }
      
      if (callbacks.onConnectionStatusChange) {
        if (status === 'SUBSCRIBED') {
          callbacks.onConnectionStatusChange('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          callbacks.onConnectionStatusChange('disconnected')
        } else if (status === 'TIMED_OUT') {
          callbacks.onConnectionStatusChange('reconnecting')
        }
      }
    })

  // Return cleanup function
  return () => {
    console.log(`Unsubscribing from battle ${battleId}`)
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to all waiting battle rooms for real-time updates
 * Monitors room creation, deletion, and status changes
 * Handles connection errors and provides automatic retry
 * 
 * @param callbacks - Callback functions for room updates
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToRooms(
  callbacks: RoomsCallbacks
): () => void {
  const channelName = 'battle_rooms'
  
  console.log('Subscribing to battle rooms')
  
  // Helper to fetch current rooms with error handling
  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/battles/rooms')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rooms: ${response.status}`)
      }
      
      const data = await response.json()
      callbacks.onRoomsUpdate(data.rooms || [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
      // Return empty array on error to prevent UI issues
      callbacks.onRoomsUpdate([])
    }
  }

  // Initial fetch
  fetchRooms()
  
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'battles',
      filter: 'status=eq.waiting'
    }, () => {
      console.log('New room created, refreshing list')
      fetchRooms()
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'battles'
    }, (payload) => {
      try {
        const updatedBattle = payload.new as Battle
        // Refetch if a room changed from waiting to another status
        if (payload.old && (payload.old as any).status === 'waiting') {
          console.log('Room status changed from waiting, refreshing list')
          fetchRooms()
        }
        // Or if a room changed to waiting status
        if (updatedBattle.status === 'waiting') {
          console.log('Room status changed to waiting, refreshing list')
          fetchRooms()
        }
      } catch (error) {
        console.error('Error handling room update:', error)
      }
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'battles'
    }, () => {
      console.log('Room deleted, refreshing list')
      fetchRooms()
    })
    .subscribe((status, err) => {
      console.log(`Rooms subscription status: ${status}`)
      
      if (err) {
        console.error('Rooms subscription error:', err)
      }
      
      if (callbacks.onConnectionStatusChange) {
        if (status === 'SUBSCRIBED') {
          callbacks.onConnectionStatusChange('connected')
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          callbacks.onConnectionStatusChange('disconnected')
        } else if (status === 'TIMED_OUT') {
          callbacks.onConnectionStatusChange('reconnecting')
        }
      }
    })

  // Return cleanup function
  return () => {
    console.log('Unsubscribing from battle rooms')
    supabase.removeChannel(channel)
  }
}

/**
 * Connection status manager for handling reconnection logic
 * Provides automatic reconnection with exponential backoff
 * Handles dropped connections and network issues gracefully
 */
export class ConnectionManager {
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 3000 // Start with 3 seconds
  private maxReconnectDelay = 30000 // Max 30 seconds
  private reconnectTimer: NodeJS.Timeout | null = null
  private isReconnecting = false
  private lastDisconnectTime: number = 0
  
  constructor(
    private reconnectCallback: () => void,
    private statusCallback?: (status: 'connected' | 'disconnected' | 'reconnecting') => void
  ) {}

  /**
   * Handle connection loss and attempt reconnection
   * Implements exponential backoff to avoid overwhelming the server
   */
  handleDisconnect() {
    if (this.isReconnecting) return
    
    this.lastDisconnectTime = Date.now()
    this.isReconnecting = true
    
    if (this.statusCallback) {
      this.statusCallback('reconnecting')
    }
    
    console.log('Connection lost, attempting to reconnect...')
    this.attemptReconnect()
  }

  /**
   * Attempt to reconnect with exponential backoff
   * Delays increase exponentially: 3s, 6s, 12s, 24s, 30s (max)
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.isReconnecting = false
      if (this.statusCallback) {
        this.statusCallback('disconnected')
      }
      console.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached. Please refresh the page.`)
      return
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    )

    console.log(`Reconnection attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts} in ${delay}ms`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      
      try {
        // Call the reconnect callback
        this.reconnectCallback()
        
        // Continue attempting if still reconnecting
        // The callback should call handleConnect() on success
        if (this.isReconnecting) {
          this.attemptReconnect()
        }
      } catch (error) {
        console.error('Error during reconnection attempt:', error)
        if (this.isReconnecting) {
          this.attemptReconnect()
        }
      }
    }, delay)
  }

  /**
   * Handle successful connection
   * Resets reconnection state and notifies callbacks
   */
  handleConnect() {
    const wasReconnecting = this.isReconnecting
    
    this.reconnectAttempts = 0
    this.isReconnecting = false
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.statusCallback) {
      this.statusCallback('connected')
    }
    
    if (wasReconnecting) {
      const reconnectDuration = Date.now() - this.lastDisconnectTime
      console.log(`Successfully reconnected after ${Math.round(reconnectDuration / 1000)}s`)
    }
  }

  /**
   * Clean up timers and reset state
   * Should be called when component unmounts
   */
  cleanup() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.isReconnecting = false
    this.reconnectAttempts = 0
  }

  /**
   * Get current reconnection status
   */
  getStatus(): { isReconnecting: boolean; attempts: number; maxAttempts: number } {
    return {
      isReconnecting: this.isReconnecting,
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts
    }
  }
}
