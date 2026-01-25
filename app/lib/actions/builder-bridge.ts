/**
 * Builder Bridge Actions
 * Connects template-0 session management to core lib/builder.ts functions
 */

'use server'

import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { sessions, clientInfo, templateSelections } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Import core builder functions
import {
  selectTemplate,
  initializeProject,
  trackProgress,
  communicateStatus,
  prepareDemoScript,
  type BuilderSession as CoreBuilderSession,
  type BuildPhase,
} from '@/lib/builder'

// ============================================================================
// Template Selection with AI
// ============================================================================

export async function suggestTemplates(sessionId: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get client info
    const [client] = await db.select()
      .from(clientInfo)
      .where(eq(clientInfo.sessionId, sessionId))

    if (!client || !client.problemStatement) {
      return {
        success: false,
        error: 'Client problem statement required',
      }
    }

    // Use core function to match templates
    const result = selectTemplate(client.problemStatement, { returnMultiple: true })

    if ('suggestions' in result) {
      // Return multiple suggestions
      return {
        success: true,
        data: {
          suggestions: result.suggestions,
          needsClarification: result.needsClarification,
        },
      }
    } else {
      // Single best match
      return {
        success: true,
        data: {
          suggestions: [result],
          needsClarification: false,
        },
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to suggest templates',
    }
  }
}

// ============================================================================
// Project Initialization
// ============================================================================

export async function initializeSelectedTemplate(
  sessionId: string,
  templateNumber: number,
  projectName: string
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get client info for context
    const [client] = await db.select()
      .from(clientInfo)
      .where(eq(clientInfo.sessionId, sessionId))

    // Initialize project using core function
    const result = await initializeProject({
      templateNumber,
      projectName,
      clientName: client?.clientName,
      env: {
        PROJECT_NAME: projectName,
        DATABASE_URL: `file:./${projectName}.db`,
      },
    })

    return result
  } catch (error) {
    return {
      success: false,
      error: 'Failed to initialize project',
    }
  }
}

// ============================================================================
// Progress Tracking Integration
// ============================================================================

export async function getBuilderProgress(sessionId: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get session
    const [session] = await db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    // Get selected template
    const [template] = await db.select()
      .from(templateSelections)
      .where(eq(templateSelections.sessionId, sessionId))

    if (!template) {
      return {
        success: false,
        error: 'No template selected',
      }
    }

    // Build core session object
    const coreSession: CoreBuilderSession = {
      id: session.id,
      templateNumber: template.templateNumber,
      startTime: session.startedAt,
      phases: [], // Would populate from sessionSteps
      currentPhase: session.currentPhase as any,
    }

    // Get progress status
    const progress = trackProgress(coreSession)

    return {
      success: true,
      data: progress,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get builder progress',
    }
  }
}

// ============================================================================
// Status Communication
// ============================================================================

export async function sendBuilderStatus(
  sessionId: string,
  type: 'update' | 'question' | 'ready' | 'blocker',
  context?: { question?: string; issue?: string; needsClientInput?: boolean }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get session and template
    const [session] = await db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))

    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    const [template] = await db.select()
      .from(templateSelections)
      .where(eq(templateSelections.sessionId, sessionId))

    if (!template) {
      return { success: false, error: 'No template selected' }
    }

    // Build core session
    const coreSession: CoreBuilderSession = {
      id: session.id,
      templateNumber: template.templateNumber,
      startTime: session.startedAt,
      phases: [],
      currentPhase: session.currentPhase as any,
      demoReady: session.status === 'completed',
    }

    // Generate status message
    const message = communicateStatus(coreSession, type, context)

    return {
      success: true,
      data: message,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to send builder status',
    }
  }
}

// ============================================================================
// Demo Script Generation
// ============================================================================

export async function generateDemoScript(sessionId: string) {
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

    if (!template) {
      return { success: false, error: 'No template selected' }
    }

    // Parse client requirements
    const clientRequirements = client?.mustHaveFeatures
      ? JSON.parse(client.mustHaveFeatures)
      : []

    const testScenarios = client?.threeWins
      ? JSON.parse(client.threeWins).map((win: string) => ({
          description: win,
          expectedOutcome: `Demonstrate ${win}`,
        }))
      : []

    // Build core session with all context
    const coreSession: CoreBuilderSession = {
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
      technicalHighlights: template.customLogic
        ? [template.customLogic]
        : [],
    }

    // Generate demo script
    const script = prepareDemoScript(coreSession)

    return {
      success: true,
      data: script,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate demo script',
    }
  }
}
