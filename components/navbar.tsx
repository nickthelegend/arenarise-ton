'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Coins, Wallet, Plus, User } from 'lucide-react'
import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react'
import { useTelegram } from '@/components/telegram-provider'
import { Badge } from '@/components/8bitcn/badge'
import { useState, useEffect } from 'react'
import { fetchRiseBalance, formatRiseBalance } from '@/lib/jetton-utils'

export function Navbar() {
  const pathname = usePathname()
  const address = useTonAddress()
  const { user: telegramUser, isInTelegram } = useTelegram()
  const [riseBalance, setRiseBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

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
    <nav className="sticky top-0 z-50 border-b-4 border-primary bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="text-2xl font-bold text-primary text-glow font-mono">
              ARENA<span className="text-accent">RISE</span>
            </div>
          </Link>

          {/* Navigation Links - Hidden on mobile, shown on md+ */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`font-bold font-mono transition-colors ${pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              HOME
            </Link>
            <Link
              href="/create"
              className={`font-bold font-mono transition-colors ${pathname === '/create' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              CREATE
            </Link>
            <Link
              href="/battle"
              className={`font-bold font-mono transition-colors ${pathname === '/battle' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              BATTLE
            </Link>
            <Link
              href="/inventory"
              className={`font-bold font-mono transition-colors ${pathname === '/inventory' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              INVENTORY
            </Link>
          </div>

          {/* Wallet Connect & $RISE Token Display */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Telegram User Display - Only show in Telegram */}
            {isInTelegram && telegramUser && (
              <div className="hidden md:flex items-center gap-2 bg-muted px-3 py-2 border-2 border-blue-500">
                <User className="w-4 h-4 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground font-mono">
                    {telegramUser.username ? `@${telegramUser.username}` : telegramUser.first_name}
                  </span>
                  {telegramUser.is_premium && (
                    <Badge variant="default" className="text-[8px] h-4 px-1">
                      PREMIUM
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* TON Connect Button */}
            <div className="ton-connect-button">
              <TonConnectButton />
            </div>

            {/* $RISE Token Display - Only show when connected */}
            {address && (
              <>
                <div className="hidden lg:flex items-center gap-1.5 md:gap-3 bg-muted px-2 py-1 md:px-4 md:py-2 border-2 border-primary">
                  <Coins className="w-3.5 h-3.5 md:w-5 md:h-5 text-accent" />
                  <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs text-muted-foreground font-mono">$RISE</span>
                    <span className="text-xs md:text-sm font-bold text-foreground font-mono">
                      {isLoadingBalance ? '...' : formatRiseBalance(riseBalance, 2)}
                    </span>
                  </div>
                  <Wallet className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary" />
                </div>
                <Link
                  href="/swap"
                  className="hidden lg:flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-accent hover:bg-accent/90 border-2 border-accent transition-colors"
                  title="Buy/Sell $RISE"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5 text-accent-foreground" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation - Shown on mobile only */}
        <div className="flex md:hidden items-center justify-around pb-3 gap-2">
          <Link
            href="/"
            className={`flex-1 text-center py-2 font-bold font-mono text-xs transition-colors border-2 ${pathname === '/'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary'
              }`}
          >
            HOME
          </Link>
          <Link
            href="/create"
            className={`flex-1 text-center py-2 font-bold font-mono text-xs transition-colors border-2 ${pathname === '/create'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary'
              }`}
          >
            CREATE
          </Link>
          <Link
            href="/battle"
            className={`flex-1 text-center py-2 font-bold font-mono text-xs transition-colors border-2 ${pathname === '/battle'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary'
              }`}
          >
            BATTLE
          </Link>
          <Link
            href="/inventory"
            className={`flex-1 text-center py-2 font-bold font-mono text-xs transition-colors border-2 ${pathname === '/inventory'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary'
              }`}
          >
            INVENTORY
          </Link>
        </div>
      </div>
    </nav>
  )
}
