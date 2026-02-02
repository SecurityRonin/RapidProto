'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { getSessionStatus } from '@/lib/client-actions'
import type { Session, Phase } from '@/lib/store'

// Simplified types for localStorage-based sessions
export interface TimeRemaining {
  phase: Phase
  totalMinutes: number
  elapsedMinutes: number
  remainingMinutes: number
  isOvertime: boolean
  overtimeMinutes: number
}

export interface SessionStatusData {
  session: Session
  currentPhase: Phase
  timeRemaining: TimeRemaining
  stepsCompleted: number
  stepsTotal: number
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

interface SessionContextValue {
  // Data
  session: SessionStatusData | null
  loading: boolean
  error: string | null

  // Network resilience
  connectionStatus: ConnectionStatus
  lastSyncAt: Date | null
  isStale: boolean

  // Recovery
  recoveredFromCache: boolean

  // Auto-advance
  autoAdvanceEnabled: boolean

  // Actions
  refresh: () => void
  setOptimistic: <K extends keyof SessionStatusData>(
    key: K,
    updater: (prev: SessionStatusData[K]) => SessionStatusData[K]
  ) => void

  // Polling control
  pausePolling: () => void
  resumePolling: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

const RECOVERY_KEY_PREFIX = 'rapidproto_session_recovery_'

interface SessionProviderProps {
  sessionId: string
  children: ReactNode
  pollInterval?: number // Default 1000ms for timer updates
  autoAdvance?: boolean // Auto-advance when phase timer hits zero
  onPhaseComplete?: (phase: Phase) => void // Callback when phase completes (for auto-advance)
}

export function SessionProvider({
  sessionId,
  children,
  pollInterval = 1000,
  autoAdvance = false,
  onPhaseComplete,
}: SessionProviderProps) {
  const [session, setSession] = useState<SessionStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollingEnabled, setPollingEnabled] = useState(true)

  // Network resilience state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected')
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [isStale, setIsStale] = useState(false)

  // Recovery state
  const [recoveredFromCache, setRecoveredFromCache] = useState(false)

  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const previousPhaseRef = useRef<Phase | null>(null)
  const phaseCompleteTriggeredRef = useRef(false)
  // Use ref to access session in refresh without causing re-renders
  const sessionRef = useRef<SessionStatusData | null>(null)

  const recoveryKey = `${RECOVERY_KEY_PREFIX}${sessionId}`

  // Keep sessionRef in sync with session state (for use in refresh without dependency)
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  // Try to recover session from cache
  const tryRecoverFromCache = useCallback((): SessionStatusData | null => {
    try {
      const cached = localStorage.getItem(recoveryKey)
      if (cached) {
        const data = JSON.parse(cached) as SessionStatusData & { savedAt?: number }
        // Only use cache if it's less than 5 minutes old
        if (data.savedAt && Date.now() - data.savedAt < 5 * 60 * 1000) {
          return data
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null
  }, [recoveryKey])

  // Save session to cache for recovery
  const saveToCache = useCallback((data: SessionStatusData) => {
    try {
      localStorage.setItem(recoveryKey, JSON.stringify({ ...data, savedAt: Date.now() }))
    } catch {
      // Ignore storage errors
    }
  }, [recoveryKey])

  // Clear recovery cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(recoveryKey)
    } catch {
      // Ignore storage errors
    }
  }, [recoveryKey])

  const refresh = useCallback(() => {
    try {
      const result = getSessionStatus(sessionId)

      if (!isMountedRef.current) return

      if (result.success) {
        setSession(result.data)
        setError(null)
        setConnectionStatus('connected')
        setLastSyncAt(new Date())
        setIsStale(false)
        setRecoveredFromCache(false)
        clearCache() // Clear recovery data on successful load
      } else {
        // Try to recover from cache if normal load fails
        // Use ref to avoid dependency cycle (session in deps -> refresh updates session -> infinite loop)
        if (!sessionRef.current) {
          const recovered = tryRecoverFromCache()
          if (recovered) {
            setSession(recovered)
            setRecoveredFromCache(true)
            setIsStale(true)
          }
        } else {
          // We have existing data, mark as stale
          setIsStale(true)
        }
        setConnectionStatus('disconnected')
        setError(result.error)
      }
    } catch (err) {
      if (!isMountedRef.current) return
      setConnectionStatus('disconnected')
      setIsStale(true)
      setError(err instanceof Error ? err.message : 'Failed to fetch session')
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [sessionId, tryRecoverFromCache, clearCache])

  // Initial fetch and polling setup
  useEffect(() => {
    isMountedRef.current = true
    refresh()

    const startPolling = () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (pollingEnabled) {
        pollRef.current = setInterval(refresh, pollInterval)
      }
    }

    startPolling()

    return () => {
      isMountedRef.current = false
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [refresh, pollInterval, pollingEnabled])

  // Visibility API - refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refresh])

  // Session recovery - save state before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session) {
        saveToCache(session)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [session, saveToCache])

  // Auto-advance when phase completes
  useEffect(() => {
    if (!autoAdvance || !session || !onPhaseComplete) return

    const { timeRemaining, currentPhase } = session

    // Detect phase transition
    if (previousPhaseRef.current !== currentPhase) {
      previousPhaseRef.current = currentPhase
      phaseCompleteTriggeredRef.current = false
    }

    // Trigger onPhaseComplete when time hits zero (and we haven't triggered yet)
    if (timeRemaining.isOvertime && !phaseCompleteTriggeredRef.current) {
      phaseCompleteTriggeredRef.current = true
      onPhaseComplete(currentPhase)
    }
  }, [autoAdvance, session, onPhaseComplete])

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

  const pausePolling = useCallback(() => {
    setPollingEnabled(false)
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  const resumePolling = useCallback(() => {
    setPollingEnabled(true)
  }, [])

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
export function useSessionTimer(): TimeRemaining | null {
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
