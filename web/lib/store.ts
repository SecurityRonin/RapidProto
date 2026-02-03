/**
 * Local Storage Session Store
 * Simple client-side persistence for solo dev productivity timer
 *
 * Phase 3 Update: Now uses StorageAdapter internally for validated operations
 */

import { nanoid } from 'nanoid'
import { getLocalStorageAdapter, SessionsCollectionSchema } from '@/lib/storage'
import type { SessionData, SessionStepData } from '@/lib/storage'

// =============================================================================
// Types (maintaining backward compatibility with Date objects)
// =============================================================================

export type SessionStatus = 'active' | 'paused' | 'completed'
export type Phase = 'discovery' | 'build' | 'demo'
export type FacilitatorStage = 'expectations' | 'longterm' | 'close'
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'
export type Role = 'builder' | 'facilitator'

export interface SessionStep {
  id: string
  sessionId: string
  role: Role
  phase: Phase | FacilitatorStage
  stepNumber: number
  title: string
  description: string | null
  estimatedMinutes: number | null
  status: StepStatus
  acquiredValue: string | null  // Input/answer captured (syncs to other role)
  startedAt: Date | null
  completedAt: Date | null
  timeSpent: number | null
  notes: string | null
  createdAt: Date
}

// Synced data structure for cross-role visibility
export interface SyncedInputs {
  coreFeature?: string
  template?: string
  requiredChanges?: string
  prototypeScope?: string
  outOfScope?: string
  successCriteria?: string
}

export interface Session {
  id: string
  status: SessionStatus
  currentPhase: Phase
  phaseStartedAt: Date
  discoveryDuration: number
  buildDuration: number
  demoDuration: number
  startedAt: Date
  pausedAt: Date | null
  completedAt: Date | null
  totalPausedTime: number
  sessionTitle: string | null
  // Dual-role support
  builderJoined: boolean
  facilitatorJoined: boolean
  facilitatorStage: FacilitatorStage
  syncedInputs: SyncedInputs
  createdAt: Date
  updatedAt: Date
  steps: SessionStep[]
}

const STORAGE_KEY = 'rapidproto_sessions'

// =============================================================================
// Storage Adapter Integration
// =============================================================================

/**
 * Get sessions using the validated StorageAdapter
 * Falls back to legacy behavior if validation fails
 */
function getSessionsViaAdapter(): SessionData[] | null {
  const adapter = getLocalStorageAdapter()
  const result = adapter.get(STORAGE_KEY, SessionsCollectionSchema)

  if (result.success) {
    return result.data
  }

  // Log validation errors for debugging but don't crash
  if (result.code === 'SESSION_CORRUPTED') {
    console.warn('[store] Session data validation failed, attempting legacy recovery:', result.error)
  }

  return null
}

/**
 * Save sessions using the validated StorageAdapter
 */
function saveSessionsViaAdapter(sessions: SessionData[]): boolean {
  const adapter = getLocalStorageAdapter()
  const result = adapter.set(STORAGE_KEY, sessions, SessionsCollectionSchema)

  if (!result.success) {
    console.error('[store] Failed to save sessions:', result.error, result.code)
    return false
  }

  return true
}

/**
 * Convert Session (with Date objects) to SessionData (with ISO strings)
 */
function sessionToData(session: Session): SessionData {
  return {
    ...session,
    phaseStartedAt: session.phaseStartedAt.toISOString(),
    startedAt: session.startedAt.toISOString(),
    pausedAt: session.pausedAt?.toISOString() ?? null,
    completedAt: session.completedAt?.toISOString() ?? null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    steps: session.steps.map(stepToData),
  }
}

/**
 * Convert SessionStep (with Date objects) to SessionStepData (with ISO strings)
 */
function stepToData(step: SessionStep): SessionStepData {
  return {
    ...step,
    startedAt: step.startedAt?.toISOString() ?? null,
    completedAt: step.completedAt?.toISOString() ?? null,
    createdAt: step.createdAt.toISOString(),
  }
}

