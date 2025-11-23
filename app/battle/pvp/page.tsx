'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { HealthBar } from '@/components/8bitcn/health-bar'
import { useTonAddress } from '@tonconnect/ui-react'
import { subscribeToBattle, subscribeToRooms, ConnectionManager } from '@/lib/realtime-manager'
import { shareBattleToTelegram } from '@/lib/telegram-share'
import { Swords, Zap, Shield, Heart, Loader2, Copy, X, Users, Hash, Wifi, WifiOff, Send } from 'lucide-react'

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

interface Battle {
  id: string
  player1_id: string
  player2_id: string | null
  beast1_id: number
  beast2_id: number | null
  current_turn: string | null
  status: string
  winner_id: string | null
  room_code: string
  created_at: string
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

type ViewState = 'select' | 'waiting' | 'browse' | 'join'

function PVPBattlePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const address = useTonAddress()
  
  const [userId, setUserId] = useState<string | null>(null)
  const [myBeasts, setMyBeasts] = useState<Beast[]>([])
  const [selectedBeast, setSelectedBeast] = useState<Beast | null>(null)
  const [view, setView] = useState<ViewState>('select')
  const [createdRoom, setCreatedRoom] = useState<Battle | null>(null)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected')
  const [opponentBeast, setOpponentBeast] = useState<Beast | null>(null)
  const [showOpponentJoined, setShowOpponentJoined] = useState(false)
  
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
          
          // Get user's beasts - use wallet_address parameter
          const beastsRes = await fetch(`/api/beasts?wallet_address=${address}`)
          const beastsData = await beastsRes.json()
          const beasts = beastsData.beasts || []
          setMyBeasts(beasts)
          
          // Pre-select beast from URL parameter if provided
          const beastIdParam = searchParams.get('beastId')
          if (beastIdParam && beasts.length > 0) {
            const preSelectedBeast = beasts.find((b: Beast) => b.id === parseInt(beastIdParam))
            if (preSelectedBeast) {
              setSelectedBeast(preSelectedBeast)
            }
          }

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

