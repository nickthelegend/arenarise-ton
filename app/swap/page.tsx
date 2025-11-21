'use client'

import { useState } from 'react'
import { ArrowDownUp, Info } from 'lucide-react'
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react'
import { toNano } from '@ton/core'
import { Button } from '@/components/8bitcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Badge } from '@/components/8bitcn/badge'
import { PAYMENT_ADDRESS, RISE_EXCHANGE_RATE } from '@/lib/constants'
import { calculateRiseAmount, validateSwapAmount, formatTokenAmount } from '@/lib/swap-utils'

type TransactionStatus = 'idle' | 'pending' | 'success' | 'error'

export default function SwapPage() {
  const [tonConnectUI] = useTonConnectUI()
  const walletAddress = useTonAddress()
  
  const [tonAmount, setTonAmount] = useState('')
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Calculate RISE amount based on TON input
  const riseAmount = tonAmount && validateSwapAmount(tonAmount) 
    ? calculateRiseAmount(Number(tonAmount)) 
    : 0

  // Mock balances (will be replaced with real balance fetching later)
  const balances = {
    RISE: 1250.50,
    TON: 12.45
  }

  /**
   * Send TON payment transaction using TonConnect
   * Handles the payment flow with proper state management and error handling
   */
  const sendTonPayment = async (amount: string): Promise<void> => {
    if (!walletAddress) {
      setErrorMessage('Please connect your wallet first')
      setTransactionStatus('error')
      return
    }

    if (!validateSwapAmount(amount)) {
      setErrorMessage('Please enter a valid amount')
      setTransactionStatus('error')
      return
    }

    try {
      setTransactionStatus('pending')
      setErrorMessage(null)

      // Create transaction payload
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: PAYMENT_ADDRESS,
            amount: toNano(amount).toString(),
          },
        ],
      }

      // Send transaction via TonConnect
      const result = await tonConnectUI.sendTransaction(transaction)

      // Transaction sent successfully
      setTransactionStatus('success')
      console.log('Transaction sent:', result)
      
    } catch (error: any) {
      // Handle different error types
      if (error?.message?.includes('reject') || error?.message?.includes('cancel')) {
        // User rejected the transaction
        setTransactionStatus('idle')
        setErrorMessage(null)
      } else {
        // Other errors (network, insufficient balance, etc.)
        setTransactionStatus('error')
        setErrorMessage(error?.message || 'Transaction failed. Please try again.')
        console.error('Transaction error:', error)
      }
    }
  }

  const handleTonAmountChange = (value: string) => {
    setTonAmount(value)
    // Reset error state when user changes input
    if (transactionStatus === 'error') {
      setTransactionStatus('idle')
      setErrorMessage(null)
    }
  }

  const handleSwap = async () => {
    await sendTonPayment(tonAmount)
  }

  const isSwapDisabled = 
    !walletAddress || 
    !validateSwapAmount(tonAmount) || 
    transactionStatus === 'pending'

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">TOKEN SWAP</h1>
          <p className="text-muted-foreground">Purchase $RISE tokens with TON</p>
        </div>

        {!walletAddress ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground mb-4">
                Please connect your wallet to swap tokens
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Swap TON for RISE</CardTitle>
              <CardDescription>
                Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* TON Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-muted-foreground">YOU PAY</label>
                  <span className="text-xs text-muted-foreground font-mono">
                    Balance: {balances.TON.toFixed(2)} TON
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={tonAmount}
                      onChange={(e) => handleTonAmountChange(e.target.value)}
                      placeholder="0.00"
                      disabled={transactionStatus === 'pending'}
                      className="w-full px-4 py-3 border-4 border-border bg-background text-lg font-bold font-mono focus:outline-none focus:border-primary disabled:opacity-50"
                    />
                  </div>
                  <div className="w-24">
                    <Badge variant="outline" className="w-full h-full flex items-center justify-center text-base">
                      TON
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Arrow Down */}
              <div className="flex justify-center">
                <div className="rounded-full border-4 border-border p-2">
                  <ArrowDownUp className="w-5 h-5" />
                </div>
              </div>

              {/* RISE Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-muted-foreground">YOU RECEIVE</label>
                  <span className="text-xs text-muted-foreground font-mono">
                    Balance: {formatTokenAmount(balances.RISE, 2)} RISE
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={riseAmount > 0 ? formatTokenAmount(riseAmount, 2) : ''}
                      readOnly
                      placeholder="0.00"
                      className="w-full px-4 py-3 border-4 border-border bg-muted text-lg font-bold font-mono"
                    />
                  </div>
                  <div className="w-24">
                    <Badge variant="outline" className="w-full h-full flex items-center justify-center text-base">
                      RISE
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Exchange Rate Info */}
              <div className="flex items-center gap-2 p-4 bg-muted border-2 border-border">
                <Info className="w-4 h-4 text-accent" />
                <span className="text-sm font-mono">
                  1 TON = {RISE_EXCHANGE_RATE.toLocaleString()} RISE
                </span>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-4 bg-destructive/10 border-2 border-destructive text-destructive text-sm font-mono">
                  {errorMessage}
                </div>
              )}

              {/* Success Message */}
              {transactionStatus === 'success' && (
                <div className="p-4 bg-green-500/10 border-2 border-green-500 text-green-500 text-sm font-mono">
                  Payment sent successfully! Processing token transfer...
                </div>
              )}

              {/* Swap Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleSwap}
                disabled={isSwapDisabled}
              >
                {transactionStatus === 'pending' 
                  ? 'PROCESSING...' 
                  : !tonAmount || !validateSwapAmount(tonAmount)
                  ? 'Enter Amount'
                  : 'SWAP TOKENS'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Transaction History - Will be implemented in later tasks */}
        {walletAddress && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm font-mono">No transactions yet</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
