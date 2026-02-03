/**
 * useAutoAdvance Hook
 * Handles phase transition detection and callback (Phase 4)
 */

import { useEffect, useRef } from 'react'
import type { Phase } from '@/lib/store'
import type { SessionStatusData } from './types'

interface UseAutoAdvanceOptions {
  /** Whether auto-advance is enabled */
  enabled: boolean
  /** Current session data */
  session: SessionStatusData | null
  /** Callback when phase completes (timer hits zero) */
  onPhaseComplete?: (phase: Phase) => void
}

/**
 * Hook for detecting phase completion and triggering auto-advance
 *
 * Tracks phase transitions and triggers callback exactly once when
 * a phase timer hits overtime (remainingMinutes = 0).
 */
export function useAutoAdvance({
  enabled,
  session,
  onPhaseComplete,
}: UseAutoAdvanceOptions): void {
  const previousPhaseRef = useRef<Phase | null>(null)
  const phaseCompleteTriggeredRef = useRef(false)

  useEffect(() => {
    if (!enabled || !session || !onPhaseComplete) return

    const { timeRemaining, currentPhase } = session

    // Detect phase transition - reset trigger flag
    if (previousPhaseRef.current !== currentPhase) {
      previousPhaseRef.current = currentPhase
      phaseCompleteTriggeredRef.current = false
    }

    // Trigger onPhaseComplete when time hits zero (exactly once per phase)
    if (timeRemaining.isOvertime && !phaseCompleteTriggeredRef.current) {
      phaseCompleteTriggeredRef.current = true
      onPhaseComplete(currentPhase)
    }
  }, [enabled, session, onPhaseComplete])
}
