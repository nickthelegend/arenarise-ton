'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { HealthBar } from '@/components/8bitcn/health-bar'
import { useTonAddress } from '@tonconnect/ui-react'
import { subscribeToBattle, ConnectionManager } from '@/lib/realtime-manager'
import { shareBattleToTelegram } from '@/lib/telegram-share'
import { convertIpfsUrl } from '@/lib/ipfs'
import { Swords, Zap, Shield, Heart, Loader2, Copy, X, Wifi, WifiOff, Send, Sparkles } from 'lucide-react'

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

interface Move {
  id: number
  name: string
  damage: number
  type: string
  description: string
}

export default function PVPRoomPage() {
  const router = useRouter()
  const params = useParams()
  const battleId = params.id as string
  const address = useTonAddress()
  
  const [userId, setUserId] = useState<string | null>(null)
  const [battle, setBattle] = useState<Battle | null>(null)
  const [myBeast, setMyBeast] = useState<Beast | null>(null)
  const [opponentBeast, setOpponentBeast] = useState<Beast | null>(null)
  const [myBeastHp, setMyBeastHp] = useState<number>(0)
  const [opponentHp, setOpponentHp] = useState<number>(0)
  const [moves, setMoves] = useState<Move[]>([])
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [isExecutingMove, setIsExecutingMove] = useState(false)
  const [turnNumber, setTurnNumber] = useState(1)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected')
  const [copiedCode, setCopiedCode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isHost, setIsHost] = useState(false)

  // Add to battle log
  const addToBattleLog = useCallback((message: string) => {
    setBattleLog(prev => [...prev, message])
  }, [])

  // Redirect if not connected
  useEffect(() => {
    if (!address) {
      router.push('/')
    }
  }, [address, router])

  // Get user and battle data
  useEffect(() => {
    if (!address) return

    async function fetchBattleData() {
      try {
        // Get user
        const userRes = await fetch(`/api/users?wallet_address=${address}`)
        const userData = await userRes.json()
        const currentUserId = userData.user?.id

        if (!currentUserId) {
          console.error('User not found')
          return
        }

        setUserId(currentUserId)

        // Get battle details
        const battleRes = await fetch(`/api/battles?battle_id=${battleId}`)
        const battleData = await battleRes.json()
        
        if (battleData.battle) {
          const battleInfo = battleData.battle
          setBattle(battleInfo)
          
          const isPlayer1 = battleInfo.player1_id === currentUserId
          setIsHost(isPlayer1)
          
          // Get my beast
          const myBeastId = isPlayer1 ? battleInfo.beast1_id : battleInfo.beast2_id
          
          if (myBeastId) {
            const beastRes = await fetch(`/api/beasts/${myBeastId}`)
            const beastData = await beastRes.json()
            
            if (beastData.beast) {
              setMyBeast(beastData.beast)
              setMyBeastHp(beastData.beast.hp)
            }
          }
          
          // If opponent already joined, get their beast
          if (battleInfo.player2_id && battleInfo.beast2_id) {
            const oppBeastId = isPlayer1 ? battleInfo.beast2_id : battleInfo.beast1_id
            
            if (oppBeastId) {
              const oppBeastRes = await fetch(`/api/beasts/${oppBeastId}`)
              const oppBeastData = await oppBeastRes.json()
              
              if (oppBeastData.beast) {
                setOpponentBeast(oppBeastData.beast)
                setOpponentHp(oppBeastData.beast.hp)
                addToBattleLog(`Battle started! ${myBeast?.name || 'Your beast'} vs ${oppBeastData.beast.name}`)
              }
            }
          }
          
          setIsMyTurn(battleInfo.current_turn === currentUserId)
        }

        // Get available moves
        const movesRes = await fetch('/api/moves')
        const movesData = await movesRes.json()
        setMoves(movesData.moves || [])

        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching battle data:', error)
        setIsLoading(false)
      }
    }

    fetchBattleData()
  }, [address, battleId, router, addToBattleLog])

  // Subscribe to real-time battle updates
  useEffect(() => {
    if (!battleId || !userId) return

    let connectionManager: ConnectionManager | null = null
    let unsubscribe: (() => void) | null = null

    const setupSubscription = () => {
      console.log(`Setting up subscription for battle: ${battleId}`)
      unsubscribe = subscribeToBattle(battleId, {
        onBattleUpdate: async (updatedBattle) => {
          console.log('Battle update received:', updatedBattle)
          setBattle(updatedBattle)
          
          // If opponent just joined
          if (updatedBattle.status === 'in_progress' && updatedBattle.player2_id && updatedBattle.beast2_id && !opponentBeast) {
            const oppBeastId = isHost ? updatedBattle.beast2_id : updatedBattle.beast1_id
            
            if (oppBeastId) {
              try {
                const oppBeastRes = await fetch(`/api/beasts/${oppBeastId}`)
                const oppBeastData = await oppBeastRes.json()
                
                if (oppBeastData.beast) {
                  setOpponentBeast(oppBeastData.beast)
                  setOpponentHp(oppBeastData.beast.hp)
                  addToBattleLog(`${oppBeastData.beast.name} joined the battle!`)
                }
              } catch (error) {
                console.error('Error fetching opponent beast:', error)
              }
            }
          }
          
          setIsMyTurn(updatedBattle.current_turn === userId)
          
          // Check if battle completed
          if (updatedBattle.status === 'completed') {
            const didWin = updatedBattle.winner_id === userId
            addToBattleLog(didWin ? 'Victory! You won the battle!' : 'Defeat! Better luck next time!')
          }
        },
        onMoveReceived: async (move) => {
          console.log('Move received:', move)
          
          // Only process opponent's moves
          if (move.player_id !== userId) {
            // Update opponent's move in battle log
            addToBattleLog(`Opponent used a move! Dealt ${move.damage_dealt} damage!`)
            
            // Update my HP (I took damage)
            setMyBeastHp(move.target_hp_remaining)
            setTurnNumber(move.turn_number + 1)
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
  }, [battleId, userId, isHost, opponentBeast, addToBattleLog])

  const handleMove = useCallback(async (move: Move) => {
    if (!battle || !userId || !isMyTurn || isExecutingMove || !opponentBeast) return

    setIsExecutingMove(true)

    try {
      // Calculate damage
      const baseDamage = move.damage
      const attackStat = myBeast?.attack || 50
      const defenseStat = opponentBeast?.defense || 30
      
      const randomMultiplier = 0.85 + Math.random() * 0.3
      const calculatedDamage = Math.max(
        1, 
        Math.floor(baseDamage * (attackStat / (attackStat + defenseStat)) * randomMultiplier)
      )
      
      const newOpponentHp = Math.max(0, opponentHp - calculatedDamage)

      addToBattleLog(`${myBeast?.name} used ${move.name}! Dealt ${calculatedDamage} damage!`)

      // Update opponent HP immediately
      setOpponentHp(newOpponentHp)

      // Record the move via API
      const moveResponse = await fetch('/api/battles/moves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battle_id: battleId,
          player_id: userId,
          move_id: move.id,
          turn_number: turnNumber,
          damage_dealt: calculatedDamage,
          target_hp_remaining: newOpponentHp
        })
      })

      const moveData = await moveResponse.json()

      if (moveData.battle_ended) {
        addToBattleLog(`${myBeast?.name} wins! ${opponentBeast?.name} has been defeated!`)
      } else {
        setIsMyTurn(false)
        addToBattleLog("Opponent's turn...")
      }

    } catch (error) {
      console.error('Error executing move:', error)
      addToBattleLog('Error executing move. Please try again.')
    } finally {
      setIsExecutingMove(false)
    }
  }, [battle, userId, isMyTurn, isExecutingMove, myBeast, opponentBeast, opponentHp, battleId, turnNumber, addToBattleLog])

  const handleCopyRoomCode = () => {
    if (battle?.room_code) {
      navigator.clipboard.writeText(battle.room_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleCancelRoom = async () => {
    if (!battle) return

    try {
      await fetch(`/api/battles/rooms/${battle.id}`, {
        method: 'DELETE'
      })
      router.push('/battle/pvp')
    } catch (error) {
      console.error('Error canceling room:', error)
    }
  }

  if (!address || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  const isWaiting = battle?.status === 'waiting'
  const isBattleActive = battle?.status === 'in_progress'
  const isBattleComplete = battle?.status === 'completed'

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3 text-glow uppercase">
            <Swords className="inline-block w-10 h-10 mr-3" />
            PVP BATTLE ROOM
          </h1>
          <div className="flex items-center justify-center gap-2">
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
        </div>

        {/* Waiting for Opponent */}
        {isWaiting && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Waiting for Opponent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <div className="bg-muted p-6 rounded-lg border-2 border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2 font-mono">Room Code</p>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-4xl font-bold font-mono tracking-wider text-primary">
                      {battle?.room_code}
                    </p>
                    <Button size="sm" variant="outline" onClick={handleCopyRoomCode}>
                      {copiedCode ? <>✓ Copied</> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 font-mono">
                    Share this code with your opponent
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => shareBattleToTelegram(battle?.room_code || '', battle?.id)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Share via Telegram
                    </Button>
                  </div>
                </div>

                {myBeast && (
                  <div className="bg-card p-4 rounded-lg border-2 border-primary/20">
                    <p className="text-xs text-muted-foreground font-mono mb-2">Your Beast</p>
                    {(myBeast as any).image_ipfs_uri && (
                      <div className="w-32 h-32 mx-auto mb-3 border-2 border-primary bg-muted flex items-center justify-center overflow-hidden">
                        <img 
                          src={convertIpfsUrl((myBeast as any).image_ipfs_uri)} 
                          alt={myBeast.name}
                          className="w-full h-full object-cover pixelated"
                        />
                      </div>
                    )}
                    <p className="font-bold font-mono text-lg">{myBeast.name}</p>
                    <Badge variant="secondary" className="mt-2">LVL {myBeast.level}</Badge>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono mt-3">
                      <div className="flex items-center gap-1 justify-center">
                        <Zap className="w-3 h-3 text-accent" />
                        <span>{myBeast.attack}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-center">
                        <Shield className="w-3 h-3 text-blue-500" />
                        <span>{myBeast.defense}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-center">
                        <Heart className="w-3 h-3 text-destructive" />
                        <span>{myBeast.hp}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                <Button variant="outline" onClick={handleCancelRoom}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Room
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Battle Active */}
        {(isBattleActive || isBattleComplete) && opponentBeast && (
          <>
            {/* Battle Status */}
            <div className="text-center mb-6">
              {isBattleComplete ? (
                <Badge variant={battle.winner_id === userId ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                  {battle.winner_id === userId ? 'VICTORY!' : 'DEFEAT'}
                </Badge>
              ) : (
                <Badge variant={isMyTurn ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                  {isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN"}
                </Badge>
              )}
            </div>

            {/* Battle Arena */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* My Beast */}
              <Card className="border-primary">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{myBeast?.name}</CardTitle>
                      <Badge className="mt-2">{myBeast?.traits?.type || 'Unknown'}</Badge>
                    </div>
                    <Badge variant="secondary">LVL {myBeast?.level}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(myBeast as any)?.image_ipfs_uri ? (
                    <div className="w-48 h-48 mx-auto border-4 border-primary bg-muted flex items-center justify-center overflow-hidden">
                      <img 
                        src={convertIpfsUrl((myBeast as any).image_ipfs_uri)} 
                        alt={myBeast?.name}
                        className="w-full h-full object-cover pixelated"
                      />
                    </div>
                  ) : (
                    <div className="text-6xl text-center">🔥</div>
                  )}
                  <HealthBar value={myBeastHp} max={myBeast?.max_hp || 100} label="HP" />
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      <span>ATK: {myBeast?.attack}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span>DEF: {myBeast?.defense}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Opponent Beast */}
              <Card className="border-destructive">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{opponentBeast.name}</CardTitle>
                      <Badge className="mt-2">{opponentBeast.traits?.type || 'Unknown'}</Badge>
                    </div>
                    <Badge variant="secondary">LVL {opponentBeast.level}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(opponentBeast as any).image_ipfs_uri ? (
                    <div className="w-48 h-48 mx-auto border-4 border-destructive bg-muted flex items-center justify-center overflow-hidden">
                      <img 
                        src={convertIpfsUrl((opponentBeast as any).image_ipfs_uri)} 
                        alt={opponentBeast.name}
                        className="w-full h-full object-cover pixelated"
                      />
                    </div>
                  ) : (
                    <div className="text-6xl text-center">⚡</div>
                  )}
                  <HealthBar value={opponentHp} max={opponentBeast.max_hp} label="HP" />
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      <span>ATK: {opponentBeast.attack}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span>DEF: {opponentBeast.defense}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Moves Selection */}
            {!isBattleComplete && isMyTurn && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Select Your Move
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {moves.slice(0, 6).map((move) => (
                      <Button
                        key={move.id}
                        variant="outline"
                        className="h-auto flex-col items-start p-4 min-h-[120px]"
                        onClick={() => handleMove(move)}
                        disabled={isExecutingMove}
                      >
                        <div className="font-bold mb-1">{move.name}</div>
                        <Badge variant="secondary" className="mb-2 text-xs">{move.type}</Badge>
                        <div className="text-xs text-muted-foreground line-clamp-2">{move.description}</div>
                        <div className="text-sm font-bold text-accent mt-2">
                          {move.damage > 0 ? `${move.damage} DMG` : 'HEAL'}
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Battle Log */}
            <Card>
              <CardHeader>
                <CardTitle>Battle Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-sm">
                  {battleLog.map((log, index) => (
                    <div key={index} className="text-muted-foreground">
                      <span className="text-primary">[{index + 1}]</span> {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Return Button */}
            {isBattleComplete && (
              <div className="text-center mt-6">
                <Button size="lg" onClick={() => router.push('/battle/pvp')}>
                  Return to PVP Menu
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
