/**
 * Error Display Component
 * Provides consistent error messaging across the application
 * with retry functionality for retryable errors
 */

import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/8bitcn/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorDisplayProps {
  error: string | null
  onRetry?: () => void
  onDismiss?: () => void
  retryable?: boolean
  className?: string
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  retryable = false,
  className = ''
}: ErrorDisplayProps) {
  if (!error) return null

  return (
    <Alert variant="destructive" className={`animate-in slide-in-from-top duration-300 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-2">
        <span className="flex-1">{error}</span>
        <div className="flex gap-2">
          {retryable && onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-7 px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Connection Status Display Component
 * Shows connection status with appropriate styling
 */

import { Wifi, WifiOff, Loader2 } from 'lucide-react'

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'reconnecting'
  className?: string
}

export function ConnectionStatus({ status, className = '' }: ConnectionStatusProps) {
  if (status === 'connected') {
    return (
      <div className={`flex items-center gap-2 text-xs text-green-500 ${className}`}>
        <Wifi className="w-4 h-4" />
        <span>Connected</span>
      </div>
    )
  }

  if (status === 'reconnecting') {
    return (
      <div className={`flex items-center gap-2 text-xs text-yellow-500 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Reconnecting...</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-xs text-destructive ${className}`}>
      <WifiOff className="w-4 h-4" />
      <span>Disconnected</span>
    </div>
  )
}