// =============================================================================
// Legacy Storage (fallback for validation failures)
// =============================================================================

// Helper to safely access localStorage (SSR-safe)
function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

// Get all sessions
export function getSessions(): Session[] {
  // Try validated adapter first
  const validatedData = getSessionsViaAdapter()
  if (validatedData !== null) {
    // Data is valid, rehydrate dates and return
    return validatedData.map(rehydrateSessionFromData)
  }

  // Fall back to legacy approach for corrupted/old data
  const storage = getStorage()
  if (!storage) return []

  try {
    const data = storage.getItem(STORAGE_KEY)
    if (!data) return []
    const sessions = JSON.parse(data)
    // Rehydrate dates
    return sessions.map(rehydrateSession)
  } catch {
    return []
  }
}

// Get single session
export function getSession(id: string): Session | null {
  const sessions = getSessions()
  return sessions.find(s => s.id === id) || null
}

// Save session
export function saveSession(session: Session): void {
  const sessions = getSessions()
  const index = sessions.findIndex(s => s.id === session.id)

  if (index >= 0) {
    sessions[index] = session
  } else {
    sessions.push(session)
  }

  // Convert to data format and save via validated adapter
  const sessionsData = sessions.map(sessionToData)
  const saved = saveSessionsViaAdapter(sessionsData)

  // Fall back to legacy save if adapter fails
  if (!saved) {
    const storage = getStorage()
    if (!storage) return
    storage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }
}

// Delete session
export function deleteSession(id: string): void {
  const sessions = getSessions().filter(s => s.id !== id)

  // Convert and save via validated adapter
  const sessionsData = sessions.map(sessionToData)
  const saved = saveSessionsViaAdapter(sessionsData)

  // Fall back to legacy save if adapter fails
  if (!saved) {
    const storage = getStorage()
    if (!storage) return
    storage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }
}

/**
 * Rehydrate Session from validated SessionData (ISO strings → Date objects)
 */
function rehydrateSessionFromData(data: SessionData): Session {
  return {
    ...data,
    phaseStartedAt: new Date(data.phaseStartedAt),
    startedAt: new Date(data.startedAt),
    pausedAt: data.pausedAt ? new Date(data.pausedAt) : null,
    completedAt: data.completedAt ? new Date(data.completedAt) : null,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    steps: data.steps.map((step): SessionStep => ({
      ...step,
      startedAt: step.startedAt ? new Date(step.startedAt) : null,
      completedAt: step.completedAt ? new Date(step.completedAt) : null,
      createdAt: new Date(step.createdAt),
    })),
  }
}

/**
 * Rehydrate dates from JSON (legacy fallback for corrupted data)
 */
function rehydrateSession(session: any): Session {
  return {
    ...session,
    phaseStartedAt: new Date(session.phaseStartedAt),
    startedAt: new Date(session.startedAt),
    pausedAt: session.pausedAt ? new Date(session.pausedAt) : null,
    completedAt: session.completedAt ? new Date(session.completedAt) : null,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    steps: session.steps.map((step: any) => ({
      ...step,
      startedAt: step.startedAt ? new Date(step.startedAt) : null,
      completedAt: step.completedAt ? new Date(step.completedAt) : null,
      createdAt: new Date(step.createdAt),
    })),
  }
}

