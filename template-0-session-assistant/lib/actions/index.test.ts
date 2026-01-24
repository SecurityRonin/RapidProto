/**
 * TDD: Action Tests for Session Assistant
 * Write tests FIRST, then implement actions to pass them
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
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
} from './index'

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [
          {
            id: 'session_123',
            role: 'builder',
            status: 'active',
            currentPhase: 'discovery',
            startedAt: new Date(),
          },
        ]),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => [
          {
            id: 'session_123',
            status: 'active',
            currentPhase: 'discovery',
            phaseStartedAt: new Date(),
          },
        ]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => [{ id: 'session_123' }]),
        })),
      })),
    })),
  },
}))

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => ({ userId: 'user_123' })),
}))

describe('Session Assistant Actions', () => {
  describe('createSession', () => {
    it('should create a builder session with default durations', async () => {
      const result = await createSession({
        role: 'builder',
        sessionTitle: 'Test Client - Invoice Generator',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.role).toBe('builder')
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

      expect(result.data.discoveryDuration).toBe(15)
      expect(result.data.buildDuration).toBe(25)
    })

    it('should initialize session steps for builder role', async () => {
      const result = await createSession({ role: 'builder' })

      // Builder should have steps for all phases
      expect(result.data.steps).toBeDefined()
      expect(result.data.steps.length).toBeGreaterThan(0)
    })

    it('should initialize session steps for facilitator role', async () => {
      const result = await createSession({ role: 'facilitator' })

      // Facilitator should have different steps
      expect(result.data.steps).toBeDefined()
      expect(result.data.steps.length).toBeGreaterThan(0)
    })

    it('should require authentication', async () => {
      vi.mock('@clerk/nextjs', () => ({
        auth: vi.fn(() => ({ userId: null })),
      }))

      const result = await createSession({ role: 'builder' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('pauseSession', () => {
    it('should pause an active session', async () => {
      const result = await pauseSession('session_123')

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('paused')
      expect(result.data.pausedAt).toBeDefined()
    })

    it('should fail if session not active', async () => {
      const result = await pauseSession('session_completed')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not active')
    })

    it('should calculate paused time correctly', async () => {
      const pauseResult = await pauseSession('session_123')
      expect(pauseResult.success).toBe(true)

      // Time tracking should be accurate
      expect(pauseResult.data.totalPausedTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('resumeSession', () => {
    it('should resume a paused session', async () => {
      const result = await resumeSession('session_123')

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('active')
      expect(result.data.pausedAt).toBeNull()
    })

    it('should accumulate paused time', async () => {
      const result = await resumeSession('session_123')

      expect(result.success).toBe(true)
      expect(result.data.totalPausedTime).toBeGreaterThan(0)
    })

    it('should fail if session not paused', async () => {
      const result = await resumeSession('session_active')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not paused')
    })
  })

  describe('advancePhase', () => {
    it('should advance from discovery to build', async () => {
      const result = await advancePhase('session_123')

      expect(result.success).toBe(true)
      expect(result.data.currentPhase).toBe('build')
      expect(result.data.phaseStartedAt).toBeDefined()
    })

    it('should advance from build to demo', async () => {
      const result = await advancePhase('session_in_build')

      expect(result.success).toBe(true)
      expect(result.data.currentPhase).toBe('demo')
    })

    it('should fail if already in demo phase', async () => {
      const result = await advancePhase('session_in_demo')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot advance')
    })

    it('should reset phase timer', async () => {
      const result = await advancePhase('session_123')

      const now = Date.now()
      const phaseStart = new Date(result.data.phaseStartedAt).getTime()
      expect(Math.abs(now - phaseStart)).toBeLessThan(1000) // Within 1 second
    })
  })

  describe('completeSession', () => {
    it('should mark session as completed', async () => {
      const result = await completeSession('session_123')

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('completed')
      expect(result.data.completedAt).toBeDefined()
    })

    it('should calculate total duration', async () => {
      const result = await completeSession('session_123')

      expect(result.data.totalDuration).toBeDefined()
      expect(result.data.totalDuration).toBeGreaterThan(0)
    })

    it('should fail if session not active', async () => {
      const result = await completeSession('session_completed')

      expect(result.success).toBe(false)
    })
  })

  describe('updateStep', () => {
    it('should mark step as in progress', async () => {
      const result = await updateStep('step_123', {
        status: 'in_progress',
      })

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('in_progress')
      expect(result.data.startedAt).toBeDefined()
    })

    it('should mark step as completed with time spent', async () => {
      const result = await updateStep('step_123', {
        status: 'completed',
        timeSpent: 300, // 5 minutes
        notes: 'Completed successfully',
      })

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('completed')
      expect(result.data.timeSpent).toBe(300)
      expect(result.data.completedAt).toBeDefined()
    })

    it('should allow skipping a step', async () => {
      const result = await updateStep('step_123', {
        status: 'skipped',
        notes: 'Not applicable for this client',
      })

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('skipped')
    })
  })

  describe('saveClientInfo', () => {
    it('should save basic client information', async () => {
      const result = await saveClientInfo('session_123', {
        clientName: 'Acme Corp',
        businessType: 'Manufacturing',
        problemStatement: 'Manual inventory tracking',
      })

      expect(result.success).toBe(true)
      expect(result.data.clientName).toBe('Acme Corp')
    })

    it('should save Three Wins framework', async () => {
      const result = await saveClientInfo('session_123', {
        threeWins: ['Save 10 hours/week', 'Reduce errors', 'Better insights'],
      })

      expect(result.success).toBe(true)
      const wins = JSON.parse(result.data.threeWins)
      expect(wins).toHaveLength(3)
    })

    it('should save pain points and features', async () => {
      const result = await saveClientInfo('session_123', {
        painPoints: ['Too slow', 'Too manual'],
        mustHaveFeatures: ['Mobile access', 'Real-time updates'],
        niceToHaveFeatures: ['Analytics', 'Integrations'],
      })

      expect(result.success).toBe(true)
      expect(JSON.parse(result.data.painPoints)).toHaveLength(2)
      expect(JSON.parse(result.data.mustHaveFeatures)).toHaveLength(2)
    })

    it('should update existing client info', async () => {
      const result = await saveClientInfo('session_with_client_info', {
        budget: '$5,000-$10,000',
      })

      expect(result.success).toBe(true)
      expect(result.data.budget).toBe('$5,000-$10,000')
    })
  })

  describe('addTemplateSelection', () => {
    it('should add a template consideration', async () => {
      const result = await addTemplateSelection('session_123', {
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
      const result = await addTemplateSelection('session_123', {
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
      const result = await addTemplateSelection('session_123', {
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
      const result = await addNote('session_123', {
        phase: 'discovery',
        content: 'Client mentioned integration with QuickBooks',
        createdBy: 'facilitator',
      })

      expect(result.success).toBe(true)
      expect(result.data.phase).toBe('discovery')
    })

    it('should support tagged notes', async () => {
      const result = await addNote('session_123', {
        phase: 'build',
        content: 'Need to add custom field for warehouse location',
        createdBy: 'builder',
        tags: ['technical', 'customization'],
      })

      expect(result.success).toBe(true)
      const tags = JSON.parse(result.data.tags)
      expect(tags).toContain('technical')
    })

    it('should mark action items', async () => {
      const result = await addNote('session_123', {
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
      const result = await getSessionStatus('session_123')

      expect(result.success).toBe(true)
      expect(result.data.session).toBeDefined()
      expect(result.data.currentPhase).toBeDefined()
      expect(result.data.timeRemaining).toBeDefined()
    })

    it('should include completed steps count', async () => {
      const result = await getSessionStatus('session_123')

      expect(result.data.stepsCompleted).toBeDefined()
      expect(result.data.stepsTotal).toBeDefined()
    })

    it('should include client info if available', async () => {
      const result = await getSessionStatus('session_with_client')

      expect(result.data.clientInfo).toBeDefined()
    })

    it('should include selected template if available', async () => {
      const result = await getSessionStatus('session_with_template')

      expect(result.data.selectedTemplate).toBeDefined()
    })
  })

  describe('getTimeRemaining', () => {
    it('should calculate time remaining in current phase', async () => {
      const result = await getTimeRemaining('session_123')

      expect(result.success).toBe(true)
      expect(result.data.phase).toBeDefined()
      expect(result.data.totalMinutes).toBeDefined()
      expect(result.data.elapsedMinutes).toBeDefined()
      expect(result.data.remainingMinutes).toBeDefined()
    })

    it('should account for paused time', async () => {
      const result = await getTimeRemaining('session_paused')

      expect(result.success).toBe(true)
      // Paused time should not count toward elapsed
      expect(result.data.elapsedMinutes).toBeLessThan(result.data.totalMinutes)
    })

    it('should handle overtime gracefully', async () => {
      const result = await getTimeRemaining('session_overtime')

      expect(result.success).toBe(true)
      expect(result.data.isOvertime).toBe(true)
      expect(result.data.overtimeMinutes).toBeGreaterThan(0)
    })
  })
})
