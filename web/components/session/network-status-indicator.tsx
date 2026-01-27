/**
 * Network Status Indicator Component
 * Shows connection status and stale data warnings
 */

'use client'

import { cn } from '@/lib/utils'
import type { ConnectionStatus } from '@/hooks/use-session'

interface NetworkStatusIndicatorProps {
  status: ConnectionStatus
  isStale: boolean
  lastSyncAt: Date | null
  className?: string
}

export function NetworkStatusIndicator({
  status,
  isStale,
  lastSyncAt,
  className,
}: NetworkStatusIndicatorProps) {
  // Don't show anything when connected and fresh
  if (status === 'connected' && !isStale) {
    return null
  }

  const getStatusColor = () => {
    if (status === 'disconnected') return 'bg-red-500'
    if (status === 'reconnecting') return 'bg-yellow-500'
    if (isStale) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (status === 'disconnected') return 'Offline'
    if (status === 'reconnecting') return 'Reconnecting...'
    if (isStale) return 'Data may be stale'
    return 'Connected'
  }

  const formatLastSync = () => {
    if (!lastSyncAt) return ''
    const seconds = Math.floor((Date.now() - lastSyncAt.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    return `${Math.floor(minutes / 60)}h ago`
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
        status === 'disconnected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn('w-2 h-2 rounded-full animate-pulse', getStatusColor())}
        aria-hidden="true"
      />
      <span>{getStatusText()}</span>
      {lastSyncAt && isStale && (
        <span className="text-gray-500">
          Last sync: {formatLastSync()}
        </span>
      )}
    </div>
  )
}
