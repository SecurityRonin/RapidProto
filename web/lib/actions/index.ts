/**
 * Template #0: RapidProto Session Assistant
 * Server Actions - implemented to pass TDD tests
 *
 * Guides Builder and Facilitator through the 50-minute process
 * with real-time tracking and countdown timers
 */

'use server'

import { db } from '@/lib/db'
import { auth } from './auth'

import {
  sessions,
  sessionSteps,
  clientInfo,
  templateSelections,
  sessionNotes,
  type Session,
  type SessionStep,
  type ClientInfo,
  type TemplateSelection,
  type SessionNote,
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import type {
  ActionResponse,
  CreateSessionResponse,
  PauseSessionResponse,
  ResumeSessionResponse,
  AdvancePhaseResponse,
  CompleteSessionResponse,
  UpdateStepResponse,
  SaveClientInfoResponse,
  AddTemplateSelectionResponse,
  AddNoteResponse,
  SessionStatusResponse,
  TimeRemainingResponse,
} from '@/types/actions'
import { handleActionError } from '@/lib/utils/errors'

// ============================================================================
// Validation Schemas
// ============================================================================

const createSessionSchema = z.object({
  role: z.enum(['builder', 'facilitator']),
  sessionTitle: z.string().optional(),
  discoveryDuration: z.number().min(1).max(60).optional(),
  buildDuration: z.number().min(1).max(120).optional(),
  demoDuration: z.number().min(1).max(60).optional(),
  teamId: z.string().optional(),
})

const updateStepSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']).optional(),
  timeSpent: z.number().optional(),
  notes: z.string().optional(),
})

const clientInfoSchema = z.object({
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  businessType: z.string().optional(),
  companySize: z.string().optional(),
  problemStatement: z.string().optional(),
  currentSolution: z.string().optional(),
  whyNow: z.string().optional(),
  threeWins: z.array(z.string()).optional(),
  painPoints: z.array(z.string()).optional(),
  mustHaveFeatures: z.array(z.string()).optional(),
  niceToHaveFeatures: z.array(z.string()).optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  decisionMakers: z.string().optional(),
})

const templateSelectionSchema = z.object({
  templateNumber: z.number(),
  templateName: z.string(),
  templateCategory: z.string().optional(),
  fitScore: z.number().min(1).max(10).optional(),
  fitReason: z.string().optional(),
  isSelected: z.boolean().optional(),
  selectedBy: z.enum(['builder', 'facilitator']).optional(),
  customizationNotes: z.string().optional(),
  estimatedBuildTime: z.number().optional(),
  customFields: z.string().optional(),
  customLogic: z.string().optional(),
  aiSuggested: z.boolean().optional(),
  aiReasoning: z.string().optional(),
})

const noteSchema = z.object({
  phase: z.enum(['discovery', 'build', 'demo', 'general']),
  content: z.string(),
  createdBy: z.enum(['builder', 'facilitator']),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  isActionItem: z.boolean().optional(),
})

// ============================================================================
// Helper Functions
// ============================================================================

function getBuilderSteps(): Array<{ phase: 'discovery' | 'build' | 'demo', stepNumber: number, title: string, description: string, estimatedMinutes?: number }> {
  return [
    // Discovery Phase (10 min)
    { phase: 'discovery', stepNumber: 1, title: 'Review client requirements', description: 'Read through facilitator notes and Three Wins', estimatedMinutes: 3 },
    { phase: 'discovery', stepNumber: 2, title: 'Select template', description: 'Choose best-fit template from library', estimatedMinutes: 4 },
    { phase: 'discovery', stepNumber: 3, title: 'Plan customizations', description: 'Note required changes and custom fields', estimatedMinutes: 3 },

    // Build Phase (30 min)
    { phase: 'build', stepNumber: 1, title: 'Clone template', description: 'Set up project from selected template', estimatedMinutes: 2 },
    { phase: 'build', stepNumber: 2, title: 'Customize database schema', description: 'Add custom fields and tables', estimatedMinutes: 5 },
    { phase: 'build', stepNumber: 3, title: 'Implement business logic', description: 'Add custom rules and calculations', estimatedMinutes: 8 },
    { phase: 'build', stepNumber: 4, title: 'Build UI components', description: 'Create client-specific interface', estimatedMinutes: 10 },
    { phase: 'build', stepNumber: 5, title: 'Test functionality', description: 'Run through user flows', estimatedMinutes: 5 },

    // Demo Phase (10 min)
    { phase: 'demo', stepNumber: 1, title: 'Deploy to preview', description: 'Push to Vercel preview environment', estimatedMinutes: 2 },
    { phase: 'demo', stepNumber: 2, title: 'Prepare demo flow', description: 'Set up sample data and walkthrough', estimatedMinutes: 3 },
    { phase: 'demo', stepNumber: 3, title: 'Present to client', description: 'Demo the working MVP', estimatedMinutes: 5 },
  ]
}

