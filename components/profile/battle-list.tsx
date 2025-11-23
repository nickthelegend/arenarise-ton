'use client'

import { Swords, Trophy, Skull, Loader2, Play, Eye } from 'lucide-react'
import { Badge } from '@/components/8bitcn/badge'
import { Button } from '@/components/8bitcn/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export interface BattleHistoryEntry {
  id: string
  opponent_name: string
  battle_type: 'pvp' | 'pve'
  won: boolean
  reward: number
  created_at: string
  status: 'waiting' | 'in_progress' | 'completed'
  beast1_name?: string
  beast2_name?: string
  beast1_hp?: number
  beast2_hp?: number
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

  // Separate active and completed battles (Requirement 10.3)
  const activeBattles = sortedBattles.filter(b => b.status === 'in_progress' || b.status === 'waiting')
  const completedBattles = sortedBattles.filter(b => b.status === 'completed')

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
    <div className="space-y-4 max-h-[500px] lg:max-h-[600px] overflow-y-auto">
      {/* Active Battles Section (Requirement 10.3) */}
      {activeBattles.length > 0 && (
        <div>
          <h3 className="text-sm font-mono font-semibold text-primary mb-2 uppercase">
            Active Battles
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {activeBattles.map((battle) => (
              <BattleItem key={battle.id} battle={battle} isActive={true} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Battles Section (Requirement 10.3) */}
      {completedBattles.length > 0 && (
        <div>
          <h3 className="text-sm font-mono font-semibold text-muted-foreground mb-2 uppercase">
            Completed Battles
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {completedBattles.map((battle) => (
              <BattleItem key={battle.id} battle={battle} isActive={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BattleItem({ battle, isActive }: { battle: BattleHistoryEntry; isActive: boolean }) {
  const router = useRouter()
  const [showSummary, setShowSummary] = useState(false)

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

  // Requirement 10.4: Navigate to active battle
  const handleResumeBattle = () => {
    router.push(`/battle/arena/${battle.id}`)
  }

  // Requirement 10.5: Toggle battle summary view
  const handleToggleSummary = () => {
    setShowSummary(!showSummary)
  }

  return (
    <div className="bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 gap-3 sm:gap-4">
        {/* Left side: Icon and Battle Info */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background flex items-center justify-center ${
            isActive ? 'text-yellow-500' : battle.won ? 'text-green-500' : 'text-red-500'
          }`}>
            {isActive ? <Swords className="w-4 h-4 sm:w-5 sm:h-5" /> : battle.won ? <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> : <Skull className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-mono font-semibold text-xs sm:text-sm break-words">
                vs {battle.opponent_name}
              </p>
              {/* Requirement 10.3: Distinguish active vs completed */}
              {isActive ? (
                <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">
                  {battle.status === 'waiting' ? 'WAITING' : 'IN PROGRESS'}
                </Badge>
              ) : (
                <Badge 
                  variant={battle.won ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {battle.won ? 'VICTORY' : 'DEFEAT'}
                </Badge>
              )}
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

        {/* Right side: Action buttons or Reward */}
        <div className="flex items-center gap-2 flex-shrink-0 sm:ml-4 pl-11 sm:pl-0">
          {isActive ? (
            // Requirement 10.4: Resume button for active battles
            <Button
              onClick={handleResumeBattle}
              size="sm"
              variant="default"
              className="font-mono"
            >
              <Play className="w-3 h-3 mr-1" />
              Resume
            </Button>
          ) : (
            <>
              {/* Reward display */}
              <div className="text-left sm:text-right mr-2">
                {battle.reward > 0 ? (
                  <>
                    <p className="font-mono font-bold text-sm sm:text-base text-green-500 break-all">
                      +{battle.reward.toLocaleString()} RISE
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground font-mono">
                    No reward
                  </p>
                )}
              </div>
              {/* Requirement 10.5: View summary button for completed battles */}
              <Button
                onClick={handleToggleSummary}
                size="sm"
                variant="outline"
                className="font-mono"
              >
                <Eye className="w-3 h-3 mr-1" />
                {showSummary ? 'Hide' : 'View'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Requirement 10.5: Battle summary view for completed battles */}
      {!isActive && showSummary && (
        <div className="border-t border-border p-3 sm:p-4 bg-background/50">
          <h4 className="text-xs font-mono font-semibold text-primary mb-2 uppercase">
            Battle Summary
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <p className="text-muted-foreground mb-1">Your Beast</p>
              <p className="font-semibold">{battle.beast1_name || 'Unknown'}</p>
              {battle.beast1_hp !== undefined && (
                <p className="text-muted-foreground">Final HP: {battle.beast1_hp}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Opponent Beast</p>
              <p className="font-semibold">{battle.beast2_name || 'Unknown'}</p>
              {battle.beast2_hp !== undefined && (
                <p className="text-muted-foreground">Final HP: {battle.beast2_hp}</p>
              )}
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground mb-1">Battle ID</p>
              <p className="text-xs break-all">{battle.id}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground mb-1">Result</p>
              <p className={battle.won ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                {battle.won ? 'Victory' : 'Defeat'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
