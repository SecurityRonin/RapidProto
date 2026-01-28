/**
 * Client-side actions using localStorage
 * No backend, no auth - just browser storage
 */

'use client'

import {
  createNewSession,
  getSession,
  saveSession,
  calculateTimeRemaining,
  type Session,
  type Phase,
  type FacilitatorStage,
} from './store'

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Create a new session
export function createSession(title?: string): ActionResult<Session> {
  try {
    const session = createNewSession(title)
    return { success: true, data: session }
  } catch (error) {
    return { success: false, error: 'Failed to create session' }
  }
}

// Get session status
export function getSessionStatus(sessionId: string): ActionResult<{
  session: Session
  currentPhase: Phase
  timeRemaining: ReturnType<typeof calculateTimeRemaining>
  stepsCompleted: number
  stepsTotal: number
}> {
  try {
    const session = getSession(sessionId)
    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    const timeRemaining = calculateTimeRemaining(session)

    // Check user's role from localStorage to filter correct steps
    const role = localStorage.getItem(`rapidproto_role_${sessionId}`) || 'builder'

    // Filter steps based on role
    // - Builder: filter by currentPhase (discovery, build, demo)
    // - Facilitator: filter by facilitatorStage (expectations, longterm, close)
    let phaseSteps: typeof session.steps
    if (role === 'facilitator') {
      phaseSteps = session.steps.filter(s =>
        s.role === 'facilitator' && s.phase === session.facilitatorStage
      )
    } else {
      phaseSteps = session.steps.filter(s =>
        s.role === 'builder' && s.phase === session.currentPhase
      )
    }

    const stepsCompleted = phaseSteps.filter(s => s.status === 'completed').length
    const stepsTotal = phaseSteps.length

    return {
      success: true,
      data: {
        session,
        currentPhase: session.currentPhase,
        timeRemaining,
        stepsCompleted,
        stepsTotal,
      },
    }
  } catch (error) {
    return { success: false, error: 'Failed to get session status' }
  }
}

// Pause session
export function pauseSession(sessionId: string): ActionResult<Session> {
  try {
    const session = getSession(sessionId)
    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    if (session.status !== 'active') {
      return { success: false, error: 'Session is not active' }
    }

    session.status = 'paused'
    session.pausedAt = new Date()
    session.updatedAt = new Date()
    saveSession(session)

    return { success: true, data: session }
  } catch (error) {
    return { success: false, error: 'Failed to pause session' }
  }
}

// Resume session
export function resumeSession(sessionId: string): ActionResult<Session> {
  try {
    const session = getSession(sessionId)
    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    if (session.status !== 'paused') {
      return { success: false, error: 'Session is not paused' }
    }

    // Calculate paused duration and add to total
    if (session.pausedAt) {
      const pausedDuration = Date.now() - session.pausedAt.getTime()
      session.totalPausedTime += pausedDuration

      // Adjust phase start time to account for pause
      session.phaseStartedAt = new Date(session.phaseStartedAt.getTime() + pausedDuration)
    }

    session.status = 'active'
    session.pausedAt = null
    session.updatedAt = new Date()
    saveSession(session)

    return { success: true, data: session }
  } catch (error) {
    return { success: false, error: 'Failed to resume session' }
  }
}

// Advance to next phase
export function advancePhase(sessionId: string): ActionResult<Session> {
  try {
    const session = getSession(sessionId)
    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    const phaseOrder: Phase[] = ['discovery', 'build', 'demo']
    const currentIndex = phaseOrder.indexOf(session.currentPhase)

    if (currentIndex >= phaseOrder.length - 1) {
      return { success: false, error: 'Already in final phase' }
    }

    session.currentPhase = phaseOrder[currentIndex + 1]
    session.phaseStartedAt = new Date()
    session.updatedAt = new Date()
    saveSession(session)

    return { success: true, data: session }
  } catch (error) {
    return { success: false, error: 'Failed to advance phase' }
  }
}

