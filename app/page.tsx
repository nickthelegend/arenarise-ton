'use client'

import Link from 'next/link'
import { Swords, Package, Coins, TrendingUp, Users, Zap, Wallet, User } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/8bitcn/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/8bitcn/card'
import { Badge } from '@/components/8bitcn/badge'
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react'
import { useTelegram } from '@/components/telegram-provider'
import { useEffect, useState } from 'react'
import { fetchRiseBalance, formatRiseBalance } from '@/lib/jetton-utils'

interface Stats {
  totalBeasts: number
  activePlayers: number
  battlesFought: number
  totalVolume: string
}

export default function HomePage() {
  const address = useTonAddress()
  const [tonConnectUI] = useTonConnectUI()
  const { user: telegramUser, isInTelegram } = useTelegram()
  const [stats, setStats] = useState<Stats>({
    totalBeasts: 0,
    activePlayers: 0,
    battlesFought: 0,
    totalVolume: '$0'
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [riseBalance, setRiseBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoadingStats(true)
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  // Fetch RISE balance when wallet is connected
  useEffect(() => {
    async function loadRiseBalance() {
      if (!address) {
        setRiseBalance(0)
        return
      }

      setIsLoadingBalance(true)
      try {
        const balance = await fetchRiseBalance(address)
        setRiseBalance(balance)
      } catch (error) {
        console.error('Error loading RISE balance:', error)
        setRiseBalance(0)
      } finally {
        setIsLoadingBalance(false)
      }
    }

    loadRiseBalance()
    
    // Refresh balance every 30 seconds
    const interval = setInterval(loadRiseBalance, 30000)
    return () => clearInterval(interval)
  }, [address])

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:py-12">
        {!address ? (
          // Show wallet connection prompt when not connected
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Wallet className="w-24 h-24 text-primary mb-6 animate-pulse" />
            <h1 className="text-3xl md:text-5xl font-bold text-primary mb-4 text-glow">
              CONNECT YOUR TON WALLET
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">
              Please connect your TON wallet to start playing ArenaRise and access all game features
            </p>
            <Button
              size="lg"
              onClick={() => tonConnectUI.openModal()}
              className="text-lg px-8 py-6"
            >
              <Wallet className="w-6 h-6 mr-2" />
              CONNECT WALLET
            </Button>
          </div>
        ) : (
          // Show game content when connected
          <>
            {/* Telegram User Welcome Card - Only show in Telegram */}
            {isInTelegram && telegramUser && (
              <Card className="border-blue-500 bg-gradient-to-r from-blue-500/10 to-purple-500/10 mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500">
                      <User className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        Welcome, {telegramUser.first_name}!
                      </h3>
                      <div className="flex items-center gap-2">
                        {telegramUser.username && (
                          <span className="text-sm text-muted-foreground font-mono">
                            @{telegramUser.username}
                          </span>
                        )}
                        {telegramUser.is_premium && (
                          <Badge variant="default" className="text-xs">
                            ⭐ PREMIUM
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hero Section */}
            <div className="lg:hidden mb-8">
              <Card className="border-primary bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded border border-border">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      <span className="text-xs font-mono text-muted-foreground">WALLET</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground">
                      {address.slice(0, 4)}...{address.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted/50 rounded border border-border">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-accent" />
                      <span className="text-xs font-mono text-muted-foreground">$RISE</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-accent">
                      {isLoadingBalance ? '...' : formatRiseBalance(riseBalance, 2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mb-12 md:mb-16">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 text-primary text-glow">
                WELCOME TO ARENARISE
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Create powerful beasts, battle in the arena, and earn $RISE tokens in this epic blockchain gaming experience
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/create">
                  <Button size="lg" className="w-full sm:w-auto">
                    CREATE BEAST
                  </Button>
                </Link>
                <Link href="/inventory">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    VIEW INVENTORY
                  </Button>
                </Link>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <Card className="border-primary hover:translate-y-[-4px] transition-transform">
                <CardContent className="pt-6">
                  <Swords className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="mb-2">Create Beasts</CardTitle>
                  <CardDescription>
                    Forge unique beasts with different attributes and abilities. Each creation is one-of-a-kind.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-accent hover:translate-y-[-4px] transition-transform">
                <CardContent className="pt-6">
                  <Package className="w-12 h-12 text-accent mb-4" />
                  <CardTitle className="mb-2">Manage Inventory</CardTitle>
                  <CardDescription>
                    Track all your beasts, view their stats, and prepare them for epic battles in the arena.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-secondary hover:translate-y-[-4px] transition-transform">
                <CardContent className="pt-6">
                  <Coins className="w-12 h-12 text-secondary mb-4" />
                  <CardTitle className="mb-2">Earn $RISE</CardTitle>
                  <CardDescription>
                    Battle, trade, and participate in the economy to earn valuable $RISE tokens.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-chart-4 hover:translate-y-[-4px] transition-transform">
                <CardContent className="pt-6">
                  <TrendingUp className="w-12 h-12 text-chart-4 mb-4" />
                  <CardTitle className="mb-2">Liquidity Pools</CardTitle>
                  <CardDescription>
                    Create and manage liquidity pools. Provide liquidity and earn rewards from trading fees.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-chart-5 hover:translate-y-[-4px] transition-transform">
                <CardContent className="pt-6">
                  <Users className="w-12 h-12 text-chart-5 mb-4" />
                  <CardTitle className="mb-2">Battle Arena</CardTitle>
                  <CardDescription>
                    Challenge other players in the arena. Win battles to climb the leaderboard and earn rewards.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-primary hover:translate-y-[-4px] transition-transform">
                <CardContent className="pt-6">
                  <Zap className="w-12 h-12 text-primary mb-4" />
                  <CardTitle className="mb-2">Level Up</CardTitle>
                  <CardDescription>
                    Train your beasts, upgrade their abilities, and unlock powerful new skills and combos.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Stats Section */}
            <Card className="border-primary">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-8 text-center text-primary">ARENARISE STATS</h2>
                {isLoadingStats ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground animate-pulse">Loading stats...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-accent mb-2">
                        {stats.totalBeasts.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Beasts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-secondary mb-2">
                        {stats.activePlayers.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Players</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                        {stats.battlesFought.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Battles Fought</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-chart-4 mb-2">
                        {stats.totalVolume}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Volume</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer */}
            <footer className="border-t-4 border-primary bg-card mt-12 py-6">
              <div className="container mx-auto px-4 text-center text-muted-foreground">
                <p className="font-mono text-sm">© 2025 ARENARISE. Powered by $RISE token.</p>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  )
}
