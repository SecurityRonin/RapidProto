/**
 * Session Actions for Dual-Mode RapidProto
 * Handles session creation, joining, and state management
 */

import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import { sessions, sessionSteps, type Session, type SessionStep, type Role } from '@/lib/db/schema'
import { builderSteps, facilitatorSteps } from '@/lib/db/step-templates'

// Action result type
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Session with computed fields
export interface SessionData {
  session: Session
  role: Role
  steps: SessionStep[]
  syncedInputs: Array<{ title: string; value: string; phase: string }>
  timeRemaining: {
    phase: string
    totalMinutes: number
    elapsedMinutes: number
    remainingMinutes: number
    isOvertime: boolean
    overtimeMinutes: number
  }
  stepsCompleted: number
  stepsTotal: number
}

/**
 * Generate a 6-character session code
 * Uses nanoid with alphanumeric characters for easy verbal sharing
 */
function generateSessionCode(): string {
  return nanoid(6)
}

/**
 * Create a new session (as builder)
 */
export async function createSession(options: {
  title?: string
}): Promise<ActionResult<Session>> {
  try {
    const sessionId = generateSessionCode()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24h TTL

    // Create session
    const sessionData = {
      id: sessionId,
      status: 'active' as const,
      currentPhase: 'discovery' as const,
      phaseStartedAt: now,
      discoveryDuration: 10,
      buildDuration: 30,
      demoDuration: 10,
      startedAt: now,
      pausedAt: null,
      completedAt: null,
      totalPausedTime: 0,
      userId: null,
      sessionTitle: options.title || null,
      builderJoined: true,
      facilitatorJoined: false,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(sessions).values(sessionData)

    // Create builder steps
    const stepValues = builderSteps.map((step, index) => ({
      id: nanoid(),
      sessionId,
      role: step.role,
      phase: step.phase,
      stepNumber: step.stepNumber,
      title: step.title,
      description: step.description,
      estimatedMinutes: step.estimatedMinutes,
      status: 'pending' as const,
      acquiredValue: null,
      startedAt: null,
      completedAt: null,
      timeSpent: null,
      notes: null,
      createdAt: now,
    }))

    await db.insert(sessionSteps).values(stepValues)

    // Return created session
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    return { success: true, data: session! }
  } catch (error) {
    console.error('Failed to create session:', error)
    return { success: false, error: 'Failed to create session' }
  }
}

/**
 * Get session data (for polling)
 */
export async function getSession(
  sessionId: string,
  role: Role
): Promise<ActionResult<SessionData>> {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    // Get steps for this role
    const allSteps = await db.query.sessionSteps.findMany({
      where: eq(sessionSteps.sessionId, sessionId),
    })

    const roleSteps = allSteps.filter(s => s.role === role)

    // Get synced inputs from OTHER role (for display)
    const otherRole = role === 'builder' ? 'facilitator' : 'builder'
    const syncedInputs = allSteps
      .filter(s => s.role === otherRole && s.acquiredValue)
      .map(s => ({
        title: s.title,
        value: s.acquiredValue!,
        phase: s.phase,
      }))

    // Calculate time remaining
    const timeRemaining = calculateTimeRemaining(session)

    // Calculate step progress
    const stepsCompleted = roleSteps.filter(s => s.status === 'completed').length
    const stepsTotal = roleSteps.length

    return {
      success: true,
      data: {
        session,
        role,
        steps: roleSteps,
        syncedInputs,
        timeRemaining,
        stepsCompleted,
        stepsTotal,
      },
    }
  } catch (error) {
    console.error('Failed to get session:', error)
    return { success: false, error: 'Failed to get session' }
  }
}

/**
 * Join session as facilitator
 */
export async function joinSession(sessionId: string): Promise<ActionResult<Session>> {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    if (session.facilitatorJoined) {
      return { success: false, error: 'Facilitator already joined' }
    }

    // Update session
    await db.update(sessions)
      .set({
        facilitatorJoined: true,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))

    // Create facilitator steps
    const now = new Date()
    const stepValues = facilitatorSteps.map((step) => ({
      id: nanoid(),
      sessionId,
      role: step.role,
      phase: step.phase,
      stepNumber: step.stepNumber,
      title: step.title,
      description: step.description,
      estimatedMinutes: step.estimatedMinutes,
      status: 'pending' as const,
      acquiredValue: null,
      startedAt: null,
      completedAt: null,
      timeSpent: null,
      notes: null,
      createdAt: now,
    }))

    await db.insert(sessionSteps).values(stepValues)

    // Return updated session
    const updatedSession = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    return { success: true, data: updatedSession! }
  } catch (error) {
    console.error('Failed to join session:', error)
    return { success: false, error: 'Failed to join session' }
  }
}

