'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { Coins, Swords, ArrowRight, User, Bot } from 'lucide-react'

// Mock data
const mockBeast = { id: 1, name: 'Fire Drake', level: 15, type: 'Fire' }
const mockOpponent = { id: 2, name: 'Thunder Wolf', level: 12, type: 'Electric', isBot: true }

export default function BattleStartPage() {
  const router = useRouter()
  const params = useParams()
  const [stakeAmount, setStakeAmount] = useState(100)
  const [userBalance] = useState(5000)

  const handleStake = () => {
    if (stakeAmount <= userBalance) {
      // Redirect to arena
      router.push(`/battle/${params.id}/arena`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
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
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    min="10"
                    max={userBalance}
                    className="flex-1 h-12 px-4 bg-background border-4 border-input rounded-sm font-mono font-bold text-lg focus:outline-none focus:border-primary"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => setStakeAmount(userBalance)}
                  >
                    Max
                  </Button>
                </div>
              </div>

              {/* Quick Stake Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 250, 500].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setStakeAmount(Math.min(amount, userBalance))}
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
            >
              Cancel
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={stakeAmount < 10 || stakeAmount > userBalance}
              onClick={handleStake}
            >
              Stake & Enter Arena
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
