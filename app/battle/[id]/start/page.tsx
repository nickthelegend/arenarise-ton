'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Button } from '@/components/8bitcn/button'
import { Badge } from '@/components/8bitcn/badge'
import { Coins, Swords, ArrowRight, User, Bot, AlertCircle, Loader2 } from 'lucide-react'
import { setStakeData } from '@/lib/stake-storage'
import { useWallet } from '@/components/wallet-provider'
import { fetchRiseBalance, fetchRiseJettonWallet } from '@/lib/jetton-utils'
import { sendJettonTransfer } from '@/lib/jetton-transfer'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { BATTLE_ESCROW_ADDRESS, RISE_JETTON_DECIMALS } from '@/lib/constants'

// Constants for stake validation
const MIN_STAKE = 10
const MAX_STAKE = 10000

// Types
interface Beast {
  id: number
  name: string
  level: number
  traits?: {
    type?: string
    rarity?: string
  }
  image_url?: string
}

interface User {
  id: string
  wallet_address: string
  username?: string
}

interface BattleData {
  id: string
  player1_id: string
  player2_id: string
  beast1_id: number
  beast2_id: number
  beast1: Beast
  beast2: Beast
  player1: User
  player2: User
  bet_amount: number
  status: string
  battle_type: string
}

export default function BattleStartPage() {
  const router = useRouter()
  const params = useParams()
  const { address, userId } = useWallet()
  const [tonConnectUI] = useTonConnectUI()
  
  const [stakeAmount, setStakeAmount] = useState(100)
  const [userBalance, setUserBalance] = useState(0)
  const [validationError, setValidationError] = useState<string>('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'confirming' | 'success' | 'error' | 'timeout'>('idle')
  const [transactionError, setTransactionError] = useState<string>('')
  const [retryCount, setRetryCount] = useState(0)
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  
  // Battle data state
  const [battleData, setBattleData] = useState<BattleData | null>(null)
  const [isLoadingBattle, setIsLoadingBattle] = useState(true)
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)
  const [battleError, setBattleError] = useState<string>('')
  
  // Determine which beast belongs to current player
  const myBeast = battleData && userId === battleData.player1_id ? battleData.beast1 : battleData?.beast2
  const opponentBeast = battleData && userId === battleData.player1_id ? battleData.beast2 : battleData?.beast1
  const opponent = battleData && userId === battleData.player1_id ? battleData.player2 : battleData?.player1
  const isBot = battleData?.battle_type === 'pve'

  // Fetch battle data
  useEffect(() => {
    async function loadBattleData() {
      if (!params.id) {
        setBattleError('No battle ID provided')
        setIsLoadingBattle(false)
        return
      }
      
      setIsLoadingBattle(true)
      setBattleError('')
      
      try {
        const response = await fetch(`/api/battles?battle_id=${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('BATTLE_NOT_FOUND')
          } else if (response.status >= 500) {
            throw new Error('SERVER_ERROR')
          } else {
            throw new Error('NETWORK_ERROR')
          }
        }
        
        const data = await response.json()
        
        if (!data.battle) {
          throw new Error('BATTLE_NOT_FOUND')
        }
        
        // Validate battle state
        if (data.battle.status === 'completed') {
          throw new Error('BATTLE_COMPLETED')
        }
        
        if (data.battle.status === 'cancelled') {
          throw new Error('BATTLE_CANCELLED')
        }
        
        // Validate user is a participant
        if (userId && data.battle.player1_id !== userId && data.battle.player2_id !== userId) {
          throw new Error('NOT_PARTICIPANT')
        }
        
        setBattleData(data.battle)
      } catch (error) {
        console.error('Error loading battle:', error)
        const errorMessage = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
        setBattleError(errorMessage)
      } finally {
        setIsLoadingBattle(false)
      }
    }
    
    loadBattleData()
  }, [params.id, userId])

  // Fetch user balance
  useEffect(() => {
    async function loadBalance() {
      if (!address) {
        setIsLoadingBalance(false)
        return
      }
      
      setIsLoadingBalance(true)
      
      try {
        const balance = await fetchRiseBalance(address)
        setUserBalance(balance)
      } catch (error) {
        console.error('Error loading balance:', error)
        setUserBalance(0)
      } finally {
        setIsLoadingBalance(false)
      }
    }
    
    loadBalance()
  }, [address])

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

  // Exponential backoff helper
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const getBackoffDelay = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000)
  
  // Maximum retry attempts
  const MAX_RETRY_ATTEMPTS = 3
  const TRANSACTION_TIMEOUT_MS = 60000 // 60 seconds

  const handleStakeChange = (amount: number) => {
    setStakeAmount(amount)
    const error = validateStakeAmount(amount)
    setValidationError(error)
  }

  const handleStake = async (isRetry: boolean = false) => {
    const error = validateStakeAmount(stakeAmount)
    if (error) {
      setValidationError(error)
      return
    }

    if (!address) {
      setValidationError('Please connect your wallet')
      return
    }

    if (!tonConnectUI) {
      setValidationError('Wallet connection not ready')
      return
    }

    // Check for insufficient balance before attempting transaction
    if (stakeAmount > userBalance) {
      setTransactionStatus('error')
      setTransactionError('INSUFFICIENT_BALANCE')
      setIsConfirming(true)
      return
    }

    // Check max retry attempts
    const currentRetry = isRetry ? retryCount + 1 : 0
    if (currentRetry > MAX_RETRY_ATTEMPTS) {
      setTransactionStatus('error')
      setTransactionError('MAX_RETRIES_EXCEEDED')
      setIsConfirming(true)
      return
    }

    // Show loading state
    setIsConfirming(true)
    setTransactionStatus('pending')
    setTransactionError('')
    setRetryCount(currentRetry)

    // Apply exponential backoff for retries
    if (isRetry && currentRetry > 0) {
      const delay = getBackoffDelay(currentRetry - 1)
      await sleep(delay)
    }

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TRANSACTION_TIMEOUT')), TRANSACTION_TIMEOUT_MS)
    })

    try {
      // Wrap the entire transaction flow in a timeout
      await Promise.race([
        (async () => {
          // Step 1: Fetch user's jetton wallet address with retry logic
          setTransactionStatus('pending')
          let jettonWalletAddress: string | null = null
          let fetchAttempts = 0
          const maxFetchAttempts = 3

          while (fetchAttempts < maxFetchAttempts && !jettonWalletAddress) {
            try {
              jettonWalletAddress = await fetchRiseJettonWallet(address)
              if (!jettonWalletAddress) {
                fetchAttempts++
                if (fetchAttempts < maxFetchAttempts) {
                  await sleep(getBackoffDelay(fetchAttempts - 1))
                }
              }
            } catch (fetchError) {
              fetchAttempts++
              if (fetchAttempts >= maxFetchAttempts) {
                throw new Error('NETWORK_ERROR')
              }
              await sleep(getBackoffDelay(fetchAttempts - 1))
            }
          }
          
          if (!jettonWalletAddress) {
            throw new Error('JETTON_WALLET_NOT_FOUND')
          }

          // Step 2: Initiate blockchain transaction
          setTransactionStatus('confirming')
          await sendJettonTransfer({
            tonConnectUI,
            jettonWalletAddress,
            destinationAddress: BATTLE_ESCROW_ADDRESS,
            amount: stakeAmount,
            jettonDecimals: RISE_JETTON_DECIMALS,
            forwardTonAmount: '0.05',
            senderAddress: address
          })

          // Step 3: Transaction sent successfully
          // Note: TonConnect doesn't provide transaction hash immediately
          // We'll use a temporary hash and update it later when confirmed
          const tempTransactionHash = `pending_${Date.now()}_${userId}`
          setTransactionHash(tempTransactionHash)
          
          // Step 4: Store transaction in database with retry logic
          let apiAttempts = 0
          const maxApiAttempts = 3
          let apiSuccess = false

          while (apiAttempts < maxApiAttempts && !apiSuccess) {
            try {
              const stakeResponse = await fetch('/api/battles/stake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  battle_id: params.id,
                  player_id: userId,
                  amount: stakeAmount,
                  transaction_hash: tempTransactionHash
                })
              })

              if (!stakeResponse.ok) {
                const errorData = await stakeResponse.json()
                throw new Error(errorData.error || 'Failed to record stake transaction')
              }

              await stakeResponse.json()
              apiSuccess = true
            } catch (apiError: any) {
              apiAttempts++
              console.error(`API attempt ${apiAttempts} failed:`, apiError)
              
              if (apiAttempts >= maxApiAttempts) {
                throw new Error('API_ERROR')
              }
              
              await sleep(getBackoffDelay(apiAttempts - 1))
            }
          }
            
          // Step 5: Update session storage with transaction hash
          setStakeData({
            amount: stakeAmount,
            battleId: params.id as string,
            timestamp: Date.now(),
            transactionHash: tempTransactionHash,
            status: 'completed'
          })

          setTransactionStatus('success')
          setRetryCount(0) // Reset retry count on success
          
          // Wait a moment to show success state
          await new Promise(resolve => setTimeout(resolve, 1500))

          // Redirect to arena
          router.push(`/battle/${params.id}/arena`)
        })(),
        timeoutPromise
      ])
    } catch (error: any) {
      console.error('Error during stake transaction:', error)
      
      // Handle specific error types
      if (error.message?.includes('TRANSACTION_TIMEOUT')) {
        setTransactionStatus('timeout')
        setTransactionError('TRANSACTION_TIMEOUT')
      } else if (error.message?.includes('User rejected') || error.message?.includes('user rejected')) {
        setTransactionStatus('error')
        setTransactionError('TRANSACTION_REJECTED')
        setRetryCount(0) // Reset on user rejection
      } else if (error.message?.includes('JETTON_WALLET_NOT_FOUND')) {
        setTransactionStatus('error')
        setTransactionError('JETTON_WALLET_NOT_FOUND')
        setRetryCount(0) // Reset - can't retry this
      } else if (error.message?.includes('Insufficient')) {
        setTransactionStatus('error')
        setTransactionError('INSUFFICIENT_BALANCE')
        setRetryCount(0) // Reset - can't retry this
      } else if (error.message?.includes('API_ERROR')) {
        setTransactionStatus('error')
        setTransactionError('API_ERROR')
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        setTransactionStatus('error')
        setTransactionError('NETWORK_ERROR')
      } else {
        setTransactionStatus('error')
        setTransactionError('TRANSACTION_FAILED')
      }
      
      setIsConfirming(false)
    }
  }

  // Handle retry after error
  const handleRetryTransaction = () => {
    setTransactionStatus('idle')
    setTransactionError('')
    setIsConfirming(false)
    // Retry with backoff
    handleStake(true)
  }

  // Handle status check for timeout scenarios
  const handleCheckTransactionStatus = async () => {
    if (!transactionHash) {
      setTransactionError('NO_TRANSACTION_HASH')
      return
    }

    setIsCheckingStatus(true)
    
    try {
      // Check if transaction was recorded in database
      const response = await fetch(`/api/battles/stake?transaction_hash=${transactionHash}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.stake_transaction && data.stake_transaction.status === 'completed') {
          // Transaction was successful, update state and proceed
          setStakeData({
            amount: stakeAmount,
            battleId: params.id as string,
            timestamp: Date.now(),
            transactionHash: transactionHash,
            status: 'completed'
          })
          
          setTransactionStatus('success')
          setRetryCount(0)
          
          await new Promise(resolve => setTimeout(resolve, 1500))
          router.push(`/battle/${params.id}/arena`)
        } else {
          // Transaction still pending or failed
          setTransactionError('TRANSACTION_PENDING')
        }
      } else {
        // Transaction not found, might still be processing
        setTransactionError('TRANSACTION_NOT_FOUND')
      }
    } catch (error) {
      console.error('Error checking transaction status:', error)
      setTransactionError('STATUS_CHECK_FAILED')
    } finally {
      setIsCheckingStatus(false)
    }
  }

  // Get transaction error details
  const getTransactionErrorDetails = (errorCode: string) => {
    switch (errorCode) {
      case 'TRANSACTION_REJECTED':
        return {
          title: 'Transaction Cancelled',
          message: 'You cancelled the transaction. Your stake was not placed.',
          canRetry: true,
          showStatusCheck: false
        }
      case 'JETTON_WALLET_NOT_FOUND':
        return {
          title: 'No RISE Tokens Found',
          message: 'You need RISE tokens to stake. Please acquire some RISE tokens first.',
          canRetry: false,
          showStatusCheck: false
        }
      case 'INSUFFICIENT_BALANCE':
        return {
          title: 'Insufficient Balance',
          message: `You don't have enough RISE tokens. Your balance: ${userBalance.toFixed(2)} $RISE`,
          canRetry: false,
          showStatusCheck: false
        }
      case 'NETWORK_ERROR':
        return {
          title: 'Network Error',
          message: `Unable to connect to the blockchain. ${retryCount > 0 ? `Retry attempt ${retryCount}/${MAX_RETRY_ATTEMPTS}. ` : ''}Please check your connection and try again.`,
          canRetry: retryCount < MAX_RETRY_ATTEMPTS,
          showStatusCheck: false
        }
      case 'TRANSACTION_TIMEOUT':
        return {
          title: 'Transaction Timeout',
          message: 'The transaction is taking longer than expected. You can check the status or try again.',
          canRetry: retryCount < MAX_RETRY_ATTEMPTS,
          showStatusCheck: true
        }
      case 'MAX_RETRIES_EXCEEDED':
        return {
          title: 'Maximum Retries Exceeded',
          message: `Failed after ${MAX_RETRY_ATTEMPTS} attempts. Please try again later or contact support.`,
          canRetry: false,
          showStatusCheck: false
        }
      case 'API_ERROR':
        return {
          title: 'Database Error',
          message: 'Transaction was sent but could not be recorded. Please contact support.',
          canRetry: false,
          showStatusCheck: false
        }
      case 'TRANSACTION_PENDING':
        return {
          title: 'Transaction Pending',
          message: 'Your transaction is still being processed. Please wait a moment and check again.',
          canRetry: false,
          showStatusCheck: true
        }
      case 'TRANSACTION_NOT_FOUND':
        return {
          title: 'Transaction Not Found',
          message: 'The transaction could not be found. It may still be processing.',
          canRetry: true,
          showStatusCheck: true
        }
      case 'STATUS_CHECK_FAILED':
        return {
          title: 'Status Check Failed',
          message: 'Unable to verify transaction status. Please try again.',
          canRetry: true,
          showStatusCheck: true
        }
      case 'TRANSACTION_FAILED':
      default:
        return {
          title: 'Transaction Failed',
          message: 'The transaction could not be completed. Please try again.',
          canRetry: retryCount < MAX_RETRY_ATTEMPTS,
          showStatusCheck: false
        }
    }
  }

  // Handle retry
  const handleRetry = () => {
    window.location.reload()
  }

  // Get error details based on error type
  const getErrorDetails = (errorCode: string) => {
    switch (errorCode) {
      case 'BATTLE_NOT_FOUND':
        return {
          title: 'Battle Not Found',
          message: 'This battle does not exist or has been removed.',
          showRetry: false,
          autoRedirect: true
        }
      case 'BATTLE_COMPLETED':
        return {
          title: 'Battle Already Completed',
          message: 'This battle has already finished. You cannot stake on a completed battle.',
          showRetry: false,
          autoRedirect: true
        }
      case 'BATTLE_CANCELLED':
        return {
          title: 'Battle Cancelled',
          message: 'This battle has been cancelled and is no longer available.',
          showRetry: false,
          autoRedirect: true
        }
      case 'NOT_PARTICIPANT':
        return {
          title: 'Access Denied',
          message: 'You are not a participant in this battle.',
          showRetry: false,
          autoRedirect: true
        }
      case 'NETWORK_ERROR':
        return {
          title: 'Network Error',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          showRetry: true,
          autoRedirect: false
        }
      case 'SERVER_ERROR':
        return {
          title: 'Server Error',
          message: 'The server encountered an error. Please try again in a moment.',
          showRetry: true,
          autoRedirect: false
        }
      default:
        return {
          title: 'Error Loading Battle',
          message: 'An unexpected error occurred while loading the battle data.',
          showRetry: true,
          autoRedirect: false
        }
    }
  }

  // Auto-redirect for invalid battles
  useEffect(() => {
    if (battleError) {
      const errorDetails = getErrorDetails(battleError)
      if (errorDetails.autoRedirect) {
        const timer = setTimeout(() => {
          router.push('/battle')
        }, 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [battleError, router])

  // Show loading state
  if (isLoadingBattle || isLoadingBalance) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
            <p className="text-lg font-mono text-muted-foreground">Loading battle data...</p>
          </div>
        </main>
      </div>
    )
  }

  // Show error state
  if (battleError || !battleData) {
    const errorDetails = getErrorDetails(battleError || 'UNKNOWN_ERROR')
    
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Card className="border-destructive animate-in fade-in duration-500">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  {errorDetails.title}
                </CardTitle>
                <CardDescription>
                  {errorDetails.message}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorDetails.autoRedirect && (
                  <div className="bg-muted p-4 rounded-sm border-2 border-muted-foreground/20">
                    <p className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to battle selection in 3 seconds...
                    </p>
                  </div>
                )}
                <div className="flex gap-4">
                  {errorDetails.showRetry && (
                    <Button onClick={handleRetry} variant="outline">
                      <Loader2 className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  )}
                  <Button onClick={() => router.push('/battle')}>
                    Back to Battle Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
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
          <Card className="mb-6 animate-in slide-in-from-top duration-700">
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
                    <h3 className="font-bold text-lg font-mono">{myBeast?.name || 'Unknown'}</h3>
                    <Badge variant="secondary" className="mt-2">LVL {myBeast?.level || 1}</Badge>
                    {myBeast?.traits?.type && (
                      <Badge className="mt-2 ml-2">{myBeast.traits.type}</Badge>
                    )}
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
                    {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    {isBot ? 'Enemy' : 'Opponent'}
                  </Badge>
                  <div className="bg-card-foreground/5 border-4 border-destructive p-4 rounded-sm">
                    <h3 className="font-bold text-lg font-mono">{opponentBeast?.name || 'Unknown'}</h3>
                    <Badge variant="secondary" className="mt-2">LVL {opponentBeast?.level || 1}</Badge>
                    {opponentBeast?.traits?.type && (
                      <Badge className="mt-2 ml-2">{opponentBeast.traits.type}</Badge>
                    )}
                    {!isBot && opponent && (
                      <p className="text-xs text-muted-foreground mt-2 font-mono truncate">
                        {opponent.username || `${opponent.wallet_address.slice(0, 6)}...${opponent.wallet_address.slice(-4)}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staking Card */}
          <Card className="mb-6 animate-in slide-in-from-bottom duration-700">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Coins className="w-6 h-6" />
                Set Your Stake
              </CardTitle>
              <CardDescription>
                Winner takes all! Current balance: <span className="text-primary font-bold">{userBalance.toFixed(2)} $RISE</span>
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
              onClick={() => handleStake(false)}
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
          
          {/* Transaction Status Overlay */}
          {isConfirming && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
              <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg border-4 border-primary animate-in zoom-in-95 duration-500 max-w-md mx-4">
                {transactionStatus === 'pending' && (
                  <>
                    <Loader2 className="w-16 h-16 animate-spin text-primary" />
                    <h3 className="text-xl font-bold font-mono text-primary">Preparing Transaction...</h3>
                    <p className="text-sm text-muted-foreground font-mono text-center">
                      Fetching wallet information
                    </p>
                    <div className="flex gap-2 mt-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </>
                )}
                
                {transactionStatus === 'confirming' && (
                  <>
                    <Loader2 className="w-16 h-16 animate-spin text-primary" />
                    <h3 className="text-xl font-bold font-mono text-primary animate-pulse">Confirm Transaction</h3>
                    <p className="text-sm text-muted-foreground font-mono text-center">
                      Please confirm the transaction in your wallet
                    </p>
                    <div className="bg-muted p-4 rounded-sm border-2 border-primary/20 w-full">
                      <div className="flex justify-between text-sm font-mono mb-2">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-bold">{stakeAmount} $RISE</span>
                      </div>
                      <div className="flex justify-between text-sm font-mono">
                        <span className="text-muted-foreground">Gas Fee:</span>
                        <span className="font-bold">~0.05 TON</span>
                      </div>
                    </div>
                  </>
                )}
                
                {transactionStatus === 'success' && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-in zoom-in duration-300">
                      <Coins className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold font-mono text-primary">Stake Confirmed!</h3>
                    <p className="text-sm text-muted-foreground font-mono text-center">
                      Entering battle arena...
                    </p>
                    <div className="flex gap-2 mt-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </>
                )}
                
                {(transactionStatus === 'error' || transactionStatus === 'timeout') && transactionError && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center animate-in zoom-in duration-300">
                      <AlertCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h3 className="text-xl font-bold font-mono text-destructive">
                      {getTransactionErrorDetails(transactionError).title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono text-center">
                      {getTransactionErrorDetails(transactionError).message}
                    </p>
                    <div className="flex flex-col gap-2 w-full mt-4">
                      {getTransactionErrorDetails(transactionError).showStatusCheck && (
                        <Button
                          onClick={handleCheckTransactionStatus}
                          disabled={isCheckingStatus}
                          className="w-full"
                        >
                          {isCheckingStatus ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Checking Status...
                            </>
                          ) : (
                            'Check Transaction Status'
                          )}
                        </Button>
                      )}
                      {getTransactionErrorDetails(transactionError).canRetry && (
                        <Button
                          onClick={handleRetryTransaction}
                          variant="outline"
                          className="w-full"
                        >
                          Retry Transaction
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setIsConfirming(false)
                          setTransactionStatus('idle')
                          setTransactionError('')
                        }}
                        variant="secondary"
                        className="w-full"
                      >
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
