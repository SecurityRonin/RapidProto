/**
 * TDD: Storage Adapter Tests
 * Tests for lib/storage/* (Phase 3)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { z } from 'zod'
import {
  createMemoryStorageAdapter,
  createFailingStorageAdapter,
} from '@/lib/storage/memory-storage'
import { createLocalStorageAdapter, getLocalStorageAdapter } from '@/lib/storage/local-storage'
import type { StorageAdapter, StorageResult } from '@/lib/storage/types'
import {
  SessionSchema,
  SessionsCollectionSchema,
  SessionStatusDataSchema,
  validateSession,
  safeValidateSession,
  PhaseSchema,
  RoleSchema,
} from '@/lib/storage/schemas'

// =============================================================================
// Test Fixtures
// =============================================================================

const createTestSession = (overrides: Partial<z.infer<typeof SessionSchema>> = {}) => ({
  id: 'test-session-1',
  status: 'active' as const,
  currentPhase: 'discovery' as const,
  phaseStartedAt: new Date().toISOString(),
  discoveryDuration: 30,
  buildDuration: 45,
  demoDuration: 15,
  startedAt: new Date().toISOString(),
  pausedAt: null,
  completedAt: null,
  totalPausedTime: 0,
  sessionTitle: 'Test Session',
  builderJoined: true,
  facilitatorJoined: false,
  facilitatorStage: 'expectations' as const,
  syncedInputs: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  steps: [],
  ...overrides,
})

const createTestStep = (overrides = {}) => ({
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
  createdAt: new Date().toISOString(),
  ...overrides,
})

// =============================================================================
// Memory Storage Adapter Tests
// =============================================================================

describe('MemoryStorageAdapter', () => {
  let adapter: ReturnType<typeof createMemoryStorageAdapter>

  beforeEach(() => {
    adapter = createMemoryStorageAdapter()
  })

  describe('get()', () => {
    it('returns null for non-existent keys', () => {
      const result = adapter.get('nonexistent', z.string())
      expect(result).toEqual({ success: true, data: null })
    })

    it('retrieves and validates stored values', () => {
      const session = createTestSession()
      adapter._getStore().set('session', JSON.stringify(session))

      const result = adapter.get('session', SessionSchema)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.id).toBe('test-session-1')
      }
    })

    it('returns error for invalid JSON', () => {
      adapter._getStore().set('invalid', 'not-json{')

      const result = adapter.get('invalid', z.string())
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('SESSION_CORRUPTED')
        expect(result.error).toContain('Invalid JSON')
      }
    })

    it('returns error for schema validation failure', () => {
      adapter._getStore().set('wrong-schema', JSON.stringify({ foo: 'bar' }))

      const result = adapter.get('wrong-schema', SessionSchema)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('SESSION_CORRUPTED')
        expect(result.error).toContain('Validation failed')
      }
    })
  })

  describe('set()', () => {
    it('stores valid data', () => {
      const session = createTestSession()
      const result = adapter.set('session', session, SessionSchema)

      expect(result.success).toBe(true)
      expect(adapter._getStore().has('session')).toBe(true)
    })

    it('rejects invalid data', () => {
      const invalidSession = { id: 123 } // id should be string
      const result = adapter.set('session', invalidSession as any, SessionSchema)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('VALIDATION_ERROR')
      }
    })

    it('serializes data as JSON', () => {
      const session = createTestSession()
      adapter.set('session', session, SessionSchema)

      const stored = adapter._getStore().get('session')
      expect(stored).toBeDefined()
      expect(() => JSON.parse(stored!)).not.toThrow()
    })
  })

  describe('remove()', () => {
    it('removes existing keys', () => {
      adapter._getStore().set('key', JSON.stringify('value'))
      expect(adapter.has('key')).toBe(true)

      const result = adapter.remove('key')
      expect(result.success).toBe(true)
      expect(adapter.has('key')).toBe(false)
    })

    it('succeeds for non-existent keys', () => {
      const result = adapter.remove('nonexistent')
      expect(result.success).toBe(true)
    })
  })

  describe('has()', () => {
    it('returns true for existing keys', () => {
      adapter._getStore().set('key', 'value')
      expect(adapter.has('key')).toBe(true)
    })

    it('returns false for non-existent keys', () => {
      expect(adapter.has('nonexistent')).toBe(false)
    })
  })

  describe('keys()', () => {
    it('returns all keys when no prefix', () => {
      adapter._getStore().set('key1', 'value1')
      adapter._getStore().set('key2', 'value2')
      adapter._getStore().set('other', 'value3')

      const keys = adapter.keys()
      expect(keys).toHaveLength(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('other')
    })

    it('filters by prefix', () => {
      adapter._getStore().set('prefix_key1', 'value1')
      adapter._getStore().set('prefix_key2', 'value2')
      adapter._getStore().set('other', 'value3')

      const keys = adapter.keys('prefix_')
      expect(keys).toHaveLength(2)
      expect(keys).toContain('prefix_key1')
      expect(keys).toContain('prefix_key2')
      expect(keys).not.toContain('other')
    })

    it('returns empty array when no matches', () => {
      adapter._getStore().set('key1', 'value1')
      const keys = adapter.keys('nonexistent_')
      expect(keys).toHaveLength(0)
    })
  })

  describe('clear()', () => {
    it('removes all data', () => {
      adapter._getStore().set('key1', 'value1')
      adapter._getStore().set('key2', 'value2')

      const result = adapter.clear()
      expect(result.success).toBe(true)
      expect(adapter._getStore().size).toBe(0)
    })
  })

  describe('transaction()', () => {
    it('commits successful transactions', () => {
      const session = createTestSession()

      const result = adapter.transaction((txAdapter) => {
        txAdapter.set('session', session, SessionSchema)
        return { success: true, data: 'committed' } as StorageResult<string>
      })

      expect(result.success).toBe(true)
      expect(adapter.has('session')).toBe(true)
    })

    it('rolls back failed transactions', () => {
      adapter.set('existing', 'value', z.string())

      const result = adapter.transaction((txAdapter) => {
        txAdapter.set('new-key', 'new-value', z.string())
        return { success: false, error: 'intentional failure', code: 'TEST_ERROR' }
      })

      expect(result.success).toBe(false)
      // new-key should not exist after rollback
      expect(adapter.has('new-key')).toBe(false)
      // existing key should still be there
      expect(adapter.has('existing')).toBe(true)
    })

    it('rolls back on exception', () => {
      adapter.set('existing', 'value', z.string())

      const result = adapter.transaction(() => {
        adapter.set('new-key', 'new-value', z.string())
        throw new Error('Transaction error')
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Transaction error')
      }
      expect(adapter.has('new-key')).toBe(false)
      expect(adapter.has('existing')).toBe(true)
    })
  })

  describe('test helpers', () => {
    it('_getStore returns internal store', () => {
      const store = adapter._getStore()
      expect(store).toBeInstanceOf(Map)
    })

    it('_setStore replaces store contents', () => {
      adapter._setStore({ key1: 'value1', key2: 'value2' })
      expect(adapter._getStore().size).toBe(2)
      expect(adapter._getStore().get('key1')).toBe('value1')
    })

    it('_clear empties the store', () => {
      adapter._getStore().set('key', 'value')
      adapter._clear()
      expect(adapter._getStore().size).toBe(0)
    })
  })

  describe('initialData', () => {
    it('initializes with provided data', () => {
      const adapterWithData = createMemoryStorageAdapter({
        sessions: [createTestSession()],
      })

      const result = adapterWithData.get('sessions', SessionsCollectionSchema)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
      }
    })
  })
})

// =============================================================================
// Failing Storage Adapter Tests
// =============================================================================

describe('FailingStorageAdapter', () => {
  it('returns failure for all operations', () => {
    const adapter = createFailingStorageAdapter()

    expect(adapter.get('key', z.string()).success).toBe(false)
    expect(adapter.set('key', 'value', z.string()).success).toBe(false)
    expect(adapter.remove('key').success).toBe(false)
    expect(adapter.clear().success).toBe(false)
    expect(adapter.transaction(() => ({ success: true, data: null }))).toEqual({
      success: false,
      error: 'Storage not available',
      code: 'STORAGE_UNAVAILABLE',
    })
  })

  it('uses custom error code and message', () => {
    const adapter = createFailingStorageAdapter('CUSTOM_ERROR', 'Custom message')

    const result = adapter.get('key', z.string())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('CUSTOM_ERROR')
      expect(result.error).toBe('Custom message')
    }
  })

  it('has returns false', () => {
    const adapter = createFailingStorageAdapter()
    expect(adapter.has('key')).toBe(false)
  })

  it('keys returns empty array', () => {
    const adapter = createFailingStorageAdapter()
    expect(adapter.keys()).toEqual([])
  })
})

// =============================================================================
// LocalStorage Adapter Tests (with mocked localStorage)
// =============================================================================

describe('LocalStorageAdapter', () => {
  let mockStorage: Map<string, string>
  let originalWindow: typeof globalThis.window

  beforeEach(() => {
    mockStorage = new Map()
    originalWindow = globalThis.window

    // Mock localStorage
    const localStorageMock = {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, value: string) => mockStorage.set(key, value),
      removeItem: (key: string) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
      key: (index: number) => Array.from(mockStorage.keys())[index] ?? null,
      get length() {
        return mockStorage.size
      },
    }

    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: localStorageMock },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    })
  })

  it('creates adapter successfully', () => {
    const adapter = createLocalStorageAdapter()
    expect(adapter).toBeDefined()
    expect(typeof adapter.get).toBe('function')
    expect(typeof adapter.set).toBe('function')
  })

  it('get returns null for non-existent keys', () => {
    const adapter = createLocalStorageAdapter()
    const result = adapter.get('nonexistent', z.string())
    expect(result).toEqual({ success: true, data: null })
  })

  it('set stores and get retrieves data', () => {
    const adapter = createLocalStorageAdapter()
    const session = createTestSession()

    adapter.set('session', session, SessionSchema)
    const result = adapter.get('session', SessionSchema)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data?.id).toBe('test-session-1')
    }
  })

  it('validates data on set', () => {
    const adapter = createLocalStorageAdapter()
    const invalidSession = { foo: 'bar' }

    const result = adapter.set('session', invalidSession as any, SessionSchema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('VALIDATION_ERROR')
    }
  })

  it('validates data on get', () => {
    const adapter = createLocalStorageAdapter()
    mockStorage.set('corrupted', JSON.stringify({ foo: 'bar' }))

    const result = adapter.get('corrupted', SessionSchema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('SESSION_CORRUPTED')
    }
  })

  it('handles invalid JSON on get', () => {
    const adapter = createLocalStorageAdapter()
    mockStorage.set('invalid', 'not-json{')

    const result = adapter.get('invalid', z.string())
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('SESSION_CORRUPTED')
    }
  })

  it('remove deletes keys', () => {
    const adapter = createLocalStorageAdapter()
    mockStorage.set('key', 'value')

    adapter.remove('key')
    expect(mockStorage.has('key')).toBe(false)
  })

  it('has checks key existence', () => {
    const adapter = createLocalStorageAdapter()
    mockStorage.set('key', 'value')

    expect(adapter.has('key')).toBe(true)
    expect(adapter.has('nonexistent')).toBe(false)
  })

  it('keys returns all keys', () => {
    const adapter = createLocalStorageAdapter()
    mockStorage.set('key1', 'value1')
    mockStorage.set('key2', 'value2')

    const keys = adapter.keys()
    expect(keys).toContain('key1')
    expect(keys).toContain('key2')
  })

  it('keys filters by prefix', () => {
    const adapter = createLocalStorageAdapter()
    mockStorage.set('prefix_a', 'value1')
    mockStorage.set('prefix_b', 'value2')
    mockStorage.set('other', 'value3')

    const keys = adapter.keys('prefix_')
    expect(keys).toHaveLength(2)
    expect(keys).not.toContain('other')
  })

  it('clear removes all data', () => {
    const adapter = createLocalStorageAdapter()
    mockStorage.set('key1', 'value1')
    mockStorage.set('key2', 'value2')

    adapter.clear()
    expect(mockStorage.size).toBe(0)
  })

  describe('transaction()', () => {
    it('commits successful transactions', () => {
      const adapter = createLocalStorageAdapter()
      mockStorage.set('existing', JSON.stringify('original'))

      const result = adapter.transaction((txAdapter) => {
        txAdapter.set('new-key', 'new-value', z.string())
        return { success: true, data: 'done' }
      })

      expect(result.success).toBe(true)
      expect(mockStorage.has('new-key')).toBe(true)
    })

    it('rolls back failed transactions', () => {
      const adapter = createLocalStorageAdapter()
      mockStorage.set('existing', JSON.stringify('original'))

      adapter.transaction((txAdapter) => {
        txAdapter.set('new-key', 'new-value', z.string())
        return { success: false, error: 'failed', code: 'TEST' }
      })

      // Rollback should restore original state
      expect(mockStorage.has('new-key')).toBe(false)
      expect(mockStorage.get('existing')).toBe(JSON.stringify('original'))
    })
  })

  describe('SSR safety', () => {
    it('handles missing window gracefully', () => {
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const adapter = createLocalStorageAdapter()

      expect(adapter.get('key', z.string())).toEqual({
        success: false,
        error: 'Storage not available',
        code: 'STORAGE_UNAVAILABLE',
      })
      expect(adapter.set('key', 'value', z.string())).toEqual({
        success: false,
        error: 'Storage not available',
        code: 'STORAGE_UNAVAILABLE',
      })
      expect(adapter.has('key')).toBe(false)
      expect(adapter.keys()).toEqual([])
    })
  })

  describe('singleton', () => {
    it('getLocalStorageAdapter returns same instance', () => {
      const adapter1 = getLocalStorageAdapter()
      const adapter2 = getLocalStorageAdapter()
      expect(adapter1).toBe(adapter2)
    })
  })
})

// =============================================================================
// Schema Tests
// =============================================================================

describe('Storage Schemas', () => {
  describe('SessionSchema', () => {
    it('validates valid session', () => {
      const session = createTestSession()
      const result = SessionSchema.safeParse(session)
      expect(result.success).toBe(true)
    })

    it('rejects session with missing required fields', () => {
      const invalid = { id: 'test' }
      const result = SessionSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('rejects session with invalid status', () => {
      const session = createTestSession({ status: 'invalid' as any })
      const result = SessionSchema.safeParse(session)
      expect(result.success).toBe(false)
    })

    it('accepts nullable fields', () => {
      const session = createTestSession({
        pausedAt: null,
        completedAt: null,
        sessionTitle: null,
      })
      const result = SessionSchema.safeParse(session)
      expect(result.success).toBe(true)
    })

    it('validates steps array', () => {
      const session = createTestSession({
        steps: [createTestStep()],
      })
      const result = SessionSchema.safeParse(session)
      expect(result.success).toBe(true)
    })
  })

  describe('SessionsCollectionSchema', () => {
    it('validates array of sessions', () => {
      const sessions = [createTestSession(), createTestSession({ id: 'session-2' })]
      const result = SessionsCollectionSchema.safeParse(sessions)
      expect(result.success).toBe(true)
    })

    it('validates empty array', () => {
      const result = SessionsCollectionSchema.safeParse([])
      expect(result.success).toBe(true)
    })

    it('rejects non-array', () => {
      const result = SessionsCollectionSchema.safeParse({ sessions: [] })
      expect(result.success).toBe(false)
    })
  })

  describe('SessionStatusDataSchema', () => {
    it('validates recovery data', () => {
      const recoveryData = {
        session: createTestSession(),
        currentPhase: 'discovery' as const,
        timeRemaining: {
          phase: 'discovery' as const,
          totalMinutes: 30,
          elapsedMinutes: 10,
          remainingMinutes: 20,
          isOvertime: false,
          overtimeMinutes: 0,
        },
        stepsCompleted: 2,
        stepsTotal: 10,
        savedAt: Date.now(),
      }
      const result = SessionStatusDataSchema.safeParse(recoveryData)
      expect(result.success).toBe(true)
    })
  })

  describe('PhaseSchema', () => {
    it('accepts valid phases', () => {
      expect(PhaseSchema.safeParse('discovery').success).toBe(true)
      expect(PhaseSchema.safeParse('build').success).toBe(true)
      expect(PhaseSchema.safeParse('demo').success).toBe(true)
    })

    it('rejects invalid phases', () => {
      expect(PhaseSchema.safeParse('invalid').success).toBe(false)
    })
  })

  describe('RoleSchema', () => {
    it('accepts valid roles', () => {
      expect(RoleSchema.safeParse('builder').success).toBe(true)
      expect(RoleSchema.safeParse('facilitator').success).toBe(true)
    })

    it('rejects invalid roles', () => {
      expect(RoleSchema.safeParse('admin').success).toBe(false)
    })
  })

  describe('validation helpers', () => {
    it('validateSession throws on invalid data', () => {
      expect(() => validateSession({})).toThrow()
    })

    it('validateSession returns data on valid input', () => {
      const session = createTestSession()
      const validated = validateSession(session)
      expect(validated.id).toBe('test-session-1')
    })

    it('safeValidateSession returns null on invalid data', () => {
      const result = safeValidateSession({})
      expect(result).toBeNull()
    })

    it('safeValidateSession returns data on valid input', () => {
      const session = createTestSession()
      const result = safeValidateSession(session)
      expect(result?.id).toBe('test-session-1')
    })
  })
})

// =============================================================================
// Integration Tests
// =============================================================================

describe('Storage Integration', () => {
  it('memory adapter can store and retrieve full session', () => {
    const adapter = createMemoryStorageAdapter()
    const session = createTestSession({
      steps: [
        createTestStep({ id: 'step-1', stepNumber: 1 }),
        createTestStep({ id: 'step-2', stepNumber: 2 }),
      ],
    })

    const setResult = adapter.set('session', session, SessionSchema)
    expect(setResult.success).toBe(true)

    const getResult = adapter.get('session', SessionSchema)
    expect(getResult.success).toBe(true)
    if (getResult.success) {
      expect(getResult.data?.steps).toHaveLength(2)
      expect(getResult.data?.steps[0].id).toBe('step-1')
    }
  })

  it('memory adapter can store sessions collection', () => {
    const adapter = createMemoryStorageAdapter()
    const sessions = [
      createTestSession({ id: 'session-1' }),
      createTestSession({ id: 'session-2', status: 'completed' as const }),
    ]

    adapter.set('rapidproto_sessions', sessions, SessionsCollectionSchema)
    const result = adapter.get('rapidproto_sessions', SessionsCollectionSchema)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
      expect(result.data?.[1].status).toBe('completed')
    }
  })

  it('preserves date strings through serialization', () => {
    const adapter = createMemoryStorageAdapter()
    const now = new Date().toISOString()
    const session = createTestSession({
      startedAt: now,
      phaseStartedAt: now,
    })

    adapter.set('session', session, SessionSchema)
    const result = adapter.get('session', SessionSchema)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data?.startedAt).toBe(now)
      expect(result.data?.phaseStartedAt).toBe(now)
    }
  })
})
