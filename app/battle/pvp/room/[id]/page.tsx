'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import dynamic from 'next/dynamic'

// Lazy load outcome animation component for better performance
const OutcomeAnimation = dynamic(
  () => import('@/components/battle/outcome-animation').then(mod => ({ default: mod.OutcomeAnimation })),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }
)

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
  beast1_id: number | null
  beast2_id: number | null
  beast1_locked: boolean
  beast2_locked: boolean
  current_turn: string | null
  status: string
  winner_id: string | null
  room_code: string | null
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
  const [showOutcomeAnimation, setShowOutcomeAnimation] = useState(false)
  const [battleOutcome, setBattleOutcome] = useState<'victory' | 'defeat' | null>(null)
  const [rewardAmount, setRewardAmount] = useState<number>(0)
  
  // Beast selection states
  const [availableBeasts, setAvailableBeasts] = useState<Beast[]>([])
  const [selectedBeastForSelection, setSelectedBeastForSelection] = useState<number | null>(null)
  const [beastSelectionLocked, setBeastSelectionLocked] = useState(false)
  const [isSelectingBeast, setIsSelectingBeast] = useState(false)
  
  // Track if animation has been shown to prevent multiple triggers
  const animationShownRef = useRef(false)

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
        
        // Fetch user's available beasts
        const beastsRes = await fetch(`/api/beasts?wallet_address=${address}`)
        const beastsData = await beastsRes.json()
        setAvailableBeasts(beastsData.beasts || [])

        // Get battle details
        const battleRes = await fetch(`/api/battles?battle_id=${battleId}`)
        const battleData = await battleRes.json()
        
        if (battleData.battle) {
          const battleInfo = battleData.battle
          setBattle(battleInfo)
          
          const isPlayer1 = battleInfo.player1_id === currentUserId
          setIsHost(isPlayer1)
          
          // Check if beast selection is locked
          const myBeastLocked = isPlayer1 ? battleInfo.beast1_locked : battleInfo.beast2_locked
          setBeastSelectionLocked(myBeastLocked || false)
          
          // Get battle moves to determine current HP state
          const movesHistoryRes = await fetch(`/api/battles/moves?battle_id=${battleId}`)
          const movesHistoryData = await movesHistoryRes.json()
          const battleMoves = movesHistoryData.moves || []
          
          // Get my beast
          const myBeastId = isPlayer1 ? battleInfo.beast1_id : battleInfo.beast2_id
          
          if (myBeastId) {
            const beastRes = await fetch(`/api/beasts/${myBeastId}`)
            const beastData = await beastRes.json()
            
            if (beastData.beast) {
              setMyBeast(beastData.beast)
              
              // Calculate current HP from battle moves
              // Find the last move where I was the target (opponent attacked me)
              const movesAgainstMe = battleMoves.filter((m: any) => m.player_id !== currentUserId)
              const lastMoveAgainstMe = movesAgainstMe[movesAgainstMe.length - 1]
              
              const currentMyHp = lastMoveAgainstMe?.target_hp_remaining ?? beastData.beast.hp
              setMyBeastHp(currentMyHp)
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
                
                // Calculate opponent's current HP from battle moves
                // Find the last move where opponent was the target (I attacked them)
                const movesAgainstOpponent = battleMoves.filter((m: any) => m.player_id === currentUserId)
                const lastMoveAgainstOpponent = movesAgainstOpponent[movesAgainstOpponent.length - 1]
                
                const currentOppHp = lastMoveAgainstOpponent?.target_hp_remaining ?? oppBeastData.beast.hp
                setOpponentHp(currentOppHp)
                
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
    let pollInterval: NodeJS.Timeout | null = null

    const setupSubscription = () => {
      console.log(`Setting up subscription for battle: ${battleId}`)
      unsubscribe = subscribeToBattle(battleId, {
        onBattleUpdate: async (updatedBattle) => {
          console.log('Battle update received via WebSocket:', updatedBattle)
          setBattle(updatedBattle as any)
          
          // Sync HP state from battle moves
          try {
            const movesHistoryRes = await fetch(`/api/battles/moves?battle_id=${battleId}`)
            const movesHistoryData = await movesHistoryRes.json()
            const battleMoves = movesHistoryData.moves || []
            
            if (battleMoves.length > 0) {
              // Update my HP from opponent's moves
              const movesAgainstMe = battleMoves.filter((m: any) => m.player_id !== userId)
              const lastMoveAgainstMe = movesAgainstMe[movesAgainstMe.length - 1]
              if (lastMoveAgainstMe) {
                setMyBeastHp(lastMoveAgainstMe.target_hp_remaining)
              }
              
              // Update opponent HP from my moves
              const movesAgainstOpponent = battleMoves.filter((m: any) => m.player_id === userId)
              const lastMoveAgainstOpponent = movesAgainstOpponent[movesAgainstOpponent.length - 1]
              if (lastMoveAgainstOpponent) {
                setOpponentHp(lastMoveAgainstOpponent.target_hp_remaining)
              }
            }
          } catch (error) {
            console.error('Error syncing HP from moves:', error)
          }
          
          // REQUIREMENT 4.3: Display notification when opponent joins
          const opponentJustJoined = !battle?.player2_id && updatedBattle.player2_id
          if (opponentJustJoined) {
            addToBattleLog(`🎮 Opponent joined the room!`)
            console.log('Opponent joined notification displayed')
          }
          
          // REQUIREMENT 5.4: Listen for opponent beast selection and update state
          const oppBeastId = isHost ? updatedBattle.beast2_id : updatedBattle.beast1_id
          const oppBeastLocked = isHost ? updatedBattle.beast2_locked : updatedBattle.beast1_locked
          const previousOppBeastId = isHost ? battle?.beast2_id : battle?.beast1_id
          
          // Check if opponent just selected their beast (beast_id changed from null to a value)
          const opponentJustSelectedBeast = !previousOppBeastId && oppBeastId
          
          if (oppBeastId && !opponentBeast) {
            try {
              const oppBeastRes = await fetch(`/api/beasts/${oppBeastId}`)
              const oppBeastData = await oppBeastRes.json()
              
              if (oppBeastData.beast) {
                // Update opponent beast state
                setOpponentBeast(oppBeastData.beast)
                
                // Get HP from moves if available
                const movesHistoryRes = await fetch(`/api/battles/moves?battle_id=${battleId}`)
                const movesHistoryData = await movesHistoryRes.json()
                const battleMoves = movesHistoryData.moves || []
                
                const movesAgainstOpp = battleMoves.filter((m: any) => m.player_id === userId)
                const lastMoveAgainstOpp = movesAgainstOpp[movesAgainstOpp.length - 1]
                const currentOppHp = lastMoveAgainstOpp?.target_hp_remaining ?? oppBeastData.beast.hp
                
                setOpponentHp(currentOppHp)
                
                // Display notification for opponent beast selection
                if (opponentJustSelectedBeast) {
                  addToBattleLog(`⚔️ Opponent selected ${oppBeastData.beast.name}!`)
                  console.log('Opponent beast selection notification displayed')
                }
                
                // REQUIREMENT 5.4: Trigger battle start when both beasts locked
                const myBeastLocked = isHost ? updatedBattle.beast1_locked : updatedBattle.beast2_locked
                if (oppBeastLocked && myBeastLocked && updatedBattle.status === 'in_progress') {
                  addToBattleLog(`🔥 Both beasts are ready! Battle starting...`)
                  console.log('Battle start triggered - both beasts locked')
                }
              }
            } catch (error) {
              console.error('Error fetching opponent beast:', error)
            }
          }
          
          // Update turn state
          setIsMyTurn(updatedBattle.current_turn === userId)
          
          // Check if battle completed and show outcome animation (only once)
          if (updatedBattle.status === 'completed' && !animationShownRef.current) {
            animationShownRef.current = true
            const didWin = updatedBattle.winner_id === userId
            
            // Set reward amount from battle data
            if (updatedBattle.reward_amount) {
              setRewardAmount(updatedBattle.reward_amount)
              if (didWin && updatedBattle.reward_amount > 0) {
                addToBattleLog(`You earned ${updatedBattle.reward_amount} RISE tokens!`)
              }
            }
            
            addToBattleLog(didWin ? 'Victory! You won the battle!' : 'Defeat! Better luck next time!')
            
            // Small delay for smooth transition
            setTimeout(() => {
              setBattleOutcome(didWin ? 'victory' : 'defeat')
              setShowOutcomeAnimation(true)
            }, 500)
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
          } else {
            // My move was recorded, update opponent HP
            setOpponentHp(move.target_hp_remaining)
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

    // Polling fallback - check battle status every 2 seconds
    const pollBattleStatus = async () => {
      try {
        const battleRes = await fetch(`/api/battles?battle_id=${battleId}`)
        const battleData = await battleRes.json()
        
        if (battleData.battle) {
          const battleInfo = battleData.battle
          console.log('Battle status polled:', battleInfo.status, 'Player2:', battleInfo.player2_id)
          
          // Stop polling if battle is completed
          if (battleInfo.status === 'completed' && pollInterval) {
            console.log('Battle completed, stopping polling')
            clearInterval(pollInterval)
            pollInterval = null
          }
          
          // Update battle state
          setBattle(battleInfo)
          setIsMyTurn(battleInfo.current_turn === userId)
          
          // Get battle moves to sync HP state
          const movesHistoryRes = await fetch(`/api/battles/moves?battle_id=${battleId}`)
          const movesHistoryData = await movesHistoryRes.json()
          const battleMoves = movesHistoryData.moves || []
          
          // Update HP from battle moves
          if (battleMoves.length > 0) {
            // Find moves against me (opponent's moves)
            const movesAgainstMe = battleMoves.filter((m: any) => m.player_id !== userId)
            const lastMoveAgainstMe = movesAgainstMe[movesAgainstMe.length - 1]
            
            if (lastMoveAgainstMe) {
              setMyBeastHp(lastMoveAgainstMe.target_hp_remaining)
            }
            
            // Find moves against opponent (my moves)
            const movesAgainstOpponent = battleMoves.filter((m: any) => m.player_id === userId)
            const lastMoveAgainstOpponent = movesAgainstOpponent[movesAgainstOpponent.length - 1]
            
            if (lastMoveAgainstOpponent) {
              setOpponentHp(lastMoveAgainstOpponent.target_hp_remaining)
            }
          }
          
          // Check if battle completed and show outcome animation (only once)
          if (battleInfo.status === 'completed' && !animationShownRef.current) {
            animationShownRef.current = true
            const didWin = battleInfo.winner_id === userId
            
            // Set reward amount from battle data
            if (battleInfo.reward_amount) {
              setRewardAmount(battleInfo.reward_amount)
              if (didWin && battleInfo.reward_amount > 0) {
                addToBattleLog(`You earned ${battleInfo.reward_amount} RISE tokens!`)
              }
            }
            
            addToBattleLog(didWin ? 'Victory! You won the battle!' : 'Defeat! Better luck next time!')
            
            // Small delay for smooth transition
            setTimeout(() => {
              setBattleOutcome(didWin ? 'victory' : 'defeat')
              setShowOutcomeAnimation(true)
            }, 500)
          }
          
          // REQUIREMENT 4.3: Display notification when opponent joins (polling fallback)
          const opponentJustJoined = !battle?.player2_id && battleInfo.player2_id
          if (opponentJustJoined) {
            addToBattleLog(`🎮 Opponent joined the room!`)
            console.log('Opponent joined notification displayed (polling)')
          }
          
          // REQUIREMENT 5.4: Listen for opponent beast selection and update state (polling fallback)
          const oppBeastId = isHost ? battleInfo.beast2_id : battleInfo.beast1_id
          const oppBeastLocked = isHost ? battleInfo.beast2_locked : battleInfo.beast1_locked
          
          if (oppBeastId && !opponentBeast) {
            const oppBeastRes = await fetch(`/api/beasts/${oppBeastId}`)
            const oppBeastData = await oppBeastRes.json()
            
            if (oppBeastData.beast) {
              console.log('Opponent beast loaded via polling:', oppBeastData.beast.name)
              
              // Update opponent beast state
              setOpponentBeast(oppBeastData.beast)
              
              // Set initial HP or HP from moves
              const movesAgainstOpp = battleMoves.filter((m: any) => m.player_id === userId)
              const lastMoveAgainstOpp = movesAgainstOpp[movesAgainstOpp.length - 1]
              const currentOppHp = lastMoveAgainstOpp?.target_hp_remaining ?? oppBeastData.beast.hp
              
              setOpponentHp(currentOppHp)
              
              // Display notification for opponent beast selection
              addToBattleLog(`⚔️ Opponent selected ${oppBeastData.beast.name}!`)
              console.log('Opponent beast selection notification displayed (polling)')
              
              // REQUIREMENT 5.4: Trigger battle start when both beasts locked (polling fallback)
              const myBeastLocked = isHost ? battleInfo.beast1_locked : battleInfo.beast2_locked
              if (oppBeastLocked && myBeastLocked && battleInfo.status === 'in_progress') {
                addToBattleLog(`🔥 Both beasts are ready! Battle starting...`)
                console.log('Battle start triggered - both beasts locked (polling)')
              }
            }
          }
        }
      } catch (error) {
        console.error('Error polling battle status:', error)
      }
    }

    // Set up connection manager for automatic reconnection
    connectionManager = new ConnectionManager(
      setupSubscription,
      setConnectionStatus
    )

    // Initial subscription
    setupSubscription()
    
    // Start polling every 2 seconds as fallback
    pollInterval = setInterval(pollBattleStatus, 2000)

    return () => {
      if (unsubscribe) unsubscribe()
      if (connectionManager) connectionManager.cleanup()
      if (pollInterval) clearInterval(pollInterval)
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
        
        // Set reward amount if provided
        if (moveData.reward_amount) {
          setRewardAmount(moveData.reward_amount)
          addToBattleLog(`You earned ${moveData.reward_amount} RISE tokens!`)
        }
        
        // Show outcome animation (only once)
        if (!animationShownRef.current) {
          animationShownRef.current = true
          setTimeout(() => {
            setBattleOutcome('victory')
            setShowOutcomeAnimation(true)
          }, 500)
        }
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

  const handleBeastSelection = async () => {
    if (!selectedBeastForSelection || !userId || !battle) return

    // Client-side validation: Check if beast selection is already locked
    if (beastSelectionLocked) {
      addToBattleLog('Error: Beast selection is already locked')
      return
    }

    // Client-side validation: Check if battle is still in valid state
    if (battle.status === 'completed') {
      addToBattleLog('Error: Cannot select beast for completed battle')
      return
    }

    setIsSelectingBeast(true)

    try {
      const response = await fetch(`/api/battles/rooms/${battle.id}/select-beast`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: userId,
          beast_id: selectedBeastForSelection
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to select beast')
      }

      // Update local state with selected beast
      const selectedBeast = availableBeasts.find(b => b.id === selectedBeastForSelection)
      if (selectedBeast) {
        setMyBeast(selectedBeast)
        setMyBeastHp(selectedBeast.hp)
      }

      // Set beast selection as locked
      setBeastSelectionLocked(true)

      // Update battle state
      setBattle(data.battle)

      // Add to battle log
      addToBattleLog(`You selected ${selectedBeast?.name}!`)

      // If battle started (both beasts selected), update turn state
      if (data.battle.status === 'in_progress') {
        setIsMyTurn(data.battle.current_turn === userId)
        addToBattleLog('Battle starting! Both beasts are ready!')
      }
    } catch (error: any) {
      console.error('Error selecting beast:', error)
      addToBattleLog(`Error: ${error.message}`)
    } finally {
      setIsSelectingBeast(false)
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

        {/* Beast Selection View */}
        {isWaiting && !myBeast && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                Select Your Beast
                {beastSelectionLocked && (
                  <Badge variant="default" className="bg-green-600">
                    🔒 Locked
                  </Badge>
                )}
              </CardTitle>
              <p className="text-center text-muted-foreground text-sm mt-2">
                {beastSelectionLocked ? '🔒 Beast selection is locked' : 'Choose your fighter for this battle'}
              </p>
            </CardHeader>
            <CardContent>
              {/* Show opponent's beast if already selected */}
              {opponentBeast && (
                <div className="mb-6 p-4 bg-muted rounded-lg border-2 border-primary/20">
                  <p className="text-sm text-muted-foreground font-mono mb-3 text-center">
                    Opponent's Beast
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    {(opponentBeast as any).image_ipfs_uri && (
                      <div className="w-24 h-24 border-2 border-primary bg-muted flex items-center justify-center overflow-hidden">
                        <img 
                          src={convertIpfsUrl((opponentBeast as any).image_ipfs_uri)} 
                          alt={opponentBeast.name}
                          className="w-full h-full object-cover pixelated"
                        />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-bold font-mono text-lg">{opponentBeast.name}</p>
                      <Badge variant="secondary" className="mt-1">LVL {opponentBeast.level}</Badge>
                      <div className="flex gap-3 text-xs font-mono mt-2">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-accent" />
                          <span>{opponentBeast.attack}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-blue-500" />
                          <span>{opponentBeast.defense}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-destructive" />
                          <span>{opponentBeast.hp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Beast selection cards */}
              {availableBeasts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You don't have any beasts yet!</p>
                  <Button onClick={() => router.push('/inventory')}>
                    Go to Inventory
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {availableBeasts.map((beast) => (
                      <Card
                        key={beast.id}
                        className={`transition-all ${
                          beastSelectionLocked 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'cursor-pointer hover:border-primary hover:shadow-lg'
                        } ${
                          selectedBeastForSelection === beast.id
                            ? 'border-primary border-2 bg-primary/5 shadow-xl'
                            : 'border-border'
                        }`}
                        onClick={() => !beastSelectionLocked && setSelectedBeastForSelection(beast.id)}
                      >
                        <CardContent className="p-4">
                          {(beast as any).image_ipfs_uri && (
                            <div className="w-full aspect-square mb-3 border-2 border-primary bg-muted flex items-center justify-center overflow-hidden rounded-lg">
                              <img 
                                src={convertIpfsUrl((beast as any).image_ipfs_uri)} 
                                alt={beast.name}
                                className="w-full h-full object-cover pixelated"
                              />
                            </div>
                          )}
                          <p className="font-bold font-mono text-lg mb-1">{beast.name}</p>
                          <Badge variant="secondary" className="mb-2">LVL {beast.level}</Badge>
                          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-accent" />
                              <span>{beast.attack}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-blue-500" />
                              <span>{beast.defense}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-destructive" />
                              <span>{beast.hp}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Confirm selection button */}
                  <div className="text-center">
                    <Button
                      size="lg"
                      disabled={!selectedBeastForSelection || isSelectingBeast || beastSelectionLocked}
                      onClick={handleBeastSelection}
                    >
                      {beastSelectionLocked ? (
                        <>
                          🔒 Beast Locked
                        </>
                      ) : isSelectingBeast ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        'Confirm Beast Selection'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Waiting for Opponent */}
        {isWaiting && myBeast && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                Waiting for Opponent
              </CardTitle>
              <p className="text-center text-muted-foreground text-sm mt-2">
                Share the room code below to invite your opponent
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                {/* Room Code Section - Prominently Displayed */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-lg border-2 border-primary shadow-lg">
                  <p className="text-sm text-muted-foreground mb-3 font-mono uppercase tracking-wide">
                    Battle Room Code
                  </p>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <p className="text-5xl font-bold font-mono tracking-widest text-primary drop-shadow-lg">
                      {battle?.room_code}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleCopyRoomCode}
                    >
                      {copiedCode ? (
                        <>
                          <span className="text-green-500 mr-2">✓</span>
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1"
                      variant="default"
                      onClick={() => shareBattleToTelegram(battle?.room_code || '', battle?.id)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Share via Telegram
                    </Button>
                  </div>
                </div>

                {/* Selected Beast Display with Locked Indicator */}
                {myBeast && (
                  <div className="bg-card p-6 rounded-lg border-2 border-green-600/50 shadow-md relative">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <p className="text-sm font-mono font-semibold text-muted-foreground">Your Selected Beast</p>
                      {beastSelectionLocked && (
                        <Badge variant="default" className="bg-green-600 text-white">
                          🔒 Locked
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center">
                      {(myBeast as any).image_ipfs_uri && (
                        <div className="w-40 h-40 mb-4 border-4 border-green-600 bg-muted flex items-center justify-center overflow-hidden rounded-lg shadow-lg">
                          <img 
                            src={convertIpfsUrl((myBeast as any).image_ipfs_uri)} 
                            alt={myBeast.name}
                            className="w-full h-full object-cover pixelated"
                          />
                        </div>
                      )}
                      <p className="font-bold font-mono text-xl mb-2">{myBeast.name}</p>
                      <Badge variant="secondary" className="mb-3">LVL {myBeast.level}</Badge>
                      
                      {/* Beast Stats */}
                      <div className="flex gap-6 text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-accent" />
                          <span className="font-semibold">ATK:</span>
                          <span>{myBeast.attack}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span className="font-semibold">DEF:</span>
                          <span>{myBeast.defense}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-destructive" />
                          <span className="font-semibold">HP:</span>
                          <span>{myBeast.hp}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Waiting Animation */}
                <div className="py-4">
                  <p className="text-sm text-muted-foreground mb-3 font-mono">
                    Waiting for opponent to join...
                  </p>
                  <div className="flex gap-2 justify-center">
                    <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>

                {/* Cancel Room Button */}
                <div className="pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={handleCancelRoom}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Room
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Battle Active */}
        {(isBattleActive || isBattleComplete) && (
          opponentBeast ? (
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
              <Card className="border-primary relative">
                {beastSelectionLocked && (
                  <Badge variant="default" className="absolute top-2 right-2 bg-green-600 z-10">
                    🔒 Locked
                  </Badge>
                )}
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
                        className="h-auto flex-col items-start p-4"
                        onClick={() => handleMove(move)}
                        disabled={isExecutingMove}
                      >
                        <div className="font-bold mb-1">{move.name}</div>
                        <Badge variant="secondary" className="mb-2 text-xs">{move.type}</Badge>
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
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                  <p className="text-lg font-mono">Loading opponent data...</p>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </main>
      
      {/* Outcome Animation */}
      {showOutcomeAnimation && battleOutcome && (
        <OutcomeAnimation
          outcome={battleOutcome}
          visible={showOutcomeAnimation}
          rewardAmount={rewardAmount}
          onComplete={() => {
            setShowOutcomeAnimation(false)
            router.push('/battle/pvp')
          }}
        />
      )}
    </div>
  )
}
