'use client'

import { useState, useEffect } from 'react'
import { ArrowDownUp, Info } from 'lucide-react'
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react'
import { toNano, fromNano, Address } from '@ton/core'
import { TonClient } from '@ton/ton'
import { Button } from '@/components/8bitcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Badge } from '@/components/8bitcn/badge'
import { PAYMENT_ADDRESS, RISE_EXCHANGE_RATE } from '@/lib/constants'
import { calculateRiseAmount, validateSwapAmount, formatTokenAmount, requestRiseTokens, RiseTransferError } from '@/lib/swap-utils'

type TransactionStatus = 'idle' | 'payment-pending' | 'transfer-pending' | 'success' | 'error'

interface SwapTransaction {
  id: string
  wallet_address: string
  ton_amount: string
  rise_amount: string
  status: 'pending' | 'completed' | 'failed'
  transaction_hash?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export default function SwapPage() {
  const [tonConnectUI] = useTonConnectUI()
  const walletAddress = useTonAddress()
  
  const [tonAmount, setTonAmount] = useState('')
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [tonBalance, setTonBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [transactions, setTransactions] = useState<SwapTransaction[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [canRetry, setCanRetry] = useState(false)
  
  // Calculate RISE amount based on TON input (1 TON = 3000 RISE)
  const riseAmount = tonAmount && validateSwapAmount(tonAmount) 
    ? calculateRiseAmount(Number(tonAmount)) 
    : 0

  // Fetch TON balance when wallet is connected
  useEffect(() => {
    async function fetchTonBalance() {
      if (!walletAddress) {
        setTonBalance(null)
        return
      }

      setIsLoadingBalance(true)
      try {
        // Create TON client (testnet)
        const client = new TonClient({
          endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        })

        // Get balance
        const address = Address.parse(walletAddress)
        const balance = await client.getBalance(address)
        
        // Convert from nanotons to TON
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

  // Fetch transaction history when wallet is connected
  useEffect(() => {
    async function fetchTransactionHistory() {
      if (!walletAddress) {
        setTransactions([])
        return
      }

      setIsLoadingHistory(true)
      try {
        const response = await fetch(`/api/swap/history?wallet_address=${encodeURIComponent(walletAddress)}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch transaction history')
        }

        const data = await response.json()
        setTransactions(data.transactions || [])
      } catch (error) {
        console.error('Error fetching transaction history:', error)
        setTransactions([])
      } finally {
        setIsLoadingHistory(false)
      }
    }

    fetchTransactionHistory()
  }, [walletAddress])

  /**
   * Record a transaction in the database
   */
  const recordTransaction = async (
    status: 'pending' | 'completed' | 'failed',
    transactionHash?: string,
    errorMsg?: string
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/swap/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          ton_amount: tonAmount,
          rise_amount: riseAmount.toString(),
          status,
          transaction_hash: transactionHash,
          error_message: errorMsg,
        }),
      })

      if (!response.ok) {
        console.error('Failed to record transaction')
        return null
      }

      const data = await response.json()
      return data.transaction?.id || null
    } catch (error) {
      console.error('Error recording transaction:', error)
      return null
    }
  }

  /**
   * Update transaction status in the database
   */
  const updateTransactionStatus = async (
    transactionId: string,
    status: 'pending' | 'completed' | 'failed',
    transactionHash?: string,
    errorMsg?: string
  ): Promise<void> => {
    try {
      const response = await fetch('/api/swap/history', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          status,
          transaction_hash: transactionHash,
          error_message: errorMsg,
        }),
      })

      if (!response.ok) {
        console.error('Failed to update transaction status')
      }
    } catch (error) {
      console.error('Error updating transaction status:', error)
    }
  }

  /**
   * Refresh transaction history
   */
  const refreshTransactionHistory = async (): Promise<void> => {
    if (!walletAddress) return

    try {
      const response = await fetch(`/api/swap/history?wallet_address=${encodeURIComponent(walletAddress)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history')
      }

      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error refreshing transaction history:', error)
    }
  }

  /**
   * Log structured error information for debugging
   */
  const logError = (
    errorType: 'PAYMENT_FAILURE' | 'TRANSFER_FAILURE' | 'PARTIAL_FAILURE' | 'VALIDATION_ERROR',
    error: any,
    context: Record<string, any>
  ): void => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      errorType,
      errorMessage: error?.message || 'Unknown error',
      errorStack: error?.stack,
      context: {
        walletAddress,
        tonAmount,
        riseAmount,
        ...context
      }
    }
    
    console.error(`[${errorType}]`, errorLog)
  }

  /**
   * Complete swap flow: payment + token transfer
   * Handles the entire swap process with proper state management and error handling
   */
  const handleCompleteSwap = async (): Promise<void> => {
    if (!walletAddress) {
      setErrorMessage('Please connect your wallet first')
      setTransactionStatus('error')
      logError('VALIDATION_ERROR', new Error('Wallet not connected'), {})
      return
    }

    if (!validateSwapAmount(tonAmount)) {
      setErrorMessage('Please enter a valid amount')
      setTransactionStatus('error')
      logError('VALIDATION_ERROR', new Error('Invalid swap amount'), { tonAmount })
      return
    }

    let txId: string | null = null
    let paymentResult: any = null

    try {
      // Reset states
      setErrorMessage(null)
      setSuccessMessage(null)
      setCanRetry(false)

      // Step 1: Record pending transaction
      setTransactionStatus('payment-pending')
      txId = await recordTransaction('pending')

      // Step 2: Send TON payment
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        messages: [
          {
            address: PAYMENT_ADDRESS,
            amount: toNano(tonAmount).toString(),
          },
        ],
      }

      try {
        paymentResult = await tonConnectUI.sendTransaction(transaction)
        console.log('Payment transaction sent successfully:', {
          transactionId: txId,
          boc: paymentResult?.boc
        })
      } catch (paymentError: any) {
        // Handle payment-specific errors
        logError('PAYMENT_FAILURE', paymentError, {
          transactionId: txId,
          stage: 'payment'
        })

        if (paymentError?.message?.includes('reject') || paymentError?.message?.includes('cancel')) {
          // User rejected the transaction - this is not an error state
          setTransactionStatus('idle')
          setErrorMessage(null)
          
          if (txId) {
            await updateTransactionStatus(txId, 'failed', undefined, 'User cancelled transaction')
          }
          
          await refreshTransactionHistory()
          return
        }

        // Other payment errors (network, insufficient balance, etc.)
        throw paymentError
      }

      // Step 3: Request RISE tokens from backend
      setTransactionStatus('transfer-pending')
      
      try {
        const transferResult = await requestRiseTokens(walletAddress, riseAmount)
        console.log('RISE tokens transferred successfully:', {
          transactionId: txId,
          fromWallet: transferResult.fromWallet,
          toWallet: transferResult.toWallet,
          jettonAmount: transferResult.jettonAmount,
          seqno: transferResult.seqno
        })

        // Step 4: Mark transaction as completed with transaction hash
        if (txId) {
          await updateTransactionStatus(txId, 'completed', paymentResult?.boc || undefined)
        }

        // Step 5: Update UI with success
        setTransactionStatus('success')
        setSuccessMessage(`Successfully received ${formatTokenAmount(riseAmount, 2)} RISE tokens!`)
        
        // Step 6: Refresh transaction history
        await refreshTransactionHistory()

        // Reset form after 3 seconds
        setTimeout(() => {
          setTonAmount('')
          setTransactionStatus('idle')
          setSuccessMessage(null)
        }, 3000)

      } catch (transferError) {
        // Handle partial failure: payment succeeded but token transfer failed
        logError('PARTIAL_FAILURE', transferError, {
          transactionId: txId,
          paymentBoc: paymentResult?.boc,
          stage: 'transfer'
        })
        
        if (txId) {
          const errorMsg = transferError instanceof Error ? transferError.message : 'Token transfer failed'
          await updateTransactionStatus(txId, 'failed', paymentResult?.boc || undefined, errorMsg)
        }

        setTransactionStatus('error')
        
        if (transferError instanceof RiseTransferError) {
          if (transferError.isRetryable) {
            // Retryable errors (5xx, network issues) - but payment already succeeded, so no retry
            setErrorMessage(
              `${transferError.message} Your payment was sent successfully. ` +
              `Please contact support with your wallet address if tokens are not received within 24 hours.`
            )
            setCanRetry(false) // Cannot retry after payment succeeded
          } else {
            // Non-retryable errors (4xx)
            setErrorMessage(
              `${transferError.message} Your payment was sent but token transfer failed. ` +
              `Please contact support with your wallet address: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
            )
            setCanRetry(false) // Cannot retry after payment succeeded
          }
        } else {
          // Unknown error
          setErrorMessage(
            'Failed to transfer RISE tokens. Your payment was sent successfully. ' +
            'Please contact support with your wallet address if tokens are not received within 24 hours.'
          )
          setCanRetry(false) // Cannot retry after payment succeeded
        }

        // Refresh history to show failed transaction
        await refreshTransactionHistory()
      }
      
    } catch (error: any) {
      // Handle payment transaction errors (before payment succeeded)
      logError('PAYMENT_FAILURE', error, {
        transactionId: txId,
        stage: 'payment'
      })

      setTransactionStatus('error')
      
      // Determine error message based on error type
      let errorMsg = 'Payment transaction failed. Please try again.'
      let isRetryable = true
      
      if (error?.message?.includes('insufficient')) {
        errorMsg = 'Insufficient TON balance to complete this transaction.'
        isRetryable = false // Cannot retry with insufficient balance
      } else if (error?.message?.includes('network') || error?.message?.includes('timeout')) {
        errorMsg = 'Network error. Please check your connection and try again.'
        isRetryable = true
      } else if (error?.message) {
        errorMsg = `Payment failed: ${error.message}`
        isRetryable = true
      }
      
      setErrorMessage(errorMsg)
      setCanRetry(isRetryable)
      
      // Mark transaction as failed
      if (txId) {
        await updateTransactionStatus(txId, 'failed', undefined, error?.message || 'Payment failed')
      }

      // Refresh history
      await refreshTransactionHistory()
    }
  }

  const handleTonAmountChange = (value: string) => {
    setTonAmount(value)
    // Reset error state when user changes input
    if (transactionStatus === 'error') {
      setTransactionStatus('idle')
      setErrorMessage(null)
      setCanRetry(false)
    }
  }

  /**
   * Retry a failed swap transaction
   */
  const handleRetry = async () => {
    setCanRetry(false)
    await handleCompleteSwap()
  }

  const handleSwap = async () => {
    // Check for insufficient balance
    if (tonBalance !== null && Number(tonAmount) > tonBalance) {
      setErrorMessage(`Insufficient TON balance. You have ${formatTokenAmount(tonBalance, 4)} TON available`)
      setTransactionStatus('error')
      return
    }
    
    await handleCompleteSwap()
  }

  const isSwapDisabled = 
    !walletAddress || 
    !validateSwapAmount(tonAmount) || 
    transactionStatus === 'payment-pending' ||
    transactionStatus === 'transfer-pending' ||
    (tonBalance !== null && Number(tonAmount) > tonBalance)

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
                    Balance: {isLoadingBalance ? '...' : tonBalance !== null ? formatTokenAmount(tonBalance, 4) : '0.00'} TON
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={tonAmount}
                      onChange={(e) => handleTonAmountChange(e.target.value)}
                      placeholder="0.00"
                      disabled={transactionStatus === 'payment-pending' || transactionStatus === 'transfer-pending'}
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
                <div className="space-y-2">
                  <div className="p-4 bg-destructive/10 border-2 border-destructive text-destructive text-sm font-mono">
                    {errorMessage}
                  </div>
                  {canRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={handleRetry}
                    >
                      RETRY TRANSACTION
                    </Button>
                  )}
                </div>
              )}

              {/* Status Messages */}
              {transactionStatus === 'payment-pending' && (
                <div className="p-4 bg-blue-500/10 border-2 border-blue-500 text-blue-500 text-sm font-mono">
                  Sending payment transaction...
                </div>
              )}

              {transactionStatus === 'transfer-pending' && (
                <div className="p-4 bg-blue-500/10 border-2 border-blue-500 text-blue-500 text-sm font-mono">
                  Payment confirmed! Transferring RISE tokens...
                </div>
              )}

              {/* Success Message */}
              {transactionStatus === 'success' && successMessage && (
                <div className="p-4 bg-green-500/10 border-2 border-green-500 text-green-500 text-sm font-mono">
                  {successMessage}
                </div>
              )}

              {/* Swap Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleSwap}
                disabled={isSwapDisabled}
              >
                {transactionStatus === 'payment-pending' 
                  ? 'SENDING PAYMENT...' 
                  : transactionStatus === 'transfer-pending'
                  ? 'TRANSFERRING TOKENS...'
                  : transactionStatus === 'success'
                  ? 'SUCCESS!'
                  : !tonAmount || !validateSwapAmount(tonAmount)
                  ? 'Enter Amount'
                  : tonBalance !== null && Number(tonAmount) > tonBalance
                  ? 'Insufficient Balance'
                  : 'SWAP TOKENS'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        {walletAddress && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm font-mono">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm font-mono">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 border-2 border-border bg-muted/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono">
                            {formatTokenAmount(parseFloat(tx.ton_amount), 4)} TON
                          </span>
                          <ArrowDownUp className="w-3 h-3" />
                          <span className="text-sm font-bold font-mono">
                            {formatTokenAmount(parseFloat(tx.rise_amount), 2)} RISE
                          </span>
                        </div>
                        <Badge
                          variant={
                            tx.status === 'completed'
                              ? 'default'
                              : tx.status === 'pending'
                              ? 'outline'
                              : 'destructive'
                          }
                        >
                          {tx.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {new Date(tx.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {tx.transaction_hash && (
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          TX: {tx.transaction_hash}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
