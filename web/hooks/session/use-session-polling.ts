/**
 * useSessionPolling Hook
 * Handles periodic session data refresh (Phase 4)
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { DEFAULT_POLL_INTERVAL_MS } from './constants'

interface UseSessionPollingOptions {
  /** Callback to execute on each poll */
  onPoll: () => void
  /** Interval between polls in ms (default 1000) */
  pollInterval?: number
  /** Whether to start polling immediately (default true) */
  enabled?: boolean
}

interface UseSessionPollingReturn {
  /** Pause polling */
  pausePolling: () => void
  /** Resume polling */
  resumePolling: () => void
  /** Whether polling is currently active */
  isPolling: boolean
}

/**
 * Hook for managing session polling with pause/resume support
 *
 * Automatically cleans up intervals on unmount and handles
 * enabled state changes.
 */
export function useSessionPolling({
  onPoll,
  pollInterval = DEFAULT_POLL_INTERVAL_MS,
  enabled = true,
}: UseSessionPollingOptions): UseSessionPollingReturn {
  const [isPolling, setIsPolling] = useState(enabled)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  // Store onPoll in ref to avoid dependency issues
  const onPollRef = useRef(onPoll)
  onPollRef.current = onPoll

  // Clear existing interval
  const clearPollInterval = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Initial fetch only (runs once on mount)
  useEffect(() => {
    isMountedRef.current = true
    onPollRef.current()

    return () => {
      isMountedRef.current = false
      clearPollInterval()
    }
  }, [clearPollInterval])

  // Polling interval management (separate from initial fetch)
  useEffect(() => {
    clearPollInterval()

    if (isPolling) {
      pollRef.current = setInterval(() => {
        if (isMountedRef.current) {
          onPollRef.current()
        }
      }, pollInterval)
    }

    return clearPollInterval
  }, [isPolling, pollInterval, clearPollInterval])

  const pausePolling = useCallback(() => {
    setIsPolling(false)
  }, [])

  const resumePolling = useCallback(() => {
    setIsPolling(true)
  }, [])

  return {
    pausePolling,
    resumePolling,
    isPolling,
  }
}
