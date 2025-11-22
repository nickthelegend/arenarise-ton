'use client'

import { Swords, Trophy, Skull, Loader2 } from 'lucide-react'
import { Badge } from '@/components/8bitcn/badge'

export interface BattleHistoryEntry {
  id: string
  opponent_name: string
  battle_type: 'pvp' | 'pve'
  won: boolean
  reward: number
  created_at: string
}

interface BattleListProps {
  battles: BattleHistoryEntry[]
  isLoading?: boolean
}

/**
 * Sort battles by created_at timestamp in descending order (most recent first)
 * @param battles - Array of battles to sort
 * @returns Sorted array of battles
 */
export function sortBattlesByTimestamp(battles: BattleHistoryEntry[]): BattleHistoryEntry[] {
  return [...battles].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return dateB - dateA // Descending order (most recent first)
  })
}

export function BattleList({ battles, isLoading = false }: BattleListProps) {
  // Sort battles by timestamp descending
  const sortedBattles = sortBattlesByTimestamp(battles)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-destructive" />
        <span className="ml-3 text-muted-foreground font-mono">Loading battles...</span>
      </div>
    )
  }

  // Empty state
  if (sortedBattles.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-3 sm:mb-4">
          <Swords className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-mono text-base sm:text-lg">
          No battle history yet
        </p>
        <p className="text-muted-foreground/70 font-mono text-xs sm:text-sm mt-2 px-4">
          Your battles will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3 max-h-[500px] lg:max-h-[600px] overflow-y-auto">
      {sortedBattles.map((battle) => (
        <BattleItem key={battle.id} battle={battle} />
      ))}
    </div>
  )
}

function BattleItem({ battle }: { battle: BattleHistoryEntry }) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors gap-3 sm:gap-4">
      {/* Left side: Icon and Battle Info */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background flex items-center justify-center ${
          battle.won ? 'text-green-500' : 'text-red-500'
        }`}>
          {battle.won ? <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> : <Skull className="w-4 h-4 sm:w-5 sm:h-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono font-semibold text-xs sm:text-sm break-words">
              vs {battle.opponent_name}
            </p>
            <Badge 
              variant={battle.won ? 'default' : 'destructive'}
              className="text-xs"
            >
              {battle.won ? 'VICTORY' : 'DEFEAT'}
            </Badge>
            <Badge 
              variant="secondary"
              className="text-xs uppercase"
            >
              {battle.battle_type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {formatTimestamp(battle.created_at)}
          </p>
        </div>
      </div>

      {/* Right side: Reward */}
      <div className="text-left sm:text-right flex-shrink-0 sm:ml-4 pl-11 sm:pl-0">
        {battle.reward > 0 ? (
          <>
            <p className="font-mono font-bold text-base sm:text-lg text-green-500 break-all">
              +{battle.reward.toLocaleString()} RISE
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              Reward
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground font-mono">
            No reward
          </p>
        )}
      </div>
    </div>
  )
}
