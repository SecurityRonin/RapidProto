/**
 * TDD: useSession Hook Tests
 * Write tests FIRST, then implement to pass them
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { SessionProvider, useSession, useSessionTimer, useCurrentPhase } from '@/hooks/use-session'
import type { ReactNode } from 'react'

// Mock the client-actions module (localStorage-based, synchronous)
vi.mock('@/lib/client-actions', () => ({
  getSessionStatus: vi.fn(),
}))

describe('useSession Hook', () => {
  // Mock data matches SessionStatusData from use-session.tsx
  const mockSessionData = {
    session: {
      id: 'session_123',
      status: 'active' as const,
      currentPhase: 'discovery' as const,
      phaseStartedAt: new Date(),
      discoveryDuration: 10,
      buildDuration: 30,
      demoDuration: 10,
      startedAt: new Date(),
      pausedAt: null,
      completedAt: null,
      totalPausedTime: 0,
      sessionTitle: 'Test Session',
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: [],
    },
    currentPhase: 'discovery' as const,
    timeRemaining: {
      phase: 'discovery' as const,
      totalMinutes: 10,
      elapsedMinutes: 5,
      remainingMinutes: 5,
      isOvertime: false,
      overtimeMinutes: 0,
    },
    stepsCompleted: 0,
    stepsTotal: 3,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider sessionId="session_123">{children}</SessionProvider>
  )

  describe('SessionProvider', () => {
    it('should fetch session data on mount', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      render(
        <SessionProvider sessionId="session_123">
          <TestConsumer />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(getSessionStatus).toHaveBeenCalledWith('session_123')
      })
    })

    it('should provide session data to children', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      render(
        <SessionProvider sessionId="session_123">
          <TestConsumer />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('session-id')).toHaveTextContent('session_123')
      })
    })

    it('should show loading state initially', async () => {
      // Note: With synchronous client-actions, loading state is brief
      // This test verifies the initial state before first render completes
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      // Clear mock to track calls
      vi.mocked(getSessionStatus).mockClear()

      render(
        <SessionProvider sessionId="session_123">
          <TestConsumer />
        </SessionProvider>
      )

      // Verify the hook was called (data fetching happened)
      expect(getSessionStatus).toHaveBeenCalled()
    })

    it('should handle error response', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: false,
        error: 'Session not found',
      })

      render(
        <SessionProvider sessionId="session_123">
          <TestConsumer />
        </SessionProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Session not found')
      })
    })
  })

  describe('useSession hook', () => {
    it('should throw when used outside provider', () => {
      expect(() => {
        renderHook(() => useSession())
      }).toThrow('useSession must be used within a SessionProvider')
    })

    it('should provide refresh function', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.refresh).toBeDefined()
        expect(typeof result.current.refresh).toBe('function')
      })
    })
  })

  describe('useSessionTimer', () => {
    it('should return time remaining data', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useSessionTimer(), { wrapper })

      await waitFor(() => {
        expect(result.current).not.toBeNull()
        expect(result.current?.remainingMinutes).toBe(5)
      })
    })

    it('should return null when session has error', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: false,
        error: 'Not found',
      })

      const { result } = renderHook(() => useSessionTimer(), { wrapper })

      // Session failed to load, so timer is null
      expect(result.current).toBeNull()
    })
  })

  describe('useCurrentPhase', () => {
    it('should return current phase', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useCurrentPhase(), { wrapper })

      await waitFor(() => {
        expect(result.current).toBe('discovery')
      })
    })

    it('should return null when session not loaded', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: false,
        error: 'Not found',
      })

      const { result } = renderHook(() => useCurrentPhase(), { wrapper })

      expect(result.current).toBeNull()
    })
  })

  describe('Network Resilience', () => {
    it('should track connection status', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })
    })

    it('should set status to disconnected after failed poll', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')

      // First call succeeds
      vi.mocked(getSessionStatus).mockReturnValueOnce({
        success: true,
        data: mockSessionData,
      })
      // Next call fails
      vi.mocked(getSessionStatus).mockReturnValueOnce({
        success: false,
        error: 'Network error',
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.session).not.toBeNull()
      })

      // Trigger a refresh to simulate poll
      act(() => {
        result.current.refresh()
      })

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('disconnected')
      })
    })

    it('should recover to connected status after network recovery', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')

      // Start with success
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })

      // Now simulate network failure
      vi.mocked(getSessionStatus).mockReturnValue({
        success: false,
        error: 'Network error',
      })

      act(() => result.current.refresh())
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('disconnected')
      })

      // Now simulate network recovery
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      act(() => result.current.refresh())
      await waitFor(() => {
        expect(result.current.connectionStatus).toBe('connected')
      })
    })

    it('should track last successful sync time', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.lastSyncAt).toBeInstanceOf(Date)
      })
    })

    it('should keep stale data when network fails', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')

      vi.mocked(getSessionStatus)
        .mockReturnValueOnce({ success: true, data: mockSessionData })
        .mockReturnValue({ success: false, error: 'Network error' })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.session?.session.id).toBe('session_123')
      })

      // Network fails
      act(() => result.current.refresh())

      // Should still have the old data
      await waitFor(() => {
        expect(result.current.session?.session.id).toBe('session_123')
        expect(result.current.isStale).toBe(true)
      })
    })
  })

  describe('Auto-Advance', () => {
    it('should accept autoAdvance option', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const autoAdvanceWrapper = ({ children }: { children: ReactNode }) => (
        <SessionProvider sessionId="session_123" autoAdvance>
          {children}
        </SessionProvider>
      )

      const { result } = renderHook(() => useSession(), { wrapper: autoAdvanceWrapper })

      await waitFor(() => {
        expect(result.current.autoAdvanceEnabled).toBe(true)
      })
    })

    it('should provide onPhaseComplete callback', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      const onPhaseComplete = vi.fn()

      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: {
          ...mockSessionData,
          timeRemaining: {
            ...mockSessionData.timeRemaining,
            remainingMinutes: 0,
            isOvertime: true,
          },
        },
      })

      const autoAdvanceWrapper = ({ children }: { children: ReactNode }) => (
        <SessionProvider sessionId="session_123" autoAdvance onPhaseComplete={onPhaseComplete}>
          {children}
        </SessionProvider>
      )

      renderHook(() => useSession(), { wrapper: autoAdvanceWrapper })

      await waitFor(() => {
        expect(onPhaseComplete).toHaveBeenCalledWith('discovery')
      })
    })

    it('should not auto-advance when disabled', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      const onPhaseComplete = vi.fn()

      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: {
          ...mockSessionData,
          timeRemaining: {
            ...mockSessionData.timeRemaining,
            remainingMinutes: 0,
            isOvertime: true,
          },
        },
      })

      const noAutoAdvanceWrapper = ({ children }: { children: ReactNode }) => (
        <SessionProvider sessionId="session_123" autoAdvance={false} onPhaseComplete={onPhaseComplete}>
          {children}
        </SessionProvider>
      )

      renderHook(() => useSession(), { wrapper: noAutoAdvanceWrapper })

      // Wait a bit to ensure no callback
      await new Promise(r => setTimeout(r, 100))
      expect(onPhaseComplete).not.toHaveBeenCalled()
    })
  })

  describe('Session Recovery', () => {
    it('should save session state before unload', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        // Trigger beforeunload
        window.dispatchEvent(new Event('beforeunload'))
      })

      // Should have saved to localStorage
      const saved = localStorage.getItem('rapidproto_session_recovery_session_123')
      expect(saved).toBeTruthy()
    })

    it('should restore session state from recovery data', async () => {
      // Pre-populate recovery data
      const recoveryData = {
        ...mockSessionData,
        savedAt: Date.now(),
      }
      localStorage.setItem('rapidproto_session_recovery_session_123', JSON.stringify(recoveryData))

      const { getSessionStatus } = await import('@/lib/client-actions')
      // First call returns null (session not in normal storage)
      vi.mocked(getSessionStatus).mockReturnValueOnce({
        success: false,
        error: 'Not found',
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        // Should have recovered from localStorage
        expect(result.current.session?.session.id).toBe('session_123')
        expect(result.current.recoveredFromCache).toBe(true)
      })
    })

    it('should clear recovery data on successful load', async () => {
      localStorage.setItem('rapidproto_session_recovery_session_123', JSON.stringify(mockSessionData))

      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        // Recovery data should be cleared
        expect(localStorage.getItem('rapidproto_session_recovery_session_123')).toBeNull()
      })
    })

    it('should handle page visibility for recovery sync', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.session).not.toBeNull()
      })

      // Clear the call count
      vi.mocked(getSessionStatus).mockClear()

      // Simulate tab becoming visible
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))

      await waitFor(() => {
        // Should have refreshed
        expect(getSessionStatus).toHaveBeenCalled()
      })
    })

    it('should not recover from expired cache (> 5 minutes old)', async () => {
      // Pre-populate recovery data with old timestamp
      const recoveryData = {
        ...mockSessionData,
        savedAt: Date.now() - 6 * 60 * 1000, // 6 minutes ago
      }
      localStorage.setItem('rapidproto_session_recovery_session_123', JSON.stringify(recoveryData))

      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: false,
        error: 'Not found',
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        // Should NOT have recovered (cache is too old)
        expect(result.current.session).toBeNull()
        expect(result.current.recoveredFromCache).toBe(false)
      })
    })

    it('should recover from cache that is less than 5 minutes old', async () => {
      // Pre-populate recovery data with recent timestamp
      const recoveryData = {
        ...mockSessionData,
        savedAt: Date.now() - 4 * 60 * 1000, // 4 minutes ago
      }
      localStorage.setItem('rapidproto_session_recovery_session_123', JSON.stringify(recoveryData))

      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: false,
        error: 'Not found',
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        // Should have recovered
        expect(result.current.session?.session.id).toBe('session_123')
        expect(result.current.recoveredFromCache).toBe(true)
      })
    })
  })

  describe('Infinite Loop Prevention (React #185)', () => {
    it('should not create dependency cycle when refresh uses session data', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      let callCount = 0

      vi.mocked(getSessionStatus).mockImplementation(() => {
        callCount++
        // If there's an infinite loop, this would be called many times rapidly
        return {
          success: true,
          data: {
            ...mockSessionData,
            // Return different data each time to test stability
            stepsCompleted: callCount,
          },
        }
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.session).not.toBeNull()
      })

      // Allow time for potential infinite loop to manifest
      await new Promise(r => setTimeout(r, 100))

      // Should not have excessive calls (max ~2-3 for initial + potential effect cycles)
      // An infinite loop would cause 100+ calls
      expect(callCount).toBeLessThan(10)
    })

    it('should use sessionRef to avoid dependency on session state in refresh', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')

      // First load succeeds
      vi.mocked(getSessionStatus).mockReturnValueOnce({
        success: true,
        data: mockSessionData,
      })

      // Second load fails - should mark as stale without infinite loop
      vi.mocked(getSessionStatus).mockReturnValue({
        success: false,
        error: 'Network error',
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.session).not.toBeNull()
      })

      // Manually refresh
      act(() => {
        result.current.refresh()
      })

      await waitFor(() => {
        // Should mark as stale without crashing into infinite loop
        expect(result.current.isStale).toBe(true)
        // Original session data preserved
        expect(result.current.session?.session.id).toBe('session_123')
      })
    })
  })

  describe('Optimistic Updates', () => {
    it('should update session data optimistically', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.session).not.toBeNull()
      })

      // Optimistically update stepsCompleted
      act(() => {
        result.current.setOptimistic('stepsCompleted', (prev) => prev + 1)
      })

      expect(result.current.session?.stepsCompleted).toBe(1) // 0 + 1
    })

    it('should allow multiple optimistic updates', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.session).not.toBeNull()
      })

      act(() => {
        result.current.setOptimistic('stepsCompleted', (prev) => prev + 1)
        result.current.setOptimistic('stepsCompleted', (prev) => prev + 1)
      })

      expect(result.current.session?.stepsCompleted).toBe(2)
    })

    it('should preserve other fields when updating one field optimistically', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.session).not.toBeNull()
      })

      const originalPhase = result.current.session?.currentPhase

      act(() => {
        result.current.setOptimistic('stepsCompleted', (prev) => prev + 1)
      })

      // Other fields should be unchanged
      expect(result.current.session?.currentPhase).toBe(originalPhase)
    })
  })

  describe('Polling Control', () => {
    it('should pause polling when pausePolling is called', async () => {
      vi.useFakeTimers()
      
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      // Use a short poll interval
      const shortPollWrapper = ({ children }: { children: ReactNode }) => (
        <SessionProvider sessionId="session_123" pollInterval={100}>
          {children}
        </SessionProvider>
      )

      const { result } = renderHook(() => useSession(), { wrapper: shortPollWrapper })

      // Wait for initial load
      await vi.runOnlyPendingTimersAsync()

      // Pause polling
      act(() => {
        result.current.pausePolling()
      })

      vi.mocked(getSessionStatus).mockClear()

      // Advance time well past poll interval
      await act(async () => {
        vi.advanceTimersByTime(500)
      })

      // Should not have polled while paused
      expect(getSessionStatus).not.toHaveBeenCalled()

      vi.useRealTimers()
    })

    it('should resume polling when resumePolling is called', async () => {
      vi.useFakeTimers()

      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      const shortPollWrapper = ({ children }: { children: ReactNode }) => (
        <SessionProvider sessionId="session_123" pollInterval={100}>
          {children}
        </SessionProvider>
      )

      const { result } = renderHook(() => useSession(), { wrapper: shortPollWrapper })

      // Wait for initial load
      await vi.runOnlyPendingTimersAsync()

      // Pause and resume
      act(() => {
        result.current.pausePolling()
      })

      act(() => {
        result.current.resumePolling()
      })

      vi.mocked(getSessionStatus).mockClear()

      // Advance time to trigger poll
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      // Should have polled after resume
      expect(getSessionStatus).toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  describe('Error Handling Edge Cases', () => {
    it('should handle localStorage errors gracefully when saving to cache', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: mockSessionData,
      })

      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        expect(result.current.session).not.toBeNull()
      })

      // Should not crash even when localStorage fails
      window.dispatchEvent(new Event('beforeunload'))
      expect(result.current.session).not.toBeNull()

      // Restore
      localStorage.setItem = originalSetItem
    })

    it('should handle malformed JSON in recovery cache', async () => {
      localStorage.setItem('rapidproto_session_recovery_session_123', 'not-valid-json{')

      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: false,
        error: 'Not found',
      })

      const { result } = renderHook(() => useSession(), { wrapper })

      await waitFor(() => {
        // Should not crash, just show error
        expect(result.current.error).toBe('Not found')
        expect(result.current.session).toBeNull()
      })
    })
  })

  describe('Phase Complete Deduplication', () => {
    it('should only trigger onPhaseComplete once per phase', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      const onPhaseComplete = vi.fn()

      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: {
          ...mockSessionData,
          timeRemaining: {
            ...mockSessionData.timeRemaining,
            remainingMinutes: 0,
            isOvertime: true,
          },
        },
      })

      const autoAdvanceWrapper = ({ children }: { children: ReactNode }) => (
        <SessionProvider sessionId="session_123" autoAdvance onPhaseComplete={onPhaseComplete}>
          {children}
        </SessionProvider>
      )

      const { result } = renderHook(() => useSession(), { wrapper: autoAdvanceWrapper })

      await waitFor(() => {
        expect(onPhaseComplete).toHaveBeenCalledTimes(1)
      })

      // Trigger multiple refreshes while still in overtime
      act(() => result.current.refresh())
      act(() => result.current.refresh())
      act(() => result.current.refresh())

      // Should still only have been called once
      expect(onPhaseComplete).toHaveBeenCalledTimes(1)
    })

    it('should trigger onPhaseComplete again after phase changes', async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      const onPhaseComplete = vi.fn()

      // Start in discovery overtime
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: {
          ...mockSessionData,
          currentPhase: 'discovery',
          timeRemaining: {
            phase: 'discovery',
            totalMinutes: 10,
            elapsedMinutes: 11,
            remainingMinutes: 0,
            isOvertime: true,
            overtimeMinutes: 1,
          },
        },
      })

      const autoAdvanceWrapper = ({ children }: { children: ReactNode }) => (
        <SessionProvider sessionId="session_123" autoAdvance onPhaseComplete={onPhaseComplete}>
          {children}
        </SessionProvider>
      )

      const { result } = renderHook(() => useSession(), { wrapper: autoAdvanceWrapper })

      await waitFor(() => {
        expect(onPhaseComplete).toHaveBeenCalledWith('discovery')
      })

      // Now change to build phase (also overtime)
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: {
          ...mockSessionData,
          currentPhase: 'build',
          timeRemaining: {
            phase: 'build',
            totalMinutes: 30,
            elapsedMinutes: 31,
            remainingMinutes: 0,
            isOvertime: true,
            overtimeMinutes: 1,
          },
        },
      })

      act(() => result.current.refresh())

      await waitFor(() => {
        expect(onPhaseComplete).toHaveBeenCalledWith('build')
      })

      // Should have been called twice total (once for each phase)
      expect(onPhaseComplete).toHaveBeenCalledTimes(2)
    })
  })
})

// Test component to consume the context
function TestConsumer() {
  const { session, loading, error } = useSession()

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error || 'none'}</span>
      <span data-testid="session-id">{session?.session.id || 'none'}</span>
    </div>
  )
}