function getFacilitatorSteps(): Array<{ phase: 'discovery' | 'build' | 'demo', stepNumber: number, title: string, description: string, estimatedMinutes?: number }> {
  return [
    // Discovery Phase (10 min)
    { phase: 'discovery', stepNumber: 1, title: 'Three Wins conversation', description: 'Identify three key wins for the client', estimatedMinutes: 4 },
    { phase: 'discovery', stepNumber: 2, title: 'Pain points deep dive', description: 'Understand current frustrations', estimatedMinutes: 3 },
    { phase: 'discovery', stepNumber: 3, title: 'Must-have vs nice-to-have', description: 'Prioritize features for MVP', estimatedMinutes: 3 },

    // Build Phase (30 min)
    { phase: 'build', stepNumber: 1, title: 'Stay with client', description: 'Keep client engaged during build', estimatedMinutes: 5 },
    { phase: 'build', stepNumber: 2, title: 'Gather additional context', description: 'Ask clarifying questions as needed', estimatedMinutes: 10 },
    { phase: 'build', stepNumber: 3, title: 'Set expectations', description: 'Explain what MVP will and won\'t do', estimatedMinutes: 10 },
    { phase: 'build', stepNumber: 4, title: 'Preview progress', description: 'Show client work in progress', estimatedMinutes: 5 },

    // Demo Phase (10 min)
    { phase: 'demo', stepNumber: 1, title: 'Introduce demo', description: 'Set context for what client will see', estimatedMinutes: 1 },
    { phase: 'demo', stepNumber: 2, title: 'Guide demo walkthrough', description: 'Help builder show key features', estimatedMinutes: 6 },
    { phase: 'demo', stepNumber: 3, title: 'Gather feedback', description: 'Capture client reactions and next steps', estimatedMinutes: 3 },
  ]
}

// ============================================================================
// Session Management Actions
// ============================================================================

export async function createSession(input: z.infer<typeof createSessionSchema>): Promise<CreateSessionResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    const validated = createSessionSchema.parse(input)

    const sessionId = nanoid()
    const now = new Date()

    // Create session
    const [session] = await db.insert(sessions).values({
      id: sessionId,
      role: validated.role,
      status: 'active',
      currentPhase: 'discovery',
      phaseStartedAt: now,
      discoveryDuration: validated.discoveryDuration ?? 10,
      buildDuration: validated.buildDuration ?? 30,
      demoDuration: validated.demoDuration ?? 10,
      startedAt: now,
      pausedAt: null,
      completedAt: null,
      totalPausedTime: 0,
      userId,
      teamId: validated.teamId ?? null,
      sessionTitle: validated.sessionTitle ?? null,
      createdAt: now,
      updatedAt: now,
    }).returning()

    // Initialize steps based on role
    const stepTemplates = validated.role === 'builder'
      ? getBuilderSteps()
      : getFacilitatorSteps()

    const steps = await db.insert(sessionSteps).values(
      stepTemplates.map(step => ({
        id: nanoid(),
        sessionId: session.id,
        phase: step.phase,
        stepNumber: step.stepNumber,
        title: step.title,
        description: step.description ?? null,
        estimatedMinutes: step.estimatedMinutes ?? null,
        status: 'pending' as const,
        startedAt: null,
        completedAt: null,
        timeSpent: null,
        notes: null,
        createdAt: now,
      }))
    ).returning()

    return {
      success: true,
      data: {
        ...session,
        steps,
      },
    }
  } catch (error) {
    return handleActionError({ action: 'createSession' }, error)
  }
}

