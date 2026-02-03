/**
 * TDD: Session Operations Tests
 * Tests for lib/session-operations.ts (Phase 5)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Session, Phase, FacilitatorStage } from '@/lib/store'
import { SessionError } from '@/lib/utils/errors'
import {
  PHASE_ORDER,
  STAGE_ORDER,
  SYNC_MAP,
  getSessionOrThrow,
  getSessionResult,
  withSession,
  withSessionMutate,
  buildStepIndex,
  findStep,
  getNextPhase,
  getPreviousPhase,
  getNextStage,
  getPreviousStage,
  updateSyncedInputs,
  validateCanPause,
  validateCanResume,
  validateCanAdvancePhase,
  validateCanRegressPhase,
  validateCanAdvanceStage,
  validateCanRegressStage,
} from '@/lib/session-operations'

// =============================================================================
// Mock store module
// =============================================================================

vi.mock('@/lib/store', () => ({
  getSession: vi.fn(),
  saveSession: vi.fn(),
}))

import { getSession, saveSession } from '@/lib/store'

const mockGetSession = getSession as ReturnType<typeof vi.fn>
const mockSaveSession = saveSession as ReturnType<typeof vi.fn>

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'test-session-1',
  status: 'active',
  currentPhase: 'discovery',
  phaseStartedAt: new Date(),
  discoveryDuration: 30,
  buildDuration: 45,
  demoDuration: 15,
  startedAt: new Date(),
  pausedAt: null,
  completedAt: null,
  totalPausedTime: 0,
  sessionTitle: 'Test',
  builderJoined: true,
  facilitatorJoined: false,
  facilitatorStage: 'expectations',
  syncedInputs: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  steps: [],
  ...overrides,
})

const createMockStep = (overrides = {}) => ({
  id: 'step-1',
  sessionId: 'test-session-1',
  role: 'builder' as const,
  phase: 'discovery' as const,
  stepNumber: 1,
  title: 'Test Step',
  description: null,
  estimatedMinutes: null,
  status: 'pending' as const,
  acquiredValue: null,
  startedAt: null,
  completedAt: null,
  timeSpent: null,
  notes: null,
  createdAt: new Date(),
  ...overrides,
})

// =============================================================================
// Constants Tests
// =============================================================================

describe('Constants', () => {
  it('PHASE_ORDER contains all phases in correct order', () => {
    expect(PHASE_ORDER).toEqual(['discovery', 'build', 'demo'])
  })

  it('STAGE_ORDER contains all stages in correct order', () => {
    expect(STAGE_ORDER).toEqual(['expectations', 'longterm', 'close'])
  })

  it('SYNC_MAP maps step titles to sync keys', () => {
    expect(SYNC_MAP['Define the core feature']).toBe('coreFeature')
    expect(SYNC_MAP['Pick a template']).toBe('template')
    expect(SYNC_MAP['List required changes']).toBe('requiredChanges')
  })
})

// =============================================================================
// Session Lookup Tests
// =============================================================================

describe('Session Lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSessionOrThrow', () => {
    it('returns session when found', () => {
      const session = createMockSession()
      mockGetSession.mockReturnValue(session)

      const result = getSessionOrThrow('test-session-1')

      expect(result).toBe(session)
    })

    it('throws SessionError when not found', () => {
      mockGetSession.mockReturnValue(null)

      expect(() => getSessionOrThrow('nonexistent')).toThrow(SessionError)
      expect(() => getSessionOrThrow('nonexistent')).toThrow('Session not found')
    })

    it('throws SessionError with SESSION_NOT_FOUND code', () => {
      mockGetSession.mockReturnValue(null)

      try {
        getSessionOrThrow('nonexistent')
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(SessionError)
        expect((error as SessionError).code).toBe('SESSION_NOT_FOUND')
      }
    })
  })

  describe('getSessionResult', () => {
    it('returns success result when found', () => {
      const session = createMockSession()
      mockGetSession.mockReturnValue(session)

      const result = getSessionResult('test-session-1')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(session)
      }
    })

    it('returns failure result when not found', () => {
      mockGetSession.mockReturnValue(null)

      const result = getSessionResult('nonexistent')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Session not found')
        expect(result.code).toBe('SESSION_NOT_FOUND')
      }
    })
  })

  describe('withSession', () => {
    it('executes operation on found session', () => {
      const session = createMockSession()
      mockGetSession.mockReturnValue(session)

      const result = withSession('test-session-1', 'test', (s) => s.id)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('test-session-1')
      }
    })

    it('returns error when session not found', () => {
      mockGetSession.mockReturnValue(null)

      const result = withSession('nonexistent', 'test', (s) => s.id)

      expect(result.success).toBe(false)
    })

    it('handles SessionError from operation', () => {
      const session = createMockSession()
      mockGetSession.mockReturnValue(session)

      const result = withSession('test-session-1', 'test', () => {
        throw new SessionError('SESSION_INVALID_STATE', 'Custom error', 'test')
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Custom error')
        expect(result.code).toBe('SESSION_INVALID_STATE')
      }
    })
  })

  describe('withSessionMutate', () => {
    it('saves session after operation', () => {
      const session = createMockSession()
      mockGetSession.mockReturnValue(session)

      withSessionMutate('test-session-1', 'test', (s) => {
        s.status = 'paused'
        return s
      })

      expect(mockSaveSession).toHaveBeenCalled()
    })

    it('updates updatedAt timestamp', () => {
      const oldDate = new Date('2020-01-01')
      const session = createMockSession({ updatedAt: oldDate })
      mockGetSession.mockReturnValue(session)

      withSessionMutate('test-session-1', 'test', (s) => s)

      expect(session.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime())
    })
  })
})

// =============================================================================
// Step Index Tests
// =============================================================================

describe('Step Index', () => {
  describe('buildStepIndex', () => {
    it('creates map of step IDs to indices', () => {
      const session = createMockSession({
        steps: [
          createMockStep({ id: 'step-a' }),
          createMockStep({ id: 'step-b' }),
          createMockStep({ id: 'step-c' }),
        ],
      })

      const index = buildStepIndex(session)

      expect(index.get('step-a')).toBe(0)
      expect(index.get('step-b')).toBe(1)
      expect(index.get('step-c')).toBe(2)
    })

    it('returns empty map for session with no steps', () => {
      const session = createMockSession({ steps: [] })

      const index = buildStepIndex(session)

      expect(index.size).toBe(0)
    })
  })

  describe('findStep', () => {
    it('finds step with index (O(1))', () => {
      const session = createMockSession({
        steps: [
          createMockStep({ id: 'step-a' }),
          createMockStep({ id: 'step-b' }),
        ],
      })
      const index = buildStepIndex(session)

      const result = findStep(session, 'step-b', index)

      expect(result).not.toBeNull()
      expect(result?.step.id).toBe('step-b')
      expect(result?.stepIndex).toBe(1)
    })

    it('finds step without index (O(n))', () => {
      const session = createMockSession({
        steps: [
          createMockStep({ id: 'step-a' }),
          createMockStep({ id: 'step-b' }),
        ],
      })

      const result = findStep(session, 'step-b')

      expect(result).not.toBeNull()
      expect(result?.step.id).toBe('step-b')
    })

    it('returns null when step not found', () => {
      const session = createMockSession({
        steps: [createMockStep({ id: 'step-a' })],
      })

      const result = findStep(session, 'nonexistent')

      expect(result).toBeNull()
    })
  })
})

// =============================================================================
// Phase/Stage Navigation Tests
// =============================================================================

describe('Phase Navigation', () => {
  describe('getNextPhase', () => {
    it('returns build for discovery', () => {
      expect(getNextPhase('discovery')).toBe('build')
    })

    it('returns demo for build', () => {
      expect(getNextPhase('build')).toBe('demo')
    })

    it('returns null for demo', () => {
      expect(getNextPhase('demo')).toBeNull()
    })
  })

  describe('getPreviousPhase', () => {
    it('returns null for discovery', () => {
      expect(getPreviousPhase('discovery')).toBeNull()
    })

    it('returns discovery for build', () => {
      expect(getPreviousPhase('build')).toBe('discovery')
    })

    it('returns build for demo', () => {
      expect(getPreviousPhase('demo')).toBe('build')
    })
  })
})

describe('Stage Navigation', () => {
  describe('getNextStage', () => {
    it('returns longterm for expectations', () => {
      expect(getNextStage('expectations')).toBe('longterm')
    })

    it('returns close for longterm', () => {
      expect(getNextStage('longterm')).toBe('close')
    })

    it('returns null for close', () => {
      expect(getNextStage('close')).toBeNull()
    })
  })

  describe('getPreviousStage', () => {
    it('returns null for expectations', () => {
      expect(getPreviousStage('expectations')).toBeNull()
    })

    it('returns expectations for longterm', () => {
      expect(getPreviousStage('longterm')).toBe('expectations')
    })

    it('returns longterm for close', () => {
      expect(getPreviousStage('close')).toBe('longterm')
    })
  })
})

// =============================================================================
// Synced Inputs Tests
// =============================================================================

describe('updateSyncedInputs', () => {
  it('updates syncedInputs from builder step acquiredValues', () => {
    const session = createMockSession({
      steps: [
        createMockStep({
          id: 'step-1',
          role: 'builder',
          title: 'Define the core feature',
          acquiredValue: 'User auth',
        }),
        createMockStep({
          id: 'step-2',
          role: 'builder',
          title: 'Pick a template',
          acquiredValue: 'Next.js starter',
        }),
      ],
    })

    updateSyncedInputs(session)

    expect(session.syncedInputs).toEqual({
      coreFeature: 'User auth',
      template: 'Next.js starter',
    })
  })

  it('ignores facilitator steps', () => {
    const session = createMockSession({
      steps: [
        createMockStep({
          role: 'facilitator',
          title: 'Define the core feature',
          acquiredValue: 'Should be ignored',
        }),
      ],
    })

    updateSyncedInputs(session)

    expect(session.syncedInputs).toEqual({})
  })

  it('ignores steps without acquiredValue', () => {
    const session = createMockSession({
      steps: [
        createMockStep({
          role: 'builder',
          title: 'Define the core feature',
          acquiredValue: null,
        }),
      ],
    })

    updateSyncedInputs(session)

    expect(session.syncedInputs).toEqual({})
  })
})

// =============================================================================
// Validation Tests
// =============================================================================

describe('Validation', () => {
  describe('validateCanPause', () => {
    it('passes for active session', () => {
      const session = createMockSession({ status: 'active' })
      expect(() => validateCanPause(session)).not.toThrow()
    })

    it('throws for paused session', () => {
      const session = createMockSession({ status: 'paused' })
      expect(() => validateCanPause(session)).toThrow(SessionError)
    })

    it('throws for completed session', () => {
      const session = createMockSession({ status: 'completed' })
      expect(() => validateCanPause(session)).toThrow('Session is not active')
    })
  })

  describe('validateCanResume', () => {
    it('passes for paused session', () => {
      const session = createMockSession({ status: 'paused' })
      expect(() => validateCanResume(session)).not.toThrow()
    })

    it('throws for active session', () => {
      const session = createMockSession({ status: 'active' })
      expect(() => validateCanResume(session)).toThrow('Session is not paused')
    })
  })

  describe('validateCanAdvancePhase', () => {
    it('passes when not in final phase', () => {
      const session = createMockSession({ currentPhase: 'discovery' })
      expect(() => validateCanAdvancePhase(session)).not.toThrow()
    })

    it('throws when in final phase', () => {
      const session = createMockSession({ currentPhase: 'demo' })
      expect(() => validateCanAdvancePhase(session)).toThrow('Already in final phase')
    })
  })

  describe('validateCanRegressPhase', () => {
    it('passes when not in first phase', () => {
      const session = createMockSession({ currentPhase: 'build' })
      expect(() => validateCanRegressPhase(session)).not.toThrow()
    })

    it('throws when in first phase', () => {
      const session = createMockSession({ currentPhase: 'discovery' })
      expect(() => validateCanRegressPhase(session)).toThrow('Already in first phase')
    })
  })

  describe('validateCanAdvanceStage', () => {
    it('passes when not in final stage', () => {
      const session = createMockSession({ facilitatorStage: 'expectations' })
      expect(() => validateCanAdvanceStage(session)).not.toThrow()
    })

    it('throws when in final stage', () => {
      const session = createMockSession({ facilitatorStage: 'close' })
      expect(() => validateCanAdvanceStage(session)).toThrow('Already in final stage')
    })
  })

  describe('validateCanRegressStage', () => {
    it('passes when not in first stage', () => {
      const session = createMockSession({ facilitatorStage: 'longterm' })
      expect(() => validateCanRegressStage(session)).not.toThrow()
    })

    it('throws when in first stage', () => {
      const session = createMockSession({ facilitatorStage: 'expectations' })
      expect(() => validateCanRegressStage(session)).toThrow('Already in first stage')
    })
  })
})
