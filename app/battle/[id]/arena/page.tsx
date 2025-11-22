'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTonAddress } from '@tonconnect/ui-react'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { HealthBar } from '@/components/8bitcn/health-bar'
import { BeastImage } from '@/components/battle/beast-image'
import { Zap, Shield, Sparkles, Trophy, Loader2, Coins } from 'lucide-react'
import dynamic from 'next/dynamic'
import { getStakeData } from '@/lib/stake-storage'

// Lazy load outcome animation component
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
  image_url?: string
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
  player2_id: string
  beast1_id: number
  beast2_id: number
  beast1: Beast
  beast2: Beast
  status: string
  winner_id: string | null
  battle_type: 'pvp'
  reward_amount: number
  bet_amount: number
}

export default function BattleArenaPage() {
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
  const [isMyTurn, setIsMyTurn] = useState(true)
  const [isExecutingMove, setIsExecutingMove] = useState(false)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [stakeAmount, setStakeAmount] = useState<number>(0)
  const [showOutcomeAnimation, setShowOutcomeAnimation] = useState(false)
  const [battleOutcome, setBattleOutcome] = useState<'victory' | 'defeat' | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isAnimationLoading, setIsAnimationLoading] = useState(false)
  const [rewardAmount, setRewardAmount] = useState<number>(0)
  const [isValidatingEntry, setIsValidatingEntry] = useState(true)
  const [validationError, setValidationError] = useState<string>('')

  // Validate arena entry before loading battle data
  useEffect(() => {
    if (!address) {
      router.push('/')
      return
    }

    async function validateArenaEntry() {
      setIsValidatingEntry(true)
      setValidationError('')

      try {
        // Step 1: Check for completed transaction in session storage
        const stakeData = getStakeData()
        
        if (!stakeData) {
          console.log('No stake data found in session storage')
          setValidationError('NO_STAKE_DATA')
          router.push(`/battle/${battleId}/start`)
          return
        }

        // Verify stake data matches current battle
        if (stakeData.battleId !== battleId) {
          console.log('Stake data battle ID mismatch')
          setValidationError('BATTLE_MISMATCH')
          router.push(`/battle/${battleId}/start`)
          return
        }

        // Check if transaction is completed
        if (stakeData.status !== 'completed' || !stakeData.transactionHash) {
          console.log('Transaction not completed or missing hash')
          setValidationError('TRANSACTION_INCOMPLETE')
          router.push(`/battle/${battleId}/start`)
          return
        }

        // Step 2: Verify transaction exists in database
        try {
          const response = await fetch(`/api/battles/stake?transaction_hash=${stakeData.transactionHash}`)
          
          if (!response.ok) {
            console.log('Transaction not found in database')
            setValidationError('TRANSACTION_NOT_FOUND')
            router.push(`/battle/${battleId}/start`)
            return
          }

          const data = await response.json()
          
          if (!data.stake_transaction || data.stake_transaction.status !== 'completed') {
            console.log('Transaction not completed in database')
            setValidationError('TRANSACTION_NOT_COMPLETED')
            router.push(`/battle/${battleId}/start`)
            return
          }

          // Validation successful - allow entry
          setIsValidatingEntry(false)
        } catch (dbError) {
          console.error('Error verifying transaction in database:', dbError)
          setValidationError('VERIFICATION_ERROR')
          router.push(`/battle/${battleId}/start`)
          return
        }
      } catch (error) {
        console.error('Error validating arena entry:', error)
        setValidationError('VALIDATION_ERROR')
        router.push(`/battle/${battleId}/start`)
      }
    }

    validateArenaEntry()
  }, [address, battleId, router])

  // Get user and battle data
  useEffect(() => {
    if (!address) {
      router.push('/')
      return
    }

    // Don't fetch battle data until validation is complete
    if (isValidatingEntry) {
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
          
          // Determine which beast is mine
          const isPlayer1 = battleInfo.player1_id === currentUserId
          const myBeastData = isPlayer1 ? battleInfo.beast1 : battleInfo.beast2
          const opponentBeastData = isPlayer1 ? battleInfo.beast2 : battleInfo.beast1
          
          setMyBeast(myBeastData)
          setOpponentBeast(opponentBeastData)
          setMyBeastHp(myBeastData.hp)
          setOpponentHp(opponentBeastData.hp)
          
          // Set stake amount from battle record
          setStakeAmount(battleInfo.bet_amount || 0)
          setRewardAmount(battleInfo.reward_amount || 0)
          
          addToBattleLog(`Battle started! ${myBeastData.name} vs ${opponentBeastData.name}`)
          
          // Check if battle is already completed
          if (battleInfo.status === 'completed') {
            const didWin = battleInfo.winner_id === currentUserId
            setBattleOutcome(didWin ? 'victory' : 'defeat')
            setShowOutcomeAnimation(true)
            setIsMyTurn(false)
          }
        }

        // Get available moves
        const movesRes = await fetch('/api/moves')
        const movesData = await movesRes.json()
        setMoves(movesData.moves || [])

        // Page loaded successfully
        setIsPageLoading(false)

      } catch (error) {
        console.error('Error fetching battle data:', error)
        setIsPageLoading(false)
      }
    }

    fetchBattleData()
  }, [address, battleId, router, isValidatingEntry])

  const addToBattleLog = useCallback((message: string) => {
    setBattleLog(prev => [...prev, message])
  }, [])

  const handleMove = useCallback(async (move: Move) => {
    if (!battle || !userId || !isMyTurn || isExecutingMove || !opponentBeast || !myBeast) return

    setIsExecutingMove(true)

    try {
      // Calculate damage
      const baseDamage = move.damage
      const attackStat = myBeast.attack
      const defenseStat = opponentBeast.defense
      
      // Damage formula: base_damage * (attack / (attack + defense)) * random(0.85-1.15)
      const randomMultiplier = 0.85 + Math.random() * 0.3
      const calculatedDamage = Math.max(
        1, 
        Math.floor(baseDamage * (attackStat / (attackStat + defenseStat)) * randomMultiplier)
      )
      
      const newOpponentHp = Math.max(0, opponentHp - calculatedDamage)

      addToBattleLog(
        `${myBeast.name} used ${move.name}! Dealt ${calculatedDamage} damage!`
      )

      // Update opponent HP immediately for better UX
      setOpponentHp(newOpponentHp)

      // Check if battle ended (opponent HP reached 0)
      if (newOpponentHp === 0) {
        addToBattleLog(
          `${myBeast.name} wins! ${opponentBeast.name} has been defeated!`
        )
        
        // Complete the battle via API
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
        
        // Show loading state before animation
        setIsAnimationLoading(true)
        setIsMyTurn(false)
        
        // Small delay for smooth transition
        setTimeout(() => {
          setBattleOutcome('victory')
          setShowOutcomeAnimation(true)
          setIsAnimationLoading(false)
        }, 300)
      } else {
        // Battle continues - opponent's turn
        setIsMyTurn(false)
        addToBattleLog("Opponent's turn...")
        
        setTimeout(async () => {
          // AI selects a random move
          const aiMove = moves[Math.floor(Math.random() * Math.min(moves.length, 6))]
          
          if (aiMove) {
            const aiAttackStat = opponentBeast.attack
            const aiDefenseStat = myBeast.defense
            const aiRandomMultiplier = 0.85 + Math.random() * 0.3
            const aiDamage = Math.max(
              1,
              Math.floor(aiMove.damage * (aiAttackStat / (aiAttackStat + aiDefenseStat)) * aiRandomMultiplier)
            )
            
            const newPlayerHp = Math.max(0, myBeastHp - aiDamage)
            
            addToBattleLog(
              `${opponentBeast.name} used ${aiMove.name}! Dealt ${aiDamage} damage!`
            )
            
            setMyBeastHp(newPlayerHp)
            
            // Check if player lost
            if (newPlayerHp === 0) {
              addToBattleLog(
                `${opponentBeast.name} wins! ${myBeast.name} has been defeated!`
              )
              
              // Complete the battle via API
              await fetch(`/api/battles/${battleId}/complete`, {
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
              }, 300)
            } else {
              // Player's turn again
              setIsMyTurn(true)
              addToBattleLog("Your turn!")
            }
          }
        }, 2000) // 2 second delay for AI move
      }

    } catch (error) {
      console.error('Error executing move:', error)
      addToBattleLog('Error executing move. Please try again.')
      setIsMyTurn(true)
    } finally {
      setIsExecutingMove(false)
    }
  }, [battle, userId, isMyTurn, isExecutingMove, myBeast, opponentBeast, opponentHp, myBeastHp, battleId, addToBattleLog, moves])

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const isCompleted = useMemo(() => battle?.status === 'completed', [battle?.status])
  const didIWin = useMemo(() => battle?.winner_id === userId, [battle?.winner_id, userId])
  
  // Memoize available moves to prevent re-renders
  const availableMoves = useMemo(() => moves.slice(0, 6), [moves])

  // Show validation loading state
  if (isValidatingEntry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 animate-in fade-in duration-700">
        <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg border-4 border-primary animate-in zoom-in-95 duration-500">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <p className="text-lg font-bold font-mono text-primary animate-pulse">Validating Entry...</p>
          <p className="text-sm text-muted-foreground font-mono">Checking transaction status</p>
          <div className="flex gap-2 mt-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (isPageLoading || !battle || !myBeast || !opponentBeast) {
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
            PVP BATTLE ARENA
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
              <div className="flex justify-center">
                <BeastImage 
                  imageUrl={myBeast.image_url}
                  beastName={myBeast.name}
                  beastType={myBeast.traits?.type}
                  size="md"
                />
              </div>
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

          {/* Opponent Beast */}
          <Card className="border-destructive animate-in slide-in-from-right duration-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{opponentBeast.name}</CardTitle>
                  <Badge variant="destructive" className="mt-2">Opponent</Badge>
                </div>
                <Badge variant="secondary">LVL {opponentBeast.level}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <BeastImage 
                  imageUrl={opponentBeast.image_url}
                  beastName={opponentBeast.name}
                  beastType={opponentBeast.traits?.type}
                  size="md"
                />
              </div>
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
        {!isCompleted && isMyTurn && !isExecutingMove && (
          <Card className="mb-6 animate-in slide-in-from-bottom duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Select Your Move
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {availableMoves.map((move, index) => (
                  <Button
                    key={move.id}
                    variant="outline"
                    className="h-auto flex-col items-start p-3 sm:p-4 min-h-[88px] sm:min-h-[120px] min-w-full touch-manipulation transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-in slide-in-from-bottom"
                    style={{ animationDelay: `${index * 50}ms` }}
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

        {/* Move Execution Overlay */}
        {isExecutingMove && !isCompleted && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg border-4 border-accent animate-in zoom-in-95 duration-300">
              <Sparkles className="w-16 h-16 text-accent animate-pulse" />
              <h3 className="text-xl font-bold font-mono text-accent animate-pulse">
                {isMyTurn ? 'Executing Move...' : 'Opponent Attacking...'}
              </h3>
              <p className="text-sm text-muted-foreground font-mono text-center">
                Calculating damage
              </p>
              <div className="flex gap-2 mt-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Battle Log */}
        <Card className="animate-in slide-in-from-bottom duration-700">
          <CardHeader>
            <CardTitle>Battle Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-sm scroll-smooth">
              {battleLog.map((log, index) => (
                <div 
                  key={index} 
                  className="text-muted-foreground animate-in slide-in-from-left duration-300"
                  style={{ animationDelay: '0ms' }}
                >
                  <span className="text-primary">[Turn {Math.floor(index / 2) + 1}]</span> {log}
                </div>
              ))}
              {battleLog.length === 0 && (
                <div className="text-center text-muted-foreground py-8 animate-in fade-in duration-500">
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