// Default builder steps
function getBuilderSteps(sessionId: string): SessionStep[] {
  const now = new Date()
  const base = { sessionId, role: 'builder' as Role, acquiredValue: null, startedAt: null, completedAt: null, timeSpent: null, notes: null, createdAt: now }

  return [
    // Discovery phase
    { ...base, id: nanoid(), phase: 'discovery', stepNumber: 1, title: 'Define the core feature', description: 'What is the ONE thing this prototype must do?', estimatedMinutes: 3, status: 'pending' },
    { ...base, id: nanoid(), phase: 'discovery', stepNumber: 2, title: 'Pick a template', description: 'Choose a starting point that gets you closest', estimatedMinutes: 4, status: 'pending' },
    { ...base, id: nanoid(), phase: 'discovery', stepNumber: 3, title: 'List required changes', description: 'What needs to be added or modified?', estimatedMinutes: 3, status: 'pending' },
    // Build phase
    { ...base, id: nanoid(), phase: 'build', stepNumber: 1, title: 'Set up the project', description: 'Clone template, install dependencies', estimatedMinutes: 5, status: 'pending' },
    { ...base, id: nanoid(), phase: 'build', stepNumber: 2, title: 'Implement core feature', description: 'Build the main functionality', estimatedMinutes: 15, status: 'pending' },
    { ...base, id: nanoid(), phase: 'build', stepNumber: 3, title: 'Style and polish', description: 'Make it look presentable', estimatedMinutes: 10, status: 'pending' },
    // Demo/Verify phase
    { ...base, id: nanoid(), phase: 'demo', stepNumber: 1, title: 'Test the happy path', description: 'Does the core feature work?', estimatedMinutes: 4, status: 'pending' },
    { ...base, id: nanoid(), phase: 'demo', stepNumber: 2, title: 'Fix critical bugs', description: 'Only blockers, skip nice-to-haves', estimatedMinutes: 4, status: 'pending' },
    { ...base, id: nanoid(), phase: 'demo', stepNumber: 3, title: 'Ship or screenshot', description: 'Deploy it or capture evidence', estimatedMinutes: 2, status: 'pending' },
  ]
}

// Default facilitator steps (active during builder's Build phase)
function getFacilitatorSteps(sessionId: string): SessionStep[] {
  const now = new Date()
  const base = { sessionId, role: 'facilitator' as Role, acquiredValue: null, startedAt: null, completedAt: null, timeSpent: null, notes: null, createdAt: now }

  return [
    // Expectations stage (~10 min)
    { ...base, id: nanoid(), phase: 'expectations', stepNumber: 1, title: 'Define prototype scope', description: 'Today\'s demo will show [X, Y, Z]', estimatedMinutes: 3, status: 'pending' },
    { ...base, id: nanoid(), phase: 'expectations', stepNumber: 2, title: 'Clarify out of scope', description: 'We won\'t be covering [A, B, C] today', estimatedMinutes: 3, status: 'pending' },
    { ...base, id: nanoid(), phase: 'expectations', stepNumber: 3, title: 'Set success criteria', description: 'What would make this demo a win for you?', estimatedMinutes: 2, status: 'pending' },
    { ...base, id: nanoid(), phase: 'expectations', stepNumber: 4, title: 'Explain technical limitations', description: 'Some parts will be mocked/simulated', estimatedMinutes: 2, status: 'pending' },
    // Long Term stage (~10 min)
    { ...base, id: nanoid(), phase: 'longterm', stepNumber: 1, title: 'Feature roadmap', description: 'After the prototype, what features matter most?', estimatedMinutes: 3, status: 'pending' },
    { ...base, id: nanoid(), phase: 'longterm', stepNumber: 2, title: 'Priority order', description: 'If you had to pick the top 3 for v1...', estimatedMinutes: 2, status: 'pending' },
    { ...base, id: nanoid(), phase: 'longterm', stepNumber: 3, title: 'Timeline expectations', description: 'When would you ideally launch the full product?', estimatedMinutes: 2, status: 'pending' },
    { ...base, id: nanoid(), phase: 'longterm', stepNumber: 4, title: 'Ongoing relationship', description: 'How do you see us working together after launch?', estimatedMinutes: 3, status: 'pending' },
    // Close stage (~10 min)
    { ...base, id: nanoid(), phase: 'close', stepNumber: 1, title: 'Pricing discussion', description: 'Let me walk you through our pricing structure', estimatedMinutes: 3, status: 'pending' },
    { ...base, id: nanoid(), phase: 'close', stepNumber: 2, title: 'Package options', description: 'Here\'s what\'s included at each tier', estimatedMinutes: 2, status: 'pending' },
    { ...base, id: nanoid(), phase: 'close', stepNumber: 3, title: 'Next steps', description: 'If the demo goes well, here\'s what happens next', estimatedMinutes: 3, status: 'pending' },
    { ...base, id: nanoid(), phase: 'close', stepNumber: 4, title: 'Commitment/deposit', description: 'To move forward, we\'d need [X]', estimatedMinutes: 2, status: 'pending' },
  ]
}

