/**
 * Tests for Builder Workflow Functions
 *
 * The builder orchestrates the 30-minute live build phase:
 * - Template selection
 * - Project setup
 * - Progress tracking
 * - Status communication
 * - Demo preparation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  selectTemplate,
  initializeProject,
  trackProgress,
  communicateStatus,
  prepareDemoScript,
  type BuilderSession,
  type TemplateMatch,
  type BuildPhase,
} from './builder'

describe('Builder Workflow Functions', () => {
  describe('selectTemplate', () => {
    it('should recommend template based on problem keywords', () => {
      const problem = 'We need to track client intake and onboarding'
      const match = selectTemplate(problem)

      expect(match.templateNumber).toBe(16)
      expect(match.confidence).toBeGreaterThan(0.8)
      expect(match.reasoning).toContain('client intake')
    })

    it('should identify expense tracking needs', () => {
      const problem = 'Need to manage employee expenses and reimbursements'
      const match = selectTemplate(problem)

      expect(match.templateNumber).toBe(1)
      expect(match.templateName).toBe('Expense Tracker')
    })

    it('should handle scheduling problems', () => {
      const problem = 'Booking appointments and managing availability'
      const match = selectTemplate(problem)

      expect([3, 5, 26]).toContain(match.templateNumber)
      expect(match.category).toBe('scheduling')
    })

    it('should return multiple suggestions when ambiguous', () => {
      const problem = 'We need a system for our business'
      const matches = selectTemplate(problem, { returnMultiple: true })

      expect(matches.suggestions).toHaveLength(3)
      expect(matches.needsClarification).toBe(true)
    })

    it('should assess complexity correctly', () => {
      const problem = 'Multi-stage approval workflow with notifications'
      const match = selectTemplate(problem)

      expect(match.complexity).toBeGreaterThanOrEqual(3)
      expect(match.estimatedBuildTime).toBeGreaterThan(25)
    })
  })

  describe('initializeProject', () => {
    it('should create project structure from template', async () => {
      const config = {
        templateNumber: 16,
        projectName: 'acme-client-intake',
        clientName: 'Acme Corp',
      }

      const result = await initializeProject(config)

      expect(result.success).toBe(true)
      expect(result.projectPath).toContain('acme-client-intake')
      expect(result.filesCreated).toBeGreaterThan(0)
    })

    it('should update environment variables', async () => {
      const config = {
        templateNumber: 1,
        projectName: 'test-project',
        env: {
          PROJECT_NAME: 'Test Project',
          DATABASE_URL: 'test.db',
        },
      }

      const result = await initializeProject(config)

      expect(result.envConfigured).toBe(true)
      expect(result.envVars).toContain('PROJECT_NAME')
    })

    it('should handle initialization errors gracefully', async () => {
      const config = {
        templateNumber: 999, // Invalid template
        projectName: 'test',
      }

      const result = await initializeProject(config)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('trackProgress', () => {
    let session: BuilderSession

    beforeEach(() => {
      session = {
        id: 'session_123',
        templateNumber: 16,
        startTime: new Date('2026-01-25T00:00:00Z'),
        phases: [],
      }
    })

    it('should track phase completion', () => {
      const phase: BuildPhase = {
        name: 'Core Logic',
        startTime: new Date('2026-01-25T00:10:00Z'),
        endTime: new Date('2026-01-25T00:20:00Z'),
        status: 'completed',
      }

      const updated = trackProgress(session, phase)

      expect(updated.phases).toHaveLength(1)
      expect(updated.phases[0].status).toBe('completed')
      expect(updated.currentPhase).toBeUndefined()
    })

    it('should calculate time remaining', () => {
      session.startTime = new Date(Date.now() - 15 * 60 * 1000) // 15 min ago

      const status = trackProgress(session)

      expect(status.timeElapsed).toBe(15)
      expect(status.timeRemaining).toBe(15)
      expect(status.onTrack).toBe(true)
    })

    it('should warn when running over time', () => {
      session.startTime = new Date(Date.now() - 35 * 60 * 1000) // 35 min ago

      const status = trackProgress(session)

      expect(status.timeRemaining).toBeLessThan(0)
      expect(status.warning).toBe('Over time limit')
      expect(status.recommendedAction).toBe('Simplify scope or demo what works')
    })

    it('should track multiple phases', () => {
      const phases: BuildPhase[] = [
        {
          name: 'Data Model',
          startTime: new Date('2026-01-25T00:10:00Z'),
          endTime: new Date('2026-01-25T00:15:00Z'),
          status: 'completed',
        },
        {
          name: 'Core Logic',
          startTime: new Date('2026-01-25T00:15:00Z'),
          status: 'in-progress',
        },
      ]

      let updated = session
      phases.forEach(phase => {
        updated = trackProgress(updated, phase)
      })

      expect(updated.phases).toHaveLength(2)
      expect(updated.currentPhase).toBe('Core Logic')
    })
  })

  describe('communicateStatus', () => {
    it('should generate status update for facilitator', () => {
      const session: BuilderSession = {
        id: 'session_123',
        templateNumber: 16,
        startTime: new Date(Date.now() - 15 * 60 * 1000),
        phases: [
          {
            name: 'Data Model',
            startTime: new Date(),
            endTime: new Date(),
            status: 'completed',
          },
        ],
        currentPhase: 'Core Logic',
      }

      const message = communicateStatus(session, 'update')

      expect(message.type).toBe('update')
      expect(message.text).toContain('Core Logic')
      expect(message.emoji).toBe('✅')
      expect(message.timeElapsed).toBe(15)
    })

    it('should request clarification from facilitator', () => {
      const session: BuilderSession = {
        id: 'session_123',
        templateNumber: 1,
        startTime: new Date(),
        phases: [],
      }

      const message = communicateStatus(session, 'question', {
        question: 'What format is their expense data in?',
      })

      expect(message.type).toBe('question')
      expect(message.text).toContain('expense data')
      expect(message.requiresResponse).toBe(true)
    })

    it('should announce demo readiness', () => {
      const session: BuilderSession = {
        id: 'session_123',
        templateNumber: 16,
        startTime: new Date(Date.now() - 28 * 60 * 1000),
        phases: [],
        demoReady: true,
      }

      const message = communicateStatus(session, 'ready')

      expect(message.type).toBe('ready')
      expect(message.emoji).toBe('🚀')
      expect(message.demoUrl).toBeDefined()
    })

    it('should escalate blockers', () => {
      const session: BuilderSession = {
        id: 'session_123',
        templateNumber: 8,
        startTime: new Date(),
        phases: [],
      }

      const message = communicateStatus(session, 'blocker', {
        issue: 'API integration requires credentials',
        needsClientInput: true,
      })

      expect(message.type).toBe('blocker')
      expect(message.emoji).toBe('⚠️')
      expect(message.urgent).toBe(true)
    })
  })

  describe('prepareDemoScript', () => {
    it('should generate demo script from session data', () => {
      const session: BuilderSession = {
        id: 'session_123',
        templateNumber: 16,
        startTime: new Date(),
        phases: [],
        customizations: [
          'AI document extraction for intake forms',
          'Conflict checking against existing clients',
        ],
        clientRequirements: [
          'Handle PDF uploads',
          'Flag duplicate submissions',
        ],
      }

      const script = prepareDemoScript(session)

      expect(script.sections).toHaveLength(4) // Opening, Happy Path, Edge Case, Future
      expect(script.sections[0].title).toBe('Context Setting')
      expect(script.estimatedDuration).toBeLessThanOrEqual(10)
    })

    it('should include client-specific scenarios', () => {
      const session: BuilderSession = {
        id: 'session_123',
        templateNumber: 1,
        startTime: new Date(),
        phases: [],
        testScenarios: [
          {
            description: 'Upload expense receipt',
            expectedOutcome: 'Auto-categorize and extract amount',
          },
        ],
      }

      const script = prepareDemoScript(session)

      const happyPath = script.sections.find(s => s.title === 'Happy Path')
      expect(happyPath?.steps).toContain('Upload expense receipt')
    })

    it('should highlight implemented edge cases', () => {
      const session: BuilderSession = {
        id: 'session_123',
        templateNumber: 16,
        startTime: new Date(),
        phases: [],
        edgeCases: [
          {
            case: 'Duplicate client detection',
            handled: true,
            approach: 'Fuzzy matching on name and contact',
          },
        ],
      }

      const script = prepareDemoScript(session)

      const edgeSection = script.sections.find(s => s.title === 'Edge Cases')
      expect(edgeSection?.callouts).toContain('Duplicate client detection')
    })

    it('should include technical explanations', () => {
      const session: BuilderSession = {
        id: 'session_123',
        templateNumber: 7,
        startTime: new Date(),
        phases: [],
        technicalHighlights: [
          'PDF generation using React-PDF',
          'Template variables with Zod validation',
        ],
      }

      const script = prepareDemoScript(session)

      expect(script.technicalNotes).toContain('React-PDF')
      expect(script.technicalNotes).toContain('Zod validation')
    })
  })
})