export async function pauseSession(sessionId: string): Promise<PauseSessionResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    // Get current session
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) {
      return { success: false, error: 'Session not found', code: 'NOT_FOUND' }
    }

    if (session.status !== 'active') {
      return { success: false, error: 'Session is not active', code: 'CONFLICT' }
    }

    const now = new Date()

    // Update session to paused
    const [updated] = await db.update(sessions)
      .set({
        status: 'paused',
        pausedAt: now,
        updatedAt: now,
      })
      .where(eq(sessions.id, sessionId))
      .returning()

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    return handleActionError({ action: 'pauseSession', sessionId }, error)
  }
}

export async function resumeSession(sessionId: string): Promise<ResumeSessionResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    // Get current session
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) {
      return { success: false, error: 'Session not found', code: 'NOT_FOUND' }
    }

    if (session.status !== 'paused') {
      return { success: false, error: 'Session is not paused', code: 'CONFLICT' }
    }

    const now = new Date()

    // Calculate time spent paused
    const pausedDuration = session.pausedAt
      ? now.getTime() - session.pausedAt.getTime()
      : 0

    // Update session to active
    const [updated] = await db.update(sessions)
      .set({
        status: 'active',
        pausedAt: null,
        totalPausedTime: session.totalPausedTime + pausedDuration,
        updatedAt: now,
      })
      .where(eq(sessions.id, sessionId))
      .returning()

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    return handleActionError({ action: 'resumeSession', sessionId }, error)
  }
}

export async function advancePhase(sessionId: string): Promise<AdvancePhaseResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    // Get current session
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) {
      return { success: false, error: 'Session not found', code: 'NOT_FOUND' }
    }

    // Determine next phase
    let nextPhase: 'discovery' | 'build' | 'demo'
    if (session.currentPhase === 'discovery') {
      nextPhase = 'build'
    } else if (session.currentPhase === 'build') {
      nextPhase = 'demo'
    } else {
      return { success: false, error: 'Cannot advance from demo phase', code: 'CONFLICT' }
    }

    const now = new Date()

    // Update session phase
    const [updated] = await db.update(sessions)
      .set({
        currentPhase: nextPhase,
        phaseStartedAt: now,
        updatedAt: now,
      })
      .where(eq(sessions.id, sessionId))
      .returning()

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    return handleActionError({ action: 'advancePhase', sessionId }, error)
  }
}

export async function completeSession(sessionId: string): Promise<CompleteSessionResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    // Get current session
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) {
      return { success: false, error: 'Session not found', code: 'NOT_FOUND' }
    }

    if (session.status === 'completed') {
      return { success: false, error: 'Session already completed', code: 'CONFLICT' }
    }

    const now = new Date()

    // Calculate total duration (excluding paused time)
    const totalDuration = now.getTime() - session.startedAt.getTime() - session.totalPausedTime

    // Update session to completed
    const [updated] = await db.update(sessions)
      .set({
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(sessions.id, sessionId))
      .returning()

    return {
      success: true,
      data: {
        ...updated,
        totalDuration,
      },
    }
  } catch (error) {
    return handleActionError({ action: 'completeSession', sessionId }, error)
  }
}

// ============================================================================
// Step Management Actions
// ============================================================================

export async function updateStep(stepId: string, data: z.infer<typeof updateStepSchema>): Promise<UpdateStepResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    const validated = updateStepSchema.parse(data)

    const updates: any = {}

    if (validated.status) {
      updates.status = validated.status

      const now = new Date()
      if (validated.status === 'in_progress') {
        updates.startedAt = now
      } else if (validated.status === 'completed') {
        updates.completedAt = now
      }
    }

    if (validated.timeSpent !== undefined) {
      updates.timeSpent = validated.timeSpent
    }

    if (validated.notes !== undefined) {
      updates.notes = validated.notes
    }

    const [updated] = await db.update(sessionSteps)
      .set(updates)
      .where(eq(sessionSteps.id, stepId))
      .returning()

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    return handleActionError({ action: 'updateStep' }, error)
  }
}

