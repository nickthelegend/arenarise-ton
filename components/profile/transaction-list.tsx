'use client'

import { ArrowUpRight, ArrowDownLeft, Gift, Loader2 } from 'lucide-react'
import { Badge } from '@/components/8bitcn/badge'

export interface Transaction {
  id: string
  type: 'swap' | 'reward' | 'transfer'
  rise_amount: number
  ton_amount?: number
  timestamp: string
  status: string
}

interface TransactionListProps {
  transactions: Transaction[]
  isLoading?: boolean
}

/**
 * Sort transactions by timestamp in descending order (most recent first)
 * @param transactions - Array of transactions to sort
 * @returns Sorted array of transactions
 */
export function sortTransactionsByTimestamp(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime()
    const dateB = new Date(b.timestamp).getTime()
    return dateB - dateA // Descending order (most recent first)
  })
}

export function TransactionList({ transactions, isLoading = false }: TransactionListProps) {
  // Sort transactions by timestamp descending
  const sortedTransactions = sortTransactionsByTimestamp(transactions)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground font-mono">Loading transactions...</span>
      </div>
    )
  }

  // Empty state
  if (sortedTransactions.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-3 sm:mb-4">
          <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-mono text-base sm:text-lg">
          No transaction history yet
        </p>
        <p className="text-muted-foreground/70 font-mono text-xs sm:text-sm mt-2 px-4">
          Your RISE token transactions will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3 max-h-[500px] lg:max-h-[600px] overflow-y-auto">
      {sortedTransactions.map((transaction) => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  )
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'swap':
        return <ArrowUpRight className="w-5 h-5" />
      case 'reward':
        return <Gift className="w-5 h-5" />
      case 'transfer':
        return <ArrowDownLeft className="w-5 h-5" />
      default:
        return <ArrowUpRight className="w-5 h-5" />
    }
  }

  const getTransactionColor = () => {
    switch (transaction.type) {
      case 'swap':
        return 'text-blue-500'
      case 'reward':
        return 'text-green-500'
      case 'transfer':
        return 'text-purple-500'
      default:
        return 'text-gray-500'
    }
  }

  const getTransactionLabel = () => {
    switch (transaction.type) {
      case 'swap':
        return 'Token Swap'
      case 'reward':
        return 'Reward'
      case 'transfer':
        return 'Transfer'
      default:
        return transaction.type
    }
  }

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
      {/* Left side: Icon and Type */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background flex items-center justify-center ${getTransactionColor()}`}>
          {getTransactionIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono font-semibold text-xs sm:text-sm uppercase">
              {getTransactionLabel()}
            </p>
            <Badge 
              variant={transaction.status === 'completed' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {transaction.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {formatTimestamp(transaction.timestamp)}
          </p>
        </div>
      </div>

      {/* Right side: Amount */}
      <div className="text-left sm:text-right flex-shrink-0 sm:ml-4 pl-11 sm:pl-0">
        <p className="font-mono font-bold text-base sm:text-lg text-accent break-all">
          {transaction.rise_amount > 0 ? '+' : ''}{transaction.rise_amount.toLocaleString()} RISE
        </p>
        {transaction.ton_amount !== undefined && (
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {transaction.ton_amount.toLocaleString()} TON
          </p>
        )}
      </div>
    </div>
  )
}
