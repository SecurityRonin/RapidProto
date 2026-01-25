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
import { getSessionStatus } from '@/lib/actions'
import type { SessionStatusData, ClientInfoParsed, TimeRemaining } from '@/types/actions'

interface SessionContextValue {
  // Data
  session: SessionStatusData | null
  loading: boolean
  error: string | null

  // Actions
  refresh: () => Promise<void>
  setOptimistic: <K extends keyof SessionStatusData>(
    key: K,
    updater: (prev: SessionStatusData[K]) => SessionStatusData[K]
  ) => void

  // Polling control
  pausePolling: () => void
  resumePolling: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

interface SessionProviderProps {
  sessionId: string
  children: ReactNode
  pollInterval?: number // Default 5000ms
}

export function SessionProvider({
  sessionId,
  children,
  pollInterval = 5000,
}: SessionProviderProps) {
  const [session, setSession] = useState<SessionStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollingEnabled, setPollingEnabled] = useState(true)

  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const result = await getSessionStatus(sessionId)

      if (!isMountedRef.current) return

      if (result.success) {
        setSession(result.data)
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err) {
      if (!isMountedRef.current) return
      setError(err instanceof Error ? err.message : 'Failed to fetch session')
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [sessionId])

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

export function useClientInfo(): ClientInfoParsed | null {
  const { session } = useSession()
  return session?.clientInfo ?? null
}

export function useCurrentPhase() {
  const { session } = useSession()
  return session?.currentPhase ?? null
}