// ============================================================================
// Client Info Actions
// ============================================================================

export async function saveClientInfo(sessionId: string, info: z.infer<typeof clientInfoSchema>): Promise<SaveClientInfoResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    const validated = clientInfoSchema.parse(info)
    const now = new Date()

    // Check if client info already exists
    const [existing] = await db.select()
      .from(clientInfo)
      .where(eq(clientInfo.sessionId, sessionId))

    if (existing) {
      // Update existing
      const updates: any = { updatedAt: now }

      if (validated.clientName) updates.clientName = validated.clientName
      if (validated.clientEmail) updates.clientEmail = validated.clientEmail
      if (validated.clientPhone) updates.clientPhone = validated.clientPhone
      if (validated.businessType) updates.businessType = validated.businessType
      if (validated.companySize) updates.companySize = validated.companySize
      if (validated.problemStatement) updates.problemStatement = validated.problemStatement
      if (validated.currentSolution) updates.currentSolution = validated.currentSolution
      if (validated.whyNow) updates.whyNow = validated.whyNow
      if (validated.threeWins) updates.threeWins = JSON.stringify(validated.threeWins)
      if (validated.painPoints) updates.painPoints = JSON.stringify(validated.painPoints)
      if (validated.mustHaveFeatures) updates.mustHaveFeatures = JSON.stringify(validated.mustHaveFeatures)
      if (validated.niceToHaveFeatures) updates.niceToHaveFeatures = JSON.stringify(validated.niceToHaveFeatures)
      if (validated.budget) updates.budget = validated.budget
      if (validated.timeline) updates.timeline = validated.timeline
      if (validated.decisionMakers) updates.decisionMakers = validated.decisionMakers

      const [updated] = await db.update(clientInfo)
        .set(updates)
        .where(eq(clientInfo.id, existing.id))
        .returning()

      return { success: true, data: updated }
    } else {
      // Create new
      const [created] = await db.insert(clientInfo).values({
        id: nanoid(),
        sessionId,
        clientName: validated.clientName ?? '',
        clientEmail: validated.clientEmail ?? null,
        clientPhone: validated.clientPhone ?? null,
        businessType: validated.businessType ?? null,
        companySize: validated.companySize ?? null,
        problemStatement: validated.problemStatement ?? '',
        currentSolution: validated.currentSolution ?? null,
        whyNow: validated.whyNow ?? null,
        threeWins: validated.threeWins ? JSON.stringify(validated.threeWins) : null,
        painPoints: validated.painPoints ? JSON.stringify(validated.painPoints) : null,
        mustHaveFeatures: validated.mustHaveFeatures ? JSON.stringify(validated.mustHaveFeatures) : null,
        niceToHaveFeatures: validated.niceToHaveFeatures ? JSON.stringify(validated.niceToHaveFeatures) : null,
        budget: validated.budget ?? null,
        timeline: validated.timeline ?? null,
        decisionMakers: validated.decisionMakers ?? null,
        createdAt: now,
        updatedAt: now,
      }).returning()

      return { success: true, data: created }
    }
  } catch (error) {
    return handleActionError({ action: 'saveClientInfo', sessionId }, error)
  }
}

// ============================================================================
// Template Selection Actions
// ============================================================================

export async function addTemplateSelection(sessionId: string, selection: z.infer<typeof templateSelectionSchema>): Promise<AddTemplateSelectionResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    const validated = templateSelectionSchema.parse(selection)
    const now = new Date()

    const [created] = await db.insert(templateSelections).values({
      id: nanoid(),
      sessionId,
      templateNumber: validated.templateNumber,
      templateName: validated.templateName,
      templateCategory: validated.templateCategory ?? null,
      fitScore: validated.fitScore ?? null,
      fitReason: validated.fitReason ?? null,
      isSelected: validated.isSelected ?? false,
      selectedAt: validated.isSelected ? now : null,
      selectedBy: validated.selectedBy ?? null,
      customizationNotes: validated.customizationNotes ?? null,
      estimatedBuildTime: validated.estimatedBuildTime ?? null,
      customFields: validated.customFields ?? null,
      customLogic: validated.customLogic ?? null,
      aiSuggested: validated.aiSuggested ?? false,
      aiReasoning: validated.aiReasoning ?? null,
      createdAt: now,
    }).returning()

    return {
      success: true,
      data: created,
    }
  } catch (error) {
    return handleActionError({ action: 'addTemplateSelection', sessionId }, error)
  }
}

