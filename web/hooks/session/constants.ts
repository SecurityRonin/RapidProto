/**
 * Session Hook Constants
 * Extracted from use-session.tsx (Phase 4)
 */

export const RECOVERY_KEY_PREFIX = 'rapidproto_session_recovery_'

/** Cache TTL in milliseconds (5 minutes) */
export const CACHE_TTL_MS = 5 * 60 * 1000

/** Default poll interval in milliseconds */
export const DEFAULT_POLL_INTERVAL_MS = 1000

/** Recovery cache key for a session */
export function getRecoveryKey(sessionId: string): string {
  return `${RECOVERY_KEY_PREFIX}${sessionId}`
}
