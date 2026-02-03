/**
 * useSessionRecovery Hook
 * Handles cache read/write/clear for session recovery (Phase 4)
 */

import { useCallback, useMemo } from 'react'
import { getRecoveryKey, CACHE_TTL_MS } from './constants'
import type { SessionStatusData, CachedSessionData } from './types'

interface UseSessionRecoveryOptions {
  sessionId: string
}

interface UseSessionRecoveryReturn {
  /** Try to recover session from localStorage cache */
  tryRecoverFromCache: () => SessionStatusData | null
  /** Save session to cache for recovery */
  saveToCache: (data: SessionStatusData) => void
  /** Clear the recovery cache */
  clearCache: () => void
  /** The cache key for this session */
  recoveryKey: string
}

/**
 * Hook for managing session recovery cache
 *
 * Provides stable callbacks for reading/writing session data to localStorage
 * with automatic expiry handling (5 minute TTL).
 */
export function useSessionRecovery({ sessionId }: UseSessionRecoveryOptions): UseSessionRecoveryReturn {
  const recoveryKey = useMemo(() => getRecoveryKey(sessionId), [sessionId])

  const tryRecoverFromCache = useCallback((): SessionStatusData | null => {
    try {
      const cached = localStorage.getItem(recoveryKey)
      if (!cached) return null

      const data = JSON.parse(cached) as CachedSessionData
      // Only use cache if it's less than TTL old
      if (data.savedAt && Date.now() - data.savedAt < CACHE_TTL_MS) {
        return data
      }
      // Cache expired, remove it
      localStorage.removeItem(recoveryKey)
    } catch {
      // Ignore parse errors
    }
    return null
  }, [recoveryKey])

  const saveToCache = useCallback((data: SessionStatusData): void => {
    try {
      const cacheEntry: CachedSessionData = { ...data, savedAt: Date.now() }
      localStorage.setItem(recoveryKey, JSON.stringify(cacheEntry))
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [recoveryKey])

  const clearCache = useCallback((): void => {
    try {
      localStorage.removeItem(recoveryKey)
    } catch {
      // Ignore storage errors
    }
  }, [recoveryKey])

  return {
    tryRecoverFromCache,
    saveToCache,
    clearCache,
    recoveryKey,
  }
}
