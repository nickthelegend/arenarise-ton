'use client'

import { useState } from 'react'
import { Loader2, Flame, Droplet, Wind, Zap, Mountain, Sparkles } from 'lucide-react'
import { convertIpfsUrl } from '@/lib/ipfs'

interface BeastImageProps {
  imageUrl?: string
  beastName: string
  beastType?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Type-based fallback icon component
function TypeBasedPlaceholder({ 
  beastType, 
  beastName, 
  size 
}: { 
  beastType?: string
  beastName: string
  size: 'sm' | 'md' | 'lg'
}) {
  // Size classes for icons
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }
  
  // Get icon and color based on beast type
  const getTypeIcon = () => {
    const type = beastType?.toLowerCase() || ''
    
    switch (type) {
      case 'fire':
        return { Icon: Flame, color: 'text-red-500', bg: 'bg-red-500/20' }
      case 'water':
        return { Icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-500/20' }
      case 'air':
      case 'wind':
        return { Icon: Wind, color: 'text-cyan-500', bg: 'bg-cyan-500/20' }
      case 'electric':
      case 'lightning':
        return { Icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/20' }
      case 'earth':
      case 'ground':
        return { Icon: Mountain, color: 'text-amber-700', bg: 'bg-amber-700/20' }
      default:
        return { Icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/20' }
    }
  }
  
  const { Icon, color, bg } = getTypeIcon()
  
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center ${bg} rounded-lg border-2 border-primary/30`}>
      <Icon className={`${iconSizes[size]} ${color}`} />
      <div className="mt-2 text-xs font-bold text-center px-2 text-muted-foreground">
        {beastName}
      </div>
    </div>
  )
}

export function BeastImage({ 
  imageUrl, 
  beastName, 
  beastType,
  size = 'md',
  className = ''
}: BeastImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(!!imageUrl) // Only show loading if we have an image to load
  
  // Convert IPFS URLs to HTTP gateway URLs
  const httpImageUrl = imageUrl ? convertIpfsUrl(imageUrl) : undefined
  
  // Size classes
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  }
  
  // If no image URL or image failed to load, show type-based placeholder
  if (!httpImageUrl || imageError) {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        <TypeBasedPlaceholder 
          beastType={beastType}
          beastName={beastName}
          size={size}
        />
      </div>
    )
  }
  
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-lg z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* Beast image */}
      <img
        src={httpImageUrl}
        alt={beastName}
        className={`w-full h-full object-cover rounded-lg border-2 border-primary/30 transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true)
          setIsLoading(false)
        }}
        title={beastName}
      />
    </div>
  )
}
