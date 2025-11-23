'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { useTonAddress } from '@tonconnect/ui-react'
import { subscribeToRooms, ConnectionManager } from '@/lib/realtime-manager'
import { Swords, Zap, Shield, Heart, Loader2, Users, Hash } from 'lucide-react'

interface Beast {
  id: number
  name: string
  hp: number
  max_hp: number
  attack: number
  defense: number
  speed: number
  level: number
  traits: any
}

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

type ViewState = 'select' | 'browse' | 'join'

function PVPBattlePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const address = useTonAddress()
  
  const [userId, setUserId] = useState<string | null>(null)
  const [myBeasts, setMyBeasts] = useState<Beast[]>([])
  const [view, setView] = useState<ViewState>('select')
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
          
          // Get user's beasts - use wallet_address parameter (for validation only)
          const beastsRes = await fetch(`/api/beasts?wallet_address=${address}`)
          const beastsData = await beastsRes.json()
          const beasts = beastsData.beasts || []
          setMyBeasts(beasts)

          // Check for join parameter in URL
          const joinCode = searchParams.get('join')
          if (joinCode) {
            setRoomCodeInput(joinCode.toUpperCase())
            setView('join')
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [address, searchParams])



  // Subscribe to available rooms when in browse view
  useEffect(() => {
    if (view !== 'browse') return

    let connectionManager: ConnectionManager | null = null
    let unsubscribe: (() => void) | null = null

    const setupSubscription = () => {
      unsubscribe = subscribeToRooms({
        onRoomsUpdate: (rooms) => {
          setAvailableRooms(rooms)
        },
        onConnectionStatusChange: (status) => {
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
      () => {} // No need to track connection status in UI
    )

    // Initial subscription
    setupSubscription()

    return () => {
      if (unsubscribe) unsubscribe()
      if (connectionManager) connectionManager.cleanup()
    }
  }, [view])

  const handleCreateRoom = async () => {
    if (!userId) return

    // Client-side validation: Check if user has beasts
    if (myBeasts.length === 0) {
      setError('You need at least one beast to battle. Visit your inventory to get started!')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/battles/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: userId
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      if (data.battle) {
        // Navigate to the room page
        router.push(`/battle/pvp/room/${data.battle.id}`)
      }
    } catch (error: any) {
      console.error('Error creating room:', error)
      setError(error.message || 'Failed to create room')
    } finally {
      setIsLoading(false)
    }
  }



  const handleJoinRoom = async (roomCode: string) => {
    if (!userId) return

    // Client-side validation: Check if user has beasts
    if (myBeasts.length === 0) {
      setError('You need at least one beast to join a battle. Visit your inventory to get started!')
      return
    }

    // Client-side validation: Validate room code format
    const trimmedCode = roomCode.trim().toUpperCase()
    if (trimmedCode.length !== 6) {
      setError('Room code must be exactly 6 characters.')
      return
    }

    // Validate room code contains only valid characters (alphanumeric, no ambiguous chars)
    const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/
    if (!validChars.test(trimmedCode)) {
      setError('Invalid room code format. Please check the code and try again.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/battles/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: trimmedCode,
          player_id: userId
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room')
      }

      if (data.success && data.battle_id) {
        // Navigate to the room page
        router.push(`/battle/pvp/room/${data.battle_id}`)
      }
    } catch (error: any) {
      console.error('Error joining room:', error)
      setError(error.message || 'Failed to join room')
    } finally {
      setIsLoading(false)
    }
  }



  if (!address) {
    return null // Will redirect in useEffect
  }

  // Render different views based on state
  const renderSelectView = () => (
    <div className="space-y-6">
      {/* Action Buttons */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Choose Your Action</CardTitle>
        </CardHeader>
        <CardContent>
          {myBeasts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You need at least one beast to battle. Visit your inventory to get started!
              </p>
              <Button onClick={() => router.push('/inventory')}>
                Go to Inventory
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  disabled={isLoading}
                  onClick={handleCreateRoom}
                  className="transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Swords className="w-5 h-5 mr-2" />
                      Create Room
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setView('browse')}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Browse Rooms
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setView('join')}
                >
                  <Hash className="w-5 h-5 mr-2" />
                  Join by Code
                </Button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded text-destructive text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )



  const renderBrowseView = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">Available Rooms</CardTitle>
          <Button variant="outline" onClick={() => setView('select')}>
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {availableRooms.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No rooms available right now
            </p>
            <Button onClick={() => setView('select')}>
              Create a Room
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {availableRooms.map((room) => (
              <Card key={room.id} className="hover:shadow-lg transition-shadow">
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
                      className="w-full"
                      disabled={isLoading || room.player1_id === userId}
                      onClick={() => handleJoinRoom(room.room_code)}
                    >
                      {room.player1_id === userId ? 'Your Room' : 'Join Battle'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded text-destructive text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderJoinView = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">Join by Code</CardTitle>
          <Button variant="outline" onClick={() => setView('select')}>
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Enter 6-digit Room Code
            </label>
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full px-4 py-3 text-2xl font-mono tracking-wider text-center border-2 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary uppercase"
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded text-destructive text-sm">
              {error}
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={roomCodeInput.length !== 6 || isLoading}
            onClick={() => handleJoinRoom(roomCodeInput)}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Swords className="w-5 h-5 mr-2" />
                Join Battle
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3 text-glow uppercase">
            <Swords className="inline-block w-10 h-10 mr-3" />
            PVP BATTLE
          </h1>
          <p className="text-muted-foreground text-lg">
            Challenge other players in real-time combat!
          </p>
        </div>

        {view === 'select' && renderSelectView()}
        {view === 'browse' && renderBrowseView()}
        {view === 'join' && renderJoinView()}
      </main>
    </div>
  )
}


export default function PVPBattlePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading battle...</p>
          </div>
        </main>
      </div>
    }>
      <PVPBattlePageContent />
    </Suspense>
  )
}
