'use client'

import { useState, useEffect } from 'react'
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react'
import { toNano, fromNano, Address } from '@ton/core'
import { TonClient } from '@ton/ton'
import { Coins, DollarSign } from 'lucide-react'
import { Button } from '@/components/8bitcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Badge } from '@/components/8bitcn/badge'
import { PAYMENT_ADDRESS } from '@/lib/constants'
import { CoinFlipAnimation } from '@/components/coin-flip-animation'

type TransactionStatus = 'idle' | 'pending' | 'flipping' | 'success' | 'error'
type CoinChoice = 'heads' | 'tails' | null

interface CoinFlipHistory {
  id: string
  bet_amount: number
  choice: 'heads' | 'tails'
  result: 'heads' | 'tails'
  won: boolean
  payout: number
  created_at: string
}

export default function BetsPage() {
  const [tonConnectUI] = useTonConnectUI()
  const walletAddress = useTonAddress()
  
  // Form state
  const [betAmount, setBetAmount] = useState('')
  const [selectedChoice, setSelectedChoice] = useState<CoinChoice>(null)
  
  // Transaction state
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Validation state
  const [betAmountError, setBetAmountError] = useState<string | null>(null)
  
  // Balance state
  const [tonBalance, setTonBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  
  // History state
  const [history, setHistory] = useState<CoinFlipHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  // Flip result state
  const [flipResult, setFlipResult] = useState<'heads' | 'tails' | null>(null)
  const [wonFlip, setWonFlip] = useState<boolean | null>(null)
  const [payoutAmount, setPayoutAmount] = useState<number | null>(null)

  // Fetch TON balance when wallet is connected
  useEffect(() => {
    async function fetchTonBalance() {
      if (!walletAddress) {
        setTonBalance(null)
        return
      }

      setIsLoadingBalance(true)
      try {
        const client = new TonClient({
          endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        })

        const address = Address.parse(walletAddress)
        const balance = await client.getBalance(address)
        const tonBalance = parseFloat(fromNano(balance))
        setTonBalance(tonBalance)
      } catch (error) {
        console.error('Error fetching TON balance:', error)
        setTonBalance(null)
      } finally {
        setIsLoadingBalance(false)
      }
    }

    fetchTonBalance()
  }, [walletAddress])

  // Fetch betting history when wallet is connected
  useEffect(() => {
    async function fetchHistory() {
      if (!walletAddress) {
        setHistory([])
        return
      }

      setIsLoadingHistory(true)
      try {
        const response = await fetch(`/api/bets/history?wallet_address=${encodeURIComponent(walletAddress)}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch betting history')
        }

        const data = await response.json()
        setHistory(data.flips || [])
      } catch (error) {
        console.error('Error fetching betting history:', error)
        setHistory([])
      } finally {
        setIsLoadingHistory(false)
      }
    }

    fetchHistory()
  }, [walletAddress])

  // Validate bet amount
  const validateBetAmount = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return null // Empty is okay, we'll handle it on submit
    }
    
    const numValue = parseFloat(value)
    
    if (isNaN(numValue)) {
      return 'Please enter a valid number'
    }
    
    if (numValue <= 0) {
      return 'Bet amount must be greater than zero'
    }
    
    if (tonBalance !== null && numValue > tonBalance) {
      return `Insufficient balance. You have ${tonBalance.toFixed(4)} TON available`
    }
    
    return null
  }

  // Handle bet amount change
  const handleBetAmountChange = (value: string) => {
    setBetAmount(value)
    
    // Validate in real-time
    const error = validateBetAmount(value)
    setBetAmountError(error)
    
    // Reset error state when user changes input
    if (transactionStatus === 'error') {
      setTransactionStatus('idle')
      setErrorMessage(null)
    }
  }

  // Handle choice selection
  const handleChoiceSelect = (choice: 'heads' | 'tails') => {
    setSelectedChoice(choice)
    // Reset error state when user changes selection
    if (transactionStatus === 'error') {
      setTransactionStatus('idle')
      setErrorMessage(null)
    }
  }
  
  // Re-validate bet amount when balance changes
  useEffect(() => {
    if (betAmount) {
      const error = validateBetAmount(betAmount)
      setBetAmountError(error)
    }
  }, [tonBalance])

  // Refresh history after a flip
  const refreshHistory = async () => {
    if (!walletAddress) return

    try {
      const response = await fetch(`/api/bets/history?wallet_address=${encodeURIComponent(walletAddress)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch betting history')
      }

      const data = await response.json()
      setHistory(data.flips || [])
    } catch (error) {
      console.error('Error refreshing betting history:', error)
    }
  }

  // Handle flip button click
  const handleFlip = async () => {
    // Validate wallet connection
    if (!walletAddress) {
      setErrorMessage('Please connect your wallet first')
      setTransactionStatus('error')
      return
    }

    // Validate bet amount
    if (!betAmount || betAmount.trim() === '') {
      setErrorMessage('Please enter a bet amount')
      setBetAmountError('Bet amount is required')
      setTransactionStatus('error')
      return
    }

    const numBetAmount = parseFloat(betAmount)
    
    if (isNaN(numBetAmount)) {
      setErrorMessage('Please enter a valid bet amount')
      setBetAmountError('Please enter a valid number')
      setTransactionStatus('error')
      return
    }

    if (numBetAmount <= 0) {
      setErrorMessage('Bet amount must be greater than zero')
      setBetAmountError('Bet amount must be greater than zero')
      setTransactionStatus('error')
      return
    }

    // Check for insufficient balance
    if (tonBalance !== null && numBetAmount > tonBalance) {
      const errorMsg = `Insufficient TON balance. You have ${tonBalance.toFixed(4)} TON available`
      setErrorMessage(errorMsg)
      setBetAmountError(errorMsg)
      setTransactionStatus('error')
      return
    }

    // Validate choice selection
    if (!selectedChoice) {
      setErrorMessage('Please select heads or tails')
      setTransactionStatus('error')
      return
    }

    try {
      // Reset states
      setErrorMessage(null)
      setBetAmountError(null)
      setFlipResult(null)
      setWonFlip(null)
      setPayoutAmount(null)

      // Step 1: Send TON payment
      setTransactionStatus('pending')
      
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: PAYMENT_ADDRESS,
            amount: toNano(betAmount).toString(),
          },
        ],
      }

      let paymentResult: any
      try {
        paymentResult = await tonConnectUI.sendTransaction(transaction)
        console.log('Payment transaction sent successfully:', paymentResult?.boc)
      } catch (paymentError: any) {
        // Handle user rejection gracefully
        if (paymentError?.message?.includes('reject') || 
            paymentError?.message?.includes('cancel') ||
            paymentError?.message?.includes('user rejected')) {
          setTransactionStatus('idle')
          setErrorMessage(null)
          return
        }
        
        // Handle other payment errors
        throw new Error(`Payment failed: ${paymentError?.message || 'Unknown error'}`)
      }

      // Step 2: Execute coin flip
      setTransactionStatus('flipping')
      
      const flipResponse = await fetch('/api/bets/flip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          bet_amount: numBetAmount,
          choice: selectedChoice,
          transaction_hash: paymentResult?.boc || 'mock_hash',
        }),
      })

      if (!flipResponse.ok) {
        const errorData = await flipResponse.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Server error: ${flipResponse.status}`)
      }

      const flipData = await flipResponse.json()

      // Step 3: Display result
      setFlipResult(flipData.result)
      setWonFlip(flipData.won)
      setPayoutAmount(flipData.payout || 0)
      setTransactionStatus('success')

      // Refresh history
      await refreshHistory()

      // Reset form after 5 seconds
      setTimeout(() => {
        setBetAmount('')
        setSelectedChoice(null)
        setTransactionStatus('idle')
        setFlipResult(null)
        setWonFlip(null)
        setPayoutAmount(null)
      }, 5000)

    } catch (error: any) {
      console.error('Coin flip error:', error)
      setTransactionStatus('error')
      
      // Categorize and format error messages
      let errorMsg = 'Transaction failed. Please try again.'
      
      if (error?.message?.includes('insufficient') || error?.message?.includes('balance')) {
        errorMsg = 'Insufficient TON balance to complete this transaction.'
      } else if (error?.message?.includes('network') || 
                 error?.message?.includes('timeout') || 
                 error?.message?.includes('fetch') ||
                 error?.message?.includes('NetworkError')) {
        errorMsg = 'Network error. Please check your connection and try again.'
      } else if (error?.message?.includes('Payment failed')) {
        errorMsg = error.message
      } else if (error?.message?.includes('Server error')) {
        errorMsg = 'Server error. Please try again later.'
      } else if (error?.message?.includes('RISE transfer')) {
        errorMsg = 'Coin flip completed but RISE transfer failed. Please contact support.'
      } else if (error?.message) {
        errorMsg = error.message
      }
      
      setErrorMessage(errorMsg)
    }
  }

  const isFlipDisabled = 
    !walletAddress || 
    !betAmount || 
    betAmountError !== null ||
    !selectedChoice ||
    transactionStatus === 'pending' ||
    transactionStatus === 'flipping'

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">COIN FLIP BETTING</h1>
          <p className="text-muted-foreground">Bet TON, win RISE tokens!</p>
        </div>

        {!walletAddress ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                Please connect your wallet to start betting
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Main Betting Card */}
            <Card>
              <CardHeader>
                <CardTitle>Place Your Bet</CardTitle>
                <CardDescription>
                  Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bet Amount Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-muted-foreground">BET AMOUNT</label>
                    <span className="text-xs text-muted-foreground font-mono">
                      Balance: {isLoadingBalance ? '...' : tonBalance !== null ? tonBalance.toFixed(4) : '0.00'} TON
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => handleBetAmountChange(e.target.value)}
                        placeholder="0.00"
                        disabled={transactionStatus === 'pending' || transactionStatus === 'flipping'}
                        className={`w-full px-4 py-3 border-4 bg-background text-lg font-bold font-mono focus:outline-none disabled:opacity-50 ${
                          betAmountError 
                            ? 'border-destructive focus:border-destructive' 
                            : 'border-border focus:border-primary'
                        }`}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="w-24">
                      <Badge variant="outline" className="w-full h-full flex items-center justify-center text-base">
                        TON
                      </Badge>
                    </div>
                  </div>
                  {betAmountError && (
                    <div className="text-xs text-destructive font-mono flex items-start gap-1">
                      <span className="mt-0.5">⚠</span>
                      <span>{betAmountError}</span>
                    </div>
                  )}
                </div>

                {/* Heads/Tails Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">CHOOSE YOUR SIDE</label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      size="lg"
                      variant={selectedChoice === 'heads' ? 'default' : 'outline'}
                      onClick={() => handleChoiceSelect('heads')}
                      disabled={transactionStatus === 'pending' || transactionStatus === 'flipping'}
                      className="h-20 text-xl"
                    >
                      <Coins className="w-6 h-6 mr-2" />
                      HEADS
                    </Button>
                    <Button
                      size="lg"
                      variant={selectedChoice === 'tails' ? 'default' : 'outline'}
                      onClick={() => handleChoiceSelect('tails')}
                      disabled={transactionStatus === 'pending' || transactionStatus === 'flipping'}
                      className="h-20 text-xl"
                    >
                      <DollarSign className="w-6 h-6 mr-2" />
                      TAILS
                    </Button>
                  </div>
                </div>

                {/* Potential Payout Info */}
                {betAmount && parseFloat(betAmount) > 0 && (
                  <div className="p-4 bg-muted border-2 border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-muted-foreground">Potential Payout:</span>
                      <span className="text-lg font-bold font-mono text-accent">
                        {(parseFloat(betAmount) * 2).toFixed(2)} RISE
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {errorMessage && transactionStatus === 'error' && (
                  <div className="p-4 bg-destructive/10 border-4 border-destructive text-destructive font-mono">
                    <div className="flex items-start gap-2">
                      <span className="text-lg mt-0.5">⚠</span>
                      <div className="flex-1">
                        <div className="font-bold text-sm mb-1">Error</div>
                        <div className="text-sm">{errorMessage}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {transactionStatus === 'pending' && (
                  <div className="p-4 bg-blue-500/10 border-2 border-blue-500 text-blue-500 text-sm font-mono">
                    Sending payment transaction...
                  </div>
                )}

                {transactionStatus === 'flipping' && (
                  <div className="p-4 bg-blue-500/10 border-2 border-blue-500 text-blue-500 text-sm font-mono">
                    Flipping the coin...
                  </div>
                )}

                {/* Coin Flip Animation and Result Display */}
                {transactionStatus === 'flipping' && selectedChoice && (
                  <Card className="border-primary">
                    <CardContent className="p-0">
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4 animate-spin">🪙</div>
                        <div className="text-lg font-mono text-muted-foreground animate-pulse">
                          Flipping the coin...
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {transactionStatus === 'success' && flipResult && wonFlip !== null && (
                  <Card className={`border-4 ${wonFlip ? 'border-green-500' : 'border-red-500'}`}>
                    <CardContent className="p-0">
                      <CoinFlipAnimation
                        result={flipResult}
                        won={wonFlip}
                        payout={payoutAmount || undefined}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Flip Button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleFlip}
                  disabled={isFlipDisabled}
                >
                  {transactionStatus === 'pending' 
                    ? 'SENDING PAYMENT...' 
                    : transactionStatus === 'flipping'
                    ? 'FLIPPING...'
                    : transactionStatus === 'success'
                    ? 'FLIP COMPLETE!'
                    : !walletAddress
                    ? 'Connect Wallet'
                    : !betAmount
                    ? 'Enter Bet Amount'
                    : betAmountError
                    ? 'Fix Bet Amount'
                    : !selectedChoice
                    ? 'Select Heads or Tails'
                    : 'FLIP COIN'}
                </Button>
              </CardContent>
            </Card>

            {/* Betting History Card */}
            <Card>
              <CardHeader>
                <CardTitle>Betting History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm font-mono">Loading history...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm font-mono">No betting history yet. Place your first bet!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((flip) => (
                      <div
                        key={flip.id}
                        className="p-4 border-2 border-border bg-muted/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {flip.result === 'heads' ? '🪙' : '💰'}
                            </span>
                            <div>
                              <div className="text-sm font-bold font-mono">
                                Bet: {flip.bet_amount.toFixed(2)} TON on {flip.choice.toUpperCase()}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                Result: {flip.result.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={flip.won ? 'default' : 'destructive'}
                          >
                            {flip.won ? `WON ${flip.payout.toFixed(2)} RISE` : 'LOST'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {new Date(flip.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