// Complete session
export function completeSession(sessionId: string): ActionResult<Session> {
  try {
    const session = getSession(sessionId)
    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    session.status = 'completed'
    session.completedAt = new Date()
    session.updatedAt = new Date()
    saveSession(session)

    return { success: true, data: session }
  } catch (error) {
    return { success: false, error: 'Failed to complete session' }
  }
}

// Advance to next facilitator stage
export function advanceFacilitatorStage(sessionId: string): ActionResult<Session> {
  try {
    const session = getSession(sessionId)
    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    const stageOrder: FacilitatorStage[] = ['expectations', 'longterm', 'close']
    const currentIndex = stageOrder.indexOf(session.facilitatorStage)

    if (currentIndex >= stageOrder.length - 1) {
      return { success: false, error: 'Already in final stage' }
    }

    session.facilitatorStage = stageOrder[currentIndex + 1]
    session.updatedAt = new Date()
    saveSession(session)

    return { success: true, data: session }
  } catch (error) {
    return { success: false, error: 'Failed to advance stage' }
  }
}

// Go back to previous facilitator stage
export function regressFacilitatorStage(sessionId: string): ActionResult<Session> {
  try {
    const session = getSession(sessionId)
    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    const stageOrder: FacilitatorStage[] = ['expectations', 'longterm', 'close']
    const currentIndex = stageOrder.indexOf(session.facilitatorStage)

    if (currentIndex <= 0) {
      return { success: false, error: 'Already in first stage' }
    }

    session.facilitatorStage = stageOrder[currentIndex - 1]
    session.updatedAt = new Date()
    saveSession(session)

    return { success: true, data: session }
  } catch (error) {
    return { success: false, error: 'Failed to go back' }
  }
}

// Update step with optional acquiredValue for sync
export function updateStep(
  stepId: string,
  updates: { status?: string; notes?: string; acquiredValue?: string }
): ActionResult<Session['steps'][0]> {
  try {
    // Find session containing this step
    const sessions = JSON.parse(localStorage.getItem('rapidproto_sessions') || '[]')

    for (const sessionData of sessions) {
      const stepIndex = sessionData.steps.findIndex((s: any) => s.id === stepId)
      if (stepIndex >= 0) {
        const step = sessionData.steps[stepIndex]

        if (updates.status) {
          step.status = updates.status
          if (updates.status === 'completed') {
            step.completedAt = new Date().toISOString()
          } else if (updates.status === 'in_progress') {
            step.startedAt = new Date().toISOString()
          }
        }

        if (updates.notes !== undefined) {
          step.notes = updates.notes
        }

        // Handle acquired value for bidirectional sync
        if (updates.acquiredValue !== undefined) {
          step.acquiredValue = updates.acquiredValue

          // Update synced inputs when builder step acquiredValue changes
          if (step.role === 'builder') {
            updateSessionSyncedInputs(sessionData)
          }
        }

        sessionData.updatedAt = new Date().toISOString()
        localStorage.setItem('rapidproto_sessions', JSON.stringify(sessions))

        return { success: true, data: step }
      }
    }

    return { success: false, error: 'Step not found' }
  } catch (error) {
    return { success: false, error: 'Failed to update step' }
  }
}

// Helper to update synced inputs from builder's acquiredValues
function updateSessionSyncedInputs(sessionData: any): void {
  const builderSteps = sessionData.steps.filter((s: any) => s.role === 'builder')

  const syncMap: Record<string, string> = {
    'Define the core feature': 'coreFeature',
    'Pick a template': 'template',
    'List required changes': 'requiredChanges',
  }

  const syncedInputs: Record<string, string> = {}
  for (const step of builderSteps) {
    const key = syncMap[step.title]
    if (key && step.acquiredValue) {
      syncedInputs[key] = step.acquiredValue
    }
  }

  sessionData.syncedInputs = syncedInputs
}
