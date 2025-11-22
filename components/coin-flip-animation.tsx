'use client'

import { useEffect, useState } from 'react'

interface CoinFlipAnimationProps {
  result: 'heads' | 'tails'
  won: boolean
  payout?: number
  onAnimationComplete?: () => void
}

export function CoinFlipAnimation({ result, won, payout, onAnimationComplete }: CoinFlipAnimationProps) {
  const [isFlipping, setIsFlipping] = useState(true)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    // Flip animation duration
    const flipTimer = setTimeout(() => {
      setIsFlipping(false)
      setShowResult(true)
    }, 2000)

    // Call completion callback after showing result
    const completeTimer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete()
      }
    }, 3500)

    return () => {
      clearTimeout(flipTimer)
      clearTimeout(completeTimer)
    }
  }, [onAnimationComplete])

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
      {/* Coin Animation */}
      <div className="relative w-40 h-40 mb-8">
        <div
          className={`absolute inset-0 flex items-center justify-center text-8xl transition-all duration-500 ${
            isFlipping ? 'animate-spin' : ''
          }`}
          style={{
            animation: isFlipping ? 'spin 0.5s linear infinite' : 'none',
            transformStyle: 'preserve-3d',
          }}
        >
          {isFlipping ? '🪙' : result === 'heads' ? '👑' : '💎'}
        </div>
      </div>

      {/* Result Display */}
      {showResult && (
        <div className="text-center space-y-4 animate-in fade-in duration-700">
          <div className={`text-4xl font-bold font-mono ${won ? 'text-green-500' : 'text-red-500'}`}>
            {result.toUpperCase()}
          </div>
          <div className={`text-3xl font-bold font-mono ${won ? 'text-green-500' : 'text-red-500'}`}>
            {won ? '🎉 YOU WON! 🎉' : '😔 YOU LOST'}
          </div>
          {won && payout && (
            <div className="text-2xl font-mono text-green-400 animate-pulse">
              +{payout.toFixed(2)} RISE
            </div>
          )}
          {!won && (
            <div className="text-lg font-mono text-muted-foreground">
              Better luck next time!
            </div>
          )}
        </div>
      )}

      {/* Flipping Text */}
      {isFlipping && (
        <div className="text-xl font-mono text-muted-foreground animate-pulse">
          Flipping the coin...
        </div>
      )}
    </div>
  )
}
