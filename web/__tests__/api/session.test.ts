/**
 * TDD: Session API Route Tests
 * Tests for dual-mode session management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'
import { setupTestDb, clearDatabase, seedTestSession, type TestDb } from '@/test/db-helpers'
import { sessions, sessionSteps } from '@/lib/db/schema'
import { setTestDb, resetDb } from '@/lib/db'

// Import session actions (to be created)
import {
  createSession,
  getSession,
  joinSession,
  updateStep,
  pauseSession,
  resumeSession,
  advancePhase,
  completeSession,
} from '@/lib/actions/session'

describe('Session API', () => {
  let testDb: TestDb

  beforeEach(async () => {
    testDb = await setupTestDb()
    setTestDb(testDb)
  })

  afterEach(async () => {
    await clearDatabase(testDb)
    resetDb()
  })

  describe('createSession', () => {
    it('should create a new session with 6-char code', async () => {
      const result = await createSession({ title: 'My Prototype' })

      expect(result.success).toBe(true)
      expect(result.data?.id).toHaveLength(6)
      expect(result.data?.sessionTitle).toBe('My Prototype')
      expect(result.data?.builderJoined).toBe(true)
      expect(result.data?.facilitatorJoined).toBe(false)
    })

    it('should create builder steps for the session', async () => {
      const result = await createSession({ title: 'Test' })

      expect(result.success).toBe(true)

      const steps = await testDb.query.sessionSteps.findMany({
        where: eq(sessionSteps.sessionId, result.data!.id),
      })

      // Should have 9 builder steps (3 per phase)
      const builderSteps = steps.filter(s => s.role === 'builder')
      expect(builderSteps.length).toBe(9)
    })

    it('should set session to active and discovery phase', async () => {
      const result = await createSession({})

      expect(result.data?.status).toBe('active')
      expect(result.data?.currentPhase).toBe('discovery')
    })
  })

  describe('getSession', () => {
    it('should return session with all data for builder', async () => {
      const session = await seedTestSession(testDb, { id: 'ABC123' })

      const result = await getSession('ABC123', 'builder')

      expect(result.success).toBe(true)
      expect(result.data?.session.id).toBe('ABC123')
      expect(result.data?.role).toBe('builder')
    })

    it('should return session with facilitator data when role is facilitator', async () => {
      await seedTestSession(testDb, {
        id: 'ABC123',
        facilitatorJoined: true,
      })

      const result = await getSession('ABC123', 'facilitator')

      expect(result.success).toBe(true)
      expect(result.data?.role).toBe('facilitator')
    })

    it('should return steps filtered by role', async () => {
      const session = await seedTestSession(testDb, { id: 'XYZ789' })

      // Add builder step
      await testDb.insert(sessionSteps).values({
        id: nanoid(),
        sessionId: 'XYZ789',
        role: 'builder',
        phase: 'discovery',
        stepNumber: 1,
        title: 'Builder Step',
        status: 'pending',
        createdAt: new Date(),
      })

      // Add facilitator step
      await testDb.insert(sessionSteps).values({
        id: nanoid(),
        sessionId: 'XYZ789',
        role: 'facilitator',
        phase: 'expectations',
        stepNumber: 1,
        title: 'Facilitator Step',
        status: 'pending',
        createdAt: new Date(),
      })

      const builderResult = await getSession('XYZ789', 'builder')
      const facilitatorResult = await getSession('XYZ789', 'facilitator')

      expect(builderResult.data?.steps.every(s => s.role === 'builder')).toBe(true)
      expect(facilitatorResult.data?.steps.every(s => s.role === 'facilitator')).toBe(true)
    })

    it('should include acquired values from OTHER role for sync', async () => {
      await seedTestSession(testDb, { id: 'SYNC01', facilitatorJoined: true })

      // Builder completed a step with acquired value
      await testDb.insert(sessionSteps).values({
        id: nanoid(),
        sessionId: 'SYNC01',
        role: 'builder',
        phase: 'discovery',
        stepNumber: 1,
        title: 'Define core feature',
        status: 'completed',
        acquiredValue: 'User login with OAuth',
        createdAt: new Date(),
      })

      // Facilitator should see builder's acquired values
      const result = await getSession('SYNC01', 'facilitator')

      expect(result.data?.syncedInputs).toBeDefined()
      expect(result.data?.syncedInputs.length).toBeGreaterThan(0)
      expect(result.data?.syncedInputs[0].value).toBe('User login with OAuth')
    })

    it('should return error for non-existent session', async () => {
      const result = await getSession('NOTFOUND', 'builder')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('joinSession', () => {
    it('should allow facilitator to join existing session', async () => {
      await seedTestSession(testDb, { id: 'JOIN01' })

      const result = await joinSession('JOIN01')

      expect(result.success).toBe(true)
      expect(result.data?.facilitatorJoined).toBe(true)
    })

    it('should create facilitator steps when joining', async () => {
      await seedTestSession(testDb, { id: 'JOIN02' })

      await joinSession('JOIN02')

      const steps = await testDb.query.sessionSteps.findMany({
        where: eq(sessionSteps.sessionId, 'JOIN02'),
      })

      const facilitatorSteps = steps.filter(s => s.role === 'facilitator')
      expect(facilitatorSteps.length).toBeGreaterThan(0)
    })

    it('should return error if session not found', async () => {
      const result = await joinSession('NOTFOUND')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should return error if facilitator already joined', async () => {
      await seedTestSession(testDb, { id: 'JOIN03', facilitatorJoined: true })

      const result = await joinSession('JOIN03')

      expect(result.success).toBe(false)
      expect(result.error).toContain('already joined')
    })
  })

  describe('updateStep', () => {
    it('should update step status', async () => {
      await seedTestSession(testDb, { id: 'STEP01' })
      const stepId = nanoid()

      await testDb.insert(sessionSteps).values({
        id: stepId,
        sessionId: 'STEP01',
        role: 'builder',
        phase: 'discovery',
        stepNumber: 1,
        title: 'Test Step',
        status: 'pending',
        createdAt: new Date(),
      })

      const result = await updateStep(stepId, { status: 'completed' })

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('completed')
    })

    it('should store acquired value', async () => {
      await seedTestSession(testDb, { id: 'STEP02' })
      const stepId = nanoid()

      await testDb.insert(sessionSteps).values({
        id: stepId,
        sessionId: 'STEP02',
        role: 'builder',
        phase: 'discovery',
        stepNumber: 1,
        title: 'Define core feature',
        status: 'pending',
        createdAt: new Date(),
      })

      const result = await updateStep(stepId, {
        status: 'completed',
        acquiredValue: 'User authentication with OAuth',
      })

      expect(result.success).toBe(true)
      expect(result.data?.acquiredValue).toBe('User authentication with OAuth')
    })

    it('should set completedAt when status becomes completed', async () => {
      await seedTestSession(testDb, { id: 'STEP03' })
      const stepId = nanoid()

      await testDb.insert(sessionSteps).values({
        id: stepId,
        sessionId: 'STEP03',
        role: 'builder',
        phase: 'discovery',
        stepNumber: 1,
        title: 'Test Step',
        status: 'pending',
        createdAt: new Date(),
      })

      const result = await updateStep(stepId, { status: 'completed' })

      expect(result.data?.completedAt).toBeDefined()
    })
  })

  describe('pauseSession', () => {
    it('should pause an active session', async () => {
      await seedTestSession(testDb, { id: 'PAUSE1', status: 'active' })

      const result = await pauseSession('PAUSE1')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('paused')
      expect(result.data?.pausedAt).toBeDefined()
    })

    it('should not pause an already paused session', async () => {
      await seedTestSession(testDb, { id: 'PAUSE2', status: 'paused' })

      const result = await pauseSession('PAUSE2')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not active')
    })
  })

  describe('resumeSession', () => {
    it('should resume a paused session', async () => {
      const now = new Date()
      await testDb.insert(sessions).values({
        id: 'RESUME1',
        status: 'paused',
        currentPhase: 'discovery',
        phaseStartedAt: now,
        startedAt: now,
        pausedAt: now,
        totalPausedTime: 0,
        builderJoined: true,
        facilitatorJoined: false,
        createdAt: now,
        updatedAt: now,
      })

      const result = await resumeSession('RESUME1')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('active')
      expect(result.data?.pausedAt).toBeNull()
    })

    it('should not resume an active session', async () => {
      await seedTestSession(testDb, { id: 'RESUME2', status: 'active' })

      const result = await resumeSession('RESUME2')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not paused')
    })
  })

  describe('advancePhase', () => {
    it('should advance from discovery to build', async () => {
      await seedTestSession(testDb, { id: 'ADV001', currentPhase: 'discovery' })

      const result = await advancePhase('ADV001')

      expect(result.success).toBe(true)
      expect(result.data?.currentPhase).toBe('build')
    })

    it('should advance from build to demo', async () => {
      await seedTestSession(testDb, { id: 'ADV002', currentPhase: 'build' })

      const result = await advancePhase('ADV002')

      expect(result.success).toBe(true)
      expect(result.data?.currentPhase).toBe('demo')
    })

    it('should not advance past demo phase', async () => {
      await seedTestSession(testDb, { id: 'ADV003', currentPhase: 'demo' })

      const result = await advancePhase('ADV003')

      expect(result.success).toBe(false)
      expect(result.error).toContain('final phase')
    })
  })

  describe('completeSession', () => {
    it('should complete the session', async () => {
      await seedTestSession(testDb, { id: 'COMP01' })

      const result = await completeSession('COMP01')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('completed')
      expect(result.data?.completedAt).toBeDefined()
    })
  })
})
