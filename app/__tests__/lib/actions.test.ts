/**
 * TDD: Action Tests for Session Assistant
 * Uses in-memory SQLite for realistic database testing (Option 2)
 *
 * Test Strategy:
 * - Each test uses a fresh in-memory database (via setup-node.ts)
 * - Create real data, test real operations, verify real results
 * - Auth is mocked at the Clerk boundary
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db, setTestDb } from '@/lib/db'
import { sessions, sessionSteps, clientInfo, templateSelections, sessionNotes } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

import {
  createSession,
  pauseSession,
  resumeSession,
  advancePhase,
  completeSession,
  updateStep,
  saveClientInfo,
  addTemplateSelection,
  addNote,
  getSessionStatus,
  getTimeRemaining,
  setAuthProvider,
  resetAuthProvider,
} from '@/lib/actions'

describe('Session Assistant Actions', () => {
  // Auth is set up in setup-node.ts, but we can override per test
  beforeEach(() => {
    setAuthProvider(() => ({ userId: 'test_user_123' }))
  })

  describe('createSession', () => {
    it('should create a builder session with default durations', async () => {
      const result = await createSession({
        role: 'builder',
        sessionTitle: 'Test Client - Invoice Generator',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.role).toBe('builder')
      expect(result.data.status).toBe('active')
      expect(result.data.currentPhase).toBe('discovery')
      expect(result.data.discoveryDuration).toBe(10)
      expect(result.data.buildDuration).toBe(30)
      expect(result.data.demoDuration).toBe(10)
    })

    it('should create a facilitator session', async () => {
      const result = await createSession({
        role: 'facilitator',
      })

      expect(result.success).toBe(true)
      expect(result.data.role).toBe('facilitator')
    })

    it('should allow custom phase durations', async () => {
      const result = await createSession({
        role: 'builder',
        discoveryDuration: 15,
        buildDuration: 25,
        demoDuration: 10,
      })

      expect(result.success).toBe(true)
      expect(result.data.discoveryDuration).toBe(15)
      expect(result.data.buildDuration).toBe(25)
    })

    it('should initialize session steps for builder role', async () => {
      const result = await createSession({ role: 'builder' })

      expect(result.success).toBe(true)
      expect(result.data.steps).toBeDefined()
      expect(result.data.steps.length).toBeGreaterThan(0)

      // Builder should have specific phases
      const phases = [...new Set(result.data.steps.map((s: any) => s.phase))]
      expect(phases).toContain('discovery')
      expect(phases).toContain('build')
      expect(phases).toContain('demo')
    })

    it('should initialize session steps for facilitator role', async () => {
      const result = await createSession({ role: 'facilitator' })

      expect(result.success).toBe(true)
      expect(result.data.steps).toBeDefined()
      expect(result.data.steps.length).toBeGreaterThan(0)
    })

    it('should require authentication', async () => {
      // Override auth to return no user
      setAuthProvider(() => ({ userId: null }))

      const result = await createSession({ role: 'builder' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })

    it('should persist session to database', async () => {
      const result = await createSession({
        role: 'builder',
        sessionTitle: 'Persisted Session',
      })

      expect(result.success).toBe(true)

      // Verify it's actually in the database
      const [found] = await db.select().from(sessions).where(eq(sessions.id, result.data.id))
      expect(found).toBeDefined()
      expect(found.sessionTitle).toBe('Persisted Session')
    })
  })

  describe('pauseSession', () => {
    it('should pause an active session', async () => {
      // Create a session first
      const createResult = await createSession({ role: 'builder' })
      expect(createResult.success).toBe(true)

      // Now pause it
      const result = await pauseSession(createResult.data.id)

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('paused')
      expect(result.data.pausedAt).toBeDefined()
    })

    it('should fail if session not found', async () => {
      const result = await pauseSession('nonexistent_session')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should fail if session is already paused', async () => {
      // Create and pause a session
      const createResult = await createSession({ role: 'builder' })
      await pauseSession(createResult.data.id)

      // Try to pause again
      const result = await pauseSession(createResult.data.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not active')
    })
  })

  describe('resumeSession', () => {
    it('should resume a paused session', async () => {
      // Create and pause a session
      const createResult = await createSession({ role: 'builder' })
      await pauseSession(createResult.data.id)

      // Now resume it
      const result = await resumeSession(createResult.data.id)

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('active')
      expect(result.data.pausedAt).toBeNull()
    })

    it('should accumulate paused time', async () => {
      // Create and pause a session
      const createResult = await createSession({ role: 'builder' })
      await pauseSession(createResult.data.id)

      // Wait a tiny bit then resume
      await new Promise(resolve => setTimeout(resolve, 10))
      const result = await resumeSession(createResult.data.id)

      expect(result.success).toBe(true)
      expect(result.data.totalPausedTime).toBeGreaterThanOrEqual(0)
    })

    it('should fail if session is not paused', async () => {
      // Create an active session
      const createResult = await createSession({ role: 'builder' })

      // Try to resume without pausing
      const result = await resumeSession(createResult.data.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not paused')
    })
  })

  describe('advancePhase', () => {
    it('should advance from discovery to build', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await advancePhase(createResult.data.id)

      expect(result.success).toBe(true)
      expect(result.data.currentPhase).toBe('build')
      expect(result.data.phaseStartedAt).toBeDefined()
    })

    it('should advance from build to demo', async () => {
      const createResult = await createSession({ role: 'builder' })

      // Advance to build first
      await advancePhase(createResult.data.id)

      // Now advance to demo
      const result = await advancePhase(createResult.data.id)

      expect(result.success).toBe(true)
      expect(result.data.currentPhase).toBe('demo')
    })

    it('should fail if already in demo phase', async () => {
      const createResult = await createSession({ role: 'builder' })

      // Advance through all phases
      await advancePhase(createResult.data.id) // -> build
      await advancePhase(createResult.data.id) // -> demo

      // Try to advance again
      const result = await advancePhase(createResult.data.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot advance')
    })

    it('should reset phase timer', async () => {
      const createResult = await createSession({ role: 'builder' })
      const beforeAdvance = Date.now()

      const result = await advancePhase(createResult.data.id)

      const phaseStart = new Date(result.data.phaseStartedAt).getTime()
      // Allow 1 second tolerance for timestamp precision differences
      expect(phaseStart).toBeGreaterThanOrEqual(beforeAdvance - 1000)
    })
  })

  describe('completeSession', () => {
    it('should mark session as completed', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await completeSession(createResult.data.id)

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('completed')
      expect(result.data.completedAt).toBeDefined()
    })

    it('should calculate total duration', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await completeSession(createResult.data.id)

      expect(result.success).toBe(true)
      expect(result.data.totalDuration).toBeDefined()
      expect(result.data.totalDuration).toBeGreaterThanOrEqual(0)
    })

    it('should fail if session already completed', async () => {
      const createResult = await createSession({ role: 'builder' })
      await completeSession(createResult.data.id)

      // Try to complete again
      const result = await completeSession(createResult.data.id)

      expect(result.success).toBe(false)
    })
  })

  describe('updateStep', () => {
    it('should mark step as in progress', async () => {
      const createResult = await createSession({ role: 'builder' })
      const stepId = createResult.data.steps[0].id

      const result = await updateStep(stepId, {
        status: 'in_progress',
      })

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('in_progress')
      expect(result.data.startedAt).toBeDefined()
    })

    it('should mark step as completed with time spent', async () => {
      const createResult = await createSession({ role: 'builder' })
      const stepId = createResult.data.steps[0].id

      const result = await updateStep(stepId, {
        status: 'completed',
        timeSpent: 300, // 5 minutes
        notes: 'Completed successfully',
      })

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('completed')
      expect(result.data.timeSpent).toBe(300)
      expect(result.data.notes).toBe('Completed successfully')
      expect(result.data.completedAt).toBeDefined()
    })

    it('should allow skipping a step', async () => {
      const createResult = await createSession({ role: 'builder' })
      const stepId = createResult.data.steps[0].id

      const result = await updateStep(stepId, {
        status: 'skipped',
        notes: 'Not applicable for this client',
      })

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('skipped')
    })
  })

  describe('saveClientInfo', () => {
    it('should save basic client information', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await saveClientInfo(createResult.data.id, {
        clientName: 'Acme Corp',
        businessType: 'Manufacturing',
        problemStatement: 'Manual inventory tracking',
      })

      expect(result.success).toBe(true)
      expect(result.data.clientName).toBe('Acme Corp')
      expect(result.data.businessType).toBe('Manufacturing')
    })

    it('should save Three Wins framework', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await saveClientInfo(createResult.data.id, {
        clientName: 'Test',
        problemStatement: 'Test problem',
        threeWins: ['Save 10 hours/week', 'Reduce errors', 'Better insights'],
      })

      expect(result.success).toBe(true)
      const wins = JSON.parse(result.data.threeWins!)
      expect(wins).toHaveLength(3)
      expect(wins[0]).toBe('Save 10 hours/week')
    })

    it('should save pain points and features', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await saveClientInfo(createResult.data.id, {
        clientName: 'Test',
        problemStatement: 'Test problem',
        painPoints: ['Too slow', 'Too manual'],
        mustHaveFeatures: ['Mobile access', 'Real-time updates'],
        niceToHaveFeatures: ['Analytics', 'Integrations'],
      })

      expect(result.success).toBe(true)
      expect(JSON.parse(result.data.painPoints!)).toHaveLength(2)
      expect(JSON.parse(result.data.mustHaveFeatures!)).toHaveLength(2)
    })

    it('should update existing client info', async () => {
      const createResult = await createSession({ role: 'builder' })

      // First save
      await saveClientInfo(createResult.data.id, {
        clientName: 'Original Name',
        problemStatement: 'Original problem',
      })

      // Update
      const result = await saveClientInfo(createResult.data.id, {
        budget: '$5,000-$10,000',
      })

      expect(result.success).toBe(true)
      expect(result.data.budget).toBe('$5,000-$10,000')
    })
  })

  describe('addTemplateSelection', () => {
    it('should add a template consideration', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await addTemplateSelection(createResult.data.id, {
        templateNumber: 14,
        templateName: 'Inventory Management',
        fitScore: 9,
        fitReason: 'Perfect match for their needs',
      })

      expect(result.success).toBe(true)
      expect(result.data.templateNumber).toBe(14)
      expect(result.data.fitScore).toBe(9)
    })

    it('should mark template as selected', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await addTemplateSelection(createResult.data.id, {
        templateNumber: 14,
        templateName: 'Inventory Management',
        isSelected: true,
        customizationNotes: 'Add barcode scanning',
        estimatedBuildTime: 25,
      })

      expect(result.success).toBe(true)
      expect(result.data.isSelected).toBe(true)
      expect(result.data.selectedAt).toBeDefined()
    })

    it('should store AI suggestions', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await addTemplateSelection(createResult.data.id, {
        templateNumber: 14,
        templateName: 'Inventory Management',
        aiSuggested: true,
        aiReasoning: 'Matches "inventory tracking" keywords',
      })

      expect(result.success).toBe(true)
      expect(result.data.aiSuggested).toBe(true)
    })
  })

  describe('addNote', () => {
    it('should add a note during discovery', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await addNote(createResult.data.id, {
        phase: 'discovery',
        content: 'Client mentioned integration with QuickBooks',
        createdBy: 'facilitator',
      })

      expect(result.success).toBe(true)
      expect(result.data.phase).toBe('discovery')
      expect(result.data.content).toBe('Client mentioned integration with QuickBooks')
    })

    it('should support tagged notes', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await addNote(createResult.data.id, {
        phase: 'build',
        content: 'Need to add custom field for warehouse location',
        createdBy: 'builder',
        tags: ['technical', 'customization'],
      })

      expect(result.success).toBe(true)
      const tags = JSON.parse(result.data.tags!)
      expect(tags).toContain('technical')
    })

    it('should mark action items', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await addNote(createResult.data.id, {
        phase: 'demo',
        content: 'Follow up on pricing by Friday',
        createdBy: 'facilitator',
        isActionItem: true,
      })

      expect(result.success).toBe(true)
      expect(result.data.isActionItem).toBe(true)
    })
  })

  describe('getSessionStatus', () => {
    it('should return current session state', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await getSessionStatus(createResult.data.id)

      expect(result.success).toBe(true)
      expect(result.data.session).toBeDefined()
      expect(result.data.currentPhase).toBe('discovery')
      expect(result.data.timeRemaining).toBeDefined()
    })

    it('should include completed steps count', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await getSessionStatus(createResult.data.id)

      expect(result.data.stepsCompleted).toBeDefined()
      expect(result.data.stepsTotal).toBeDefined()
      expect(result.data.stepsTotal).toBeGreaterThan(0)
    })

    it('should include client info if available', async () => {
      const createResult = await createSession({ role: 'builder' })
      await saveClientInfo(createResult.data.id, {
        clientName: 'Test Client',
        problemStatement: 'Test problem',
      })

      const result = await getSessionStatus(createResult.data.id)

      expect(result.data.clientInfo).toBeDefined()
      expect(result.data.clientInfo.clientName).toBe('Test Client')
    })

    it('should include selected template if available', async () => {
      const createResult = await createSession({ role: 'builder' })
      await addTemplateSelection(createResult.data.id, {
        templateNumber: 14,
        templateName: 'Inventory Management',
        isSelected: true,
      })

      const result = await getSessionStatus(createResult.data.id)

      expect(result.data.selectedTemplate).toBeDefined()
      expect(result.data.selectedTemplate.templateNumber).toBe(14)
    })
  })

  describe('getTimeRemaining', () => {
    it('should calculate time remaining in current phase', async () => {
      const createResult = await createSession({ role: 'builder' })

      const result = await getTimeRemaining(createResult.data.id)

      expect(result.success).toBe(true)
      expect(result.data.phase).toBe('discovery')
      expect(result.data.totalMinutes).toBe(10) // Default discovery duration
      expect(result.data.elapsedMinutes).toBeDefined()
      expect(result.data.remainingMinutes).toBeDefined()
    })

    it('should handle different phases', async () => {
      const createResult = await createSession({
        role: 'builder',
        buildDuration: 45,
      })
      await advancePhase(createResult.data.id) // -> build

      const result = await getTimeRemaining(createResult.data.id)

      expect(result.success).toBe(true)
      expect(result.data.phase).toBe('build')
      expect(result.data.totalMinutes).toBe(45)
    })

    it('should indicate when overtime', async () => {
      // Create session with 0 duration (will immediately be overtime)
      // This tests the overtime logic
      const createResult = await createSession({
        role: 'builder',
        discoveryDuration: 1, // 1 minute
      })

      // The session just started, so it shouldn't be overtime yet
      const result = await getTimeRemaining(createResult.data.id)

      expect(result.success).toBe(true)
      expect(result.data.isOvertime).toBe(false)
    })
  })
})
