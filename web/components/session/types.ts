/**
 * Session Dashboard Type Definitions
 *
 * Centralized types for the session dashboard components.
 * All types are derived from the domain model to ensure consistency.
 */

// =============================================================================
// ROLE TYPES
// =============================================================================

export type Role = 'builder' | 'facilitator'

export const ROLES = ['builder', 'facilitator'] as const

export function isValidRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLES.includes(value as Role)
}

// =============================================================================
// PHASE & STAGE TYPES
// =============================================================================

/** Builder phases during a session */
export type BuilderPhase = 'discovery' | 'build' | 'demo'

/** Facilitator stages (active during builder's build phase) */
export type FacilitatorStage = 'expectations' | 'longterm' | 'close'

/** Union type for any phase/stage */
export type Phase = BuilderPhase | FacilitatorStage

export const BUILDER_PHASES: readonly BuilderPhase[] = ['discovery', 'build', 'demo']
export const FACILITATOR_STAGES: readonly FacilitatorStage[] = ['expectations', 'longterm', 'close']

// =============================================================================
// SESSION STATUS
// =============================================================================

export type SessionStatus = 'active' | 'paused' | 'completed'

export const SESSION_STATUSES: readonly SessionStatus[] = ['active', 'paused', 'completed']

// =============================================================================
// SYNCED INPUTS (Builder → Facilitator)
// =============================================================================

export interface SyncedInputs {
  coreFeature?: string
  template?: string
}

// =============================================================================
// SESSION DATA SHAPES
// =============================================================================

/** Core session data from the store */
export interface SessionData {
  id: string
  status: SessionStatus
  currentPhase: BuilderPhase
  facilitatorStage?: FacilitatorStage
  sessionTitle?: string
  phaseStartedAt: Date | string
  startedAt: Date | string
  discoveryDuration: number
  buildDuration: number
  demoDuration: number
  totalPausedTime: number
  steps: SessionStep[]
  syncedInputs?: SyncedInputs
}

/** Step within a session */
export interface SessionStep {
  id: string
  stepNumber: number
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  phase: Phase
  role?: Role
  estimatedMinutes?: number
}

/** Computed time remaining data */
export interface TimeRemaining {
  phase: Phase
  totalMinutes: number
  elapsedMinutes: number
  remainingMinutes: number
  isOvertime: boolean
  overtimeMinutes: number
}

/** Full session status response from getSessionStatus */
export interface SessionStatusData {
  session: SessionData
  currentPhase: BuilderPhase
  timeRemaining: TimeRemaining | null
  stepsCompleted: number
  stepsTotal: number
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface SessionDashboardProps {
  sessionId: string
  role?: Role
}

export interface PhaseIndicatorProps {
  phases: readonly string[]
  currentPhase: string
  getDisplayName: (phase: string) => string
  isCompleted: (phase: string) => boolean
}

export interface SessionControlsProps {
  sessionId: string
  role: Role
  status: SessionStatus
  phase: BuilderPhase
  facilitatorStage?: FacilitatorStage
  isPending: boolean
  onAction: (action: () => { success: boolean; error?: string }) => void
}

// =============================================================================
// ACTION RESULT
// =============================================================================

export interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

// =============================================================================
// DEBUG TYPES
// =============================================================================

export interface DebugInfo {
  role: Role
  roleSource: 'prop' | 'localStorage' | 'default'
  sessionId: string
  phase: BuilderPhase
  facilitatorStage?: FacilitatorStage
  status: SessionStatus
  mounted: boolean
}
