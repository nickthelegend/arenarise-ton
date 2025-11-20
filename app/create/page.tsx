'use client'

import { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/8bitcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/8bitcn/card'
import { Badge } from '@/components/8bitcn/badge'

const BEAST_TYPES = ['Dragon', 'Phoenix', 'Hydra', 'Griffon', 'Cerberus', 'Chimera', 'Basilisk', 'Manticore']
const ELEMENTS = ['Fire', 'Water', 'Earth', 'Air', 'Lightning', 'Shadow', 'Ice', 'Nature']
const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary']

const generateRandomBeast = () => {
  const type = BEAST_TYPES[Math.floor(Math.random() * BEAST_TYPES.length)]
  const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]
  const rarity = RARITIES[Math.floor(Math.random() * RARITIES.length)]
  const id = Math.floor(Math.random() * 9999)
  
  // Generate stats based on rarity
  const rarityMultiplier = {
    'Common': 1,
    'Rare': 1.3,
    'Epic': 1.6,
    'Legendary': 2
  }[rarity]
  
  return {
    name: `${type} #${id}`,
    type,
    element,
    rarity,
    id,
    attack: Math.floor((50 + Math.random() * 50) * rarityMultiplier),
    defense: Math.floor((30 + Math.random() * 40) * rarityMultiplier),
    speed: Math.floor((40 + Math.random() * 60) * rarityMultiplier),
    health: Math.floor((100 + Math.random() * 100) * rarityMultiplier)
  }
}

export default function CreatePage() {
  const [generatedBeast, setGeneratedBeast] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateBeast = async () => {
    setIsGenerating(true)
    setGeneratedBeast(null)
    
    // Simulate generation animation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const newBeast = generateRandomBeast()
    setGeneratedBeast(newBeast)
    setIsGenerating(false)
  }

  const cost = 0.5 // TON cost to create

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
              Generate a random beast with unique attributes and stats
            </p>
          </div>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
                Beast Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Generation Cost Display */}
              <div className="bg-accent/20 border-2 border-accent p-6 mb-6 text-center">
                <div className="text-sm text-muted-foreground mb-2 font-mono">GENERATION COST</div>
                <div className="text-3xl font-bold text-accent font-mono">{cost} TON</div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateBeast}
                disabled={isGenerating}
                size="lg"
                className="w-full mb-6"
              >
                {isGenerating ? 'GENERATING...' : `GENERATE BEAST WITH ${cost} TON`}
              </Button>

              {generatedBeast && (
                <div className="border-2 border-primary p-6 bg-muted/50 animate-in fade-in duration-500">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">🐉</div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {generatedBeast.name}
                    </h3>
                    <div className="flex gap-2 justify-center items-center flex-wrap">
                      <Badge variant="default">{generatedBeast.type}</Badge>
                      <Badge variant="secondary">{generatedBeast.element}</Badge>
                      <Badge 
                        variant={
                          generatedBeast.rarity === 'Legendary' ? 'default' : 
                          generatedBeast.rarity === 'Epic' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {generatedBeast.rarity}
                      </Badge>
                    </div>
                  </div>

                  {/* Beast Stats */}
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="bg-background border-2 border-border p-3">
                      <div className="text-xs text-muted-foreground mb-1 font-mono">HEALTH</div>
                      <div className="text-xl font-bold text-primary font-mono">
                        {generatedBeast.health}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground font-mono">
                      Beast successfully minted! Check your inventory to view all beasts.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
