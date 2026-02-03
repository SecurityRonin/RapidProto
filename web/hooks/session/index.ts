/**
 * Session Hooks Module
 * Re-exports all session-related hooks (Phase 4)
 */

// Types
export type {
  TimeRemaining,
  SessionStatusData,
  ConnectionStatus,
  SessionState,
  SessionContextValue,
  CachedSessionData,
} from './types'

// Constants
export {
  RECOVERY_KEY_PREFIX,
  CACHE_TTL_MS,
  DEFAULT_POLL_INTERVAL_MS,
  getRecoveryKey,
} from './constants'

// Hooks
export { useSessionRecovery } from './use-session-recovery'
export { useSessionPolling } from './use-session-polling'
export { useSessionSync } from './use-session-sync'
export { useAutoAdvance } from './use-auto-advance'
