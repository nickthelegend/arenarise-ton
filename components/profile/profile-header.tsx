'use client'

import { useState, useEffect } from 'react'
import { User, Wallet, Crown, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/8bitcn/card'
import { Badge } from '@/components/8bitcn/badge'
import { Button } from '@/components/8bitcn/button'
import { fetchRiseBalance, formatRiseBalance } from '@/lib/jetton-utils'

interface ProfileHeaderProps {
  telegramUser?: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
    is_premium?: boolean
  }
  walletAddress: string
  isInTelegram: boolean
}

export function ProfileHeader({ telegramUser, walletAddress, isInTelegram }: ProfileHeaderProps) {
  const [riseBalance, setRiseBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)
  const [balanceError, setBalanceError] = useState<string | null>(null)

  // Fetch RISE balance
  useEffect(() => {
    async function loadBalance() {
      if (!walletAddress) {
        setRiseBalance(0)
        setIsLoadingBalance(false)
        return
      }

      setIsLoadingBalance(true)
      setBalanceError(null)
      
      try {
        const balance = await fetchRiseBalance(walletAddress)
        setRiseBalance(balance)
        setBalanceError(null)
      } catch (error) {
        console.error('Error loading RISE balance:', error)
        setBalanceError('Failed to load balance')
        setRiseBalance(0)
      } finally {
        setIsLoadingBalance(false)
      }
    }

    loadBalance()
    
    // Refresh balance every 30 seconds
    const interval = setInterval(loadBalance, 30000)
    return () => clearInterval(interval)
  }, [walletAddress])

  // Retry balance fetch
  const retryBalance = async () => {
    if (!walletAddress) return

    setIsLoadingBalance(true)
    setBalanceError(null)
    
    try {
      const balance = await fetchRiseBalance(walletAddress)
      setRiseBalance(balance)
      setBalanceError(null)
    } catch (error) {
      console.error('Error retrying RISE balance:', error)
      setBalanceError('Failed to load balance')
      setRiseBalance(0)
    } finally {
      setIsLoadingBalance(false)
    }
  }

  return (
    <Card className="border-primary">
      <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          {/* Profile Info Section */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Profile Photo */}
            {isInTelegram && telegramUser?.photo_url ? (
              <img
                src={telegramUser.photo_url}
                alt={`${telegramUser.first_name}'s profile`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 sm:border-4 border-primary object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 sm:border-4 border-primary flex-shrink-0">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
            )}

            {/* Name and Username */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold font-mono break-words">
                  {isInTelegram && telegramUser
                    ? `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ''}`
                    : 'Anonymous User'}
                </h2>
                {/* Premium Badge */}
                {telegramUser?.is_premium && (
                  <Badge variant="default" className="bg-yellow-500 text-yellow-950 border-yellow-600 flex items-center gap-1 text-xs">
                    <Crown className="w-3 h-3" />
                    <span className="hidden xs:inline">PREMIUM</span>
                    <span className="xs:hidden">PRO</span>
                  </Badge>
                )}
              </div>
              {telegramUser?.username && (
                <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-1 break-all">
                  @{telegramUser.username}
                </p>
              )}
              {!isInTelegram && (
                <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-1">
                  Not connected via Telegram
                </p>
              )}
            </div>
          </div>

          {/* RISE Balance Section */}
          <div className="flex flex-col items-start lg:items-end gap-2 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs font-mono uppercase">RISE Balance</span>
            </div>
            
            {isLoadingBalance ? (
              <div className="text-2xl sm:text-3xl font-bold font-mono text-accent animate-pulse">
                Loading...
              </div>
            ) : balanceError ? (
              <div className="flex flex-col items-start lg:items-end gap-2">
                <div className="text-xs sm:text-sm text-destructive font-mono">
                  {balanceError}
                </div>
                <Button
                  onClick={retryBalance}
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs h-7"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            ) : (
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono text-accent text-glow break-all">
                {formatRiseBalance(riseBalance, 2)}
              </div>
            )}
            
            <div className="text-xs text-muted-foreground font-mono">
              $RISE
            </div>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="mt-4 sm:mt-6 p-2 sm:p-3 bg-muted rounded border border-border">
          <div className="flex items-start sm:items-center gap-2">
            <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-mono uppercase mb-1">
                Wallet Address
              </p>
              <p className="text-xs sm:text-sm font-mono font-bold break-all">
                {walletAddress}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
