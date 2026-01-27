/**
 * TDD: Dual-Mode Schema Tests
 * Tests for builder-facilitator session sync
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { setupTestDb, clearDatabase, type TestDb } from '@/test/db-helpers'
import { sessions, sessionSteps } from '@/lib/db/schema'

describe('Dual-Mode Schema', () => {
  let testDb: TestDb

  beforeEach(async () => {
    testDb = await setupTestDb()
  })

  afterEach(async () => {
    await clearDatabase(testDb)
  })

  describe('Session with dual roles', () => {
    it('should create session with builder joined by default', async () => {
      const sessionId = nanoid(6)
      const now = new Date()

      await testDb.insert(sessions).values({
        id: sessionId,
        status: 'active',
        currentPhase: 'discovery',
        phaseStartedAt: now,
        startedAt: now,
        builderJoined: true,
        facilitatorJoined: false,
        createdAt: now,
        updatedAt: now,
      })

      const session = await testDb.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
      })

      expect(session).toBeDefined()
      expect(session?.builderJoined).toBe(true)
      expect(session?.facilitatorJoined).toBe(false)
    })

    it('should allow facilitator to join session', async () => {
      const sessionId = nanoid(6)
      const now = new Date()

      await testDb.insert(sessions).values({
        id: sessionId,
        status: 'active',
        currentPhase: 'discovery',
        phaseStartedAt: now,
        startedAt: now,
        builderJoined: true,
        facilitatorJoined: false,
        createdAt: now,
        updatedAt: now,
      })

      // Facilitator joins
      await testDb.update(sessions)
        .set({ facilitatorJoined: true, updatedAt: new Date() })
        .where(eq(sessions.id, sessionId))

      const session = await testDb.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
      })

      expect(session?.facilitatorJoined).toBe(true)
    })
  })

  describe('Role-specific steps', () => {
    it('should create builder steps with role column', async () => {
      const sessionId = nanoid(6)
      const stepId = nanoid()
      const now = new Date()

      await testDb.insert(sessions).values({
        id: sessionId,
        status: 'active',
        currentPhase: 'discovery',
        phaseStartedAt: now,
        startedAt: now,
        builderJoined: true,
        facilitatorJoined: false,
        createdAt: now,
        updatedAt: now,
      })

      await testDb.insert(sessionSteps).values({
        id: stepId,
        sessionId,
        role: 'builder',
        phase: 'discovery',
        stepNumber: 1,
        title: 'Define core feature',
        description: 'What is the ONE thing this prototype must do?',
        estimatedMinutes: 3,
        status: 'pending',
        createdAt: now,
      })

      const step = await testDb.query.sessionSteps.findFirst({
        where: eq(sessionSteps.id, stepId),
      })

      expect(step).toBeDefined()
      expect(step?.role).toBe('builder')
      expect(step?.phase).toBe('discovery')
    })

    it('should create facilitator steps with facilitator phases', async () => {
      const sessionId = nanoid(6)
      const stepId = nanoid()
      const now = new Date()

      await testDb.insert(sessions).values({
        id: sessionId,
        status: 'active',
        currentPhase: 'build',
        phaseStartedAt: now,
        startedAt: now,
        builderJoined: true,
        facilitatorJoined: true,
        createdAt: now,
        updatedAt: now,
      })

      await testDb.insert(sessionSteps).values({
        id: stepId,
        sessionId,
        role: 'facilitator',
        phase: 'expectations',  // Facilitator-specific phase
        stepNumber: 1,
        title: 'Define prototype scope',
        description: 'What will the demo show?',
        estimatedMinutes: 3,
        status: 'pending',
        createdAt: now,
      })

      const step = await testDb.query.sessionSteps.findFirst({
        where: eq(sessionSteps.id, stepId),
      })

      expect(step).toBeDefined()
      expect(step?.role).toBe('facilitator')
      expect(step?.phase).toBe('expectations')
    })
  })

  describe('Acquired value sync', () => {
    it('should store acquired value on step completion', async () => {
      const sessionId = nanoid(6)
      const stepId = nanoid()
      const now = new Date()

      await testDb.insert(sessions).values({
        id: sessionId,
        status: 'active',
        currentPhase: 'discovery',
        phaseStartedAt: now,
        startedAt: now,
        builderJoined: true,
        facilitatorJoined: false,
        createdAt: now,
        updatedAt: now,
      })

      await testDb.insert(sessionSteps).values({
        id: stepId,
        sessionId,
        role: 'builder',
        phase: 'discovery',
        stepNumber: 1,
        title: 'Define core feature',
        status: 'pending',
        createdAt: now,
      })

      // Complete step with acquired value
      await testDb.update(sessionSteps)
        .set({
          status: 'completed',
          acquiredValue: 'User login with OAuth',
          completedAt: new Date(),
        })
        .where(eq(sessionSteps.id, stepId))

      const step = await testDb.query.sessionSteps.findFirst({
        where: eq(sessionSteps.id, stepId),
      })

      expect(step?.status).toBe('completed')
      expect(step?.acquiredValue).toBe('User login with OAuth')
    })

    it('should retrieve all acquired values for a session by role', async () => {
      const sessionId = nanoid(6)
      const now = new Date()

      await testDb.insert(sessions).values({
        id: sessionId,
        status: 'active',
        currentPhase: 'build',
        phaseStartedAt: now,
        startedAt: now,
        builderJoined: true,
        facilitatorJoined: true,
        createdAt: now,
        updatedAt: now,
      })

      // Builder steps with acquired values
      await testDb.insert(sessionSteps).values([
        {
          id: nanoid(),
          sessionId,
          role: 'builder',
          phase: 'discovery',
          stepNumber: 1,
          title: 'Define core feature',
          status: 'completed',
          acquiredValue: 'User login with OAuth',
          createdAt: now,
        },
        {
          id: nanoid(),
          sessionId,
          role: 'builder',
          phase: 'discovery',
          stepNumber: 2,
          title: 'Pick template',
          status: 'completed',
          acquiredValue: 'Next.js SaaS starter',
          createdAt: now,
        },
      ])

      // Facilitator steps with acquired values
      await testDb.insert(sessionSteps).values([
        {
          id: nanoid(),
          sessionId,
          role: 'facilitator',
          phase: 'expectations',
          stepNumber: 1,
          title: 'Define prototype scope',
          status: 'completed',
          acquiredValue: 'Login, dashboard, basic profile',
          createdAt: now,
        },
      ])

      // Get all steps for the session
      const allSteps = await testDb.query.sessionSteps.findMany({
        where: eq(sessionSteps.sessionId, sessionId),
      })

      const builderValues = allSteps
        .filter(s => s.role === 'builder' && s.acquiredValue)
        .map(s => ({ title: s.title, value: s.acquiredValue }))

      const facilitatorValues = allSteps
        .filter(s => s.role === 'facilitator' && s.acquiredValue)
        .map(s => ({ title: s.title, value: s.acquiredValue }))

      expect(builderValues).toHaveLength(2)
      expect(facilitatorValues).toHaveLength(1)
      expect(builderValues[0].value).toBe('User login with OAuth')
    })
  })

  describe('Session code format', () => {
    it('should use 6-character alphanumeric IDs', () => {
      const sessionId = nanoid(6)

      expect(sessionId).toHaveLength(6)
      expect(sessionId).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('should be stored with exact case', async () => {
      const sessionId = 'AbC123'
      const now = new Date()

      await testDb.insert(sessions).values({
        id: sessionId,
        status: 'active',
        currentPhase: 'discovery',
        phaseStartedAt: now,
        startedAt: now,
        builderJoined: true,
        facilitatorJoined: false,
        createdAt: now,
        updatedAt: now,
      })

      const session = await testDb.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
      })

      expect(session).toBeDefined()
      expect(session?.id).toBe('AbC123')
    })
  })
})
