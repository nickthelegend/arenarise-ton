'use client'

import { Navbar } from '@/components/navbar'
import { Package, Swords, Zap, Heart, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Button } from '@/components/8bitcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Badge } from '@/components/8bitcn/badge'
import { useTonAddress } from '@tonconnect/ui-react'

interface Beast {
  id: number
  name: string
  hp: number
  max_hp: number
  attack: number
  defense: number
  speed: number
  level: number
  traits: {
    trait_type: string
    value: string
  }[]
}

const RARITY_COLORS = {
  Common: 'text-muted-foreground',
  Rare: 'text-chart-4',
  Epic: 'text-secondary',
  Legendary: 'text-accent',
}

export default function InventoryPage() {
  const address = useTonAddress()
  const [beasts, setBeasts] = useState<Beast[]>([])
  const [selectedBeast, setSelectedBeast] = useState<Beast | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBeasts() {
      if (!address) {
        setBeasts([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/beasts?wallet_address=${address}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch beasts')
        }

        const data = await response.json()
        setBeasts(data.beasts || [])
      } catch (err) {
        console.error('Error fetching beasts:', err)
        setError('Failed to load your beasts. Please try again.')
        setBeasts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchBeasts()
  }, [address])

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-mono text-sm">Back to Home</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-primary text-glow">
            INVENTORY
          </h1>
          <p className="text-muted-foreground">
            View and manage your collection of beasts. You have {beasts.length} beasts ready for battle.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Beast List */}
          <div className="lg:col-span-2">
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Your Beasts ({beasts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50 animate-pulse" />
                    <p className="text-muted-foreground">Loading your beasts...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-destructive opacity-50" />
                    <p className="text-destructive mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>RETRY</Button>
                  </div>
                ) : beasts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      {!address ? 'Connect your wallet to see your beasts' : 'No beasts in your inventory yet.'}
                    </p>
                    {address && (
                      <Link href="/create">
                        <Button>CREATE YOUR FIRST BEAST</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {beasts.map(beast => {
                      const beastType = beast.traits?.find((t: any) => t.trait_type === 'Type')?.value || 'Unknown'
                      const element = beast.traits?.find((t: any) => t.trait_type === 'Element')?.value || 'Unknown'
                      const rarity = beast.traits?.find((t: any) => t.trait_type === 'Rarity')?.value || 'Common'
                      
                      return (
                        <div
                          key={beast.id}
                          onClick={() => setSelectedBeast(beast)}
                          className={`bg-muted border-2 p-4 cursor-pointer transition-all hover:border-primary ${
                            selectedBeast?.id === beast.id ? 'border-primary' : 'border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-foreground mb-1">{beast.name}</h3>
                              <div className="text-xs text-muted-foreground font-mono">{beastType}</div>
                            </div>
                            <div className="text-2xl">🐉</div>
                          </div>

                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <Badge variant="outline">{element}</Badge>
                            <Badge className={RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]}>
                              {rarity}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">LVL {beast.level}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-destructive" />
                              <span className="text-muted-foreground">{beast.hp}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Swords className="w-3 h-3 text-primary" />
                              <span className="text-muted-foreground">{beast.attack}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Beast Details */}
          <div className="lg:col-span-1">
            <Card className="border-accent sticky top-20">
              <CardContent className="p-6">
                {selectedBeast ? (
                  <>
                    <h2 className="text-2xl font-bold mb-6 text-foreground">Beast Details</h2>
                    
                    <div className="aspect-square bg-muted border-2 border-border mb-6 flex items-center justify-center">
                      <div className="text-8xl">🐉</div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-1">{selectedBeast.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {selectedBeast.traits?.find((t: any) => t.trait_type === 'Type')?.value || 'Unknown'}
                          </span>
                          <span className="text-sm">•</span>
                          <span className={`text-sm font-bold ${RARITY_COLORS[(selectedBeast.traits?.find((t: any) => t.trait_type === 'Rarity')?.value || 'Common') as keyof typeof RARITY_COLORS]}`}>
                            {selectedBeast.traits?.find((t: any) => t.trait_type === 'Rarity')?.value || 'Common'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-muted border-2 border-border p-4">
                        <div className="text-sm text-muted-foreground mb-1">Level</div>
                        <div className="text-2xl font-bold text-primary">{selectedBeast.level}</div>
                      </div>

                      <div className="bg-muted border-2 border-border p-4">
                        <div className="text-sm text-muted-foreground mb-1">Element</div>
                        <div className="text-lg font-bold text-accent">
                          {selectedBeast.traits?.find((t: any) => t.trait_type === 'Element')?.value || 'Unknown'}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-destructive" />
                            <span className="text-sm text-muted-foreground">HP</span>
                          </div>
                          <span className="font-bold text-foreground">{selectedBeast.hp} / {selectedBeast.max_hp}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Swords className="w-4 h-4 text-primary" />
                            <span className="text-sm text-muted-foreground">Attack</span>
                          </div>
                          <span className="font-bold text-foreground">{selectedBeast.attack}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-secondary" />
                            <span className="text-sm text-muted-foreground">Defense</span>
                          </div>
                          <span className="font-bold text-foreground">{selectedBeast.defense}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-accent" />
                            <span className="text-sm text-muted-foreground">Speed</span>
                          </div>
                          <span className="font-bold text-foreground">{selectedBeast.speed}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link href="/battle">
                        <Button className="w-full">
                          BATTLE
                        </Button>
                      </Link>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        DELETE
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Select a beast to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