// Get all default steps for a session (both roles)
function getDefaultSteps(sessionId: string): SessionStep[] {
  return [...getBuilderSteps(sessionId), ...getFacilitatorSteps(sessionId)]
}

// Create new session
export function createNewSession(title?: string): Session {
  const now = new Date()
  const sessionId = nanoid()

  const session: Session = {
    id: sessionId,
    status: 'active',
    currentPhase: 'discovery',
    phaseStartedAt: now,
    discoveryDuration: 10,
    buildDuration: 30,
    demoDuration: 10,
    startedAt: now,
    pausedAt: null,
    completedAt: null,
    totalPausedTime: 0,
    sessionTitle: title || null,
    // Dual-role support
    builderJoined: true,  // Builder creates the session
    facilitatorJoined: false,
    facilitatorStage: 'expectations',
    syncedInputs: {},
    createdAt: now,
    updatedAt: now,
    steps: getDefaultSteps(sessionId),
  }

  saveSession(session)
  return session
}

// Join session as facilitator
export function joinSessionAsFacilitator(sessionId: string): Session | null {
  const session = getSession(sessionId)
  if (!session) return null

  session.facilitatorJoined = true
  session.updatedAt = new Date()
  saveSession(session)
  return session
}

// Update synced inputs from step acquiredValues
export function updateSyncedInputs(sessionId: string): void {
  const session = getSession(sessionId)
  if (!session) return

  const builderSteps = session.steps.filter(s => s.role === 'builder')

  // Map builder step titles to sync keys
  const syncMap: Record<string, keyof SyncedInputs> = {
    'Define the core feature': 'coreFeature',
    'Pick a template': 'template',
    'List required changes': 'requiredChanges',
  }

  const syncedInputs: SyncedInputs = {}
  for (const step of builderSteps) {
    const key = syncMap[step.title]
    if (key && step.acquiredValue) {
      syncedInputs[key] = step.acquiredValue
    }
  }

  session.syncedInputs = syncedInputs
  session.updatedAt = new Date()
  saveSession(session)
}

// Calculate time remaining for current phase
export function calculateTimeRemaining(session: Session): {
  phase: Phase
  totalMinutes: number
  elapsedMinutes: number
  remainingMinutes: number
  isOvertime: boolean
  overtimeMinutes: number
} {
  const now = new Date()
  const phaseDurations = {
    discovery: session.discoveryDuration,
    build: session.buildDuration,
    demo: session.demoDuration,
  }

  const totalMinutes = phaseDurations[session.currentPhase]

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

// =============================================================================
// SESSION HISTORY HELPERS
// =============================================================================

/**
 * Get completed sessions sorted by completion date (most recent first)
 */
export function getCompletedSessions(): Session[] {
  return getSessions()
    .filter(s => s.status === 'completed')
    .sort((a, b) => {
      const dateA = a.completedAt?.getTime() ?? 0
      const dateB = b.completedAt?.getTime() ?? 0
      return dateB - dateA
    })
}

/**
 * Get active (non-completed) sessions
 */
export function getActiveSessions(): Session[] {
  return getSessions()
    .filter(s => s.status !== 'completed')
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

/**
 * Calculate total session duration in minutes
 */
export function calculateSessionDuration(session: Session): number {
  if (!session.completedAt) {
    // For active sessions, calculate from start to now minus paused time
    const now = new Date()
    const totalMs = now.getTime() - session.startedAt.getTime() - session.totalPausedTime
    return Math.round(totalMs / 1000 / 60)
  }

  // For completed sessions, calculate from start to completion minus paused time
  const totalMs = session.completedAt.getTime() - session.startedAt.getTime() - session.totalPausedTime
  return Math.round(totalMs / 1000 / 60)
}
