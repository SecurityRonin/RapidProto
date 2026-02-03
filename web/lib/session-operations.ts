/**
 * Session Operations
 * Centralized session manipulation with consistent error handling (Phase 5)
 */

'use client'

import { getSession, saveSession, type Session, type Phase, type FacilitatorStage } from './store'
import { SessionError, handleActionError } from './utils/errors'
import type { ActionError } from './utils/errors'

// =============================================================================
// Constants
// =============================================================================

/** Builder phase progression order */
export const PHASE_ORDER: readonly Phase[] = ['discovery', 'build', 'demo'] as const

/** Facilitator stage progression order */
export const STAGE_ORDER: readonly FacilitatorStage[] = ['expectations', 'longterm', 'close'] as const

/** Map step titles to synced input keys */
export const SYNC_MAP: Readonly<Record<string, string>> = {
  'Define the core feature': 'coreFeature',
  'Pick a template': 'template',
  'List required changes': 'requiredChanges',
} as const

// =============================================================================
// Result Types
// =============================================================================

export type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

// =============================================================================
// Session Lookup Helpers
// =============================================================================

/**
 * Get session by ID with proper error handling
 * @throws SessionError if session not found
 */
export function getSessionOrThrow(sessionId: string): Session {
  const session = getSession(sessionId)
  if (!session) {
    throw new SessionError('SESSION_NOT_FOUND', 'Session not found', sessionId)
  }
  return session
}

/**
 * Get session with result wrapper (doesn't throw)
 */
export function getSessionResult(sessionId: string): OperationResult<Session> {
  try {
    const session = getSessionOrThrow(sessionId)
    return { success: true, data: session }
  } catch (error) {
    if (error instanceof SessionError) {
      return { success: false, error: error.message, code: error.code }
    }
    return handleActionError({ action: 'getSession', sessionId }, error) as OperationResult<Session>
  }
}

/**
 * Execute operation on session with consistent error handling
 */
export function withSession<T>(
  sessionId: string,
  action: string,
  operation: (session: Session) => T
): OperationResult<T> {
  try {
    const session = getSessionOrThrow(sessionId)
    const result = operation(session)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof SessionError) {
      return { success: false, error: error.message, code: error.code }
    }
    return handleActionError({ action, sessionId }, error) as OperationResult<T>
  }
}

/**
 * Execute operation that modifies and saves session
 */
export function withSessionMutate<T>(
  sessionId: string,
  action: string,
  operation: (session: Session) => T
): OperationResult<T> {
  try {
    const session = getSessionOrThrow(sessionId)
    const result = operation(session)
    session.updatedAt = new Date()
    saveSession(session)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof SessionError) {
      return { success: false, error: error.message, code: error.code }
    }
    return handleActionError({ action, sessionId }, error) as OperationResult<T>
  }
}

// =============================================================================
// Step Index for O(1) Lookups
// =============================================================================

/**
 * Build an index of steps by ID for fast lookups
 */
export function buildStepIndex(session: Session): Map<string, number> {
  const index = new Map<string, number>()
  session.steps.forEach((step, i) => {
    index.set(step.id, i)
  })
  return index
}

/**
 * Find step by ID in session (O(1) with index, O(n) without)
 */
export function findStep(
  session: Session,
  stepId: string,
  index?: Map<string, number>
): { step: Session['steps'][0]; stepIndex: number } | null {
  if (index) {
    const i = index.get(stepId)
    if (i !== undefined) {
      return { step: session.steps[i], stepIndex: i }
    }
    return null
  }

  // Fallback to linear search
  const stepIndex = session.steps.findIndex(s => s.id === stepId)
  if (stepIndex === -1) return null
  return { step: session.steps[stepIndex], stepIndex }
}

// =============================================================================
// Phase/Stage Navigation
// =============================================================================

/**
 * Get next phase in order
 */
export function getNextPhase(currentPhase: Phase): Phase | null {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase)
  if (currentIndex >= PHASE_ORDER.length - 1) return null
  return PHASE_ORDER[currentIndex + 1]
}

/**
 * Get previous phase in order
 */
export function getPreviousPhase(currentPhase: Phase): Phase | null {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase)
  if (currentIndex <= 0) return null
  return PHASE_ORDER[currentIndex - 1]
}

/**
 * Get next facilitator stage in order
 */
export function getNextStage(currentStage: FacilitatorStage): FacilitatorStage | null {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  if (currentIndex >= STAGE_ORDER.length - 1) return null
  return STAGE_ORDER[currentIndex + 1]
}

/**
 * Get previous facilitator stage in order
 */
export function getPreviousStage(currentStage: FacilitatorStage): FacilitatorStage | null {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)
  if (currentIndex <= 0) return null
  return STAGE_ORDER[currentIndex - 1]
}

// =============================================================================
// Synced Inputs
// =============================================================================

/**
 * Update synced inputs from builder's acquiredValues
 */
export function updateSyncedInputs(session: Session): void {
  const builderSteps = session.steps.filter(s => s.role === 'builder')
  const syncedInputs: Record<string, string> = {}

  for (const step of builderSteps) {
    const key = SYNC_MAP[step.title]
    if (key && step.acquiredValue) {
      syncedInputs[key] = step.acquiredValue
    }
  }

  session.syncedInputs = syncedInputs
}

// =============================================================================
// Session State Validation
// =============================================================================

/**
 * Validate session can be paused
 */
export function validateCanPause(session: Session): void {
  if (session.status !== 'active') {
    throw new SessionError(
      'SESSION_INVALID_STATE',
      'Session is not active',
      session.id
    )
  }
}

/**
 * Validate session can be resumed
 */
export function validateCanResume(session: Session): void {
  if (session.status !== 'paused') {
    throw new SessionError(
      'SESSION_INVALID_STATE',
      'Session is not paused',
      session.id
    )
  }
}

/**
 * Validate session can advance to next phase
 */
export function validateCanAdvancePhase(session: Session): void {
  const nextPhase = getNextPhase(session.currentPhase)
  if (!nextPhase) {
    throw new SessionError(
      'SESSION_INVALID_STATE',
      'Already in final phase',
      session.id
    )
  }
}

/**
 * Validate session can regress to previous phase
 */
export function validateCanRegressPhase(session: Session): void {
  const prevPhase = getPreviousPhase(session.currentPhase)
  if (!prevPhase) {
    throw new SessionError(
      'SESSION_INVALID_STATE',
      'Already in first phase',
      session.id
    )
  }
}

/**
 * Validate session can advance facilitator stage
 */
export function validateCanAdvanceStage(session: Session): void {
  const nextStage = getNextStage(session.facilitatorStage)
  if (!nextStage) {
    throw new SessionError(
      'SESSION_INVALID_STATE',
      'Already in final stage',
      session.id
    )
  }
}

/**
 * Validate session can regress facilitator stage
 */
export function validateCanRegressStage(session: Session): void {
  const prevStage = getPreviousStage(session.facilitatorStage)
  if (!prevStage) {
    throw new SessionError(
      'SESSION_INVALID_STATE',
      'Already in first stage',
      session.id
    )
  }
}
