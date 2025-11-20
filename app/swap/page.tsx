'use client'

import { useState } from 'react'
import { ArrowDownUp, Info } from 'lucide-react'
import { Button } from '@/components/8bitcn/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Badge } from '@/components/8bitcn/badge'

export default function SwapPage() {
  const [fromToken, setFromToken] = useState<'RISE' | 'TON'>('RISE')
  const [toToken, setToToken] = useState<'RISE' | 'TON'>('TON')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  
  // Mock exchange rate: 1 RISE = 0.01 TON or 1 TON = 100 RISE
  const exchangeRate = fromToken === 'RISE' ? 0.01 : 100

  // Mock balances
  const balances = {
    RISE: 1250.50,
    TON: 12.45
  }

  const handleSwapDirection = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    if (value && !isNaN(Number(value))) {
      const calculated = (Number(value) * exchangeRate).toFixed(2)
      setToAmount(calculated)
    } else {
      setToAmount('')
    }
  }

  const handleMaxClick = () => {
    const maxAmount = balances[fromToken].toString()
    handleFromAmountChange(maxAmount)
  }

  const handleSwap = () => {
    // Mock swap functionality
    alert(`Swapping ${fromAmount} ${fromToken} for ${toAmount} ${toToken}`)
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">TOKEN SWAP</h1>
          <p className="text-muted-foreground">Exchange $RISE and TON tokens instantly</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Swap Tokens</CardTitle>
            <CardDescription>Trade between $RISE and TON tokens</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From Token */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-muted-foreground">FROM</label>
                <span className="text-xs text-muted-foreground font-mono">
                  Balance: {balances[fromToken].toFixed(2)} {fromToken}
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => handleFromAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-4 border-border bg-background text-lg font-bold font-mono focus:outline-none focus:border-primary"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleMaxClick}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                  >
                    MAX
                  </Button>
                </div>
                <div className="w-24">
                  <Badge variant="outline" className="w-full h-full flex items-center justify-center text-base">
                    {fromToken}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center">
              <Button
                size="icon"
                variant="outline"
                onClick={handleSwapDirection}
                className="rounded-full"
              >
                <ArrowDownUp className="w-5 h-5" />
              </Button>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-muted-foreground">TO</label>
                <span className="text-xs text-muted-foreground font-mono">
                  Balance: {balances[toToken].toFixed(2)} {toToken}
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={toAmount}
                    readOnly
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-4 border-border bg-muted text-lg font-bold font-mono"
                  />
                </div>
                <div className="w-24">
                  <Badge variant="outline" className="w-full h-full flex items-center justify-center text-base">
                    {toToken}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Exchange Rate Info */}
            <div className="flex items-center gap-2 p-4 bg-muted border-2 border-border">
              <Info className="w-4 h-4 text-accent" />
              <span className="text-sm font-mono">
                1 {fromToken} = {exchangeRate} {toToken}
              </span>
            </div>

            {/* Swap Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleSwap}
              disabled={!fromAmount || Number(fromAmount) <= 0 || Number(fromAmount) > balances[fromToken]}
            >
              {!fromAmount || Number(fromAmount) <= 0 
                ? 'Enter Amount' 
                : Number(fromAmount) > balances[fromToken]
                ? 'Insufficient Balance'
                : 'SWAP TOKENS'}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Swaps */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Swaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { from: '100 RISE', to: '1.00 TON', time: '5 mins ago' },
                { from: '5.50 TON', to: '550 RISE', time: '1 hour ago' },
                { from: '250 RISE', to: '2.50 TON', time: '3 hours ago' },
              ].map((swap, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted border-2 border-border">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{swap.from}</Badge>
                    <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline">{swap.to}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{swap.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
