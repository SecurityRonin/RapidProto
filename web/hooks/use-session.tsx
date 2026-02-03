'use client'

/**
 * Session Provider and Hooks
 * Composes focused hooks for session management (Phase 4 refactor)
 *
 * Original: 318 lines with mixed concerns
 * Refactored: ~100 lines composing extracted hooks
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { getSessionStatus } from '@/lib/client-actions'
import type { Phase } from '@/lib/store'

import {
  type SessionStatusData,
  type SessionContextValue,
  type ConnectionStatus,
  DEFAULT_POLL_INTERVAL_MS,
} from './session'

import { useSessionRecovery } from './session/use-session-recovery'
import { useSessionPolling } from './session/use-session-polling'
import { useSessionSync } from './session/use-session-sync'
import { useAutoAdvance } from './session/use-auto-advance'

// Re-export types for backward compatibility
export type { TimeRemaining, SessionStatusData, ConnectionStatus } from './session'

const SessionContext = createContext<SessionContextValue | null>(null)

interface SessionProviderProps {
  sessionId: string
  children: ReactNode
  pollInterval?: number
  autoAdvance?: boolean
  onPhaseComplete?: (phase: Phase) => void
}

export function SessionProvider({
  sessionId,
  children,
  pollInterval = DEFAULT_POLL_INTERVAL_MS,
  autoAdvance = false,
  onPhaseComplete,
}: SessionProviderProps) {
  // Core state
  const [session, setSession] = useState<SessionStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected')
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [recoveredFromCache, setRecoveredFromCache] = useState(false)

  // Ref to access session without causing re-renders (breaks dependency cycle)
  const sessionRef = useRef<SessionStatusData | null>(null)
  sessionRef.current = session

  // Recovery hooks
  const { tryRecoverFromCache, saveToCache, clearCache } = useSessionRecovery({ sessionId })

  // Refresh function
  const refresh = useCallback(() => {
    try {
      const result = getSessionStatus(sessionId)

      if (result.success) {
        setSession(result.data)
        setError(null)
        setConnectionStatus('connected')
        setLastSyncAt(new Date())
        setIsStale(false)
        setRecoveredFromCache(false)
        clearCache()
      } else {
        // Try cache recovery if no existing data
        if (!sessionRef.current) {
          const recovered = tryRecoverFromCache()
          if (recovered) {
            setSession(recovered)
            setRecoveredFromCache(true)
            setIsStale(true)
          }
        } else {
          setIsStale(true)
        }
        setConnectionStatus('disconnected')
        setError(result.error)
      }
    } catch (err) {
      setConnectionStatus('disconnected')
      setIsStale(true)
      setError(err instanceof Error ? err.message : 'Failed to fetch session')
    } finally {
      setLoading(false)
    }
  }, [sessionId, tryRecoverFromCache, clearCache])

  // Polling
  const { pausePolling, resumePolling } = useSessionPolling({
    onPoll: refresh,
    pollInterval,
    enabled: true,
  })

  // Visibility and unload sync
  useSessionSync({
    session,
    onVisibilityChange: refresh,
    onBeforeUnload: saveToCache,
  })

  // Auto-advance
  useAutoAdvance({
    enabled: autoAdvance,
    session,
    onPhaseComplete,
  })

  // Optimistic updates
  const setOptimistic = useCallback(
    <K extends keyof SessionStatusData>(
      key: K,
      updater: (prev: SessionStatusData[K]) => SessionStatusData[K]
    ) => {
      setSession((prev) => {
        if (!prev) return prev
        return { ...prev, [key]: updater(prev[key]) }
      })
    },
    []
  )

  return (
    <SessionContext.Provider
      value={{
        session,
        loading,
        error,
        connectionStatus,
        lastSyncAt,
        isStale,
        recoveredFromCache,
        autoAdvanceEnabled: autoAdvance,
        refresh,
        setOptimistic,
        pausePolling,
        resumePolling,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return ctx
}

// Convenience hooks for specific data slices
export function useSessionTimer() {
  const { session } = useSession()
  return session?.timeRemaining ?? null
}

export function useSessionSteps() {
  const { session } = useSession()
  return session?.session.steps ?? []
}

export function useCurrentPhase() {
  const { session } = useSession()
  return session?.currentPhase ?? null
}
