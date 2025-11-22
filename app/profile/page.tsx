'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTonAddress } from '@tonconnect/ui-react'
import { useTelegram } from '@/components/telegram-provider'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { User, AlertCircle, RefreshCw } from 'lucide-react'
import { ProfileHeader } from '@/components/profile/profile-header'
import { TransactionList, type Transaction } from '@/components/profile/transaction-list'
import { BattleList, type BattleHistoryEntry } from '@/components/profile/battle-list'
import { Button } from '@/components/8bitcn/button'

export default function ProfilePage() {
  const address = useTonAddress()
  const router = useRouter()
  const { user: telegramUser, isInTelegram } = useTelegram()
  
  // Transaction state
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [transactionsError, setTransactionsError] = useState<string | null>(null)

  // Battle state
  const [battles, setBattles] = useState<BattleHistoryEntry[]>([])
  const [isLoadingBattles, setIsLoadingBattles] = useState(true)
  const [battlesError, setBattlesError] = useState<string | null>(null)

  // User ID state (needed for battles API)
  const [userId, setUserId] = useState<string | null>(null)

  // Authentication check - redirect if no wallet connected
  useEffect(() => {
    if (!address) {
      router.push('/')
    }
  }, [address, router])

  // Fetch user ID from wallet address
  useEffect(() => {
    async function fetchUserId() {
      if (!address) return

      try {
        const response = await fetch('/api/users')
        if (!response.ok) {
          console.error('Failed to fetch users')
          return
        }

        const data = await response.json()
        const user = data.users?.find((u: any) => u.wallet_address === address)
        
        if (user) {
          setUserId(user.id)
        }
      } catch (error) {
        console.error('Error fetching user ID:', error)
      }
    }

    fetchUserId()
  }, [address])

  // Fetch transactions
  useEffect(() => {
    async function fetchTransactions() {
      if (!address) return

      setIsLoadingTransactions(true)
      setTransactionsError(null)

      try {
        const response = await fetch(`/api/profile/transactions?wallet_address=${encodeURIComponent(address)}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch transactions' }))
          throw new Error(errorData.error || 'Failed to fetch transactions')
        }

        const data = await response.json()
        setTransactions(data.transactions || [])
      } catch (error: any) {
        console.error('Error fetching transactions:', error)
        setTransactionsError(error.message || 'Failed to load transaction history')
        setTransactions([])
      } finally {
        setIsLoadingTransactions(false)
      }
    }

    fetchTransactions()
  }, [address])

  // Fetch battles
  useEffect(() => {
    async function fetchBattles() {
      if (!userId) return

      setIsLoadingBattles(true)
      setBattlesError(null)

      try {
        const response = await fetch(`/api/profile/battles?user_id=${encodeURIComponent(userId)}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch battles' }))
          throw new Error(errorData.error || 'Failed to fetch battles')
        }

        const data = await response.json()
        setBattles(data.battles || [])
      } catch (error: any) {
        console.error('Error fetching battles:', error)
        setBattlesError(error.message || 'Failed to load battle history')
        setBattles([])
      } finally {
        setIsLoadingBattles(false)
      }
    }

    fetchBattles()
  }, [userId])

  // Retry handlers
  const retryTransactions = () => {
    if (!address) return
    setIsLoadingTransactions(true)
    setTransactionsError(null)
    
    fetch(`/api/profile/transactions?wallet_address=${encodeURIComponent(address)}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch transactions' }))
          throw new Error(errorData.error || 'Failed to fetch transactions')
        }
        return response.json()
      })
      .then((data) => {
        setTransactions(data.transactions || [])
        setTransactionsError(null)
      })
      .catch((error: any) => {
        console.error('Error retrying transactions:', error)
        setTransactionsError(error.message || 'Failed to load transaction history')
        setTransactions([])
      })
      .finally(() => {
        setIsLoadingTransactions(false)
      })
  }

  const retryBattles = () => {
    if (!userId) return
    setIsLoadingBattles(true)
    setBattlesError(null)
    
    fetch(`/api/profile/battles?user_id=${encodeURIComponent(userId)}`)
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to fetch battles' }))
          throw new Error(errorData.error || 'Failed to fetch battles')
        }
        return response.json()
      })
      .then((data) => {
        setBattles(data.battles || [])
        setBattlesError(null)
      })
      .catch((error: any) => {
        console.error('Error retrying battles:', error)
        setBattlesError(error.message || 'Failed to load battle history')
        setBattles([])
      })
      .finally(() => {
        setIsLoadingBattles(false)
      })
  }

  // Show loading state while checking authentication
  if (!address) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-muted-foreground font-mono animate-pulse">
              Checking authentication...
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 animate-in fade-in duration-700 max-w-7xl">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 text-center animate-in slide-in-from-top duration-500">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-2 sm:mb-3 text-glow uppercase font-mono">
            <User className="inline-block w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3" />
            User Profile
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg font-mono px-4">
            View your account information and activity
          </p>
        </div>

        {/* Profile Content Sections */}
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Header Section */}
          <ProfileHeader
            telegramUser={telegramUser || undefined}
            walletAddress={address}
            isInTelegram={isInTelegram}
          />

          {/* Transaction and Battle History - Side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Transaction History Section */}
            <Card className="border-secondary">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-mono uppercase">
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {transactionsError ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-destructive/20 mb-3 sm:mb-4">
                      <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
                    </div>
                    <p className="text-destructive font-mono text-sm sm:text-base mb-4">
                      {transactionsError}
                    </p>
                    <Button
                      onClick={retryTransactions}
                      variant="outline"
                      size="sm"
                      className="font-mono"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <TransactionList 
                    transactions={transactions} 
                    isLoading={isLoadingTransactions}
                  />
                )}
              </CardContent>
            </Card>

            {/* Battle History Section */}
            <Card className="border-destructive">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl font-mono uppercase">
                  Battle History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {battlesError ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-destructive/20 mb-3 sm:mb-4">
                      <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
                    </div>
                    <p className="text-destructive font-mono text-sm sm:text-base mb-4">
                      {battlesError}
                    </p>
                    <Button
                      onClick={retryBattles}
                      variant="outline"
                      size="sm"
                      className="font-mono"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <BattleList 
                    battles={battles} 
                    isLoading={isLoadingBattles}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
