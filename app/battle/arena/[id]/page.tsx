'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { HealthBar } from '@/components/8bitcn/health-bar'
import { useTonAddress } from '@tonconnect/ui-react'
import { supabase } from '@/lib/supabase'
import { Swords, Zap, Shield, Sparkles, Trophy, Loader2, Coins } from 'lucide-react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { getStakeData, clearStakeData, validateStakeData } from '@/lib/stake-storage'
import { useIsMobile } from '@/hooks/use-mobile'
import dynamic from 'next/dynamic'

// Lazy load outcome animation component for better performance
// Only load when needed to reduce initial bundle size
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
  level: number
  traits: any
}

interface Enemy {
  id: number
  name: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  reward: number
}

interface Move {
  id: number
  name: string
  damage: number
  type: string
  description: string
}

interface Battle {
  id: string
  player1_id: string
  player2_id: string | null
  beast1: Beast
  beast2: Beast | null
  current_turn: string
  status: string
  winner_id: string | null
  battle_type: 'pvp' | 'pve'
  enemy_id: number | null
  reward_amount: number
  reward_status: string
}

interface BattleMove {
  id: string
  battle_id: string
  player_id: string
  move_id: number
  turn_number: number
  damage_dealt: number
  target_hp_remaining: number
  move: Move
}

