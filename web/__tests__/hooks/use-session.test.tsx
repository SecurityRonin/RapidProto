/**
 * TDD: useSession Hook Tests
 * Write tests FIRST, then implement to pass them
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { SessionProvider, useSession, useSessionTimer, useClientInfo } from '@/hooks/use-session'
import type { ReactNode } from 'react'

// Mock the actions module
vi.mock('@/lib/actions', () => ({
  getSessionStatus: vi.fn(),
}))

describe('useSession Hook', () => {
  const mockSessionData = {
    session: {
      id: 'session_123',
      role: 'builder' as const,
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
      userId: 'user_123',
      teamId: null,
      sessionTitle: 'Test Session',
      steps: [],
      clientInfo: null,
      selectedTemplate: null,
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
    clientInfo: null,
    selectedTemplate: null,
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
      const { getSessionStatus } = await import('@/lib/actions')
      vi.mocked(getSessionStatus).mockResolvedValue({
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
      const { getSessionStatus } = await import('@/lib/actions')
      vi.mocked(getSessionStatus).mockResolvedValue({
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
      const { getSessionStatus } = await import('@/lib/actions')
      vi.mocked(getSessionStatus).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(
        <SessionProvider sessionId="session_123">
          <TestConsumer />
        </SessionProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('true')
    })

    it('should handle error response', async () => {
      const { getSessionStatus } = await import('@/lib/actions')
      vi.mocked(getSessionStatus).mockResolvedValue({
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
      const { getSessionStatus } = await import('@/lib/actions')
      vi.mocked(getSessionStatus).mockResolvedValue({
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
      const { getSessionStatus } = await import('@/lib/actions')
      vi.mocked(getSessionStatus).mockResolvedValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useSessionTimer(), { wrapper })

      await waitFor(() => {
        expect(result.current).not.toBeNull()
        expect(result.current?.remainingMinutes).toBe(5)
      })
    })

    it('should return null when session not loaded', async () => {
      const { getSessionStatus } = await import('@/lib/actions')
      vi.mocked(getSessionStatus).mockImplementation(
        () => new Promise(() => {})
      )

      const { result } = renderHook(() => useSessionTimer(), { wrapper })

      expect(result.current).toBeNull()
    })
  })

  describe('useClientInfo', () => {
    it('should return null when no client info', async () => {
      const { getSessionStatus } = await import('@/lib/actions')
      vi.mocked(getSessionStatus).mockResolvedValue({
        success: true,
        data: mockSessionData,
      })

      const { result } = renderHook(() => useClientInfo(), { wrapper })

      await waitFor(() => {
        expect(result.current).toBeNull()
      })
    })

    it('should return client info when available', async () => {
      const { getSessionStatus } = await import('@/lib/actions')
      const dataWithClient = {
        ...mockSessionData,
        clientInfo: {
          id: 'client_1',
          sessionId: 'session_123',
          clientName: 'Acme Corp',
          clientEmail: null,
          clientPhone: null,
          businessType: null,
          companySize: null,
          problemStatement: 'Need help',
          currentSolution: null,
          whyNow: null,
          threeWins: ['Win 1'],
          painPoints: [],
          mustHaveFeatures: [],
          niceToHaveFeatures: [],
          budget: null,
          timeline: null,
          decisionMakers: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }
      vi.mocked(getSessionStatus).mockResolvedValue({
        success: true,
        data: dataWithClient,
      })

      const { result } = renderHook(() => useClientInfo(), { wrapper })

      await waitFor(() => {
        expect(result.current?.clientName).toBe('Acme Corp')
      })
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
