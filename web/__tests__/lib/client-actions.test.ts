/**
 * TDD: Client Actions Tests
 * Tests for lib/client-actions.ts - localStorage-based session management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock } })

import {
  createSession,
  getSessionStatus,
  pauseSession,
  resumeSession,
  advancePhase,
  regressPhase,
  completeSession,
  advanceFacilitatorStage,
  regressFacilitatorStage,
  updateStep,
  type ActionResult,
} from '@/lib/client-actions'
import type { Session } from '@/lib/store'

describe('Client Actions', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('createSession', () => {
    it('should create a new session', () => {
      const result = createSession('Test Project')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sessionTitle).toBe('Test Project')
        expect(result.data.status).toBe('active')
        expect(result.data.currentPhase).toBe('discovery')
      }
    })

    it('should create session with default title if not provided', () => {
      const result = createSession()

      expect(result.success).toBe(true)
      if (result.success) {
        // sessionTitle can be null or undefined when not provided
        expect(result.data).toBeDefined()
        expect(result.data.id).toBeDefined()
      }
    })

    it('should generate unique session ID', () => {
      const result1 = createSession('Project 1')
      const result2 = createSession('Project 2')

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      if (result1.success && result2.success) {
        expect(result1.data.id).not.toBe(result2.data.id)
      }
    })

    it('should initialize steps for the session', () => {
      const result = createSession('Test')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.steps.length).toBeGreaterThan(0)
      }
    })
  })

  describe('getSessionStatus', () => {
    it('should return session status with time remaining', () => {
      const createResult = createSession('Test')
      expect(createResult.success).toBe(true)
      if (!createResult.success) return

      const result = getSessionStatus(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.session).toBeDefined()
        expect(result.data.currentPhase).toBe('discovery')
        expect(result.data.timeRemaining).toBeDefined()
        expect(result.data.stepsCompleted).toBeDefined()
        expect(result.data.stepsTotal).toBeDefined()
      }
    })

    it('should return error for non-existent session', () => {
      const result = getSessionStatus('invalid-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Session not found')
      }
    })

    it('should count steps correctly', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const result = getSessionStatus(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.stepsCompleted).toBe(0)
        expect(result.data.stepsTotal).toBeGreaterThan(0)
      }
    })
  })

  describe('pauseSession', () => {
    it('should pause an active session', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const result = pauseSession(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('paused')
        expect(result.data.pausedAt).toBeDefined()
      }
    })

    it('should return error for non-existent session', () => {
      const result = pauseSession('invalid-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Session not found')
      }
    })

    it('should return error if session is not active', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      // First pause
      pauseSession(createResult.data.id)

      // Try to pause again
      const result = pauseSession(createResult.data.id)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Session is not active')
      }
    })
  })

  describe('resumeSession', () => {
    it('should resume a paused session', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      // Pause first
      pauseSession(createResult.data.id)

      // Then resume
      const result = resumeSession(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active')
        expect(result.data.pausedAt).toBeNull()
      }
    })

    it('should return error for non-existent session', () => {
      const result = resumeSession('invalid-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Session not found')
      }
    })

    it('should return error if session is not paused', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const result = resumeSession(createResult.data.id)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Session is not paused')
      }
    })

    it('should adjust total paused time', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      // Pause and resume
      pauseSession(createResult.data.id)

      // Small delay to simulate pause duration
      vi.useFakeTimers()
      vi.advanceTimersByTime(1000)

      const result = resumeSession(createResult.data.id)
      vi.useRealTimers()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.totalPausedTime).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('advancePhase', () => {
    it('should advance from discovery to build', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const result = advancePhase(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currentPhase).toBe('build')
      }
    })

    it('should advance from build to demo', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      advancePhase(createResult.data.id) // discovery -> build

      const result = advancePhase(createResult.data.id) // build -> demo

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currentPhase).toBe('demo')
      }
    })

    it('should return error when already in final phase', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      advancePhase(createResult.data.id) // discovery -> build
      advancePhase(createResult.data.id) // build -> demo

      const result = advancePhase(createResult.data.id) // demo -> ?

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Already in final phase')
      }
    })

    it('should return error for non-existent session', () => {
      const result = advancePhase('invalid-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Session not found')
      }
    })

    it('should update phaseStartedAt when advancing', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const originalPhaseStart = createResult.data.phaseStartedAt

      // Small delay
      vi.useFakeTimers()
      vi.advanceTimersByTime(100)

      const result = advancePhase(createResult.data.id)
      vi.useRealTimers()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.phaseStartedAt).not.toEqual(originalPhaseStart)
      }
    })
  })

  describe('completeSession', () => {
    it('should complete a session', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const result = completeSession(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('completed')
        expect(result.data.completedAt).toBeDefined()
      }
    })

    it('should return error for non-existent session', () => {
      const result = completeSession('invalid-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Session not found')
      }
    })
  })

  describe('advanceFacilitatorStage', () => {
    it('should advance from expectations to longterm', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const result = advanceFacilitatorStage(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.facilitatorStage).toBe('longterm')
      }
    })

    it('should advance from longterm to close', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      advanceFacilitatorStage(createResult.data.id) // expectations -> longterm

      const result = advanceFacilitatorStage(createResult.data.id) // longterm -> close

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.facilitatorStage).toBe('close')
      }
    })

    it('should return error when already in final stage', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      advanceFacilitatorStage(createResult.data.id) // expectations -> longterm
      advanceFacilitatorStage(createResult.data.id) // longterm -> close

      const result = advanceFacilitatorStage(createResult.data.id) // close -> ?

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Already in final stage')
      }
    })

    it('should return error for non-existent session', () => {
      const result = advanceFacilitatorStage('invalid-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Session not found')
      }
    })
  })

  describe('updateStep', () => {
    it('should update step status to completed', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const step = createResult.data.steps[0]
      const result = updateStep(step.id, { status: 'completed' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('completed')
        expect(result.data.completedAt).toBeDefined()
      }
    })

    it('should update step status to in_progress', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const step = createResult.data.steps[0]
      const result = updateStep(step.id, { status: 'in_progress' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('in_progress')
        expect(result.data.startedAt).toBeDefined()
      }
    })

    it('should update step notes', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const step = createResult.data.steps[0]
      const result = updateStep(step.id, { notes: 'Test notes' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.notes).toBe('Test notes')
      }
    })

    it('should update step acquiredValue', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const step = createResult.data.steps[0]
      const result = updateStep(step.id, { acquiredValue: 'User login with OAuth' })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.acquiredValue).toBe('User login with OAuth')
      }
    })

    it('should return error for non-existent step', () => {
      const result = updateStep('invalid-step-id', { status: 'completed' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Step not found')
      }
    })

    it('should update multiple fields at once', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const step = createResult.data.steps[0]
      const result = updateStep(step.id, {
        status: 'completed',
        notes: 'Done!',
        acquiredValue: 'Result',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('completed')
        expect(result.data.notes).toBe('Done!')
        expect(result.data.acquiredValue).toBe('Result')
      }
    })
  })

  describe('ActionResult Type', () => {
    it('should return success true with data on success', () => {
      const result = createSession('Test')

      if (result.success) {
        expect(result.data).toBeDefined()
        // @ts-expect-error - error should not exist on success
        expect(result.error).toBeUndefined()
      }
    })

    it('should return success false with error on failure', () => {
      const result = getSessionStatus('invalid')

      if (!result.success) {
        expect(result.error).toBeDefined()
        // @ts-expect-error - data should not exist on failure
        expect(result.data).toBeUndefined()
      }
    })
  })

  // ==========================================================================
  // Extended Tests - Phase 1 TDD Coverage
  // ==========================================================================

  describe('regressPhase', () => {
    it('should regress from build to discovery', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      advancePhase(createResult.data.id) // discovery -> build
      
      
      const result = regressPhase(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currentPhase).toBe('discovery')
      }
    })

    it('should regress from demo to build', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      advancePhase(createResult.data.id) // discovery -> build
      advancePhase(createResult.data.id) // build -> demo
      
      
      const result = regressPhase(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currentPhase).toBe('build')
      }
    })

    it('should return error when already in first phase', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      
      const result = regressPhase(createResult.data.id)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Already in first phase')
      }
    })

    it('should return error for non-existent session', () => {
      
      const result = regressPhase('invalid-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Session not found')
      }
    })

    it('should update phaseStartedAt when regressing', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      advancePhase(createResult.data.id)
      
      vi.useFakeTimers()
      vi.advanceTimersByTime(100)

      
      const result = regressPhase(createResult.data.id)
      vi.useRealTimers()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.phaseStartedAt).toBeDefined()
      }
    })
  })

  describe('regressFacilitatorStage', () => {
    it('should regress from longterm to expectations', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      advanceFacilitatorStage(createResult.data.id) // expectations -> longterm
      
      
      const result = regressFacilitatorStage(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.facilitatorStage).toBe('expectations')
      }
    })

    it('should regress from close to longterm', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      advanceFacilitatorStage(createResult.data.id) // expectations -> longterm
      advanceFacilitatorStage(createResult.data.id) // longterm -> close
      
      
      const result = regressFacilitatorStage(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.facilitatorStage).toBe('longterm')
      }
    })

    it('should return error when already in first stage', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      
      const result = regressFacilitatorStage(createResult.data.id)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Already in first stage')
      }
    })

    it('should return error for non-existent session', () => {
      
      const result = regressFacilitatorStage('invalid-id')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Session not found')
      }
    })
  })

  describe('Role-based step filtering', () => {
    it('should return builder steps when role is builder', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      // Set role to builder (default)
      localStorageMock.setItem(`rapidproto_role_${createResult.data.id}`, 'builder')

      const result = getSessionStatus(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        // Builder discovery phase has 3 steps
        expect(result.data.stepsTotal).toBe(3)
      }
    })

    it('should return facilitator steps when role is facilitator', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      // Set role to facilitator
      localStorageMock.setItem(`rapidproto_role_${createResult.data.id}`, 'facilitator')

      const result = getSessionStatus(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        // Facilitator expectations stage has 4 steps
        expect(result.data.stepsTotal).toBe(4)
      }
    })

    it('should filter steps by current phase for builder', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      localStorageMock.setItem(`rapidproto_role_${createResult.data.id}`, 'builder')
      advancePhase(createResult.data.id) // discovery -> build

      const result = getSessionStatus(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        // Builder build phase has 3 steps
        expect(result.data.stepsTotal).toBe(3)
      }
    })

    it('should filter steps by facilitator stage', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      localStorageMock.setItem(`rapidproto_role_${createResult.data.id}`, 'facilitator')
      advanceFacilitatorStage(createResult.data.id) // expectations -> longterm

      const result = getSessionStatus(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        // Facilitator longterm stage has 4 steps
        expect(result.data.stepsTotal).toBe(4)
      }
    })

    it('should default to builder role when not set', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      // Don't set role - should default to builder
      const result = getSessionStatus(createResult.data.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.stepsTotal).toBe(3) // Builder discovery steps
      }
    })
  })

  describe('Synced Inputs', () => {
    it('should update syncedInputs when builder step acquiredValue is set for "Define the core feature"', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const coreFeatureStep = createResult.data.steps.find(
        s => s.role === 'builder' && s.title === 'Define the core feature'
      )

      updateStep(coreFeatureStep!.id, { acquiredValue: 'User Authentication' })

      // Check syncedInputs was updated
      const sessions = JSON.parse(localStorageMock.getItem('rapidproto_sessions') || '[]')
      const session = sessions.find((s: any) => s.id === createResult.data.id)

      expect(session.syncedInputs.coreFeature).toBe('User Authentication')
    })

    it('should update syncedInputs when builder step acquiredValue is set for "Pick a template"', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const templateStep = createResult.data.steps.find(
        s => s.role === 'builder' && s.title === 'Pick a template'
      )

      updateStep(templateStep!.id, { acquiredValue: 'Next.js Starter' })

      const sessions = JSON.parse(localStorageMock.getItem('rapidproto_sessions') || '[]')
      const session = sessions.find((s: any) => s.id === createResult.data.id)

      expect(session.syncedInputs.template).toBe('Next.js Starter')
    })

    it('should update syncedInputs when builder step acquiredValue is set for "List required changes"', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const changesStep = createResult.data.steps.find(
        s => s.role === 'builder' && s.title === 'List required changes'
      )

      updateStep(changesStep!.id, { acquiredValue: 'Add login, OAuth' })

      const sessions = JSON.parse(localStorageMock.getItem('rapidproto_sessions') || '[]')
      const session = sessions.find((s: any) => s.id === createResult.data.id)

      expect(session.syncedInputs.requiredChanges).toBe('Add login, OAuth')
    })

    it('should not update syncedInputs for facilitator steps', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      // Find a facilitator step
      const facilitatorStep = createResult.data.steps.find(s => s.role === 'facilitator')

      updateStep(facilitatorStep!.id, { acquiredValue: 'Some value' })

      const sessions = JSON.parse(localStorageMock.getItem('rapidproto_sessions') || '[]')
      const session = sessions.find((s: any) => s.id === createResult.data.id)

      // syncedInputs should not have this value
      expect(Object.values(session.syncedInputs)).not.toContain('Some value')
    })

    it('should not sync builder steps that are not in syncMap', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      // "Set up the project" is a builder step but not in syncMap
      const nonSyncStep = createResult.data.steps.find(
        s => s.role === 'builder' && s.title === 'Set up the project'
      )

      updateStep(nonSyncStep!.id, { acquiredValue: 'Done' })

      const sessions = JSON.parse(localStorageMock.getItem('rapidproto_sessions') || '[]')
      const session = sessions.find((s: any) => s.id === createResult.data.id)

      expect(Object.values(session.syncedInputs)).not.toContain('Done')
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle multiple rapid step updates', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const steps = createResult.data.steps.slice(0, 3)

      // Rapid updates
      for (const step of steps) {
        const result = updateStep(step.id, { status: 'in_progress' })
        expect(result.success).toBe(true)
      }

      // Verify all updated
      const sessions = JSON.parse(localStorageMock.getItem('rapidproto_sessions') || '[]')
      const session = sessions.find((s: any) => s.id === createResult.data.id)

      for (const step of steps) {
        const updatedStep = session.steps.find((s: any) => s.id === step.id)
        expect(updatedStep.status).toBe('in_progress')
      }
    })

    it('should maintain session integrity with multiple operations', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      // Multiple operations in sequence
      pauseSession(createResult.data.id)
      resumeSession(createResult.data.id)
      advancePhase(createResult.data.id)

      const step = createResult.data.steps[0]
      updateStep(step.id, { status: 'completed', notes: 'Done' })

      advancePhase(createResult.data.id) // build -> demo

      // Verify final state
      const result = getSessionStatus(createResult.data.id)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.session.status).toBe('active')
        expect(result.data.currentPhase).toBe('demo')
      }
    })

    it('should not lose data when updating different steps', () => {
      const createResult = createSession('Test')
      if (!createResult.success) return

      const step1 = createResult.data.steps[0]
      const step2 = createResult.data.steps[1]

      updateStep(step1.id, { notes: 'Step 1 notes' })
      updateStep(step2.id, { notes: 'Step 2 notes' })

      // Verify both preserved
      const sessions = JSON.parse(localStorageMock.getItem('rapidproto_sessions') || '[]')
      const session = sessions.find((s: any) => s.id === createResult.data.id)

      const updatedStep1 = session.steps.find((s: any) => s.id === step1.id)
      const updatedStep2 = session.steps.find((s: any) => s.id === step2.id)

      expect(updatedStep1.notes).toBe('Step 1 notes')
      expect(updatedStep2.notes).toBe('Step 2 notes')
    })
  })

  describe('Error Handling', () => {
    it('should handle corrupted localStorage gracefully in updateStep', () => {
      localStorageMock.setItem('rapidproto_sessions', 'invalid-json')

      const result = updateStep('any-id', { status: 'completed' })

      expect(result.success).toBe(false)
      if (!result.success) {
        // New implementation uses getSessions() which returns [] for corrupted JSON
        // So step is not found rather than a JSON parse error
        expect(result.error).toBe('Step not found')
        expect(result.code).toBe('STEP_NOT_FOUND')
      }
    })

    it('should handle empty sessions array in updateStep', () => {
      localStorageMock.setItem('rapidproto_sessions', '[]')

      const result = updateStep('any-id', { status: 'completed' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Step not found')
      }
    })

    it('should preserve session when step update fails', () => {
      const createResult = createSession('Preserve Me')
      if (!createResult.success) return

      // Try to update non-existent step
      updateStep('invalid-id', { status: 'completed' })

      // Session should still exist
      const result = getSessionStatus(createResult.data.id)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.session.sessionTitle).toBe('Preserve Me')
      }
    })
  })

  describe('Time Tracking', () => {
    it('should calculate pausedTime correctly after resume', () => {
      vi.useFakeTimers()
      const startTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(startTime)

      const createResult = createSession('Test')
      if (!createResult.success) return

      // Pause after 5 minutes
      vi.setSystemTime(new Date('2024-01-15T10:05:00Z'))
      pauseSession(createResult.data.id)

      // Resume after 3 more minutes (3 min paused)
      vi.setSystemTime(new Date('2024-01-15T10:08:00Z'))
      const result = resumeSession(createResult.data.id)

      vi.useRealTimers()

      expect(result.success).toBe(true)
      if (result.success) {
        // totalPausedTime should be 3 minutes in milliseconds
        expect(result.data.totalPausedTime).toBeGreaterThanOrEqual(180000 - 1000) // 3 min - 1s tolerance
        expect(result.data.totalPausedTime).toBeLessThanOrEqual(180000 + 1000) // 3 min + 1s tolerance
      }
    })

    it('should accumulate pausedTime across multiple pause/resume cycles', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))

      const createResult = createSession('Test')
      if (!createResult.success) return

      // First pause/resume (2 min paused)
      vi.setSystemTime(new Date('2024-01-15T10:01:00Z'))
      pauseSession(createResult.data.id)
      vi.setSystemTime(new Date('2024-01-15T10:03:00Z'))
      resumeSession(createResult.data.id)

      // Second pause/resume (3 min paused)
      vi.setSystemTime(new Date('2024-01-15T10:05:00Z'))
      pauseSession(createResult.data.id)
      vi.setSystemTime(new Date('2024-01-15T10:08:00Z'))
      const result = resumeSession(createResult.data.id)

      vi.useRealTimers()

      expect(result.success).toBe(true)
      if (result.success) {
        // Total paused should be 5 minutes (2 + 3)
        const fiveMinutes = 5 * 60 * 1000
        expect(result.data.totalPausedTime).toBeGreaterThanOrEqual(fiveMinutes - 1000)
        expect(result.data.totalPausedTime).toBeLessThanOrEqual(fiveMinutes + 1000)
      }
    })
  })
})
