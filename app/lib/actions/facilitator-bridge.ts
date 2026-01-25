/**
 * Facilitator Bridge Actions
 * Connects template-0 session management to core lib/facilitator.ts functions
 */

'use server'

import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { sessions, clientInfo, templateSelections, sessionNotes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Import core facilitator functions
import {
  generateDiscoveryQuestions,
  excavateProblem,
  planEngagementActivities,
  orchestrateDemo,
  generateFollowUp,
  type DiscoverySession,
  type ProblemProfile,
  type EngagementPlan,
  type DemoOrchestration,
  type FollowUpEmail,
} from '@/lib/facilitator'

// Import demo script type from builder
import { prepareDemoScript, type BuilderSession } from '@/lib/builder'

// ============================================================================
// Discovery Question Generation
// ============================================================================

export async function generateDiscoveryQuestionsForSession(
  sessionId: string,
  context?: { industry?: string; problemType?: string }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get client info for industry context
    const [client] = await db.select()
      .from(clientInfo)
      .where(eq(clientInfo.sessionId, sessionId))

    // Generate questions using core function
    const questions = generateDiscoveryQuestions({
      industry: context?.industry || client?.industry,
      problemType: context?.problemType,
    })

    return {
      success: true,
      data: questions,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate discovery questions',
    }
  }
}

// ============================================================================
// Problem Excavation
// ============================================================================

export async function excavateSessionProblem(sessionId: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get session and client info
    const [session] = await db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    const [client] = await db.select()
      .from(clientInfo)
      .where(eq(clientInfo.sessionId, sessionId))

    if (!client) {
      return {
        success: false,
        error: 'Client information required for problem excavation',
      }
    }

    // Transform client info to DiscoverySession format
    const discoverySession: DiscoverySession = {
      id: session.id,
      clientName: client.clientName || 'Unknown Client',
      startTime: session.startedAt,
      responses: {
        surface: client.problemStatement || '',
        currentState: client.currentState || '',
        successCriteria: client.threeWins || '',
        users: client.targetUsers || '',
        decisionMaker: client.decisionMaker || '',
        integrations: client.existingIntegrations || '',
        dataFormat: client.dataFormat || '',
        costPerMonth: client.currentCostPerMonth || '',
        volume: client.volume || '',
        timeline: client.timeline || '',
        budget: client.budget || '',
      },
      heatLevel: session.heatLevel as 'hot' | 'qualified' | 'lukewarm' | undefined,
    }

    // Excavate problem using core function
    const profile = excavateProblem(discoverySession)

    return {
      success: true,
      data: profile,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to excavate problem profile',
    }
  }
}

// ============================================================================
// Engagement Activity Planning
// ============================================================================

export async function planSessionEngagement(
  sessionId: string,
  options?: { duration?: number }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get problem profile first
    const profileResult = await excavateSessionProblem(sessionId)
    if (!profileResult.success || !profileResult.data) {
      return {
        success: false,
        error: 'Problem profile required for engagement planning',
      }
    }

    // Plan engagement activities using core function
    const plan = planEngagementActivities(
      profileResult.data as ProblemProfile,
      options
    )

    return {
      success: true,
      data: plan,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to plan engagement activities',
    }
  }
}

// ============================================================================
// Demo Orchestration
// ============================================================================

export async function orchestrateSessionDemo(sessionId: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get session data
    const [session] = await db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    const [client] = await db.select()
      .from(clientInfo)
      .where(eq(clientInfo.sessionId, sessionId))

    const [template] = await db.select()
      .from(templateSelections)
      .where(eq(templateSelections.sessionId, sessionId))

    if (!template) {
      return { success: false, error: 'No template selected' }
    }

    // Get problem profile
    const profileResult = await excavateSessionProblem(sessionId)
    if (!profileResult.success || !profileResult.data) {
      return { success: false, error: 'Problem profile required' }
    }

    // Build builder session for demo script
    const clientRequirements = client?.mustHaveFeatures
      ? JSON.parse(client.mustHaveFeatures)
      : []

    const testScenarios = client?.threeWins
      ? JSON.parse(client.threeWins).map((win: string) => ({
          description: win,
          expectedOutcome: `Demonstrate ${win}`,
        }))
      : []

    const builderSession: BuilderSession = {
      id: session.id,
      templateNumber: template.templateNumber,
      startTime: session.startedAt,
      phases: [],
      currentPhase: session.currentPhase as any,
      demoReady: true,
      customizations: template.customizationNotes
        ? [template.customizationNotes]
        : [],
      clientRequirements,
      testScenarios,
      technicalHighlights: template.customLogic ? [template.customLogic] : [],
    }

    // Generate demo script
    const demoScript = prepareDemoScript(builderSession)

    // Orchestrate demo using core function
    const orchestration = orchestrateDemo(
      demoScript,
      profileResult.data as ProblemProfile
    )

    return {
      success: true,
      data: {
        script: demoScript,
        orchestration,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to orchestrate demo',
    }
  }
}

// ============================================================================
// Follow-Up Email Generation
// ============================================================================

export async function generateSessionFollowUp(sessionId: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get all session data
    const [session] = await db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    const [client] = await db.select()
      .from(clientInfo)
      .where(eq(clientInfo.sessionId, sessionId))

    const [template] = await db.select()
      .from(templateSelections)
      .where(eq(templateSelections.sessionId, sessionId))

    const notes = await db.select()
      .from(sessionNotes)
      .where(eq(sessionNotes.sessionId, sessionId))

    // Transform to DiscoverySession format
    const discoverySession: DiscoverySession = {
      id: session.id,
      clientName: client?.clientName || 'Unknown Client',
      startTime: session.startedAt,
      responses: {
        surface: client?.problemStatement || '',
        currentState: client?.currentState || '',
        successCriteria: client?.threeWins || '',
        users: client?.targetUsers || '',
        decisionMaker: client?.decisionMaker || '',
        integrations: client?.existingIntegrations || '',
        dataFormat: client?.dataFormat || '',
        costPerMonth: client?.currentCostPerMonth || '',
        volume: client?.volume || '',
        timeline: client?.timeline || '',
        budget: client?.budget || '',
      },
      heatLevel: session.heatLevel as 'hot' | 'qualified' | 'lukewarm' | undefined,
      notes: notes.map((n) => ({
        timestamp: n.createdAt,
        content: n.content,
        category: n.category as any,
      })),
    }

    // Build demo object
    const demo = {
      completedAt: session.completedAt || new Date(),
      demoUrl: session.demoUrl || undefined,
      recordingUrl: session.recordingUrl || undefined,
      codeRepo: template?.projectPath || undefined,
    }

    // Generate follow-up using core function
    const followUp = generateFollowUp(discoverySession, demo)

    return {
      success: true,
      data: followUp,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate follow-up email',
    }
  }
}
