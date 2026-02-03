/**
 * TDD: Extracted Session Hooks Tests
 * Tests for hooks/session/* (Phase 4)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useSessionRecovery } from '@/hooks/session/use-session-recovery'
import { useSessionPolling } from '@/hooks/session/use-session-polling'
import { useAutoAdvance } from '@/hooks/session/use-auto-advance'
import {
  CACHE_TTL_MS,
  getRecoveryKey,
  DEFAULT_POLL_INTERVAL_MS,
} from '@/hooks/session/constants'
import type { SessionStatusData } from '@/hooks/session/types'

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockSession = (overrides = {}): SessionStatusData => ({
  session: {
    id: 'test-session',
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
  },
  currentPhase: 'discovery',
  timeRemaining: {
    phase: 'discovery',
    totalMinutes: 30,
    elapsedMinutes: 5,
    remainingMinutes: 25,
    isOvertime: false,
    overtimeMinutes: 0,
  },
  stepsCompleted: 2,
  stepsTotal: 10,
  ...overrides,
})

// =============================================================================
// Constants Tests
// =============================================================================

describe('Session Constants', () => {
  it('CACHE_TTL_MS is 5 minutes', () => {
    expect(CACHE_TTL_MS).toBe(5 * 60 * 1000)
  })

  it('DEFAULT_POLL_INTERVAL_MS is 1 second', () => {
    expect(DEFAULT_POLL_INTERVAL_MS).toBe(1000)
  })

  it('getRecoveryKey generates correct key', () => {
    const key = getRecoveryKey('session-123')
    expect(key).toBe('rapidproto_session_recovery_session-123')
  })
})

// =============================================================================
// useSessionRecovery Tests
// =============================================================================

describe('useSessionRecovery', () => {
  const sessionId = 'test-session-123'
  let localStorageMock: Map<string, string>

  beforeEach(() => {
    localStorageMock = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStorageMock.get(key) ?? null,
      setItem: (key: string, value: string) => localStorageMock.set(key, value),
      removeItem: (key: string) => localStorageMock.delete(key),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('generates correct recovery key', () => {
    const { result } = renderHook(() => useSessionRecovery({ sessionId }))
    expect(result.current.recoveryKey).toBe(`rapidproto_session_recovery_${sessionId}`)
  })

  it('tryRecoverFromCache returns null when no cached data', () => {
    const { result } = renderHook(() => useSessionRecovery({ sessionId }))
    expect(result.current.tryRecoverFromCache()).toBeNull()
  })

  it('tryRecoverFromCache returns data when cache is fresh', () => {
    const session = createMockSession()
    const cacheData = { ...session, savedAt: Date.now() }
    localStorageMock.set(getRecoveryKey(sessionId), JSON.stringify(cacheData))

    const { result } = renderHook(() => useSessionRecovery({ sessionId }))
    const recovered = result.current.tryRecoverFromCache()

    expect(recovered).not.toBeNull()
    expect(recovered?.currentPhase).toBe('discovery')
  })

  it('tryRecoverFromCache returns null when cache is expired', () => {
    const session = createMockSession()
    const expiredTimestamp = Date.now() - CACHE_TTL_MS - 1000
    const cacheData = { ...session, savedAt: expiredTimestamp }
    localStorageMock.set(getRecoveryKey(sessionId), JSON.stringify(cacheData))

    const { result } = renderHook(() => useSessionRecovery({ sessionId }))
    expect(result.current.tryRecoverFromCache()).toBeNull()
  })

  it('saveToCache stores data with timestamp', () => {
    const { result } = renderHook(() => useSessionRecovery({ sessionId }))
    const session = createMockSession()

    result.current.saveToCache(session)

    const stored = localStorageMock.get(getRecoveryKey(sessionId))
    expect(stored).toBeDefined()
    const parsed = JSON.parse(stored!)
    expect(parsed.savedAt).toBeDefined()
    expect(typeof parsed.savedAt).toBe('number')
  })

  it('clearCache removes cached data', () => {
    const { result } = renderHook(() => useSessionRecovery({ sessionId }))
    localStorageMock.set(getRecoveryKey(sessionId), JSON.stringify({}))

    result.current.clearCache()

    expect(localStorageMock.has(getRecoveryKey(sessionId))).toBe(false)
  })

  it('handles localStorage errors gracefully', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('Storage error')
      },
      setItem: () => {
        throw new Error('Storage error')
      },
      removeItem: () => {
        throw new Error('Storage error')
      },
    })

    const { result } = renderHook(() => useSessionRecovery({ sessionId }))

    // Should not throw
    expect(() => result.current.tryRecoverFromCache()).not.toThrow()
    expect(() => result.current.saveToCache(createMockSession())).not.toThrow()
    expect(() => result.current.clearCache()).not.toThrow()
  })
})

// =============================================================================
// useSessionPolling Tests
// =============================================================================

describe('useSessionPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls onPoll immediately on mount', () => {
    const onPoll = vi.fn()

    renderHook(() => useSessionPolling({ onPoll }))

    expect(onPoll).toHaveBeenCalledTimes(1)
  })

  it('calls onPoll at specified interval', () => {
    const onPoll = vi.fn()
    const pollInterval = 500

    renderHook(() => useSessionPolling({ onPoll, pollInterval }))

    expect(onPoll).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(pollInterval)
    })
    expect(onPoll).toHaveBeenCalledTimes(2)

    act(() => {
      vi.advanceTimersByTime(pollInterval)
    })
    expect(onPoll).toHaveBeenCalledTimes(3)
  })

  it('pausePolling stops polling', () => {
    const onPoll = vi.fn()
    const { result } = renderHook(() => useSessionPolling({ onPoll, pollInterval: 500 }))

    expect(onPoll).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.pausePolling()
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Should not have been called again
    expect(onPoll).toHaveBeenCalledTimes(1)
  })

  it('resumePolling restarts polling', () => {
    const onPoll = vi.fn()
    const { result } = renderHook(() => useSessionPolling({ onPoll, pollInterval: 500 }))

    act(() => {
      result.current.pausePolling()
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onPoll).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.resumePolling()
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(onPoll).toHaveBeenCalledTimes(2)
  })

  it('isPolling reflects current state', () => {
    const onPoll = vi.fn()
    const { result } = renderHook(() => useSessionPolling({ onPoll }))

    expect(result.current.isPolling).toBe(true)

    act(() => {
      result.current.pausePolling()
    })
    expect(result.current.isPolling).toBe(false)

    act(() => {
      result.current.resumePolling()
    })
    expect(result.current.isPolling).toBe(true)
  })

  it('clears interval on unmount', () => {
    const onPoll = vi.fn()
    const { unmount } = renderHook(() => useSessionPolling({ onPoll, pollInterval: 500 }))

    unmount()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Should not have been called after unmount
    expect(onPoll).toHaveBeenCalledTimes(1)
  })

  it('uses default poll interval when not specified', () => {
    const onPoll = vi.fn()

    renderHook(() => useSessionPolling({ onPoll }))

    act(() => {
      vi.advanceTimersByTime(DEFAULT_POLL_INTERVAL_MS)
    })

    expect(onPoll).toHaveBeenCalledTimes(2)
  })

  it('enabled=false disables polling', () => {
    const onPoll = vi.fn()

    renderHook(() => useSessionPolling({ onPoll, enabled: false, pollInterval: 500 }))

    // Initial call still happens
    expect(onPoll).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // No further calls
    expect(onPoll).toHaveBeenCalledTimes(1)
  })
})

// =============================================================================
// useAutoAdvance Tests
// =============================================================================

describe('useAutoAdvance', () => {
  it('does nothing when disabled', () => {
    const onPhaseComplete = vi.fn()
    const session = createMockSession({
      timeRemaining: {
        phase: 'discovery',
        totalMinutes: 30,
        elapsedMinutes: 35,
        remainingMinutes: 0,
        isOvertime: true,
        overtimeMinutes: 5,
      },
    })

    renderHook(() =>
      useAutoAdvance({ enabled: false, session, onPhaseComplete })
    )

    expect(onPhaseComplete).not.toHaveBeenCalled()
  })

  it('does nothing when no session', () => {
    const onPhaseComplete = vi.fn()

    renderHook(() =>
      useAutoAdvance({ enabled: true, session: null, onPhaseComplete })
    )

    expect(onPhaseComplete).not.toHaveBeenCalled()
  })

  it('does nothing when no callback', () => {
    const session = createMockSession({
      timeRemaining: {
        phase: 'discovery',
        totalMinutes: 30,
        elapsedMinutes: 35,
        remainingMinutes: 0,
        isOvertime: true,
        overtimeMinutes: 5,
      },
    })

    // Should not throw
    expect(() =>
      renderHook(() => useAutoAdvance({ enabled: true, session, onPhaseComplete: undefined }))
    ).not.toThrow()
  })

  it('calls onPhaseComplete when overtime', () => {
    const onPhaseComplete = vi.fn()
    const session = createMockSession({
      timeRemaining: {
        phase: 'discovery',
        totalMinutes: 30,
        elapsedMinutes: 35,
        remainingMinutes: 0,
        isOvertime: true,
        overtimeMinutes: 5,
      },
    })

    renderHook(() =>
      useAutoAdvance({ enabled: true, session, onPhaseComplete })
    )

    expect(onPhaseComplete).toHaveBeenCalledWith('discovery')
  })

  it('calls onPhaseComplete only once per phase', () => {
    const onPhaseComplete = vi.fn()
    const session = createMockSession({
      timeRemaining: {
        phase: 'discovery',
        totalMinutes: 30,
        elapsedMinutes: 35,
        remainingMinutes: 0,
        isOvertime: true,
        overtimeMinutes: 5,
      },
    })

    const { rerender } = renderHook(
      ({ session }) => useAutoAdvance({ enabled: true, session, onPhaseComplete }),
      { initialProps: { session } }
    )

    expect(onPhaseComplete).toHaveBeenCalledTimes(1)

    // Rerender with same session (still overtime)
    rerender({ session })

    // Should still be 1 call
    expect(onPhaseComplete).toHaveBeenCalledTimes(1)
  })

  it('resets trigger when phase changes', () => {
    const onPhaseComplete = vi.fn()
    const discoverySession = createMockSession({
      currentPhase: 'discovery',
      timeRemaining: {
        phase: 'discovery',
        totalMinutes: 30,
        elapsedMinutes: 35,
        remainingMinutes: 0,
        isOvertime: true,
        overtimeMinutes: 5,
      },
    })

    const { rerender } = renderHook(
      ({ session }) => useAutoAdvance({ enabled: true, session, onPhaseComplete }),
      { initialProps: { session: discoverySession } }
    )

    expect(onPhaseComplete).toHaveBeenCalledWith('discovery')

    // Advance to build phase (also in overtime)
    const buildSession = createMockSession({
      currentPhase: 'build',
      timeRemaining: {
        phase: 'build',
        totalMinutes: 45,
        elapsedMinutes: 50,
        remainingMinutes: 0,
        isOvertime: true,
        overtimeMinutes: 5,
      },
    })

    rerender({ session: buildSession })

    expect(onPhaseComplete).toHaveBeenCalledTimes(2)
    expect(onPhaseComplete).toHaveBeenLastCalledWith('build')
  })

  it('does not call when not overtime', () => {
    const onPhaseComplete = vi.fn()
    const session = createMockSession({
      timeRemaining: {
        phase: 'discovery',
        totalMinutes: 30,
        elapsedMinutes: 20,
        remainingMinutes: 10,
        isOvertime: false,
        overtimeMinutes: 0,
      },
    })

    renderHook(() =>
      useAutoAdvance({ enabled: true, session, onPhaseComplete })
    )

    expect(onPhaseComplete).not.toHaveBeenCalled()
  })
})
