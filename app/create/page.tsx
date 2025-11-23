'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sparkles, ArrowLeft, Wallet, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/8bitcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Badge } from '@/components/8bitcn/badge'
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react'
import { toNano } from '@ton/core'
import { PAYMENT_ADDRESS, BEAST_PURCHASE_PRICE } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import { convertIpfsUrl } from '@/lib/ipfs'

export default function CreatePage() {
  const router = useRouter()
  const address = useTonAddress()
  const [tonConnectUI] = useTonConnectUI()
  const { toast } = useToast()
  
  const [generatedBeast, setGeneratedBeast] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseComplete, setPurchaseComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not connected
  useEffect(() => {
    if (!address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create a beast',
        variant: 'destructive',
      })
      router.push('/')
    }
  }, [address, router, toast])

  const handleGenerateBeast = async () => {
    if (!address) {
      setError('Please connect your wallet first')
      return
    }

    // Prevent duplicate calls
    if (isGenerating) {
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedBeast(null)
    setPurchaseComplete(false)
    
    try {
      const response = await fetch('/api/create/beast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate beast')
      }

      setGeneratedBeast(data.beast)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePurchase = async () => {
    if (!generatedBeast || !address) return

    setIsPurchasing(true)
    setError(null)

    try {
      // Send 1 TON to payment address
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: PAYMENT_ADDRESS,
            amount: toNano(BEAST_PURCHASE_PRICE).toString(),
          }
        ]
      }

      await tonConnectUI.sendTransaction(transaction)

      // After payment, transfer NFT
      const purchaseResponse = await fetch('/api/purchase/beast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beast_id: generatedBeast.id,
          wallet_address: address,
          nft_address: generatedBeast.nft_address,
          payment_verified: true
        })
      })

      const purchaseData = await purchaseResponse.json()

      if (!purchaseResponse.ok) {
        throw new Error(purchaseData.error || 'Failed to complete purchase')
      }

      setPurchaseComplete(true)
      
      // Redirect to inventory after 2 seconds
      setTimeout(() => {
        router.push('/inventory')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Transaction cancelled')
    } finally {
      setIsPurchasing(false)
    }
  }

  if (!address) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-mono text-sm">Back to Home</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 text-primary text-glow">
              CREATE BEAST
            </h1>
            <p className="text-muted-foreground font-mono">
              Generate a random beast NFT with unique attributes
            </p>
          </div>

          {error && (
            <div className="bg-destructive/20 border-2 border-destructive p-4 mb-6 text-center">
              <p className="text-destructive font-mono text-sm">{error}</p>
            </div>
          )}

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
                Beast Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!generatedBeast ? (
                <>
                  <div className="bg-accent/20 border-2 border-accent p-6 mb-6 text-center">
                    <div className="text-sm text-muted-foreground mb-2 font-mono">FREE GENERATION</div>
                    <div className="text-2xl font-bold text-accent font-mono">PREVIEW YOUR BEAST</div>
                  </div>

                  <Button
                    onClick={handleGenerateBeast}
                    disabled={isGenerating}
                    size="lg"
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        GENERATING BEAST...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        GENERATE BEAST
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="border-2 border-primary p-6 bg-muted/50 animate-in fade-in duration-500">
                  {purchaseComplete ? (
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-primary mb-2">BEAST PURCHASED!</h3>
                      <p className="text-muted-foreground font-mono mb-4">
                        Your beast has been minted and sent to your wallet
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        Redirecting to inventory...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-6">
                        {generatedBeast.image_ipfs_uri ? (
                          <div className="w-64 h-64 mx-auto mb-4 border-4 border-primary bg-muted flex items-center justify-center overflow-hidden">
                            <img 
                              src={convertIpfsUrl(generatedBeast.image_ipfs_uri)} 
                              alt={generatedBeast.name}
                              className="w-full h-full object-cover pixelated"
                            />
                          </div>
                        ) : (
                          <div className="text-6xl mb-4">🐉</div>
                        )}
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          {generatedBeast.name}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono mb-4">
                          {generatedBeast.description}
                        </p>
                        <div className="flex gap-2 justify-center items-center flex-wrap">
                          {generatedBeast.traits && generatedBeast.traits.map((trait: any, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {trait.trait_type}: {trait.value}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-background border-2 border-border p-3">
                          <div className="text-xs text-muted-foreground mb-1 font-mono">HP</div>
                          <div className="text-xl font-bold text-primary font-mono">
                            {generatedBeast.hp}
                          </div>
                        </div>
                        <div className="bg-background border-2 border-border p-3">
                          <div className="text-xs text-muted-foreground mb-1 font-mono">ATTACK</div>
                          <div className="text-xl font-bold text-primary font-mono">
                            {generatedBeast.attack}
                          </div>
                        </div>
                        <div className="bg-background border-2 border-border p-3">
                          <div className="text-xs text-muted-foreground mb-1 font-mono">DEFENSE</div>
                          <div className="text-xl font-bold text-accent font-mono">
                            {generatedBeast.defense}
                          </div>
                        </div>
                        <div className="bg-background border-2 border-border p-3">
                          <div className="text-xs text-muted-foreground mb-1 font-mono">SPEED</div>
                          <div className="text-xl font-bold text-foreground font-mono">
                            {generatedBeast.speed}
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary/20 border-2 border-primary p-4 mb-6 text-center">
                        <div className="text-sm text-muted-foreground mb-2 font-mono">PURCHASE PRICE</div>
                        <div className="text-3xl font-bold text-primary font-mono">{BEAST_PURCHASE_PRICE} TON</div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            setGeneratedBeast(null)
                            setPurchaseComplete(false)
                          }}
                          variant="outline"
                          className="flex-1"
                          disabled={isPurchasing}
                        >
                          REGENERATE
                        </Button>
                        <Button
                          onClick={handlePurchase}
                          disabled={isPurchasing}
                          className="flex-1"
                        >
                          {isPurchasing ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              PROCESSING...
                            </>
                          ) : (
                            <>
                              <Wallet className="w-5 h-5 mr-2" />
                              BUY BEAST - {BEAST_PURCHASE_PRICE} TON
                            </>
                          )}
                        </Button>
                      </div>

                      <p className="text-xs text-center text-muted-foreground font-mono mt-4">
                        Beast will be minted and sent to your wallet after payment
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
