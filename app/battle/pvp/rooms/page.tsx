'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { useTonAddress } from '@tonconnect/ui-react'
import { subscribeToRooms, ConnectionManager } from '@/lib/realtime-manager'
import { Swords, Zap, Shield, Heart, Loader2, Users, ArrowLeft, Wifi, WifiOff } from 'lucide-react'

interface Room {
  id: string
  room_code: string
  player1_id: string
  beast1_id: number
  created_at: string
  beast1: {
    id: number
    name: string
    level: number
    hp: number
    max_hp: number
    attack: number
    defense: number
    speed: number
    traits: any
    image_ipfs_uri: string | null
  }
  player1: {
    id: string
    wallet_address: string
  }
}

export default function RoomsListPage() {
  const router = useRouter()
  const address = useTonAddress()
  
  const [userId, setUserId] = useState<string | null>(null)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected')
  const [myBeasts, setMyBeasts] = useState<any[]>([])
  
  // Redirect if not connected
  useEffect(() => {
    if (!address) {
      router.push('/')
    }
  }, [address, router])

  // Get user ID and beasts
  useEffect(() => {
    async function fetchUserData() {
      if (!address) return

      try {
        // Get user
        const userRes = await fetch(`/api/users?wallet_address=${address}`)
        const userData = await userRes.json()
        
        if (userData.user) {
          setUserId(userData.user.id)
          
          // Get user's beasts for validation
          const beastsRes = await fetch(`/api/beasts?wallet_address=${address}`)
          const beastsData = await beastsRes.json()
          setMyBeasts(beastsData.beasts || [])
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [address])

  // Subscribe to available rooms with real-time updates
  useEffect(() => {
    let connectionManager: ConnectionManager | null = null
    let unsubscribe: (() => void) | null = null
    let isFirstLoad = true

    const setupSubscription = () => {
      unsubscribe = subscribeToRooms({
        onRoomsUpdate: (rooms) => {
          setAvailableRooms(rooms)
          if (isFirstLoad) {
            setIsLoading(false)
            isFirstLoad = false
          }
        },
        onConnectionStatusChange: (status) => {
          setConnectionStatus(status)
          if (status === 'connected' && connectionManager) {
            connectionManager.handleConnect()
          } else if (status === 'disconnected' && connectionManager) {
            connectionManager.handleDisconnect()
          }
        }
      })
    }

    // Set up connection manager for automatic reconnection
    connectionManager = new ConnectionManager(
      setupSubscription,
      setConnectionStatus
    )

    // Initial subscription
    setupSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
      if (connectionManager) connectionManager.cleanup()
    }
  }, [])

  const handleJoinRoom = async (roomCode: string) => {
    if (!userId) {
      setError('User not found. Please reconnect your wallet.')
      return
    }

    // Client-side validation: Check if user has beasts
    if (myBeasts.length === 0) {
      setError('You need at least one beast to join a battle. Visit your inventory to get started!')
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      const response = await fetch('/api/battles/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: roomCode,
          player_id: userId
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room')
      }

      if (data.success && data.battle_id) {
        // Navigate to room page for beast selection
        router.push(`/battle/pvp/room/${data.battle_id}`)
      }
    } catch (error: any) {
      console.error('Error joining room:', error)
      setError(error.message || 'Failed to join room')
    } finally {
      setIsJoining(false)
    }
  }

  if (!address) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/battle/pvp')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to PVP
            </Button>
            
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 text-xs text-green-500">
                <Wifi className="w-4 h-4" />
                <span>Live Updates</span>
              </div>
            )}
            {connectionStatus === 'reconnecting' && (
              <div className="flex items-center gap-2 text-xs text-yellow-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reconnecting...</span>
              </div>
            )}
            {connectionStatus === 'disconnected' && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <WifiOff className="w-4 h-4" />
                <span>Disconnected</span>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3 text-glow uppercase">
              <Users className="inline-block w-10 h-10 mr-3" />
              AVAILABLE ROOMS
            </h1>
            <p className="text-muted-foreground text-lg">
              Join a battle room and challenge other players!
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-3 bg-destructive/10 border border-destructive rounded text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Rooms List */}
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading rooms...</p>
              </div>
            ) : availableRooms.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4 text-lg">
                  No rooms available right now
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Be the first to create a battle room!
                </p>
                <Button onClick={() => router.push('/battle/pvp')}>
                  <Swords className="w-4 h-4 mr-2" />
                  Create a Room
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {availableRooms.map((room, index) => (
                  <Card 
                    key={room.id} 
                    className="hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{room.beast1.name}</CardTitle>
                          <Badge className="mt-2">
                            {room.beast1.traits?.type || 'Unknown'}
                          </Badge>
                        </div>
                        <Badge variant="secondary">
                          LVL {room.beast1.level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-accent" />
                          <span>ATK: {room.beast1.attack}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-blue-500" />
                          <span>DEF: {room.beast1.defense}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-destructive" />
                          <span>HP: {room.beast1.hp}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground font-mono mb-2">
                          Room Code: <span className="text-primary font-bold">{room.room_code}</span>
                        </p>
                        <Button
                          className="w-full transition-all duration-300 hover:scale-105 active:scale-95"
                          disabled={isJoining || room.player1_id === userId}
                          onClick={() => handleJoinRoom(room.room_code)}
                        >
                          {isJoining ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Joining...
                            </>
                          ) : room.player1_id === userId ? (
                            'Your Room'
                          ) : (
                            <>
                              <Swords className="w-4 h-4 mr-2" />
                              Join Battle
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
