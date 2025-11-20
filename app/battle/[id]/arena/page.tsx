'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { HealthBar } from '@/components/8bitcn/health-bar'
import { Swords, Zap, Shield, Heart, Flame, Sparkles } from 'lucide-react'

// Mock battle data
const mockPlayerBeast = {
  id: 1,
  name: 'Fire Drake',
  level: 15,
  hp: 200,
  maxHp: 200,
  attack: 45,
  defense: 30,
  type: 'Fire',
}

const mockEnemyBeast = {
  id: 2,
  name: 'Thunder Wolf',
  level: 12,
  hp: 150,
  maxHp: 150,
  attack: 38,
  defense: 25,
  type: 'Electric',
}

const mockMoves = [
  { id: 1, name: 'Fire Blast', damage: 50, icon: Flame, type: 'attack' },
  { id: 2, name: 'Thunder Strike', damage: 45, icon: Zap, type: 'attack' },
  { id: 3, name: 'Defend', damage: 0, icon: Shield, type: 'defense' },
  { id: 4, name: 'Heal', damage: -30, icon: Heart, type: 'heal' },
]

export default function BattleArenaPage() {
  const router = useRouter()
  const params = useParams()
  const [playerHp, setPlayerHp] = useState(mockPlayerBeast.hp)
  const [enemyHp, setEnemyHp] = useState(mockEnemyBeast.hp)
  const [battleLog, setBattleLog] = useState<string[]>(['Battle started!'])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null)

  const handleMove = (move: typeof mockMoves[0]) => {
    if (!isPlayerTurn || gameOver) return

    let newPlayerHp = playerHp
    let newEnemyHp = enemyHp
    let logMessage = ''

    // Player's turn
    if (move.type === 'attack') {
      const damage = Math.max(move.damage - mockEnemyBeast.defense, 5)
      newEnemyHp = Math.max(enemyHp - damage, 0)
      logMessage = `${mockPlayerBeast.name} used ${move.name}! Dealt ${damage} damage!`
    } else if (move.type === 'heal') {
      const heal = Math.abs(move.damage)
      newPlayerHp = Math.min(playerHp + heal, mockPlayerBeast.maxHp)
      logMessage = `${mockPlayerBeast.name} used ${move.name}! Restored ${heal} HP!`
    } else if (move.type === 'defense') {
      logMessage = `${mockPlayerBeast.name} is defending!`
    }

    setPlayerHp(newPlayerHp)
    setEnemyHp(newEnemyHp)
    setBattleLog(prev => [...prev, logMessage])

    // Check if enemy is defeated
    if (newEnemyHp <= 0) {
      setGameOver(true)
      setWinner('player')
      setBattleLog(prev => [...prev, `${mockPlayerBeast.name} wins! You earned 200 $RISE!`])
      return
    }

    // Enemy's turn
    setIsPlayerTurn(false)
    setTimeout(() => {
      const enemyMove = mockMoves[Math.floor(Math.random() * 2)] // Enemy picks attack moves
      const enemyDamage = Math.max(enemyMove.damage - mockPlayerBeast.defense, 5)
      newPlayerHp = Math.max(newPlayerHp - enemyDamage, 0)
      
      setPlayerHp(newPlayerHp)
      setBattleLog(prev => [...prev, `${mockEnemyBeast.name} used ${enemyMove.name}! Dealt ${enemyDamage} damage!`])

      // Check if player is defeated
      if (newPlayerHp <= 0) {
        setGameOver(true)
        setWinner('enemy')
        setBattleLog(prev => [...prev, `${mockEnemyBeast.name} wins! You lost 100 $RISE.`])
      } else {
        setIsPlayerTurn(true)
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2 text-glow uppercase font-mono">
              <Swords className="inline-block w-8 h-8 mr-3" />
              Battle Arena
            </h1>
            <Badge variant={isPlayerTurn ? 'default' : 'destructive'} className="text-sm">
              {gameOver ? 'Battle Ended' : isPlayerTurn ? 'Your Turn' : 'Enemy Turn'}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Player Beast */}
            <Card className="border-primary">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{mockPlayerBeast.name}</CardTitle>
                    <Badge className="mt-2">{mockPlayerBeast.type}</Badge>
                  </div>
                  <Badge variant="secondary">LVL {mockPlayerBeast.level}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <HealthBar 
                  value={playerHp} 
                  max={mockPlayerBeast.maxHp} 
                  label="HP" 
                />
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-accent" />
                    <span>ATK: {mockPlayerBeast.attack}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span>DEF: {mockPlayerBeast.defense}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enemy Beast */}
            <Card className="border-destructive">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{mockEnemyBeast.name}</CardTitle>
                    <Badge variant="destructive" className="mt-2">{mockEnemyBeast.type}</Badge>
                  </div>
                  <Badge variant="secondary">LVL {mockEnemyBeast.level}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <HealthBar 
                  value={enemyHp} 
                  max={mockEnemyBeast.maxHp} 
                  label="HP"
                  variant="destructive"
                />
                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-accent" />
                    <span>ATK: {mockEnemyBeast.attack}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span>DEF: {mockEnemyBeast.defense}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Battle Log */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Battle Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-background border-4 border-input rounded-sm p-4 h-32 overflow-y-auto font-mono text-sm space-y-1">
                {battleLog.map((log, index) => (
                  <div key={index} className="text-foreground/80">
                    {'> '}{log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Moves */}
          {!gameOver && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Moves</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {mockMoves.map((move) => {
                    const Icon = move.icon
                    return (
                      <Button
                        key={move.id}
                        variant={move.type === 'attack' ? 'default' : move.type === 'heal' ? 'secondary' : 'outline'}
                        className="h-auto py-4 flex-col gap-2"
                        disabled={!isPlayerTurn}
                        onClick={() => handleMove(move)}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs">{move.name}</span>
                        {move.damage > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {move.damage} DMG
                          </Badge>
                        )}
                        {move.damage < 0 && (
                          <Badge variant="default" className="text-xs">
                            +{Math.abs(move.damage)} HP
                          </Badge>
                        )}
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Game Over */}
          {gameOver && (
            <Card className={winner === 'player' ? 'border-primary' : 'border-destructive'}>
              <CardContent className="text-center py-8">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h2 className="text-3xl font-bold mb-4 font-mono uppercase">
                  {winner === 'player' ? 'Victory!' : 'Defeat!'}
                </h2>
                <p className="text-lg mb-6 font-mono">
                  {winner === 'player' 
                    ? 'You won 200 $RISE tokens!' 
                    : 'You lost 100 $RISE tokens.'}
                </p>
                <Button
                  size="lg"
                  onClick={() => router.push('/battle')}
                >
                  Return to Battle Menu
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
