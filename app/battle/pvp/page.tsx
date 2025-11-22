'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { HealthBar } from '@/components/8bitcn/health-bar'
import { useTonAddress } from '@tonconnect/ui-react'
import { supabase } from '@/lib/supabase'
import { Swords, Zap, Shield, Heart, Loader2 } from 'lucide-react'

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
  current_turn: string
  status: string
  winner_id: string | null
}

function PVPBattlePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const address = useTonAddress()
  
  const [userId, setUserId] = useState<string | null>(null)
  const [myBeasts, setMyBeasts] = useState<Beast[]>([])
  const [selectedBeast, setSelectedBeast] = useState<Beast | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [battleId, setBattleId] = useState<string | null>(null)
  
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
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [address, searchParams])

  const handleFindMatch = async () => {
    if (!selectedBeast || !userId) return

    setIsSearching(true)

    // Add a small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      // Find another user with beasts (matchmaking)
      // First try to find beasts from other users
      let { data: allBeasts, error: beastsError } = await supabase
        .from('beasts')
        .select('*')
        .neq('owner_address', address)
        .limit(10)

      // If no other users' beasts found, allow self-play (battle your own beasts)
      if (!allBeasts || allBeasts.length === 0) {
        const { data: myOtherBeasts, error: myBeastsError } = await supabase
          .from('beasts')
          .select('*')
          .eq('owner_address', address)
          .neq('id', selectedBeast.id)
          .limit(10)

        if (myBeastsError) {
          throw new Error('Error finding opponents. Please try again.')
        }

        if (!myOtherBeasts || myOtherBeasts.length === 0) {
          throw new Error('No opponents available. Create more beasts to battle!')
        }

        allBeasts = myOtherBeasts
      }

      // Select random opponent beast
      const opponentBeast = allBeasts[Math.floor(Math.random() * allBeasts.length)]

      // Get opponent user
      const { data: opponentUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', opponentBeast.owner_address)
        .single()

      const opponentId = opponentUser?.id || userId // Fallback to self if no user found

      const response = await fetch('/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1_id: userId,
          player2_id: opponentId,
          beast1_id: selectedBeast.id,
          beast2_id: opponentBeast.id,
          bet_amount: 100
        })
      })

      const data = await response.json()
      
      if (data.battle) {
        setBattleId(data.battle.id)
        // Navigate to battle arena
        router.push(`/battle/arena/${data.battle.id}`)
      }
    } catch (error: any) {
      console.error('Error creating battle:', error)
      alert(error.message || 'Failed to find match')
      setIsSearching(false)
    }
  }

  if (!address) {
    return null // Will redirect in useEffect
  }

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
                <div className="grid md:grid-cols-2 gap-4 mb-6">
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

                <div className="text-center">
                  <Button
                    size="lg"
                    disabled={!selectedBeast || isSearching}
                    onClick={handleFindMatch}
                    className="min-w-64 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Finding Match...
                      </>
                    ) : (
                      <>
                        <Swords className="w-5 h-5 mr-2" />
                        Find Match
                      </>
                    )}
                  </Button>
                  {!selectedBeast && (
                    <p className="text-sm text-muted-foreground mt-3 font-mono animate-in fade-in duration-500">
                      Select a beast to begin matchmaking
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Searching Overlay */}
        {isSearching && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg border-4 border-primary animate-in zoom-in-95 duration-500 max-w-md mx-4">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <h3 className="text-xl font-bold font-mono text-primary animate-pulse">Finding Opponent...</h3>
              <p className="text-sm text-muted-foreground font-mono text-center">
                Searching for a worthy challenger
              </p>
              <div className="flex gap-2 mt-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              {selectedBeast && (
                <div className="bg-muted p-4 rounded-sm border-2 border-primary/20 w-full mt-4 animate-in slide-in-from-bottom duration-700">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-mono mb-2">Your Beast</p>
                    <p className="font-bold font-mono">{selectedBeast.name}</p>
                    <Badge variant="secondary" className="mt-2">LVL {selectedBeast.level}</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