/**
 * Update step status/acquired value
 */
export async function updateStep(
  stepId: string,
  updates: {
    status?: 'pending' | 'in_progress' | 'completed' | 'skipped'
    acquiredValue?: string
    notes?: string
  }
): Promise<ActionResult<SessionStep>> {
  try {
    const updateData: Record<string, any> = {}

    if (updates.status) {
      updateData.status = updates.status
      if (updates.status === 'completed') {
        updateData.completedAt = new Date()
      } else if (updates.status === 'in_progress') {
        updateData.startedAt = new Date()
      }
    }

    if (updates.acquiredValue !== undefined) {
      updateData.acquiredValue = updates.acquiredValue
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes
    }

    await db.update(sessionSteps)
      .set(updateData)
      .where(eq(sessionSteps.id, stepId))

    const step = await db.query.sessionSteps.findFirst({
      where: eq(sessionSteps.id, stepId),
    })

    if (!step) {
      return { success: false, error: 'Step not found' }
    }

    return { success: true, data: step }
  } catch (error) {
    console.error('Failed to update step:', error)
    return { success: false, error: 'Failed to update step' }
  }
}

/**
 * Pause session
 */
export async function pauseSession(sessionId: string): Promise<ActionResult<Session>> {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    if (session.status !== 'active') {
      return { success: false, error: 'Session is not active' }
    }

    await db.update(sessions)
      .set({
        status: 'paused',
        pausedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))

    const updatedSession = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    return { success: true, data: updatedSession! }
  } catch (error) {
    console.error('Failed to pause session:', error)
    return { success: false, error: 'Failed to pause session' }
  }
}

/**
 * Resume session
 */
export async function resumeSession(sessionId: string): Promise<ActionResult<Session>> {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    if (session.status !== 'paused') {
      return { success: false, error: 'Session is not paused' }
    }

    // Calculate paused duration
    let totalPausedTime = session.totalPausedTime
    if (session.pausedAt) {
      const pausedDuration = Date.now() - session.pausedAt.getTime()
      totalPausedTime += pausedDuration
    }

    await db.update(sessions)
      .set({
        status: 'active',
        pausedAt: null,
        totalPausedTime,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))

    const updatedSession = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    return { success: true, data: updatedSession! }
  } catch (error) {
    console.error('Failed to resume session:', error)
    return { success: false, error: 'Failed to resume session' }
  }
}

/**
 * Advance to next phase
 */
export async function advancePhase(sessionId: string): Promise<ActionResult<Session>> {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    const phaseOrder = ['discovery', 'build', 'demo'] as const
    const currentIndex = phaseOrder.indexOf(session.currentPhase as typeof phaseOrder[number])

    if (currentIndex >= phaseOrder.length - 1) {
      return { success: false, error: 'Already in final phase' }
    }

    const nextPhase = phaseOrder[currentIndex + 1]

    await db.update(sessions)
      .set({
        currentPhase: nextPhase,
        phaseStartedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))

    const updatedSession = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    return { success: true, data: updatedSession! }
  } catch (error) {
    console.error('Failed to advance phase:', error)
    return { success: false, error: 'Failed to advance phase' }
  }
}

/**
 * Complete session
 */
export async function completeSession(sessionId: string): Promise<ActionResult<Session>> {
  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    await db.update(sessions)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId))

    const updatedSession = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    return { success: true, data: updatedSession! }
  } catch (error) {
    console.error('Failed to complete session:', error)
    return { success: false, error: 'Failed to complete session' }
  }
}

/**
 * Calculate time remaining for current phase
 */
function calculateTimeRemaining(session: Session) {
  const now = new Date()
  const phaseDurations = {
    discovery: session.discoveryDuration,
    build: session.buildDuration,
    demo: session.demoDuration,
  }

  const totalMinutes = phaseDurations[session.currentPhase as keyof typeof phaseDurations] || 10

  let elapsedMs = now.getTime() - session.phaseStartedAt.getTime()

  // Subtract paused time if currently paused
  if (session.status === 'paused' && session.pausedAt) {
    elapsedMs = session.pausedAt.getTime() - session.phaseStartedAt.getTime()
  }

  const elapsedMinutes = elapsedMs / 1000 / 60
  const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes)
  const isOvertime = elapsedMinutes > totalMinutes
  const overtimeMinutes = isOvertime ? elapsedMinutes - totalMinutes : 0

  return {
    phase: session.currentPhase,
    totalMinutes,
    elapsedMinutes,
    remainingMinutes,
    isOvertime,
    overtimeMinutes,
  }
}
