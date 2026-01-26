/**
 * TDD: Bidirectional Sync Tests
 * Tests the synced inputs functionality between builder and facilitator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

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
  createNewSession,
  getSession,
  joinSessionAsFacilitator,
  updateSyncedInputs,
  type Session,
} from '@/lib/store'

import { updateStep } from '@/lib/client-actions'

describe('Bidirectional Sync', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('Session Creation with Dual-Role Support', () => {
    it('should create session with builder joined', () => {
      const session = createNewSession('Test Project')

      expect(session.builderJoined).toBe(true)
      expect(session.facilitatorJoined).toBe(false)
    })

    it('should initialize empty synced inputs', () => {
      const session = createNewSession('Test Project')

      expect(session.syncedInputs).toEqual({})
    })

    it('should create both builder and facilitator steps', () => {
      const session = createNewSession('Test Project')

      const builderSteps = session.steps.filter(s => s.role === 'builder')
      const facilitatorSteps = session.steps.filter(s => s.role === 'facilitator')

      expect(builderSteps.length).toBeGreaterThan(0)
      expect(facilitatorSteps.length).toBeGreaterThan(0)
    })

    it('should have acquiredValue field on steps', () => {
      const session = createNewSession('Test Project')

      for (const step of session.steps) {
        expect(step).toHaveProperty('acquiredValue')
        expect(step.acquiredValue).toBeNull()
      }
    })
  })

  describe('Facilitator Join', () => {
    it('should allow facilitator to join session', () => {
      const session = createNewSession('Test Project')

      const updated = joinSessionAsFacilitator(session.id)

      expect(updated).not.toBeNull()
      expect(updated!.facilitatorJoined).toBe(true)
    })

    it('should persist facilitator joined status', () => {
      const session = createNewSession('Test Project')
      joinSessionAsFacilitator(session.id)

      const retrieved = getSession(session.id)
      expect(retrieved!.facilitatorJoined).toBe(true)
    })

    it('should return null for non-existent session', () => {
      const result = joinSessionAsFacilitator('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('Step Acquired Values', () => {
    it('should save acquired value on step update', () => {
      const session = createNewSession('Test Project')
      const coreFeatureStep = session.steps.find(
        s => s.role === 'builder' && s.title === 'Define the core feature'
      )!

      const result = updateStep(coreFeatureStep.id, {
        acquiredValue: 'User login with OAuth',
      })

      expect(result.success).toBe(true)
    })

    it('should update synced inputs when builder step has acquiredValue', () => {
      const session = createNewSession('Test Project')
      const coreFeatureStep = session.steps.find(
        s => s.role === 'builder' && s.title === 'Define the core feature'
      )!

      updateStep(coreFeatureStep.id, {
        acquiredValue: 'User login with OAuth',
      })

      const updated = getSession(session.id)
      expect(updated!.syncedInputs.coreFeature).toBe('User login with OAuth')
    })

    it('should sync multiple builder step values', () => {
      const session = createNewSession('Test Project')

      // Update core feature
      const coreFeatureStep = session.steps.find(
        s => s.role === 'builder' && s.title === 'Define the core feature'
      )!
      updateStep(coreFeatureStep.id, { acquiredValue: 'Invoice generator' })

      // Update template
      const templateStep = session.steps.find(
        s => s.role === 'builder' && s.title === 'Pick a template'
      )!
      updateStep(templateStep.id, { acquiredValue: 'Next.js SaaS starter' })

      const updated = getSession(session.id)
      expect(updated!.syncedInputs.coreFeature).toBe('Invoice generator')
      expect(updated!.syncedInputs.template).toBe('Next.js SaaS starter')
    })
  })

  describe('Facilitator Sees Synced Data', () => {
    it('should have synced inputs available for facilitator view', () => {
      const session = createNewSession('Test Project')
      joinSessionAsFacilitator(session.id)

      // Builder fills in discovery
      const coreFeatureStep = session.steps.find(
        s => s.role === 'builder' && s.title === 'Define the core feature'
      )!
      updateStep(coreFeatureStep.id, { acquiredValue: 'Real-time chat app' })

      // Facilitator retrieves session
      const facilitatorView = getSession(session.id)

      expect(facilitatorView!.syncedInputs.coreFeature).toBe('Real-time chat app')
    })
  })

  describe('Step Filtering by Role', () => {
    it('should allow filtering steps by builder role', () => {
      const session = createNewSession('Test Project')

      const builderSteps = session.steps.filter(s => s.role === 'builder')
      const phases = [...new Set(builderSteps.map(s => s.phase))]

      expect(phases).toContain('discovery')
      expect(phases).toContain('build')
      expect(phases).toContain('demo')
      expect(phases).not.toContain('expectations')
    })

    it('should allow filtering steps by facilitator role', () => {
      const session = createNewSession('Test Project')

      const facilitatorSteps = session.steps.filter(s => s.role === 'facilitator')
      const phases = [...new Set(facilitatorSteps.map(s => s.phase))]

      expect(phases).toContain('expectations')
      expect(phases).toContain('longterm')
      expect(phases).toContain('close')
      expect(phases).not.toContain('discovery')
    })
  })
})
