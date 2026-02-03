/**
 * useSessionSync Hook
 * Handles visibility API and beforeunload for session persistence (Phase 4)
 */

import { useEffect } from 'react'
import type { SessionStatusData } from './types'

interface UseSessionSyncOptions {
  /** Current session data to save on unload */
  session: SessionStatusData | null
  /** Callback to refresh session when tab becomes visible */
  onVisibilityChange: () => void
  /** Callback to save session before unload */
  onBeforeUnload: (session: SessionStatusData) => void
}

/**
 * Hook for syncing session state with browser events
 *
 * - Refreshes session when tab becomes visible (handles drift)
 * - Saves session to cache before page unload (for recovery)
 */
export function useSessionSync({
  session,
  onVisibilityChange,
  onBeforeUnload,
}: UseSessionSyncOptions): void {
  // Visibility API - refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onVisibilityChange()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [onVisibilityChange])

  // Session recovery - save state before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session) {
        onBeforeUnload(session)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [session, onBeforeUnload])
}
