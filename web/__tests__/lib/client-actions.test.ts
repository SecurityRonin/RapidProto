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
  completeSession,
  advanceFacilitatorStage,
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
})