// ============================================================================
// Note Actions
// ============================================================================

export async function addNote(sessionId: string, note: z.infer<typeof noteSchema>): Promise<AddNoteResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    const validated = noteSchema.parse(note)
    const now = new Date()

    const [created] = await db.insert(sessionNotes).values({
      id: nanoid(),
      sessionId,
      phase: validated.phase,
      content: validated.content,
      createdBy: validated.createdBy,
      tags: validated.tags ? JSON.stringify(validated.tags) : null,
      isPinned: validated.isPinned ?? false,
      isActionItem: validated.isActionItem ?? false,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return {
      success: true,
      data: created,
    }
  } catch (error) {
    return handleActionError({ action: 'addNote', sessionId }, error)
  }
}

// ============================================================================
// Query Actions
// ============================================================================

export async function getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    // Get session
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) {
      return { success: false, error: 'Session not found', code: 'NOT_FOUND' }
    }

    // Get steps
    const steps = await db.select().from(sessionSteps).where(eq(sessionSteps.sessionId, sessionId))

    // Get client info
    const [client] = await db.select().from(clientInfo).where(eq(clientInfo.sessionId, sessionId))

    // Get selected template
    const [selectedTemplate] = await db.select()
      .from(templateSelections)
      .where(and(
        eq(templateSelections.sessionId, sessionId),
        eq(templateSelections.isSelected, true)
      ))

    // Calculate time remaining
    const timeResult = await getTimeRemaining(sessionId)

    return {
      success: true,
      data: {
        session,
        currentPhase: session.currentPhase,
        timeRemaining: timeResult.success ? timeResult.data : null,
        stepsCompleted: steps.filter(s => s.status === 'completed').length,
        stepsTotal: steps.length,
        clientInfo: client ?? null,
        selectedTemplate: selectedTemplate ?? null,
      },
    }
  } catch (error) {
    return handleActionError({ action: 'getSessionStatus', sessionId }, error)
  }
}

export async function getTimeRemaining(sessionId: string): Promise<TimeRemainingResponse> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }
    }

    // Get session
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
    if (!session) {
      return { success: false, error: 'Session not found', code: 'NOT_FOUND' }
    }

    const now = new Date()

    // Get phase duration in milliseconds
    let phaseDurationMs: number
    if (session.currentPhase === 'discovery') {
      phaseDurationMs = session.discoveryDuration * 60 * 1000
    } else if (session.currentPhase === 'build') {
      phaseDurationMs = session.buildDuration * 60 * 1000
    } else {
      phaseDurationMs = session.demoDuration * 60 * 1000
    }

    // Calculate elapsed time (accounting for paused time if currently paused)
    let elapsedMs = now.getTime() - session.phaseStartedAt.getTime()

    if (session.status === 'paused' && session.pausedAt) {
      // Don't count time since pause
      elapsedMs = session.pausedAt.getTime() - session.phaseStartedAt.getTime()
    }

    const remainingMs = phaseDurationMs - elapsedMs
    const isOvertime = remainingMs < 0

    return {
      success: true,
      data: {
        phase: session.currentPhase,
        totalMinutes: phaseDurationMs / 1000 / 60,
        elapsedMinutes: elapsedMs / 1000 / 60,
        remainingMinutes: Math.max(0, remainingMs / 1000 / 60),
        isOvertime,
        overtimeMinutes: isOvertime ? Math.abs(remainingMs / 1000 / 60) : 0,
      },
    }
  } catch (error) {
    return handleActionError({ action: 'getTimeRemaining', sessionId }, error)
  }
}
