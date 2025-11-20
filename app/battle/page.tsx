'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Import useRouter for navigation
import { useWallet } from '@/components/wallet-provider'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/8bitcn/tabs'
import { Badge } from '@/components/8bitcn/badge'
import { HealthBar } from '@/components/8bitcn/health-bar'
import { Swords, Users, Zap, Shield, Crown } from 'lucide-react'

interface Beast {
  id: number
  name: string
  level: number
  hp: number
  max_hp: number
  attack: number
  defense: number
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

export default function BattlePage() {
  const [selectedBeast, setSelectedBeast] = useState<number | null>(null)
  const [selectedEnemy, setSelectedEnemy] = useState<number | null>(null)
  const [beasts, setBeasts] = useState<Beast[]>([])
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [isLoadingBeasts, setIsLoadingBeasts] = useState(true)
  const [isLoadingEnemies, setIsLoadingEnemies] = useState(true)
  const router = useRouter() // Added router for navigation to battle start
  const { address, isConnected } = useWallet()

  // Fetch user's beasts
  useEffect(() => {
    async function fetchBeasts() {
      if (!address) {
        setBeasts([])
        setIsLoadingBeasts(false)
        return
      }

      try {
        setIsLoadingBeasts(true)
        const response = await fetch(`/api/beasts?wallet_address=${address}`)
        const data = await response.json()
        
        if (data.beasts) {
          setBeasts(data.beasts)
        } else {
          setBeasts([])
        }
      } catch (error) {
        console.error('Error fetching beasts:', error)
        setBeasts([])
      } finally {
        setIsLoadingBeasts(false)
      }
    }

    fetchBeasts()
  }, [address])

  // Fetch enemies
  useEffect(() => {
    async function fetchEnemies() {
      try {
        setIsLoadingEnemies(true)
        const response = await fetch('/api/enemies')
        const data = await response.json()
        
        if (data.enemies) {
          setEnemies(data.enemies)
        } else {
          setEnemies([])
        }
      } catch (error) {
        console.error('Error fetching enemies:', error)
        setEnemies([])
      } finally {
        setIsLoadingEnemies(false)
      }
    }

    fetchEnemies()
  }, [])

  // Render beast selection list
  const renderBeastList = () => {
    if (isLoadingBeasts) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground font-mono">Loading beasts...</p>
          </CardContent>
        </Card>
      )
    }

    if (beasts.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-muted-foreground font-mono mb-2">No beasts found</p>
            <p className="text-sm text-muted-foreground font-mono">
              {!isConnected ? 'Connect your wallet to see your beasts' : 'Create a beast to get started'}
            </p>
          </CardContent>
        </Card>
      )
    }

    return beasts.map((beast) => {
      const beastType = beast.traits?.type || 'Unknown'
      return (
        <Card
          key={beast.id}
          className={`cursor-pointer transition-all hover:scale-105 ${
            selectedBeast === beast.id ? 'ring-4 ring-primary' : ''
          }`}
          onClick={() => setSelectedBeast(beast.id)}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{beast.name}</CardTitle>
                <Badge className="mt-2">{beastType}</Badge>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Crown className="w-3 h-3" />
                LVL {beast.level}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <HealthBar value={beast.hp} max={beast.max_hp} label="HP" />
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-accent" />
                <span>ATK: {beast.attack}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-500" />
                <span>DEF: {beast.defense}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    })
  }

  // Render enemy selection list
  const renderEnemyList = () => {
    if (isLoadingEnemies) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground font-mono">Loading enemies...</p>
          </CardContent>
        </Card>
      )
    }

    if (enemies.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-muted-foreground font-mono mb-2">No enemies available</p>
          </CardContent>
        </Card>
      )
    }

    return enemies.map((enemy) => (
      <Card
        key={enemy.id}
        className={`cursor-pointer transition-all hover:scale-105 ${
          selectedEnemy === enemy.id ? 'ring-4 ring-destructive' : ''
        }`}
        onClick={() => setSelectedEnemy(enemy.id)}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{enemy.name}</CardTitle>
            <Badge variant="destructive" className="gap-1">
              <Crown className="w-3 h-3" />
              LVL {enemy.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <HealthBar value={enemy.hp} max={enemy.maxHp} label="HP" />
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-accent" />
              <span>ATK: {enemy.attack}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-500" />
              <span>DEF: {enemy.defense}</span>
            </div>
            <Badge variant="default" className="text-xs">
              +{enemy.reward} $RISE
            </Badge>
          </div>
        </CardContent>
      </Card>
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 animate-in fade-in duration-700">
        <div className="mb-8 text-center animate-in slide-in-from-top duration-500">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3 text-glow uppercase font-mono">
            <Swords className="inline-block w-10 h-10 mr-3" />
            Battle Arena
          </h1>
          <p className="text-muted-foreground text-lg font-mono">
            Choose your battle mode and fight for glory!
          </p>
        </div>

        <Tabs defaultValue="pvp" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="pve" className="gap-2">
              <Swords className="w-4 h-4" />
              PVE
            </TabsTrigger>
            <TabsTrigger value="pvp" className="gap-2">
              <Users className="w-4 h-4" />
              PVP
            </TabsTrigger>
          </TabsList>

          {/* PVE Content */}
          <TabsContent value="pve" className="mt-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">Player vs Environment</CardTitle>
                <CardDescription>Battle against AI enemies to earn $RISE tokens</CardDescription>
              </CardHeader>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Your Beast Selection */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-primary uppercase font-mono">
                  Select Your Beast
                </h3>
                <div className="space-y-4">
                  {renderBeastList()}
                </div>
              </div>

              {/* Enemy Selection */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-destructive uppercase font-mono">
                  Choose Your Enemy
                </h3>
                <div className="space-y-4">
                  {renderEnemyList()}
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button
                size="lg"
                disabled={!selectedBeast || !selectedEnemy}
                className="w-full md:w-auto min-w-64"
                onClick={() => router.push('/battle/1/start')}
              >
                <Swords className="w-5 h-5 mr-2" />
                Start Battle
              </Button>
            </div>
          </TabsContent>

          {/* PVP Content */}
          <TabsContent value="pvp" className="mt-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">Player vs Player</CardTitle>
                <CardDescription>Challenge other players and win $RISE tokens</CardDescription>
              </CardHeader>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Your Beast Selection */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-primary uppercase font-mono">
                  Select Your Beast
                </h3>
                <div className="space-y-4">
                  {renderBeastList()}
                </div>
              </div>

              {/* Matchmaking */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-accent uppercase font-mono">
                  Find Opponent
                </h3>
                <Card className="h-full">
                  <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
                    <Users className="w-20 h-20 text-muted-foreground mb-4" />
                    <h4 className="text-xl font-bold mb-2 font-mono uppercase">
                      Matchmaking System
                    </h4>
                    <p className="text-muted-foreground mb-6 font-mono">
                      Find players with similar level beasts
                    </p>
                    <Button
                      size="lg"
                      disabled={!selectedBeast}
                      className="w-full"
                      onClick={() => router.push(`/battle/pvp?beastId=${selectedBeast}`)}
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Find Match
                    </Button>
                    {selectedBeast && (
                      <div className="mt-4 text-sm text-muted-foreground font-mono">
                        Searching for opponents at your level...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
