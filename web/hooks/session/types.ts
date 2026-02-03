/**
 * Session Hook Types
 * Extracted from use-session.tsx (Phase 4)
 */

import type { Session, Phase } from '@/lib/store'

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

/**
 * Core session state managed by hooks
 */
export interface SessionState {
  session: SessionStatusData | null
  loading: boolean
  error: string | null
  connectionStatus: ConnectionStatus
  lastSyncAt: Date | null
  isStale: boolean
  recoveredFromCache: boolean
}

/**
 * Session context value exposed to consumers
 */
export interface SessionContextValue extends SessionState {
  autoAdvanceEnabled: boolean
  refresh: () => void
  setOptimistic: <K extends keyof SessionStatusData>(
    key: K,
    updater: (prev: SessionStatusData[K]) => SessionStatusData[K]
  ) => void
  pausePolling: () => void
  resumePolling: () => void
}

/**
 * Cache entry with timestamp for expiry checking
 */
export interface CachedSessionData extends SessionStatusData {
  savedAt?: number
}
