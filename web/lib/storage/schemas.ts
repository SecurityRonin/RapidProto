/**
 * Storage Schemas
 * Zod schemas for validating stored session data (Phase 3)
 */

import { z } from 'zod'

// =============================================================================
// Enums and Primitives
// =============================================================================

export const SessionStatusSchema = z.enum(['active', 'paused', 'completed'])
export const PhaseSchema = z.enum(['discovery', 'build', 'demo'])
export const FacilitatorStageSchema = z.enum(['expectations', 'longterm', 'close'])
export const StepStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'skipped'])
export const RoleSchema = z.enum(['builder', 'facilitator'])

// =============================================================================
// Session Step
// =============================================================================

export const SessionStepSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: RoleSchema,
  // Phase can be builder phase or facilitator stage
  phase: z.union([PhaseSchema, FacilitatorStageSchema]),
  stepNumber: z.number().int().positive(),
  title: z.string(),
  description: z.string().nullable(),
  estimatedMinutes: z.number().nullable(),
  status: StepStatusSchema,
  acquiredValue: z.string().nullable(),
  // Dates stored as ISO strings in localStorage
  startedAt: z.string().datetime().nullable().or(z.null()),
  completedAt: z.string().datetime().nullable().or(z.null()),
  timeSpent: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
})

export type SessionStepData = z.infer<typeof SessionStepSchema>

// =============================================================================
// Synced Inputs (for cross-role visibility)
// =============================================================================

export const SyncedInputsSchema = z.object({
  coreFeature: z.string().optional(),
  template: z.string().optional(),
  requiredChanges: z.string().optional(),
  prototypeScope: z.string().optional(),
  outOfScope: z.string().optional(),
  successCriteria: z.string().optional(),
})

export type SyncedInputsData = z.infer<typeof SyncedInputsSchema>

// =============================================================================
// Session
// =============================================================================

export const SessionSchema = z.object({
  id: z.string(),
  status: SessionStatusSchema,
  currentPhase: PhaseSchema,
  // Dates stored as ISO strings
  phaseStartedAt: z.string().datetime(),
  discoveryDuration: z.number().int().positive(),
  buildDuration: z.number().int().positive(),
  demoDuration: z.number().int().positive(),
  startedAt: z.string().datetime(),
  pausedAt: z.string().datetime().nullable().or(z.null()),
  completedAt: z.string().datetime().nullable().or(z.null()),
  totalPausedTime: z.number().int().min(0),
  sessionTitle: z.string().nullable(),
  // Dual-role support
  builderJoined: z.boolean(),
  facilitatorJoined: z.boolean(),
  facilitatorStage: FacilitatorStageSchema,
  syncedInputs: SyncedInputsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  steps: z.array(SessionStepSchema),
})

export type SessionData = z.infer<typeof SessionSchema>

// =============================================================================
// Sessions Collection (what's actually stored)
// =============================================================================

export const SessionsCollectionSchema = z.array(SessionSchema)

export type SessionsCollectionData = z.infer<typeof SessionsCollectionSchema>

// =============================================================================
// Recovery Data (for session recovery feature)
// =============================================================================

export const TimeRemainingSchema = z.object({
  phase: PhaseSchema,
  totalMinutes: z.number(),
  elapsedMinutes: z.number(),
  remainingMinutes: z.number(),
  isOvertime: z.boolean(),
  overtimeMinutes: z.number(),
})

export const SessionStatusDataSchema = z.object({
  session: SessionSchema,
  currentPhase: PhaseSchema,
  timeRemaining: TimeRemainingSchema,
  stepsCompleted: z.number().int().min(0),
  stepsTotal: z.number().int().min(0),
  savedAt: z.number().optional(), // Unix timestamp for cache expiry
})

export type SessionStatusDataValue = z.infer<typeof SessionStatusDataSchema>

// =============================================================================
// User Preferences
// =============================================================================

export const UserRoleSchema = z.object({
  role: RoleSchema,
  sessionId: z.string(),
})

export type UserRoleData = z.infer<typeof UserRoleSchema>

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate session data with helpful error messages
 */
export function validateSession(data: unknown): SessionData {
  return SessionSchema.parse(data)
}

/**
 * Safe validation that returns null instead of throwing
 */
export function safeValidateSession(data: unknown): SessionData | null {
  const result = SessionSchema.safeParse(data)
  return result.success ? result.data : null
}

/**
 * Validate sessions collection
 */
export function validateSessionsCollection(data: unknown): SessionsCollectionData {
  return SessionsCollectionSchema.parse(data)
}

/**
 * Safe validation for sessions collection
 */
export function safeValidateSessionsCollection(data: unknown): SessionsCollectionData | null {
  const result = SessionsCollectionSchema.safeParse(data)
  return result.success ? result.data : null
}
