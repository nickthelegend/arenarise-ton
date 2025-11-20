'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation' // Import useRouter for navigation
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/8bitcn/tabs'
import { Badge } from '@/components/8bitcn/badge'
import { HealthBar } from '@/components/8bitcn/health-bar'
import { Swords, Users, Zap, Shield, Heart, Crown } from 'lucide-react'

// Mock data for beasts
const mockBeasts = [
  { id: 1, name: 'Fire Drake', level: 15, hp: 180, maxHp: 200, attack: 45, defense: 30, type: 'Fire' },
  { id: 2, name: 'Thunder Wolf', level: 12, hp: 150, maxHp: 150, attack: 38, defense: 25, type: 'Electric' },
  { id: 3, name: 'Ice Phoenix', level: 18, hp: 200, maxHp: 220, attack: 52, defense: 35, type: 'Ice' },
]

// Mock enemies for PVE
const mockEnemies = [
  { id: 1, name: 'Goblin Scout', level: 8, hp: 100, maxHp: 100, attack: 20, defense: 15, reward: 50 },
  { id: 2, name: 'Dark Mage', level: 15, hp: 180, maxHp: 180, attack: 40, defense: 25, reward: 150 },
  { id: 3, name: 'Ancient Dragon', level: 25, hp: 350, maxHp: 350, attack: 65, defense: 45, reward: 500 },
]

export default function BattlePage() {
  const [selectedBeast, setSelectedBeast] = useState<number | null>(null)
  const [selectedEnemy, setSelectedEnemy] = useState<number | null>(null)
  const router = useRouter() // Added router for navigation to battle start

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
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
                  {mockBeasts.map((beast) => (
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
                            <Badge className="mt-2">{beast.type}</Badge>
                          </div>
                          <Badge variant="secondary" className="gap-1">
                            <Crown className="w-3 h-3" />
                            LVL {beast.level}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <HealthBar value={beast.hp} max={beast.maxHp} label="HP" />
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
                  ))}
                </div>
              </div>

              {/* Enemy Selection */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-destructive uppercase font-mono">
                  Choose Your Enemy
                </h3>
                <div className="space-y-4">
                  {mockEnemies.map((enemy) => (
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
                  ))}
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
                  {mockBeasts.map((beast) => (
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
                            <Badge className="mt-2">{beast.type}</Badge>
                          </div>
                          <Badge variant="secondary" className="gap-1">
                            <Crown className="w-3 h-3" />
                            LVL {beast.level}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <HealthBar value={beast.hp} max={beast.maxHp} label="HP" />
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
                  ))}
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
                      onClick={() => router.push('/battle/pvp')}
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
