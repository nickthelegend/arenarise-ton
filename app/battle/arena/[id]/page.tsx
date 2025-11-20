'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { HealthBar } from '@/components/8bitcn/health-bar'
import { useTonAddress } from '@tonconnect/ui-react'
import { supabase } from '@/lib/supabase'
import { Swords, Zap, Shield, Sparkles, Trophy, Loader2 } from 'lucide-react'
import { RealtimeChannel } from '@supabase/supabase-js'

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
  beast1: Beast
  beast2: Beast
  current_turn: string
  status: string
  winner_id: string | null
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
  
  const [userId, setUserId] = useState<string | null>(null)
  const [battle, setBattle] = useState<Battle | null>(null)
  const [myBeast, setMyBeast] = useState<Beast | null>(null)
  const [opponentBeast, setOpponentBeast] = useState<Beast | null>(null)
  const [myBeastHp, setMyBeastHp] = useState<number>(0)
  const [opponentBeastHp, setOpponentBeastHp] = useState<number>(0)
  const [moves, setMoves] = useState<Move[]>([])
  const [battleMoves, setBattleMoves] = useState<BattleMove[]>([])
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [isExecutingMove, setIsExecutingMove] = useState(false)
  const [turnNumber, setTurnNumber] = useState(1)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>([])

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

          // Determine my beast and opponent's beast
          const isPlayer1 = battleInfo.player1_id === currentUserId
          const myBeastData = isPlayer1 ? battleInfo.beast1 : battleInfo.beast2
          const oppBeastData = isPlayer1 ? battleInfo.beast2 : battleInfo.beast1

          setMyBeast(myBeastData)
          setOpponentBeast(oppBeastData)
          setMyBeastHp(myBeastData.hp)
          setOpponentBeastHp(oppBeastData.hp)
          setIsMyTurn(battleInfo.current_turn === currentUserId)

          addToBattleLog(`Battle started! ${myBeastData.name} vs ${oppBeastData.name}`)
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

      } catch (error) {
        console.error('Error fetching battle data:', error)
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
            setOpponentBeastHp(newMove.target_hp_remaining)
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
          }
        }
      )
      .subscribe()

    setChannel(newChannel)

    return () => {
      newChannel.unsubscribe()
    }
  }, [battleId, userId])

  const addToBattleLog = (message: string) => {
    setBattleLog(prev => [...prev, message])
  }

  const handleMove = async (move: Move) => {
    if (!battle || !userId || !isMyTurn || isExecutingMove) return

    setIsExecutingMove(true)

    try {
      // Calculate damage
      const baseDamage = move.damage
      const attackStat = myBeast?.attack || 50
      const defenseStat = opponentBeast?.defense || 30
      
      // Damage formula: base_damage * (attack / (attack + defense)) * random(0.85-1.15)
      const randomMultiplier = 0.85 + Math.random() * 0.3
      const calculatedDamage = Math.max(
        1, 
        Math.floor(baseDamage * (attackStat / (attackStat + defenseStat)) * randomMultiplier)
      )
      
      const newOpponentHp = Math.max(0, opponentBeastHp - calculatedDamage)

      addToBattleLog(
        `${myBeast?.name} used ${move.name}! Dealt ${calculatedDamage} damage!`
      )

      // Record the move
      const response = await fetch('/api/battles/moves', {
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

      const data = await response.json()

      if (data.battle_ended) {
        addToBattleLog(
          `${myBeast?.name} wins! ${opponentBeast?.name} has been defeated!`
        )
        setTimeout(() => {
          router.push('/battle')
        }, 3000)
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
  }

  if (!battle || !myBeast || !opponentBeast) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  const isCompleted = battle.status === 'completed'
  const didIWin = battle.winner_id === userId

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Battle Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2 text-glow">
            BATTLE ARENA
          </h1>
          {isCompleted ? (
            <Badge variant={didIWin ? 'default' : 'destructive'} className="text-lg px-4 py-2">
              <Trophy className="w-5 h-5 mr-2" />
              {didIWin ? 'VICTORY!' : 'DEFEAT'}
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
              <div className="text-6xl text-center">⚡</div>
              <HealthBar value={opponentBeastHp} max={opponentBeast.max_hp} label="HP" />
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
        {!isCompleted && isMyTurn && (
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
                    <Badge variant="secondary" className="mb-2">{move.type}</Badge>
                    <div className="text-xs text-muted-foreground">{move.description}</div>
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
    </div>
  )
}
