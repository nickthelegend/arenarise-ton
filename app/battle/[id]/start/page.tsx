'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { Coins, Swords, ArrowRight, User, Bot, AlertCircle, Loader2 } from 'lucide-react'
import { setStakeData } from '@/lib/stake-storage'

// Mock data
const mockBeast = { id: 1, name: 'Fire Drake', level: 15, type: 'Fire' }
const mockOpponent = { id: 2, name: 'Thunder Wolf', level: 12, type: 'Electric', isBot: true }

// Constants for stake validation
const MIN_STAKE = 10
const MAX_STAKE = 10000

export default function BattleStartPage() {
  const router = useRouter()
  const params = useParams()
  const [stakeAmount, setStakeAmount] = useState(100)
  const [userBalance] = useState(5000)
  const [validationError, setValidationError] = useState<string>('')
  const [isConfirming, setIsConfirming] = useState(false)

  // Real-time validation
  const validateStakeAmount = (amount: number): string => {
    if (amount < MIN_STAKE) {
      return `Minimum stake is ${MIN_STAKE} $RISE`
    }
    if (amount > MAX_STAKE) {
      return `Maximum stake is ${MAX_STAKE} $RISE`
    }
    if (amount > userBalance) {
      return 'Insufficient balance'
    }
    return ''
  }

  const handleStakeChange = (amount: number) => {
    setStakeAmount(amount)
    const error = validateStakeAmount(amount)
    setValidationError(error)
  }

  const handleStake = async () => {
    const error = validateStakeAmount(stakeAmount)
    if (error) {
      setValidationError(error)
      return
    }

    // Show loading state
    setIsConfirming(true)

    try {
      // Store stake data in session storage
      setStakeData({
        amount: stakeAmount,
        battleId: params.id as string,
        timestamp: Date.now()
      })

      // Smooth transition delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800))

      // Redirect to arena with smooth transition
      router.push(`/battle/${params.id}/arena`)
    } catch (error) {
      console.error('Error confirming stake:', error)
      setValidationError('Failed to confirm stake. Please try again.')
      setIsConfirming(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3 text-glow uppercase font-mono">
              <Coins className="inline-block w-8 h-8 mr-3" />
              Stake $RISE
            </h1>
            <p className="text-muted-foreground font-mono">
              Place your bet to enter the arena
            </p>
          </div>

          {/* Battle Preview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Battle Preview</CardTitle>
              <CardDescription>View combatants before staking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Player Beast */}
                <div className="text-center">
                  <Badge className="mb-3 w-full justify-center gap-2">
                    <User className="w-4 h-4" />
                    Your Beast
                  </Badge>
                  <div className="bg-card-foreground/5 border-4 border-primary p-4 rounded-sm">
                    <h3 className="font-bold text-lg font-mono">{mockBeast.name}</h3>
                    <Badge variant="secondary" className="mt-2">LVL {mockBeast.level}</Badge>
                    <Badge className="mt-2 ml-2">{mockBeast.type}</Badge>
                  </div>
                </div>

                {/* VS */}
                <div className="text-center">
                  <Swords className="w-12 h-12 mx-auto text-accent animate-pulse" />
                  <p className="text-2xl font-bold font-mono text-accent mt-2">VS</p>
                </div>

                {/* Opponent */}
                <div className="text-center">
                  <Badge variant="destructive" className="mb-3 w-full justify-center gap-2">
                    <Bot className="w-4 h-4" />
                    Opponent
                  </Badge>
                  <div className="bg-card-foreground/5 border-4 border-destructive p-4 rounded-sm">
                    <h3 className="font-bold text-lg font-mono">{mockOpponent.name}</h3>
                    <Badge variant="secondary" className="mt-2">LVL {mockOpponent.level}</Badge>
                    <Badge className="mt-2 ml-2">{mockOpponent.type}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staking Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Coins className="w-6 h-6" />
                Set Your Stake
              </CardTitle>
              <CardDescription>
                Winner takes all! Current balance: <span className="text-primary font-bold">{userBalance} $RISE</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stake Amount Input */}
              <div>
                <label className="block text-sm font-bold mb-3 font-mono uppercase">
                  Stake Amount ($RISE)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => handleStakeChange(Number(e.target.value))}
                    min={MIN_STAKE}
                    max={Math.min(MAX_STAKE, userBalance)}
                    className={`flex-1 h-12 px-4 bg-background border-4 rounded-sm font-mono font-bold text-lg focus:outline-none ${
                      validationError ? 'border-destructive' : 'border-input focus:border-primary'
                    }`}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => handleStakeChange(Math.min(MAX_STAKE, userBalance))}
                  >
                    Max
                  </Button>
                </div>
                {validationError && (
                  <div className="flex items-center gap-2 mt-2 text-destructive text-sm font-mono">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationError}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2 font-mono">
                  Min: {MIN_STAKE} $RISE | Max: {Math.min(MAX_STAKE, userBalance)} $RISE
                </div>
              </div>

              {/* Quick Stake Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleStakeChange(Math.min(amount, userBalance))}
                  >
                    {amount}
                  </Button>
                ))}
              </div>

              {/* Potential Winnings */}
              <div className="bg-primary/10 border-4 border-primary p-4 rounded-sm">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold">Potential Winnings:</span>
                  <span className="text-2xl font-bold text-primary font-mono">
                    {stakeAmount * 2} $RISE
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Win and double your stake! Lose and forfeit your bet.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => router.push('/battle')}
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              className="flex-1 transition-all duration-300"
              disabled={!!validationError || stakeAmount < MIN_STAKE || stakeAmount > userBalance || isConfirming}
              onClick={handleStake}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Confirming Stake...
                </>
              ) : (
                <>
                  Stake & Enter Arena
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
          
          {/* Loading Overlay during confirmation */}
          {isConfirming && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg border-4 border-primary animate-in zoom-in-95 duration-300">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <p className="text-lg font-bold font-mono text-primary">Confirming Stake...</p>
                <p className="text-sm text-muted-foreground font-mono">Preparing battle arena</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
