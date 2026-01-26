/**
 * Standardized action response types
 * All server actions return this shape for predictable handling
 */

// Base response - discriminated union for type narrowing
export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: ActionErrorCode }

// Error codes for programmatic handling
export type ActionErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

// Phase type used throughout
export type BuilderPhase = 'discovery' | 'build' | 'demo'
export type FacilitatorPhase = 'expectations' | 'longterm' | 'close'
export type Phase = BuilderPhase | FacilitatorPhase
export type SessionStatus = 'active' | 'paused' | 'completed'
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'
export type Role = 'builder' | 'facilitator'

// Time tracking
export interface TimeRemaining {
  phase: BuilderPhase | string
  totalMinutes: number
  elapsedMinutes: number
  remainingMinutes: number
  isOvertime: boolean
  overtimeMinutes: number
}

// Session step
export interface SessionStep {
  id: string
  sessionId: string
  role: Role
  phase: Phase
  stepNumber: number
  title: string
  description: string | null
  estimatedMinutes: number | null
  status: StepStatus
  acquiredValue: string | null
  startedAt: Date | null
  completedAt: Date | null
  timeSpent: number | null
  notes: string | null
  createdAt: Date
}

// Parsed client info (JSON fields converted to arrays)
export interface ClientInfoParsed {
  id: string
  sessionId: string
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  businessType: string | null
  companySize: string | null
  problemStatement: string
  currentSolution: string | null
  whyNow: string | null
  threeWins: string[]        // Parsed from JSON
  painPoints: string[]       // Parsed from JSON
  mustHaveFeatures: string[] // Parsed from JSON
  niceToHaveFeatures: string[] // Parsed from JSON
  budget: string | null
  timeline: string | null
  decisionMakers: string | null
  createdAt: Date
  updatedAt: Date
}

// Template selection
export interface TemplateSelectionData {
  id: string
  sessionId: string
  templateNumber: number
  templateName: string
  templateCategory: string | null
  fitScore: number | null
  fitReason: string | null
  isSelected: boolean
  selectedAt: Date | null
  selectedBy: string | null
  customizationNotes: string | null
  estimatedBuildTime: number | null
  aiSuggested: boolean
  aiReasoning: string | null
  createdAt: Date
}

// Session with nested data (for components that need full details)
export interface SessionWithDetails {
  id: string
  status: SessionStatus
  currentPhase: BuilderPhase
  phaseStartedAt: Date
  discoveryDuration: number
  buildDuration: number
  demoDuration: number
  startedAt: Date
  pausedAt: Date | null
  completedAt: Date | null
  totalPausedTime: number
  userId: string | null
  sessionTitle: string | null
  builderJoined: boolean
  facilitatorJoined: boolean
  expiresAt: Date | null
  steps: SessionStep[]
  clientInfo: ClientInfoParsed | null
  selectedTemplate: TemplateSelectionData | null
}

// Main session status response data (flat structure as returned by action)
export interface SessionStatusData {
  session: SessionData & { steps?: SessionStep[] }
  currentPhase: BuilderPhase
  timeRemaining: TimeRemaining | null
  stepsCompleted: number
  stepsTotal: number
  clientInfo: ClientInfoRaw | null
  selectedTemplate: TemplateSelectionRaw | null
}

// Session data as returned from database (without nested relations)
export interface SessionData {
  id: string
  status: SessionStatus
  currentPhase: BuilderPhase
  phaseStartedAt: Date
  discoveryDuration: number
  buildDuration: number
  demoDuration: number
  startedAt: Date
  pausedAt: Date | null
  completedAt: Date | null
  totalPausedTime: number
  userId: string | null
  sessionTitle: string | null
  builderJoined: boolean
  facilitatorJoined: boolean
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Client info as stored in database (JSON strings, not parsed)
export interface ClientInfoRaw {
  id: string
  sessionId: string
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  businessType: string | null
  companySize: string | null
  problemStatement: string
  currentSolution: string | null
  whyNow: string | null
  threeWins: string | null        // JSON string
  painPoints: string | null       // JSON string
  mustHaveFeatures: string | null // JSON string
  niceToHaveFeatures: string | null // JSON string
  budget: string | null
  timeline: string | null
  decisionMakers: string | null
  createdAt: Date
  updatedAt: Date
}

// Template selection as stored in database
export interface TemplateSelectionRaw {
  id: string
  sessionId: string
  templateNumber: number
  templateName: string
  templateCategory: string | null
  fitScore: number | null
  fitReason: string | null
  isSelected: boolean | null
  selectedAt: Date | null
  selectedBy: string | null
  customizationNotes: string | null
  estimatedBuildTime: number | null
  customFields: string | null
  customLogic: string | null
  aiSuggested: boolean | null
  aiReasoning: string | null
  createdAt: Date
}

// Session note as stored in database
export interface SessionNoteRaw {
  id: string
  sessionId: string
  phase: Phase | 'general'
  content: string
  createdBy: Role
  tags: string | null  // JSON string
  isPinned: boolean | null
  isActionItem: boolean | null
  createdAt: Date
  updatedAt: Date
}

// Alias for backwards compatibility
export type SessionStepPhase = Phase

// Response types for each action - matching actual implementation
export type CreateSessionResponse = ActionResponse<SessionData & { steps: SessionStep[] }>
export type SessionStatusResponse = ActionResponse<SessionStatusData>
export type PauseSessionResponse = ActionResponse<SessionData>
export type ResumeSessionResponse = ActionResponse<SessionData>
export type AdvancePhaseResponse = ActionResponse<SessionData>
export type CompleteSessionResponse = ActionResponse<SessionData & { totalDuration: number }>
export type SaveClientInfoResponse = ActionResponse<ClientInfoRaw>
export type UpdateStepResponse = ActionResponse<SessionStep>
export type AddNoteResponse = ActionResponse<SessionNoteRaw>
export type AddTemplateSelectionResponse = ActionResponse<TemplateSelectionRaw>
export type TimeRemainingResponse = ActionResponse<TimeRemaining>

// Input types for actions
export interface CreateSessionInput {
  sessionTitle?: string
  discoveryDuration?: number
  buildDuration?: number
  demoDuration?: number
}

export interface SaveClientInfoInput {
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  businessType?: string
  companySize?: string
  problemStatement?: string
  currentSolution?: string
  whyNow?: string
  threeWins?: string[]
  painPoints?: string[]
  mustHaveFeatures?: string[]
  niceToHaveFeatures?: string[]
  budget?: string
  timeline?: string
  decisionMakers?: string
}

export interface UpdateStepInput {
  status?: StepStatus
  timeSpent?: number
  notes?: string
}

export interface AddNoteInput {
  phase: Phase | 'general'
  content: string
  createdBy: Role
  tags?: string[]
  isPinned?: boolean
  isActionItem?: boolean
}

export interface AddTemplateSelectionInput {
  templateNumber: number
  templateName: string
  templateCategory?: string
  fitScore?: number
  fitReason?: string
  isSelected?: boolean
  customizationNotes?: string
  estimatedBuildTime?: number
  aiSuggested?: boolean
  aiReasoning?: string
}

// Helper type for type narrowing
export function isSuccessResponse<T>(
  response: ActionResponse<T>
): response is { success: true; data: T } {
  return response.success === true
}

export function isErrorResponse<T>(
  response: ActionResponse<T>
): response is { success: false; error: string; code?: ActionErrorCode } {
  return response.success === false
}
