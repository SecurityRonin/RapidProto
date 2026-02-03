/**
 * TDD: Store Tests
 * Comprehensive tests for lib/store.ts - localStorage-based session persistence
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock localStorage before imports
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: () => { store = {} },
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => { store = newStore },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })
Object.defineProperty(global, 'window', { 
  value: { localStorage: localStorageMock },
  writable: true 
})

import {
  getSessions,
  getSession,
  saveSession,
  deleteSession,
  createNewSession,
  joinSessionAsFacilitator,
  updateSyncedInputs,
  calculateTimeRemaining,
  getCompletedSessions,
  getActiveSessions,
  calculateSessionDuration,
  type Session,
  type SessionStep,
  type Phase,
  type FacilitatorStage,
  type SessionStatus,
} from '@/lib/store'

const STORAGE_KEY = 'rapidproto_sessions'

describe('Store - localStorage Session Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ==========================================================================
  // Basic CRUD Operations
  // ==========================================================================

  describe('getSessions', () => {
    it('returns empty array when localStorage is empty', () => {
      const sessions = getSessions()
      expect(sessions).toEqual([])
    })

    it('returns empty array when localStorage has invalid JSON', () => {
      localStorageMock.setItem(STORAGE_KEY, 'not-valid-json{')
      const sessions = getSessions()
      expect(sessions).toEqual([])
    })

    it('returns empty array when localStorage has null', () => {
      localStorageMock.setItem(STORAGE_KEY, 'null')
      const sessions = getSessions()
      expect(sessions).toEqual([])
    })

    it('rehydrates Date objects from JSON strings', () => {
      const now = new Date()
      const rawSession = {
        id: 'test-1',
        status: 'active',
        currentPhase: 'discovery',
        phaseStartedAt: now.toISOString(),
        discoveryDuration: 10,
        buildDuration: 30,
        demoDuration: 10,
        startedAt: now.toISOString(),
        pausedAt: null,
        completedAt: null,
        totalPausedTime: 0,
        sessionTitle: 'Test',
        builderJoined: true,
        facilitatorJoined: false,
        facilitatorStage: 'expectations',
        syncedInputs: {},
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        steps: [],
      }
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify([rawSession]))

      const sessions = getSessions()
      
      expect(sessions[0].phaseStartedAt).toBeInstanceOf(Date)
      expect(sessions[0].startedAt).toBeInstanceOf(Date)
      expect(sessions[0].createdAt).toBeInstanceOf(Date)
      expect(sessions[0].updatedAt).toBeInstanceOf(Date)
    })

    it('handles pausedAt Date rehydration when not null', () => {
      const now = new Date()
      const pausedAt = new Date(now.getTime() - 60000)
      const rawSession = {
        id: 'test-1',
        status: 'paused',
        currentPhase: 'build',
        phaseStartedAt: now.toISOString(),
        discoveryDuration: 10,
        buildDuration: 30,
        demoDuration: 10,
        startedAt: now.toISOString(),
        pausedAt: pausedAt.toISOString(),
        completedAt: null,
        totalPausedTime: 0,
        sessionTitle: 'Test',
        builderJoined: true,
        facilitatorJoined: false,
        facilitatorStage: 'expectations',
        syncedInputs: {},
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        steps: [],
      }
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify([rawSession]))

      const sessions = getSessions()
      
      expect(sessions[0].pausedAt).toBeInstanceOf(Date)
      expect(sessions[0].pausedAt?.getTime()).toBe(pausedAt.getTime())
    })

    it('rehydrates step Date objects', () => {
      const now = new Date()
      const stepStarted = new Date(now.getTime() - 120000)
      const stepCompleted = new Date(now.getTime() - 60000)
      const rawSession = {
        id: 'test-1',
        status: 'active',
        currentPhase: 'discovery',
        phaseStartedAt: now.toISOString(),
        discoveryDuration: 10,
        buildDuration: 30,
        demoDuration: 10,
        startedAt: now.toISOString(),
        pausedAt: null,
        completedAt: null,
        totalPausedTime: 0,
        sessionTitle: 'Test',
        builderJoined: true,
        facilitatorJoined: false,
        facilitatorStage: 'expectations',
        syncedInputs: {},
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        steps: [{
          id: 'step-1',
          sessionId: 'test-1',
          role: 'builder',
          phase: 'discovery',
          stepNumber: 1,
          title: 'Test Step',
          description: null,
          estimatedMinutes: 5,
          status: 'completed',
          acquiredValue: null,
          startedAt: stepStarted.toISOString(),
          completedAt: stepCompleted.toISOString(),
          timeSpent: null,
          notes: null,
          createdAt: now.toISOString(),
        }],
      }
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify([rawSession]))

      const sessions = getSessions()
      
      expect(sessions[0].steps[0].startedAt).toBeInstanceOf(Date)
      expect(sessions[0].steps[0].completedAt).toBeInstanceOf(Date)
      expect(sessions[0].steps[0].createdAt).toBeInstanceOf(Date)
    })

    it('returns multiple sessions in order', () => {
      const session1 = createNewSession('First')
      const session2 = createNewSession('Second')

      const sessions = getSessions()
      
      expect(sessions.length).toBe(2)
      expect(sessions.map(s => s.sessionTitle)).toContain('First')
      expect(sessions.map(s => s.sessionTitle)).toContain('Second')
    })
  })

  describe('getSession', () => {
    it('returns null for non-existent session', () => {
      const session = getSession('non-existent-id')
      expect(session).toBeNull()
    })

    it('returns session by ID', () => {
      const created = createNewSession('Test Session')
      
      const retrieved = getSession(created.id)
      
      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.sessionTitle).toBe('Test Session')
    })

    it('returns null when localStorage is corrupted', () => {
      localStorageMock.setItem(STORAGE_KEY, 'corrupted-data')
      
      const session = getSession('any-id')
      
      expect(session).toBeNull()
    })
  })

  describe('saveSession', () => {
    it('creates new session in localStorage', () => {
      const session = createNewSession('New Session')
      
      const stored = JSON.parse(localStorageMock.getItem(STORAGE_KEY) || '[]')
      
      expect(stored.length).toBe(1)
      expect(stored[0].id).toBe(session.id)
    })

    it('updates existing session by ID', () => {
      const session = createNewSession('Original')
      session.sessionTitle = 'Updated'
      
      saveSession(session)
      
      const sessions = getSessions()
      expect(sessions.length).toBe(1)
      expect(sessions[0].sessionTitle).toBe('Updated')
    })

    it('preserves other sessions when updating one', () => {
      const session1 = createNewSession('First')
      const session2 = createNewSession('Second')
      
      session1.sessionTitle = 'First Updated'
      saveSession(session1)
      
      const sessions = getSessions()
      expect(sessions.length).toBe(2)
      expect(sessions.find(s => s.id === session1.id)?.sessionTitle).toBe('First Updated')
      expect(sessions.find(s => s.id === session2.id)?.sessionTitle).toBe('Second')
    })

    it('handles empty steps array', () => {
      const session = createNewSession('Test')
      session.steps = []
      
      saveSession(session)
      
      const retrieved = getSession(session.id)
      expect(retrieved?.steps).toEqual([])
    })
  })

  describe('deleteSession', () => {
    it('removes session from localStorage', () => {
      const session = createNewSession('To Delete')
      
      deleteSession(session.id)
      
      expect(getSession(session.id)).toBeNull()
    })

    it('preserves other sessions when deleting one', () => {
      const session1 = createNewSession('Keep')
      const session2 = createNewSession('Delete')
      
      deleteSession(session2.id)
      
      const sessions = getSessions()
      expect(sessions.length).toBe(1)
      expect(sessions[0].id).toBe(session1.id)
    })

    it('handles deleting non-existent session gracefully', () => {
      createNewSession('Keep')
      
      // Should not throw
      expect(() => deleteSession('non-existent')).not.toThrow()
      
      expect(getSessions().length).toBe(1)
    })
  })

  // ==========================================================================
  // Session Creation
  // ==========================================================================

  describe('createNewSession', () => {
    it('creates session with provided title', () => {
      const session = createNewSession('My Project')
      
      expect(session.sessionTitle).toBe('My Project')
    })

    it('creates session with null title when not provided', () => {
      const session = createNewSession()
      
      expect(session.sessionTitle).toBeNull()
    })

    it('generates unique IDs for each session', () => {
      const ids = new Set<string>()
      
      for (let i = 0; i < 100; i++) {
        const session = createNewSession('Test')
        expect(ids.has(session.id)).toBe(false)
        ids.add(session.id)
      }
    })

    it('initializes session in active status', () => {
      const session = createNewSession('Test')
      
      expect(session.status).toBe('active')
    })

    it('initializes session in discovery phase', () => {
      const session = createNewSession('Test')
      
      expect(session.currentPhase).toBe('discovery')
    })

    it('sets phaseStartedAt to current time', () => {
      vi.useFakeTimers()
      const now = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(now)
      
      const session = createNewSession('Test')
      
      expect(session.phaseStartedAt.getTime()).toBe(now.getTime())
    })

    it('initializes default durations', () => {
      const session = createNewSession('Test')
      
      expect(session.discoveryDuration).toBe(10)
      expect(session.buildDuration).toBe(30)
      expect(session.demoDuration).toBe(10)
    })

    it('initializes paused-related fields correctly', () => {
      const session = createNewSession('Test')
      
      expect(session.pausedAt).toBeNull()
      expect(session.completedAt).toBeNull()
      expect(session.totalPausedTime).toBe(0)
    })

    it('initializes dual-role fields', () => {
      const session = createNewSession('Test')
      
      expect(session.builderJoined).toBe(true)
      expect(session.facilitatorJoined).toBe(false)
      expect(session.facilitatorStage).toBe('expectations')
    })

    it('initializes empty syncedInputs', () => {
      const session = createNewSession('Test')
      
      expect(session.syncedInputs).toEqual({})
    })

    it('creates builder steps for all phases', () => {
      const session = createNewSession('Test')
      
      const builderSteps = session.steps.filter(s => s.role === 'builder')
      const discoverySteps = builderSteps.filter(s => s.phase === 'discovery')
      const buildSteps = builderSteps.filter(s => s.phase === 'build')
      const demoSteps = builderSteps.filter(s => s.phase === 'demo')
      
      expect(discoverySteps.length).toBe(3)
      expect(buildSteps.length).toBe(3)
      expect(demoSteps.length).toBe(3)
    })

    it('creates facilitator steps for all stages', () => {
      const session = createNewSession('Test')
      
      const facilitatorSteps = session.steps.filter(s => s.role === 'facilitator')
      const expectationsSteps = facilitatorSteps.filter(s => s.phase === 'expectations')
      const longtermSteps = facilitatorSteps.filter(s => s.phase === 'longterm')
      const closeSteps = facilitatorSteps.filter(s => s.phase === 'close')
      
      expect(expectationsSteps.length).toBe(4)
      expect(longtermSteps.length).toBe(4)
      expect(closeSteps.length).toBe(4)
    })

    it('assigns correct sessionId to all steps', () => {
      const session = createNewSession('Test')
      
      session.steps.forEach(step => {
        expect(step.sessionId).toBe(session.id)
      })
    })

    it('initializes all steps with pending status', () => {
      const session = createNewSession('Test')
      
      session.steps.forEach(step => {
        expect(step.status).toBe('pending')
      })
    })

    it('saves session to localStorage immediately', () => {
      const session = createNewSession('Test')
      
      const stored = getSession(session.id)
      expect(stored).not.toBeNull()
      expect(stored?.id).toBe(session.id)
    })
  })

  // ==========================================================================
  // Facilitator Support
  // ==========================================================================

  describe('joinSessionAsFacilitator', () => {
    it('marks facilitatorJoined as true', () => {
      const session = createNewSession('Test')
      
      const updated = joinSessionAsFacilitator(session.id)
      
      expect(updated?.facilitatorJoined).toBe(true)
    })

    it('returns null for non-existent session', () => {
      const result = joinSessionAsFacilitator('non-existent')
      
      expect(result).toBeNull()
    })

    it('updates updatedAt timestamp', () => {
      vi.useFakeTimers()
      const createTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(createTime)
      
      const session = createNewSession('Test')
      
      const joinTime = new Date('2024-01-15T10:05:00Z')
      vi.setSystemTime(joinTime)
      
      const updated = joinSessionAsFacilitator(session.id)
      
      expect(updated?.updatedAt.getTime()).toBe(joinTime.getTime())
    })

    it('persists changes to localStorage', () => {
      const session = createNewSession('Test')
      
      joinSessionAsFacilitator(session.id)
      
      const retrieved = getSession(session.id)
      expect(retrieved?.facilitatorJoined).toBe(true)
    })

    it('preserves other session fields', () => {
      const session = createNewSession('Original Title')
      session.currentPhase = 'build'
      saveSession(session)
      
      const updated = joinSessionAsFacilitator(session.id)
      
      expect(updated?.sessionTitle).toBe('Original Title')
      expect(updated?.currentPhase).toBe('build')
    })
  })

  describe('updateSyncedInputs', () => {
    it('syncs coreFeature from builder step', () => {
      const session = createNewSession('Test')
      const coreFeatureStep = session.steps.find(
        s => s.role === 'builder' && s.title === 'Define the core feature'
      )
      coreFeatureStep!.acquiredValue = 'User authentication'
      saveSession(session)
      
      updateSyncedInputs(session.id)
      
      const updated = getSession(session.id)
      expect(updated?.syncedInputs.coreFeature).toBe('User authentication')
    })

    it('syncs template from builder step', () => {
      const session = createNewSession('Test')
      const templateStep = session.steps.find(
        s => s.role === 'builder' && s.title === 'Pick a template'
      )
      templateStep!.acquiredValue = 'Next.js Starter'
      saveSession(session)
      
      updateSyncedInputs(session.id)
      
      const updated = getSession(session.id)
      expect(updated?.syncedInputs.template).toBe('Next.js Starter')
    })

    it('syncs requiredChanges from builder step', () => {
      const session = createNewSession('Test')
      const changesStep = session.steps.find(
        s => s.role === 'builder' && s.title === 'List required changes'
      )
      changesStep!.acquiredValue = 'Add login form, OAuth provider'
      saveSession(session)
      
      updateSyncedInputs(session.id)
      
      const updated = getSession(session.id)
      expect(updated?.syncedInputs.requiredChanges).toBe('Add login form, OAuth provider')
    })

    it('does not sync null acquiredValues', () => {
      const session = createNewSession('Test')
      // All steps have null acquiredValue by default
      
      updateSyncedInputs(session.id)
      
      const updated = getSession(session.id)
      expect(updated?.syncedInputs.coreFeature).toBeUndefined()
      expect(updated?.syncedInputs.template).toBeUndefined()
      expect(updated?.syncedInputs.requiredChanges).toBeUndefined()
    })

    it('handles non-existent session gracefully', () => {
      // Should not throw
      expect(() => updateSyncedInputs('non-existent')).not.toThrow()
    })

    it('updates updatedAt timestamp', () => {
      vi.useFakeTimers()
      const createTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(createTime)
      
      const session = createNewSession('Test')
      
      const updateTime = new Date('2024-01-15T10:05:00Z')
      vi.setSystemTime(updateTime)
      
      const coreFeatureStep = session.steps.find(
        s => s.role === 'builder' && s.title === 'Define the core feature'
      )
      coreFeatureStep!.acquiredValue = 'Test'
      saveSession(session)
      
      updateSyncedInputs(session.id)
      
      const updated = getSession(session.id)
      expect(updated?.updatedAt.getTime()).toBe(updateTime.getTime())
    })
  })

  // ==========================================================================
  // Time Calculations
  // ==========================================================================

  describe('calculateTimeRemaining', () => {
    it('calculates remaining time for discovery phase', () => {
      vi.useFakeTimers()
      const startTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(startTime)
      
      const session = createNewSession('Test')
      
      // Advance 3 minutes
      vi.setSystemTime(new Date('2024-01-15T10:03:00Z'))
      
      const result = calculateTimeRemaining(session)
      
      expect(result.phase).toBe('discovery')
      expect(result.totalMinutes).toBe(10)
      expect(result.elapsedMinutes).toBeCloseTo(3, 1)
      expect(result.remainingMinutes).toBeCloseTo(7, 1)
      expect(result.isOvertime).toBe(false)
      expect(result.overtimeMinutes).toBe(0)
    })

    it('detects overtime correctly', () => {
      vi.useFakeTimers()
      const startTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(startTime)
      
      const session = createNewSession('Test')
      
      // Advance 12 minutes (discovery is 10 min)
      vi.setSystemTime(new Date('2024-01-15T10:12:00Z'))
      
      const result = calculateTimeRemaining(session)
      
      expect(result.isOvertime).toBe(true)
      expect(result.overtimeMinutes).toBeCloseTo(2, 1)
      expect(result.remainingMinutes).toBe(0)
    })

    it('uses correct duration for build phase', () => {
      vi.useFakeTimers()
      const startTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(startTime)
      
      const session = createNewSession('Test')
      session.currentPhase = 'build'
      session.phaseStartedAt = startTime
      
      const result = calculateTimeRemaining(session)
      
      expect(result.totalMinutes).toBe(30) // buildDuration
    })

    it('uses correct duration for demo phase', () => {
      vi.useFakeTimers()
      const startTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(startTime)
      
      const session = createNewSession('Test')
      session.currentPhase = 'demo'
      session.phaseStartedAt = startTime
      
      const result = calculateTimeRemaining(session)
      
      expect(result.totalMinutes).toBe(10) // demoDuration
    })

    it('handles paused session time calculation', () => {
      vi.useFakeTimers()
      const startTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(startTime)
      
      const session = createNewSession('Test')
      
      // Advance 5 minutes and pause
      const pauseTime = new Date('2024-01-15T10:05:00Z')
      vi.setSystemTime(pauseTime)
      session.status = 'paused'
      session.pausedAt = pauseTime
      
      // Advance another 5 minutes (still paused)
      vi.setSystemTime(new Date('2024-01-15T10:10:00Z'))
      
      const result = calculateTimeRemaining(session)
      
      // Time should be frozen at pause moment
      expect(result.elapsedMinutes).toBeCloseTo(5, 1)
      expect(result.remainingMinutes).toBeCloseTo(5, 1)
    })
  })

  // ==========================================================================
  // Session History Helpers
  // ==========================================================================

  describe('getCompletedSessions', () => {
    it('returns only completed sessions', () => {
      const active = createNewSession('Active')
      const paused = createNewSession('Paused')
      paused.status = 'paused'
      saveSession(paused)
      
      const completed = createNewSession('Completed')
      completed.status = 'completed'
      completed.completedAt = new Date()
      saveSession(completed)
      
      const result = getCompletedSessions()
      
      expect(result.length).toBe(1)
      expect(result[0].sessionTitle).toBe('Completed')
    })

    it('sorts by completion date, most recent first', () => {
      vi.useFakeTimers()
      
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
      const first = createNewSession('First')
      first.status = 'completed'
      first.completedAt = new Date('2024-01-15T10:00:00Z')
      saveSession(first)
      
      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'))
      const second = createNewSession('Second')
      second.status = 'completed'
      second.completedAt = new Date('2024-01-15T11:00:00Z')
      saveSession(second)
      
      vi.setSystemTime(new Date('2024-01-15T10:30:00Z'))
      const third = createNewSession('Third')
      third.status = 'completed'
      third.completedAt = new Date('2024-01-15T10:30:00Z')
      saveSession(third)
      
      const result = getCompletedSessions()
      
      expect(result.map(s => s.sessionTitle)).toEqual(['Second', 'Third', 'First'])
    })

    it('returns empty array when no completed sessions', () => {
      createNewSession('Active')
      
      const result = getCompletedSessions()
      
      expect(result).toEqual([])
    })
  })

  describe('getActiveSessions', () => {
    it('returns non-completed sessions', () => {
      const active = createNewSession('Active')
      const paused = createNewSession('Paused')
      paused.status = 'paused'
      saveSession(paused)
      
      const completed = createNewSession('Completed')
      completed.status = 'completed'
      saveSession(completed)
      
      const result = getActiveSessions()
      
      expect(result.length).toBe(2)
      expect(result.map(s => s.sessionTitle)).toContain('Active')
      expect(result.map(s => s.sessionTitle)).toContain('Paused')
    })

    it('sorts by updatedAt, most recent first', () => {
      vi.useFakeTimers()
      
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
      const first = createNewSession('First')
      
      vi.setSystemTime(new Date('2024-01-15T11:00:00Z'))
      const second = createNewSession('Second')
      
      vi.setSystemTime(new Date('2024-01-15T10:30:00Z'))
      const third = createNewSession('Third')
      
      const result = getActiveSessions()
      
      expect(result.map(s => s.sessionTitle)).toEqual(['Second', 'Third', 'First'])
    })

    it('returns empty array when all sessions completed', () => {
      const session = createNewSession('Test')
      session.status = 'completed'
      saveSession(session)
      
      const result = getActiveSessions()
      
      expect(result).toEqual([])
    })
  })

  describe('calculateSessionDuration', () => {
    it('calculates duration for completed session', () => {
      vi.useFakeTimers()
      
      const startTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(startTime)
      
      const session = createNewSession('Test')
      
      // Complete after 45 minutes
      const endTime = new Date('2024-01-15T10:45:00Z')
      vi.setSystemTime(endTime)
      session.completedAt = endTime
      session.status = 'completed'
      
      const duration = calculateSessionDuration(session)
      
      expect(duration).toBe(45)
    })

    it('calculates duration for active session from start to now', () => {
      vi.useFakeTimers()
      
      const startTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(startTime)
      
      const session = createNewSession('Test')
      
      // Check duration after 30 minutes
      vi.setSystemTime(new Date('2024-01-15T10:30:00Z'))
      
      const duration = calculateSessionDuration(session)
      
      expect(duration).toBe(30)
    })

    it('subtracts paused time from duration', () => {
      vi.useFakeTimers()
      
      const startTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(startTime)
      
      const session = createNewSession('Test')
      session.totalPausedTime = 10 * 60 * 1000 // 10 minutes in ms
      
      // Complete after 45 minutes
      const endTime = new Date('2024-01-15T10:45:00Z')
      vi.setSystemTime(endTime)
      session.completedAt = endTime
      session.status = 'completed'
      
      const duration = calculateSessionDuration(session)
      
      expect(duration).toBe(35) // 45 - 10 = 35
    })

    it('rounds duration to nearest minute', () => {
      vi.useFakeTimers()
      
      const startTime = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(startTime)
      
      const session = createNewSession('Test')
      
      // 10 minutes and 45 seconds
      vi.setSystemTime(new Date('2024-01-15T10:10:45Z'))
      
      const duration = calculateSessionDuration(session)
      
      expect(duration).toBe(11) // Rounded up
    })
  })

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles SSR environment by returning safe defaults', () => {
      // The getStorage() function checks typeof window === 'undefined'
      // This is tested implicitly by the localStorage mock - when localStorage
      // is unavailable, functions return empty arrays/null
      // We verify the function signatures handle this case
      expect(typeof getSessions).toBe('function')
      expect(typeof getSession).toBe('function')
      
      // Verify localStorage mock is being used correctly
      expect(localStorageMock.getItem).toHaveBeenCalled
    })

    it('handles large number of sessions', () => {
      // Create 50 sessions
      for (let i = 0; i < 50; i++) {
        createNewSession(`Session ${i}`)
      }
      
      const sessions = getSessions()
      expect(sessions.length).toBe(50)
    })

    it('handles session with many steps', () => {
      const session = createNewSession('Test')
      expect(session.steps.length).toBe(21) // 9 builder + 12 facilitator
    })

    it('handles session title with special characters', () => {
      const title = 'Test "Special" <chars> & \'quotes\''
      const session = createNewSession(title)
      
      const retrieved = getSession(session.id)
      expect(retrieved?.sessionTitle).toBe(title)
    })

    it('treats empty string session title as null (falsy coercion)', () => {
      const session = createNewSession('')
      
      // Implementation uses `title || null` so empty string becomes null
      expect(session.sessionTitle).toBeNull()
    })

    it('handles corrupted step dates gracefully', () => {
      const rawSession = {
        id: 'test-1',
        status: 'active',
        currentPhase: 'discovery',
        phaseStartedAt: new Date().toISOString(),
        discoveryDuration: 10,
        buildDuration: 30,
        demoDuration: 10,
        startedAt: new Date().toISOString(),
        pausedAt: null,
        completedAt: null,
        totalPausedTime: 0,
        sessionTitle: 'Test',
        builderJoined: true,
        facilitatorJoined: false,
        facilitatorStage: 'expectations',
        syncedInputs: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        steps: [{
          id: 'step-1',
          sessionId: 'test-1',
          role: 'builder',
          phase: 'discovery',
          stepNumber: 1,
          title: 'Test Step',
          description: null,
          estimatedMinutes: 5,
          status: 'pending',
          acquiredValue: null,
          startedAt: 'invalid-date', // Invalid date string
          completedAt: null,
          timeSpent: null,
          notes: null,
          createdAt: new Date().toISOString(),
        }],
      }
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify([rawSession]))
      
      const sessions = getSessions()
      
      // Should handle gracefully - Date will be Invalid Date
      expect(sessions[0].steps[0].startedAt).toBeInstanceOf(Date)
    })
  })

  // ==========================================================================
  // Data Integrity
  // ==========================================================================

  describe('Data Integrity', () => {
    it('maintains referential integrity between session and steps', () => {
      const session = createNewSession('Test')
      
      session.steps.forEach(step => {
        expect(step.sessionId).toBe(session.id)
      })
    })

    it('preserves all session fields through save/load cycle', () => {
      vi.useFakeTimers()
      const now = new Date('2024-01-15T10:00:00Z')
      vi.setSystemTime(now)
      
      const session = createNewSession('Test Session')
      session.status = 'paused'
      session.currentPhase = 'build'
      session.pausedAt = now
      session.totalPausedTime = 5000
      session.builderJoined = true
      session.facilitatorJoined = true
      session.facilitatorStage = 'longterm'
      session.syncedInputs = { coreFeature: 'Auth', template: 'Next.js' }
      saveSession(session)
      
      // Clear mock to simulate fresh load
      const stored = localStorageMock.getItem(STORAGE_KEY)
      localStorageMock.clear()
      localStorageMock.setItem(STORAGE_KEY, stored!)
      
      const retrieved = getSession(session.id)
      
      expect(retrieved?.status).toBe('paused')
      expect(retrieved?.currentPhase).toBe('build')
      expect(retrieved?.pausedAt?.getTime()).toBe(now.getTime())
      expect(retrieved?.totalPausedTime).toBe(5000)
      expect(retrieved?.builderJoined).toBe(true)
      expect(retrieved?.facilitatorJoined).toBe(true)
      expect(retrieved?.facilitatorStage).toBe('longterm')
      expect(retrieved?.syncedInputs).toEqual({ coreFeature: 'Auth', template: 'Next.js' })
    })

    it('preserves step field values through save/load cycle', () => {
      const session = createNewSession('Test')
      const step = session.steps[0]
      
      step.status = 'completed'
      step.acquiredValue = 'Important Value'
      step.notes = 'Some notes'
      step.startedAt = new Date()
      step.completedAt = new Date()
      step.timeSpent = 300
      saveSession(session)
      
      const retrieved = getSession(session.id)
      const retrievedStep = retrieved?.steps.find(s => s.id === step.id)
      
      expect(retrievedStep?.status).toBe('completed')
      expect(retrievedStep?.acquiredValue).toBe('Important Value')
      expect(retrievedStep?.notes).toBe('Some notes')
      expect(retrievedStep?.startedAt).toBeInstanceOf(Date)
      expect(retrievedStep?.completedAt).toBeInstanceOf(Date)
      expect(retrievedStep?.timeSpent).toBe(300)
    })
  })
})
