/**
 * Client-side actions using localStorage
 * Refactored with session-operations helpers (Phase 5)
 */

'use client'

import {
  createNewSession,
  getSession,
  saveSession,
  calculateTimeRemaining,
  getSessions,
  type Session,
  type Phase,
} from './store'
import { SessionError } from './utils/errors'
import {
  getSessionOrThrow,
  withSessionMutate,
  getNextPhase,
  getPreviousPhase,
  getNextStage,
  getPreviousStage,
  validateCanPause,
  validateCanResume,
  validateCanAdvancePhase,
  validateCanRegressPhase,
  validateCanAdvanceStage,
  validateCanRegressStage,
  updateSyncedInputs,
  SYNC_MAP,
  type OperationResult,
} from './session-operations'

export type ActionResult<T> = OperationResult<T>

// =============================================================================
// Session Creation
// =============================================================================

export function createSession(title?: string): ActionResult<Session> {
  try {
    const session = createNewSession(title)
    return { success: true, data: session }
  } catch {
    return { success: false, error: 'Failed to create session' }
  }
}

// =============================================================================
// Session Status
// =============================================================================

export function getSessionStatus(sessionId: string): ActionResult<{
  session: Session
  currentPhase: Phase
  timeRemaining: ReturnType<typeof calculateTimeRemaining>
  stepsCompleted: number
  stepsTotal: number
}> {
  try {
    const session = getSessionOrThrow(sessionId)
    const timeRemaining = calculateTimeRemaining(session)

    // Check user's role from localStorage to filter correct steps
    const role = localStorage.getItem(`rapidproto_role_${sessionId}`) || 'builder'

    // Filter steps based on role
    const phaseSteps = role === 'facilitator'
      ? session.steps.filter(s => s.role === 'facilitator' && s.phase === session.facilitatorStage)
      : session.steps.filter(s => s.role === 'builder' && s.phase === session.currentPhase)

    return {
      success: true,
      data: {
        session,
        currentPhase: session.currentPhase,
        timeRemaining,
        stepsCompleted: phaseSteps.filter(s => s.status === 'completed').length,
        stepsTotal: phaseSteps.length,
      },
    }
  } catch (error) {
    if (error instanceof SessionError) {
      return { success: false, error: error.message, code: error.code }
    }
    return { success: false, error: 'Failed to get session status' }
  }
}

// =============================================================================
// Session State Management
// =============================================================================

export function pauseSession(sessionId: string): ActionResult<Session> {
  return withSessionMutate(sessionId, 'pauseSession', (session) => {
    validateCanPause(session)
    session.status = 'paused'
    session.pausedAt = new Date()
    return session
  })
}

export function resumeSession(sessionId: string): ActionResult<Session> {
  return withSessionMutate(sessionId, 'resumeSession', (session) => {
    validateCanResume(session)

    // Calculate paused duration and adjust phase start time
    if (session.pausedAt) {
      const pausedDuration = Date.now() - session.pausedAt.getTime()
      session.totalPausedTime += pausedDuration
      session.phaseStartedAt = new Date(session.phaseStartedAt.getTime() + pausedDuration)
    }

    session.status = 'active'
    session.pausedAt = null
    return session
  })
}

export function completeSession(sessionId: string): ActionResult<Session> {
  return withSessionMutate(sessionId, 'completeSession', (session) => {
    session.status = 'completed'
    session.completedAt = new Date()
    return session
  })
}

// =============================================================================
// Phase Navigation (Builder)
// =============================================================================

export function advancePhase(sessionId: string): ActionResult<Session> {
  return withSessionMutate(sessionId, 'advancePhase', (session) => {
    validateCanAdvancePhase(session)
    session.currentPhase = getNextPhase(session.currentPhase)!
    session.phaseStartedAt = new Date()
    return session
  })
}

export function regressPhase(sessionId: string): ActionResult<Session> {
  return withSessionMutate(sessionId, 'regressPhase', (session) => {
    validateCanRegressPhase(session)
    session.currentPhase = getPreviousPhase(session.currentPhase)!
    session.phaseStartedAt = new Date()
    return session
  })
}

// =============================================================================
// Stage Navigation (Facilitator)
// =============================================================================

export function advanceFacilitatorStage(sessionId: string): ActionResult<Session> {
  return withSessionMutate(sessionId, 'advanceFacilitatorStage', (session) => {
    validateCanAdvanceStage(session)
    session.facilitatorStage = getNextStage(session.facilitatorStage)!
    return session
  })
}

export function regressFacilitatorStage(sessionId: string): ActionResult<Session> {
  return withSessionMutate(sessionId, 'regressFacilitatorStage', (session) => {
    validateCanRegressStage(session)
    session.facilitatorStage = getPreviousStage(session.facilitatorStage)!
    return session
  })
}

// =============================================================================
// Step Updates
// =============================================================================

export function updateStep(
  stepId: string,
  updates: { status?: string; notes?: string; acquiredValue?: string }
): ActionResult<Session['steps'][0]> {
  try {
    // Get all sessions to find the one containing this step
    const allSessions = getSessions()

    for (const session of allSessions) {
      const stepIndex = session.steps.findIndex(s => s.id === stepId)
      if (stepIndex >= 0) {
        const step = session.steps[stepIndex]

        // Apply status update
        if (updates.status) {
          step.status = updates.status as any
          if (updates.status === 'completed') {
            step.completedAt = new Date()
          } else if (updates.status === 'in_progress') {
            step.startedAt = new Date()
          }
        }

        // Apply notes update
        if (updates.notes !== undefined) {
          step.notes = updates.notes
        }

        // Apply acquired value and sync
        if (updates.acquiredValue !== undefined) {
          step.acquiredValue = updates.acquiredValue

          // Update synced inputs when builder step changes
          if (step.role === 'builder') {
            updateSyncedInputs(session)
          }
        }

        session.updatedAt = new Date()
        saveSession(session)

        return { success: true, data: step }
      }
    }

    return { success: false, error: 'Step not found', code: 'STEP_NOT_FOUND' }
  } catch {
    return { success: false, error: 'Failed to update step' }
  }
}

// Re-export SYNC_MAP for components that need it
export { SYNC_MAP }
