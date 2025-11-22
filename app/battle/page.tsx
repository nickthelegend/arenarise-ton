'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Import useRouter for navigation
import { useWallet } from '@/components/wallet-provider'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/8bitcn/tabs'
import { Badge } from '@/components/8bitcn/badge'
import { HealthBar } from '@/components/8bitcn/health-bar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Swords, Users, Zap, Shield, Crown, Coins } from 'lucide-react'
import { selectRandomEnemy } from '@/lib/enemy-utils'
import { sendJettonTransfer } from '@/lib/jetton-transfer'
import { validateStake } from '@/lib/stake-validation'
import { PAYMENT_ADDRESS, RISE_JETTON_DECIMALS } from '@/lib/constants'

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
  const [autoMatchedEnemy, setAutoMatchedEnemy] = useState<Enemy | null>(null)
  const [beasts, setBeasts] = useState<Beast[]>([])
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [isLoadingBeasts, setIsLoadingBeasts] = useState(true)
  const [isLoadingEnemies, setIsLoadingEnemies] = useState(true)
  const [isCreatingBattle, setIsCreatingBattle] = useState(false)
  const [battleError, setBattleError] = useState<string | null>(null)
  const [stakeAmount, setStakeAmount] = useState<string>('')
  const [stakeError, setStakeError] = useState<string | null>(null)
  const [isStaking, setIsStaking] = useState(false)
  const [jettonWalletAddress, setJettonWalletAddress] = useState<string>('')
  const router = useRouter() // Added router for navigation to battle start
  const { address, userId, isConnected } = useWallet()
  const [tonConnectUI] = useTonConnectUI()

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

  // Fetch jetton wallet address for RISE tokens
  useEffect(() => {
    async function fetchJettonWallet() {
      if (!address) {
        setJettonWalletAddress('')
        return
      }

      try {
        console.log('Fetching jetton wallet for address:', address)
        
        // Fetch the user's RISE jetton wallet address from the API
        const response = await fetch(`/api/jetton-wallet?owner_address=${address}`)
        const data = await response.json()
        
        if (data.jetton_wallet_address) {
          console.log('Jetton wallet found:', data.jetton_wallet_address)
          setJettonWalletAddress(data.jetton_wallet_address)
        } else {
          console.error('No jetton wallet found for user:', data.error)
          setJettonWalletAddress('')
          setStakeError('No RISE jetton wallet found. You may need to receive RISE tokens first.')
        }
      } catch (error) {
        console.error('Error fetching jetton wallet:', error)
        setJettonWalletAddress('')
        setStakeError('Failed to fetch jetton wallet address')
      }
    }

    fetchJettonWallet()
  }, [address])

  // Handle beast selection and automatic enemy assignment
  const handleBeastSelection = (beastId: number) => {
    setSelectedBeast(beastId)
    setBattleError(null)
    setStakeError(null)
    
    // Automatically select a random enemy
    const randomEnemy = selectRandomEnemy(enemies)
    if (randomEnemy) {
      setAutoMatchedEnemy(randomEnemy)
    } else {
      setAutoMatchedEnemy(null)
      setBattleError('No enemies available for battle')
    }
  }

  // Handle stake input change
  const handleStakeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setStakeAmount(value)
    setStakeError(null)
  }

  // Handle stake button click
  const handleStake = async () => {
    if (!selectedBeast || !autoMatchedEnemy || !userId || !address) {
      setStakeError('Please select a beast and connect your wallet')
      return
    }

    const amount = parseFloat(stakeAmount)
    
    // Validate stake inputs
    const validation = validateStake({
      stakeAmount: amount,
      isWalletConnected: isConnected,
      jettonWalletAddress: jettonWalletAddress
    })

    if (!validation.isValid) {
      setStakeError(validation.error || 'Validation failed')
      return
    }

    try {
      setIsStaking(true)
      setStakeError(null)

      console.log('Sending jetton transfer with:', {
        jettonWalletAddress,
        destinationAddress: PAYMENT_ADDRESS,
        amount,
        jettonDecimals: RISE_JETTON_DECIMALS,
        senderAddress: address
      })

      // Send jetton transfer
      await sendJettonTransfer({
        tonConnectUI,
        jettonWalletAddress,
        destinationAddress: PAYMENT_ADDRESS,
        amount,
        jettonDecimals: RISE_JETTON_DECIMALS,
        forwardTonAmount: '0.05',
        senderAddress: address
      })

      // After successful transfer, create battle with stake amount
      await createBattleWithStake(amount)
    } catch (error: any) {
      console.error('Error during stake:', error)
      setStakeError(error.message || 'Failed to stake tokens')
    } finally {
      setIsStaking(false)
    }
  }

  // Create battle with stake amount
  const createBattleWithStake = async (stakeAmountValue: number) => {
    if (!selectedBeast || !autoMatchedEnemy || !userId) {
      throw new Error('Missing required data for battle creation')
    }

    try {
      setIsCreatingBattle(true)
      setBattleError(null)

      const response = await fetch('/api/battles/pve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: userId,
          beast_id: selectedBeast,
          enemy_id: autoMatchedEnemy.id,
          stake_amount: stakeAmountValue,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create battle')
      }

      if (data.success && data.battle) {
        // Navigate to PVE battle arena with the battle ID
        router.push(`/battle/pve/${data.battle.id}`)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Error creating battle:', error)
      throw error
    } finally {
      setIsCreatingBattle(false)
    }
  }

  // Create PVE battle without stake and navigate to arena
  const handleStartPVEBattle = async () => {
    if (!selectedBeast || !autoMatchedEnemy || !userId) {
      setBattleError('Please select a beast')
      return
    }

    try {
      setIsCreatingBattle(true)
      setBattleError(null)

      const response = await fetch('/api/battles/pve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: userId,
          beast_id: selectedBeast,
          enemy_id: autoMatchedEnemy.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create battle')
      }

      if (data.success && data.battle) {
        // Navigate to PVE battle arena with the battle ID
        router.push(`/battle/pve/${data.battle.id}`)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Error creating PVE battle:', error)
      setBattleError(error.message || 'Failed to create battle')
    } finally {
      setIsCreatingBattle(false)
    }
  }

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
          className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-in slide-in-from-left ${
            selectedBeast === beast.id ? 'ring-4 ring-primary shadow-primary/50' : ''
          }`}
          style={{ animationDelay: `${beasts.indexOf(beast) * 100}ms` }}
          onClick={() => handleBeastSelection(beast.id)}
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

  // Render auto-matched enemy display (read-only)
  const renderAutoMatchedEnemy = () => {
    if (!autoMatchedEnemy) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-muted-foreground font-mono mb-2">
              {isLoadingEnemies ? 'Loading enemies...' : 'Select a beast to see your opponent'}
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="ring-2 ring-destructive animate-in slide-in-from-right duration-700">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{autoMatchedEnemy.name}</CardTitle>
              <Badge variant="outline" className="mt-2">Auto-Matched</Badge>
            </div>
            <Badge variant="destructive" className="gap-1">
              <Crown className="w-3 h-3" />
              LVL {autoMatchedEnemy.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <HealthBar value={autoMatchedEnemy.hp} max={autoMatchedEnemy.maxHp} label="HP" />
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-accent" />
              <span>ATK: {autoMatchedEnemy.attack}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-500" />
              <span>DEF: {autoMatchedEnemy.defense}</span>
            </div>
            <Badge variant="default" className="text-xs">
              +{autoMatchedEnemy.reward} $RISE
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
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

              {/* Auto-Matched Enemy Display */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-destructive uppercase font-mono">
                  Your Opponent
                </h3>
                <div className="space-y-4">
                  {renderAutoMatchedEnemy()}
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              {/* Stake Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Stake RISE Tokens (Optional)
                  </CardTitle>
                  <CardDescription>
                    Stake RISE tokens to increase your potential rewards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stake-amount" className="font-mono">
                      Stake Amount (RISE)
                    </Label>
                    <Input
                      id="stake-amount"
                      type="number"
                      placeholder="0.0"
                      value={stakeAmount}
                      onChange={handleStakeAmountChange}
                      disabled={!selectedBeast || !autoMatchedEnemy || isStaking || isCreatingBattle}
                      min="0"
                      step="0.1"
                      className="font-mono"
                    />
                  </div>
                  {stakeError && (
                    <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                      <p className="text-destructive font-mono text-sm">{stakeError}</p>
                    </div>
                  )}
                  <Button
                    size="lg"
                    disabled={
                      !selectedBeast || 
                      !autoMatchedEnemy || 
                      !userId || 
                      !stakeAmount || 
                      parseFloat(stakeAmount) <= 0 ||
                      isStaking || 
                      isCreatingBattle
                    }
                    className="w-full transition-all duration-300 hover:scale-105 active:scale-95"
                    onClick={handleStake}
                  >
                    <Coins className="w-5 h-5 mr-2" />
                    {isStaking ? 'Staking...' : 'Stake & Start Battle'}
                  </Button>
                </CardContent>
              </Card>

              {/* Battle Error Display */}
              {battleError && (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <p className="text-destructive font-mono text-sm">{battleError}</p>
                  </CardContent>
                </Card>
              )}

              {/* Start Battle Without Stake */}
              <div className="text-center space-y-4">
                <Button
                  size="lg"
                  disabled={!selectedBeast || !autoMatchedEnemy || !userId || isCreatingBattle || isStaking}
                  className="w-full md:w-auto min-w-64 transition-all duration-300 hover:scale-105 active:scale-95"
                  onClick={handleStartPVEBattle}
                  variant="outline"
                >
                  <Swords className="w-5 h-5 mr-2" />
                  {isCreatingBattle ? 'Creating Battle...' : 'Start Battle (No Stake)'}
                </Button>
                {!userId && isConnected && (
                  <p className="text-sm text-muted-foreground font-mono">
                    Loading user data...
                  </p>
                )}
                {!isConnected && (
                  <p className="text-sm text-muted-foreground font-mono">
                    Connect your wallet to start a battle
                  </p>
                )}
              </div>
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
                      className="w-full transition-all duration-300 hover:scale-105 active:scale-95"
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

        {/* Battle Creation Loading Overlay */}
        {(isCreatingBattle || isStaking) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg border-4 border-primary animate-in zoom-in-95 duration-500 max-w-md mx-4">
              <Swords className="w-16 h-16 text-primary animate-pulse" />
              <h3 className="text-xl font-bold font-mono text-primary animate-pulse">
                {isStaking ? 'Processing Stake...' : 'Creating Battle...'}
              </h3>
              <p className="text-sm text-muted-foreground font-mono text-center">
                {isStaking ? 'Confirming your transaction' : 'Preparing the arena'}
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
                    <p className="font-bold font-mono">
                      {beasts.find(b => b.id === selectedBeast)?.name || 'Unknown'}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      LVL {beasts.find(b => b.id === selectedBeast)?.level || 1}
                    </Badge>
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