  // Subscribe to battle updates when in waiting view
  useEffect(() => {
    if (view !== 'waiting' || !createdRoom) return

    let connectionManager: ConnectionManager | null = null
    let unsubscribe: (() => void) | null = null

    const setupSubscription = () => {
      unsubscribe = subscribeToBattle(createdRoom.id, {
        onBattleUpdate: async (battle) => {
          // If player2 joined, fetch their beast info and display it
          if (battle.status === 'in_progress' && battle.player2_id && battle.beast2_id) {
            try {
              // Fetch opponent's beast information
              const response = await fetch(`/api/beasts/${battle.beast2_id}`)
              const data = await response.json()
              
              if (data.beast) {
                setOpponentBeast(data.beast)
                setShowOpponentJoined(true)
                
                // Auto-navigate to arena after showing opponent info (2 seconds delay)
                setTimeout(() => {
                  router.push(`/battle/arena/${battle.id}`)
                }, 2000)
              } else {
                // If we can't fetch beast info, navigate immediately
                router.push(`/battle/arena/${battle.id}`)
              }
            } catch (error) {
              console.error('Error fetching opponent beast:', error)
              // Navigate anyway if there's an error
              router.push(`/battle/arena/${battle.id}`)
            }
          }
        },
        onPlayerJoined: async (battle) => {
          // Fetch and display opponent's beast information
          if (battle.beast2_id) {
            try {
              const response = await fetch(`/api/beasts/${battle.beast2_id}`)
              const data = await response.json()
              
              if (data.beast) {
                setOpponentBeast(data.beast)
                setShowOpponentJoined(true)
                
                // Auto-navigate to arena after showing opponent info (2 seconds delay)
                setTimeout(() => {
                  router.push(`/battle/arena/${battle.id}`)
                }, 2000)
              } else {
                // If we can't fetch beast info, navigate immediately
                router.push(`/battle/arena/${battle.id}`)
              }
            } catch (error) {
              console.error('Error fetching opponent beast:', error)
              // Navigate anyway if there's an error
              router.push(`/battle/arena/${battle.id}`)
            }
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
  }, [view, createdRoom, router])

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
  }, [view])

  const handleCreateRoom = async () => {
    if (!selectedBeast || !userId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/battles/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: userId,
          beast_id: selectedBeast.id
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      if (data.battle) {
        setCreatedRoom(data.battle)
        setView('waiting')
      }
    } catch (error: any) {
      console.error('Error creating room:', error)
      setError(error.message || 'Failed to create room')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelRoom = async () => {
    if (!createdRoom) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/battles/rooms/${createdRoom.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel room')
      }

      setCreatedRoom(null)
      setView('select')
    } catch (error: any) {
      console.error('Error canceling room:', error)
      setError(error.message || 'Failed to cancel room')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async (roomCode: string) => {
    if (!selectedBeast || !userId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/battles/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_code: roomCode,
          player_id: userId,
          beast_id: selectedBeast.id
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room')
      }

      if (data.success && data.battle_id) {
        // Navigate to battle arena
        router.push(`/battle/arena/${data.battle_id}`)
      }
    } catch (error: any) {
      console.error('Error joining room:', error)
      setError(error.message || 'Failed to join room')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyRoomCode = () => {
    if (createdRoom?.room_code) {
      navigator.clipboard.writeText(createdRoom.room_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  if (!address) {
    return null // Will redirect in useEffect
  }

  // Render different views based on state
  const renderSelectView = () => (
    <div className="space-y-6">
      {/* Action Buttons at the Top */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Choose Your Action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              disabled={!selectedBeast || isLoading}
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
          {!selectedBeast && (
            <p className="text-sm text-muted-foreground mt-3 text-center font-mono animate-in fade-in duration-500">
              Select a beast below to begin
            </p>
          )}
        </CardContent>
      </Card>

      {/* Beast Selection */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Select Your Beast</CardTitle>
        </CardHeader>
        <CardContent>
          {myBeasts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You don't have any beasts yet!
              </p>
              <Button onClick={() => router.push('/inventory')}>
                Go to Inventory
              </Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {myBeasts.map((beast, index) => (
                  <Card
                    key={beast.id}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-in slide-in-from-bottom ${
                      selectedBeast?.id === beast.id ? 'ring-4 ring-primary shadow-primary/50' : ''
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => setSelectedBeast(beast)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{beast.name}</CardTitle>
                          <Badge className="mt-2">
                            {beast.traits?.type || 'Unknown'}
                          </Badge>
                        </div>
                        <Badge variant="secondary">
                          LVL {beast.level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <HealthBar 
                        value={beast.hp} 
                        max={beast.max_hp} 
                        label="HP" 
                      />
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-accent" />
                          <span>ATK: {beast.attack}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-blue-500" />
                          <span>DEF: {beast.defense}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-destructive" />
                          <span>HP: {beast.hp}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

  const renderWaitingView = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">Waiting for Opponent</CardTitle>
          {connectionStatus === 'connected' && (
            <div className="flex items-center gap-2 text-xs text-green-500">
              <Wifi className="w-4 h-4" />
              <span>Connected</span>
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
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-6">
          <div className="bg-muted p-6 rounded-lg border-2 border-primary/20">
            <p className="text-sm text-muted-foreground mb-2 font-mono">Room Code</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-4xl font-bold font-mono tracking-wider text-primary">
                {createdRoom?.room_code}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyRoomCode}
              >
                {copiedCode ? (
                  <>✓ Copied</>
                ) : (
                  <><Copy className="w-4 h-4" /></>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-mono">
              Share this code with your opponent
            </p>
            
            {/* Telegram Share Button */}
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                className="w-full"
                variant="default"
                onClick={() => shareBattleToTelegram(createdRoom?.room_code || '', createdRoom?.id)}
              >
                <Send className="w-4 h-4 mr-2" />
                Share via Telegram
              </Button>
            </div>
          </div>

          {selectedBeast && (
            <div className="bg-card p-4 rounded-lg border-2 border-primary/20 animate-in slide-in-from-bottom">
              <p className="text-xs text-muted-foreground font-mono mb-2">Your Beast</p>
              <p className="font-bold font-mono text-lg">{selectedBeast.name}</p>
              <Badge variant="secondary" className="mt-2">LVL {selectedBeast.level}</Badge>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono mt-3">
                <div className="flex items-center gap-1 justify-center">
                  <Zap className="w-3 h-3 text-accent" />
                  <span>{selectedBeast.attack}</span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <Shield className="w-3 h-3 text-blue-500" />
                  <span>{selectedBeast.defense}</span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <Heart className="w-3 h-3 text-destructive" />
                  <span>{selectedBeast.hp}</span>
                </div>
              </div>
            </div>
          )}

          {showOpponentJoined && opponentBeast && (
            <div className="bg-accent/20 p-4 rounded-lg border-2 border-accent animate-in slide-in-from-top">
              <p className="text-xs text-accent font-mono mb-2 font-bold">🎉 Opponent Joined!</p>
              <p className="font-bold font-mono text-lg">{opponentBeast.name}</p>
              <Badge variant="secondary" className="mt-2">LVL {opponentBeast.level}</Badge>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono mt-3">
                <div className="flex items-center gap-1 justify-center">
                  <Zap className="w-3 h-3 text-accent" />
                  <span>{opponentBeast.attack}</span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <Shield className="w-3 h-3 text-blue-500" />
                  <span>{opponentBeast.defense}</span>
                </div>
                <div className="flex items-center gap-1 justify-center">
                  <Heart className="w-3 h-3 text-destructive" />
                  <span>{opponentBeast.hp}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-3 text-center">
                Starting battle...
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded text-destructive text-sm">
              {error}
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleCancelRoom}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Canceling...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel Room
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
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
        {!selectedBeast && (
          <div className="mb-4 p-3 bg-accent/10 border border-accent rounded text-sm">
            Select a beast from the main menu before joining a room
          </div>
        )}

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
                      disabled={!selectedBeast || isLoading || room.player1_id === userId}
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
        {!selectedBeast && (
          <div className="mb-4 p-3 bg-accent/10 border border-accent rounded text-sm">
            Select a beast from the main menu before joining a room
          </div>
        )}

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
            disabled={!selectedBeast || roomCodeInput.length !== 6 || isLoading}
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
        {view === 'waiting' && renderWaitingView()}
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