export default function BattleArenaPage() {
  const router = useRouter()
  const params = useParams()
  const battleId = params.id as string
  const address = useTonAddress()
  const isMobile = useIsMobile()
  
  const [userId, setUserId] = useState<string | null>(null)
  const [battle, setBattle] = useState<Battle | null>(null)
  const [myBeast, setMyBeast] = useState<Beast | null>(null)
  const [opponentBeast, setOpponentBeast] = useState<Beast | null>(null)
  const [enemy, setEnemy] = useState<Enemy | null>(null)
  const [myBeastHp, setMyBeastHp] = useState<number>(0)
  const [opponentHp, setOpponentHp] = useState<number>(0)
  const [moves, setMoves] = useState<Move[]>([])
  const [battleMoves, setBattleMoves] = useState<BattleMove[]>([])
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [isExecutingMove, setIsExecutingMove] = useState(false)
  const [turnNumber, setTurnNumber] = useState(1)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [stakeAmount, setStakeAmount] = useState<number>(0)
  const [showOutcomeAnimation, setShowOutcomeAnimation] = useState(false)
  const [battleOutcome, setBattleOutcome] = useState<'victory' | 'defeat' | null>(null)
  const [viewportWidth, setViewportWidth] = useState<number>(0)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isAnimationLoading, setIsAnimationLoading] = useState(false)
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)
  const [isPVE, setIsPVE] = useState(false)
  const [rewardAmount, setRewardAmount] = useState<number>(0)

  // Handle viewport changes for dynamic layout adjustment
  useEffect(() => {
    // Set initial viewport width
    setViewportWidth(window.innerWidth)
    
    // Listen for viewport changes (including orientation changes)
    const handleResize = () => {
      setViewportWidth(window.innerWidth)
    }
    
    // Listen for orientation changes specifically
    const handleOrientationChange = () => {
      // Small delay to ensure viewport dimensions are updated
      setTimeout(() => {
        setViewportWidth(window.innerWidth)
      }, 100)
    }
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  // Validate stake data on mount
  useEffect(() => {
    if (!validateStakeData(battleId)) {
      // No valid stake found, redirect to start page
      router.push(`/battle/${battleId}/start`)
      return
    }
    
    // Get stake amount to display
    const stakeData = getStakeData()
    if (stakeData) {
      setStakeAmount(stakeData.amount)
    }
  }, [battleId, router])

  // Get user and battle data
  useEffect(() => {
    if (!address) {
      router.push('/')
      return
    }

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
          
          const isPVEBattle = battleInfo.battle_type === 'pve'
          setIsPVE(isPVEBattle)
          setRewardAmount(battleInfo.reward_amount || 0)

          if (isPVEBattle) {
            // PVE battle - player vs enemy
            const myBeastData = battleInfo.beast1
            setMyBeast(myBeastData)
            setMyBeastHp(myBeastData.hp)
            
            // Fetch enemy data
            const enemiesRes = await fetch('/api/enemies')
            const enemiesData = await enemiesRes.json()
            const enemyData = enemiesData.enemies?.find((e: Enemy) => e.id === battleInfo.enemy_id)
            
            if (enemyData) {
              setEnemy(enemyData)
              setOpponentHp(enemyData.hp)
              addToBattleLog(`Battle started! ${myBeastData.name} vs ${enemyData.name}`)
            }
          } else {
            // PVP battle - player vs player
            const isPlayer1 = battleInfo.player1_id === currentUserId
            const myBeastData = isPlayer1 ? battleInfo.beast1 : battleInfo.beast2
            const oppBeastData = isPlayer1 ? battleInfo.beast2 : battleInfo.beast1

            setMyBeast(myBeastData)
            setOpponentBeast(oppBeastData)
            setMyBeastHp(myBeastData.hp)
            setOpponentHp(oppBeastData.hp)
            addToBattleLog(`Battle started! ${myBeastData.name} vs ${oppBeastData.name}`)
          }
          
          setIsMyTurn(battleInfo.current_turn === currentUserId)
        }

        // Get available moves
        const movesRes = await fetch('/api/moves')
        const movesData = await movesRes.json()
        setMoves(movesData.moves || [])

        // Get battle moves history
        const historyRes = await fetch(`/api/battles/moves?battle_id=${battleId}`)
        const historyData = await historyRes.json()
        setBattleMoves(historyData.moves || [])
        setTurnNumber((historyData.moves?.length || 0) + 1)

        // Page loaded successfully
        setIsPageLoading(false)

      } catch (error) {
        console.error('Error fetching battle data:', error)
        setIsPageLoading(false)
      }
    }

    fetchBattleData()
  }, [address, battleId, router])

  // Subscribe to real-time battle moves
  useEffect(() => {
    if (!battleId) return

    const newChannel = supabase
      .channel(`battle_${battleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_moves',
          filter: `battle_id=eq.${battleId}`
        },
        async (payload) => {
          console.log('New move received:', payload)
          
          // Fetch the complete move data with move details
          const res = await fetch(`/api/battles/moves?battle_id=${battleId}`)
          const data = await res.json()
          setBattleMoves(data.moves || [])
          
          const newMove = payload.new as any
          
          // Update HP based on who made the move
          if (newMove.player_id === userId) {
            // My move - opponent took damage
            setOpponentHp(newMove.target_hp_remaining)
          } else {
            // Opponent's move - I took damage
            setMyBeastHp(newMove.target_hp_remaining)
          }

          setTurnNumber(newMove.turn_number + 1)
          
          // Check battle status
          const battleRes = await fetch(`/api/battles?battle_id=${battleId}`)
          const battleData = await battleRes.json()
          if (battleData.battle) {
            setBattle(battleData.battle)
            setIsMyTurn(battleData.battle.current_turn === userId)
            
            // Check if battle is completed and show outcome animation
            if (battleData.battle.status === 'completed' && !showOutcomeAnimation) {
              setIsAnimationLoading(true)
              
              // Small delay for smooth transition
              setTimeout(() => {
                const didWin = battleData.battle.winner_id === userId
                setBattleOutcome(didWin ? 'victory' : 'defeat')
                setShowOutcomeAnimation(true)
                setIsAnimationLoading(false)
                
                // Clear stake data after battle completes
                clearStakeData()
              }, 300)
            }
          }
        }
      )
      .subscribe()

    setChannel(newChannel)

    return () => {
      newChannel.unsubscribe()
    }
  }, [battleId, userId])

  const addToBattleLog = useCallback((message: string) => {
    setBattleLog(prev => [...prev, message])
  }, [])

  const handleMove = useCallback(async (move: Move) => {
    if (!battle || !userId || !isMyTurn || isExecutingMove) return

    setIsExecutingMove(true)

    try {
      // Calculate damage
      const baseDamage = move.damage
      const attackStat = myBeast?.attack || 50
      const defenseStat = isPVE ? (enemy?.defense || 30) : (opponentBeast?.defense || 30)
      
      // Damage formula: base_damage * (attack / (attack + defense)) * random(0.85-1.15)
      const randomMultiplier = 0.85 + Math.random() * 0.3
      const calculatedDamage = Math.max(
        1, 
        Math.floor(baseDamage * (attackStat / (attackStat + defenseStat)) * randomMultiplier)
      )
      
      const newOpponentHp = Math.max(0, opponentHp - calculatedDamage)
      const opponentName = isPVE ? enemy?.name : opponentBeast?.name

      addToBattleLog(
        `${myBeast?.name} used ${move.name}! Dealt ${calculatedDamage} damage!`
      )

      // Update opponent HP immediately for better UX
      setOpponentHp(newOpponentHp)

      // Check if battle ended (opponent HP reached 0)
      if (newOpponentHp === 0) {
        addToBattleLog(
          `${myBeast?.name} wins! ${opponentName} has been defeated!`
        )
        
        // Complete the battle via API
        if (isPVE) {
          const completeResponse = await fetch(`/api/battles/${battleId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              winner: 'player',
              final_player_hp: myBeastHp,
              final_enemy_hp: newOpponentHp
            })
          })

          const completeData = await completeResponse.json()
          
          if (completeData.success) {
            setRewardAmount(completeData.reward || 0)
            
            if (completeData.reward > 0) {
              addToBattleLog(`You earned ${completeData.reward} RISE tokens!`)
            }
          }
        }
        
        // Show loading state before animation
        setIsAnimationLoading(true)
        
        // Small delay for smooth transition
        setTimeout(() => {
          setBattleOutcome('victory')
          setShowOutcomeAnimation(true)
          setIsAnimationLoading(false)
          
          // Clear stake data
          clearStakeData()
        }, 300)
      } else {
        // Battle continues - switch turn
        setIsMyTurn(false)
        
        if (isPVE) {
          // Execute AI enemy move after a delay
          addToBattleLog("Enemy's turn...")
          
          setTimeout(async () => {
            // AI selects a random move
            const aiMove = moves[Math.floor(Math.random() * Math.min(moves.length, 6))]
            
            if (aiMove && enemy) {
              const aiAttackStat = enemy.attack
              const aiDefenseStat = myBeast?.defense || 30
              const aiRandomMultiplier = 0.85 + Math.random() * 0.3
              const aiDamage = Math.max(
                1,
                Math.floor(aiMove.damage * (aiAttackStat / (aiAttackStat + aiDefenseStat)) * aiRandomMultiplier)
              )
              
              const newPlayerHp = Math.max(0, myBeastHp - aiDamage)
              
              addToBattleLog(
                `${enemy.name} used ${aiMove.name}! Dealt ${aiDamage} damage!`
              )
              
              setMyBeastHp(newPlayerHp)
              
              // Check if player lost
              if (newPlayerHp === 0) {
                addToBattleLog(
                  `${enemy.name} wins! ${myBeast?.name} has been defeated!`
                )
                
                // Complete the battle via API
                const completeResponse = await fetch(`/api/battles/${battleId}/complete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    winner: 'enemy',
                    final_player_hp: newPlayerHp,
                    final_enemy_hp: opponentHp
                  })
                })
                
                // Show loading state before animation
                setIsAnimationLoading(true)
                
                setTimeout(() => {
                  setBattleOutcome('defeat')
                  setShowOutcomeAnimation(true)
                  setIsAnimationLoading(false)
                  clearStakeData()
                }, 300)
              } else {
                // Player's turn again
                setIsMyTurn(true)
                addToBattleLog("Your turn!")
              }
            }
          }, 2000) // 2 second delay for AI move
        } else {
          addToBattleLog("Opponent's turn...")
        }
      }

    } catch (error) {
      console.error('Error executing move:', error)
      addToBattleLog('Error executing move. Please try again.')
    } finally {
      setIsExecutingMove(false)
    }
  }, [battle, userId, isMyTurn, isExecutingMove, myBeast, opponentBeast, enemy, opponentHp, myBeastHp, battleId, turnNumber, addToBattleLog, isPVE, moves])

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const isCompleted = useMemo(() => battle?.status === 'completed', [battle?.status])
  const didIWin = useMemo(() => battle?.winner_id === userId, [battle?.winner_id, userId])
  
  // Memoize available moves to prevent re-renders
  const availableMoves = useMemo(() => moves.slice(0, 6), [moves])

  if (isPageLoading || !battle || !myBeast || (!opponentBeast && !enemy)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 animate-in fade-in duration-700">
        <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg border-4 border-primary animate-in zoom-in-95 duration-500">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <p className="text-lg font-bold font-mono text-primary animate-pulse">Loading Battle Arena...</p>
          <p className="text-sm text-muted-foreground font-mono">Preparing combatants</p>
          <div className="flex gap-2 mt-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 animate-in fade-in duration-700">
        {/* Battle Header */}
        <div className="text-center mb-6 animate-in slide-in-from-top duration-500">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2 text-glow">
            BATTLE ARENA
          </h1>
          <div className="flex flex-col items-center gap-2">
            {isCompleted ? (
              <Badge variant={didIWin ? 'default' : 'destructive'} className="text-lg px-4 py-2 animate-in zoom-in duration-300">
                <Trophy className="w-5 h-5 mr-2" />
                {didIWin ? 'VICTORY!' : 'DEFEAT'}
              </Badge>
            ) : (
              <Badge variant={isMyTurn ? 'default' : 'secondary'} className="text-lg px-4 py-2 transition-all duration-300">
                {isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN"}
              </Badge>
            )}
            {stakeAmount > 0 && (
              <Badge variant="outline" className="text-md px-3 py-1 animate-in slide-in-from-top duration-700">
                <Coins className="w-4 h-4 mr-2" />
                Stake: {stakeAmount} $RISE
              </Badge>
            )}
          </div>
        </div>

        {/* Battle Arena */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* My Beast */}
          <Card className="border-primary animate-in slide-in-from-left duration-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{myBeast.name}</CardTitle>
                  <Badge className="mt-2">{myBeast.traits?.type || 'Unknown'}</Badge>
                </div>
                <Badge variant="secondary">LVL {myBeast.level}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-6xl text-center">🔥</div>
              <HealthBar value={myBeastHp} max={myBeast.max_hp} label="HP" />
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>ATK: {myBeast.attack}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>DEF: {myBeast.defense}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opponent Beast or Enemy */}
          <Card className="border-destructive animate-in slide-in-from-right duration-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    {isPVE ? enemy?.name : opponentBeast?.name}
                  </CardTitle>
                  {!isPVE && opponentBeast && (
                    <Badge className="mt-2">{opponentBeast.traits?.type || 'Unknown'}</Badge>
                  )}
                  {isPVE && (
                    <Badge variant="destructive" className="mt-2">Enemy</Badge>
                  )}
                </div>
                <Badge variant="secondary">
                  LVL {isPVE ? enemy?.level : opponentBeast?.level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-6xl text-center">⚡</div>
              <HealthBar 
                value={opponentHp} 
                max={isPVE ? (enemy?.maxHp || 100) : (opponentBeast?.max_hp || 100)} 
                label="HP" 
              />
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>ATK: {isPVE ? enemy?.attack : opponentBeast?.attack}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>DEF: {isPVE ? enemy?.defense : opponentBeast?.defense}</span>
                </div>
              </div>
              {isPVE && enemy && (
                <div className="pt-2 border-t border-border">
                  <Badge variant="default" className="w-full justify-center">
                    <Coins className="w-4 h-4 mr-2" />
                    Reward: {enemy.reward} RISE
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Moves Selection */}
        {!isCompleted && isMyTurn && (
          <Card className="mb-6 animate-in slide-in-from-bottom duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Select Your Move
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {availableMoves.map((move) => (
                  <Button
                    key={move.id}
                    variant="outline"
                    className="h-auto flex-col items-start p-3 sm:p-4 min-h-[88px] sm:min-h-[120px] min-w-full touch-manipulation transition-all duration-200 hover:scale-105 active:scale-95"
                    onClick={() => handleMove(move)}
                    disabled={isExecutingMove}
                  >
                    <div className="font-bold mb-1 text-sm sm:text-base w-full text-left">{move.name}</div>
                    <Badge variant="secondary" className="mb-2 text-xs">{move.type}</Badge>
                    <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2 w-full text-left">{move.description}</div>
                    <div className="text-sm sm:text-base font-bold text-accent mt-2 w-full text-left">
                      {move.damage > 0 ? `${move.damage} DMG` : 'HEAL'}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Battle Log */}
        <Card className="animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle>Battle Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-sm">
              {battleLog.map((log, index) => (
                <div key={index} className="text-muted-foreground">
                  <span className="text-primary">[Turn {Math.floor(index / 2) + 1}]</span> {log}
                </div>
              ))}
              {battleLog.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Waiting for battle to begin...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      
      {/* Animation Loading State */}
      {isAnimationLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg border-4 border-primary animate-in zoom-in-95 duration-500">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <p className="text-lg font-bold font-mono text-primary animate-pulse">Battle Complete!</p>
            <p className="text-sm text-muted-foreground font-mono">Preparing results...</p>
            <div className="flex gap-2 mt-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Outcome Animation */}
      {battleOutcome && (
        <OutcomeAnimation
          outcome={battleOutcome}
          visible={showOutcomeAnimation}
          rewardAmount={rewardAmount}
          stakeAmount={stakeAmount}
          onComplete={() => {
            // Animation completed, user can click button to return
          }}
        />
      )}
    </div>
  )
}
