/**
 * TDD: Session Dashboard Component Tests
 * Write tests FIRST, then implement component to pass them
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionDashboard } from './session-dashboard'

// Mock server actions
vi.mock('@/lib/actions', () => ({
  getSessionStatus: vi.fn(),
  pauseSession: vi.fn(),
  resumeSession: vi.fn(),
  advancePhase: vi.fn(),
  completeSession: vi.fn(),
}))

describe('SessionDashboard', () => {
  const mockSession = {
    id: 'session_123',
    role: 'builder',
    status: 'active',
    currentPhase: 'discovery',
    phaseStartedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    discoveryDuration: 10,
    buildDuration: 30,
    demoDuration: 10,
    startedAt: new Date(Date.now() - 5 * 60 * 1000),
    totalPausedTime: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should display current phase', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText(/discovery/i)).toBeInTheDocument()
      })
    })

    it('should show role badge', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText(/builder/i)).toBeInTheDocument()
      })
    })

    it('should display session status', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText(/active/i)).toBeInTheDocument()
      })
    })
  })

  describe('Timer Display', () => {
    it('should show countdown timer', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByTestId('countdown-timer')).toBeInTheDocument()
      })
    })

    it('should display time remaining in minutes', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        const timer = screen.getByTestId('countdown-timer')
        expect(timer.textContent).toMatch(/\d+:\d+/)
      })
    })

    it('should show overtime warning when time exceeded', async () => {
      // Mock session that's overtime
      const overtimeSession = {
        ...mockSession,
        phaseStartedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago (10 min phase)
      }

      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText(/overtime/i)).toBeInTheDocument()
      })
    })
  })

  describe('Session Controls', () => {
    it('should have pause button for active session', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
      })
    })

    it('should have resume button for paused session', async () => {
      const pausedSession = { ...mockSession, status: 'paused' }

      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
      })
    })

    it('should have advance phase button', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /advance|next phase/i })).toBeInTheDocument()
      })
    })

    it('should have complete session button in demo phase', async () => {
      const demoSession = { ...mockSession, currentPhase: 'demo' }

      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument()
      })
    })
  })

  describe('Phase Progress', () => {
    it('should show all three phases', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText(/discovery/i)).toBeInTheDocument()
        expect(screen.getByText(/build/i)).toBeInTheDocument()
        expect(screen.getByText(/demo/i)).toBeInTheDocument()
      })
    })

    it('should highlight current phase', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        const currentPhase = screen.getByTestId('phase-discovery')
        expect(currentPhase).toHaveClass('active')
      })
    })

    it('should show completed phases as done', async () => {
      const buildSession = { ...mockSession, currentPhase: 'build' }

      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        const discoveryPhase = screen.getByTestId('phase-discovery')
        expect(discoveryPhase).toHaveClass('completed')
      })
    })
  })

  describe('Step Checklist', () => {
    it('should display step checklist', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByTestId('step-checklist')).toBeInTheDocument()
      })
    })

    it('should show steps for current phase', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        // Discovery phase builder steps
        expect(screen.getByText(/review client requirements/i)).toBeInTheDocument()
        expect(screen.getByText(/select template/i)).toBeInTheDocument()
      })
    })

    it('should display step completion count', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText(/\d+ of \d+ steps/i)).toBeInTheDocument()
      })
    })
  })

  describe('Collapsible Sidebar', () => {
    it('should have collapsible sidebar', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument()
      })
    })

    it('should toggle sidebar visibility', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      const toggle = await screen.findByTestId('sidebar-toggle')
      const sidebar = await screen.findByTestId('sidebar')

      expect(sidebar).toHaveClass('open')

      fireEvent.click(toggle)

      await waitFor(() => {
        expect(sidebar).toHaveClass('closed')
      })
    })

    it('should show full rundown in sidebar', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        const sidebar = screen.getByTestId('sidebar')
        expect(sidebar).toHaveTextContent(/discovery.*build.*demo/i)
      })
    })
  })

  describe('Client Info Display', () => {
    it('should show client name when available', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText(/acme corp/i)).toBeInTheDocument()
      })
    })

    it('should display Three Wins if captured', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByTestId('three-wins')).toBeInTheDocument()
      })
    })
  })

  describe('Template Selection Display', () => {
    it('should show selected template', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText(/template #14/i)).toBeInTheDocument()
        expect(screen.getByText(/inventory management/i)).toBeInTheDocument()
      })
    })

    it('should display customization notes', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByTestId('customization-notes')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should refresh session status periodically', async () => {
      const { getSessionStatus } = await import('@/lib/actions')

      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(getSessionStatus).toHaveBeenCalledTimes(1)
      })

      // Wait for auto-refresh (every 5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5100))

      expect(getSessionStatus).toHaveBeenCalledTimes(2)
    })

    it('should update timer every second', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      const timer = await screen.findByTestId('countdown-timer')
      const initialTime = timer.textContent

      await new Promise(resolve => setTimeout(resolve, 1100))

      expect(timer.textContent).not.toBe(initialTime)
    })
  })

  describe('Responsive Layout', () => {
    it('should collapse sidebar on mobile', async () => {
      // Mock mobile viewport
      global.innerWidth = 375

      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        const sidebar = screen.getByTestId('sidebar')
        expect(sidebar).toHaveClass('mobile-collapsed')
      })
    })

    it('should stack phases vertically on small screens', async () => {
      global.innerWidth = 375

      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        const phaseContainer = screen.getByTestId('phase-container')
        expect(phaseContainer).toHaveClass('vertical-layout')
      })
    })
  })
})
