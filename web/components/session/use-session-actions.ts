/**
 * Session Actions Hook
 *
 * Encapsulates session action execution with proper error handling,
 * loading states, and automatic refresh after mutations.
 */

'use client'

import { useState, useCallback } from 'react'
import {
  pauseSession,
  resumeSession,
  advancePhase,
  regressPhase,
  completeSession,
  advanceFacilitatorStage,
  regressFacilitatorStage,
} from '@/lib/client-actions'
import { useSession } from '@/hooks/use-session'
import type { ActionResult, Role, BuilderPhase, FacilitatorStage } from './types'
import { debug } from './debug'

interface UseSessionActionsOptions {
  sessionId: string
  role: Role
}

interface UseSessionActionsResult {
  /** Whether an action is currently executing */
  isPending: boolean
  /** Error message from the last failed action */
  error: string | null
  /** Clear the current error */
  clearError: () => void
  /** Pause the session */
  pause: () => void
  /** Resume the session */
  resume: () => void
  /** Advance to the next phase (builder) */
  advancePhase: () => void
  /** Advance to the next stage (facilitator) */
  advanceStage: () => void
  /** Go back to previous stage (facilitator) */
  regressStage: () => void
  /** Go back to previous phase (builder) */
  regressPhase: () => void
  /** Complete the session */
  complete: () => void
}

/**
 * Hook for managing session actions with consistent error handling.
 *
 * @example
 * ```tsx
 * const {
 *   isPending,
 *   error,
 *   pause,
 *   resume,
 *   advancePhase,
 *   complete
 * } = useSessionActions({ sessionId, role })
 *
 * <Button onClick={pause} disabled={isPending}>
 *   {isPending ? <Spinner /> : <PauseIcon />}
 *   Pause
 * </Button>
 *
 * {error && <ErrorMessage>{error}</ErrorMessage>}
 * ```
 */
export function useSessionActions({
  sessionId,
  role,
}: UseSessionActionsOptions): UseSessionActionsResult {
  const { refresh } = useSession()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeAction = useCallback(
    (actionName: string, action: () => ActionResult) => {
      setIsPending(true)
      setError(null)
      debug.actionStart(actionName, sessionId)

      try {
        const result = action()
        debug.actionResult(actionName, result)

        if (!result.success) {
          setError(result.error || `${actionName} failed`)
        }

        // Refresh session data after any action
        refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        debug.error('Action', `${actionName} threw an exception`, err)
        setError(message)
      } finally {
        setIsPending(false)
      }
    },
    [sessionId, refresh]
  )

  const pause = useCallback(() => {
    executeAction('pauseSession', () => pauseSession(sessionId))
  }, [executeAction, sessionId])

  const resume = useCallback(() => {
    executeAction('resumeSession', () => resumeSession(sessionId))
  }, [executeAction, sessionId])

  const advance = useCallback(() => {
    executeAction('advancePhase', () => advancePhase(sessionId))
  }, [executeAction, sessionId])

  const advanceStage = useCallback(() => {
    executeAction('advanceFacilitatorStage', () => advanceFacilitatorStage(sessionId))
  }, [executeAction, sessionId])

  const regressStage = useCallback(() => {
    executeAction('regressFacilitatorStage', () => regressFacilitatorStage(sessionId))
  }, [executeAction, sessionId])

  const goBackPhase = useCallback(() => {
    executeAction('regressPhase', () => regressPhase(sessionId))
  }, [executeAction, sessionId])

  const complete = useCallback(() => {
    executeAction('completeSession', () => completeSession(sessionId))
  }, [executeAction, sessionId])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isPending,
    error,
    clearError,
    pause,
    resume,
    advancePhase: advance,
    advanceStage,
    regressStage,
    regressPhase: goBackPhase,
    complete,
  }
}

// =============================================================================
// ACTION VISIBILITY HELPERS
// =============================================================================

interface ActionVisibilityParams {
  role: Role
  status: 'active' | 'paused' | 'completed'
  phase: BuilderPhase
  facilitatorStage?: FacilitatorStage
}

/**
 * Determine which actions should be visible for the current state.
 *
 * This is a pure function that can be easily tested.
 */
export function getVisibleActions(params: ActionVisibilityParams): {
  showPause: boolean
  showResume: boolean
  showBack: boolean
  showAdvance: boolean
  showComplete: boolean
  backLabel: string | null
  advanceLabel: string | null
} {
  const { role, status, phase, facilitatorStage } = params
  const isBuilder = role === 'builder'
  const isActive = status === 'active'
  const isPaused = status === 'paused'
  const isCompleted = status === 'completed'

  if (isCompleted) {
    return {
      showPause: false,
      showResume: false,
      showBack: false,
      showAdvance: false,
      showComplete: false,
      backLabel: null,
      advanceLabel: null,
    }
  }

  if (isBuilder) {
    return {
      showPause: isActive,
      showResume: isPaused,
      showBack: isActive && phase !== 'discovery', // Can go back unless at first phase
      showAdvance: isActive && phase !== 'demo',
      showComplete: isActive && phase === 'demo',
      backLabel:
        phase === 'build'
          ? 'Back to Discovery'
          : phase === 'demo'
          ? 'Back to Build'
          : null,
      advanceLabel: phase === 'discovery' ? 'Start Build' : phase === 'build' ? 'Start Verify' : null,
    }
  }

  // Facilitator - can navigate back and forth between stages
  const currentStage = facilitatorStage || 'expectations'
  return {
    showPause: isActive,
    showResume: isPaused,
    showBack: isActive && currentStage !== 'expectations', // Can go back unless at first stage
    showAdvance: isActive && currentStage !== 'close',
    showComplete: isActive && currentStage === 'close',
    backLabel:
      currentStage === 'longterm'
        ? 'Back to Expectations'
        : currentStage === 'close'
        ? 'Back to Long Term'
        : null,
    advanceLabel:
      currentStage === 'expectations'
        ? 'Start Long Term'
        : currentStage === 'longterm'
        ? 'Start Close'
        : null,
  }
}
