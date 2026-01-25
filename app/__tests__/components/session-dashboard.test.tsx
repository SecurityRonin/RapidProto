/**
 * TDD: Session Dashboard Component Tests
 * Tests component behavior with mocked server actions (Option 3)
 *
 * Strategy: Test what the user sees and can interact with,
 * not internal implementation details.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionDashboard } from '../../components/session/session-dashboard'

// Mock server actions with meaningful defaults
vi.mock('@/lib/actions', () => ({
  getSessionStatus: vi.fn(() => Promise.resolve({
    success: true,
    data: {
      session: {
        id: 'session_123',
        role: 'builder',
        status: 'active',
        currentPhase: 'discovery',
        phaseStartedAt: new Date(Date.now() - 5 * 60 * 1000),
        discoveryDuration: 10,
        buildDuration: 30,
        demoDuration: 10,
        startedAt: new Date(Date.now() - 5 * 60 * 1000),
        totalPausedTime: 0,
        steps: [
          { id: 'step_1', stepNumber: 1, title: 'Review client requirements', status: 'completed', phase: 'discovery', estimatedMinutes: 3 },
          { id: 'step_2', stepNumber: 2, title: 'Select template', status: 'in_progress', phase: 'discovery', estimatedMinutes: 4 },
        ],
      },
      currentPhase: 'discovery',
      timeRemaining: {
        phase: 'discovery',
        totalMinutes: 10,
        elapsedMinutes: 5,
        remainingMinutes: 5,
        isOvertime: false,
        overtimeMinutes: 0,
      },
      stepsCompleted: 1,
      stepsTotal: 2,
      clientInfo: {
        id: 'client_1',
        clientName: 'Acme Corp',
        threeWins: JSON.stringify(['Better reporting', 'Faster processing', 'Easier maintenance']),
      },
      selectedTemplate: {
        templateNumber: 14,
        templateName: 'Inventory Management',
        customizationNotes: 'Need additional barcode scanning feature',
      },
    },
  })),
  pauseSession: vi.fn(() => Promise.resolve({ success: true, data: { status: 'paused' } })),
  resumeSession: vi.fn(() => Promise.resolve({ success: true, data: { status: 'active' } })),
  advancePhase: vi.fn(() => Promise.resolve({ success: true, data: { currentPhase: 'build' } })),
  completeSession: vi.fn(() => Promise.resolve({ success: true, data: { status: 'completed' } })),
  updateStep: vi.fn(() => Promise.resolve({ success: true })),
}))

describe('SessionDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Rendering', () => {
    it('should display current phase', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        // "discovery" appears in phase list and current phase indicator
        expect(screen.getAllByText(/discovery/i).length).toBeGreaterThan(0)
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
        // Status appears in badge and summary
        expect(screen.getAllByText(/active/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Phase Progress', () => {
    it('should show all three phases', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        // Each phase name appears at least once in the phase list
        expect(screen.getAllByText(/discovery/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/build/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/demo/i).length).toBeGreaterThan(0)
      })
    })

    it('should highlight current phase', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        const currentPhase = screen.getByTestId('phase-discovery')
        expect(currentPhase).toHaveClass('active')
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

    it('should call pauseSession when pause clicked', async () => {
      const { pauseSession } = await import('@/lib/actions')

      render(<SessionDashboard sessionId="session_123" />)

      const pauseButton = await screen.findByRole('button', { name: /pause/i })
      fireEvent.click(pauseButton)

      await waitFor(() => {
        expect(pauseSession).toHaveBeenCalledWith('session_123')
      })
    })

    it('should have advance phase button', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start build/i })).toBeInTheDocument()
      })
    })

    it('should call advancePhase when advance clicked', async () => {
      const { advancePhase } = await import('@/lib/actions')

      render(<SessionDashboard sessionId="session_123" />)

      const advanceButton = await screen.findByRole('button', { name: /start build/i })
      fireEvent.click(advanceButton)

      await waitFor(() => {
        expect(advancePhase).toHaveBeenCalledWith('session_123')
      })
    })
  })

  describe('Collapsible Sidebar', () => {
    it('should have collapsible sidebar', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument()
        expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      })
    })

    it('should toggle sidebar visibility', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      const toggle = await screen.findByTestId('sidebar-toggle')
      const sidebar = await screen.findByTestId('sidebar')

      // Initially open
      expect(sidebar).toHaveClass('open')

      // Click to close
      fireEvent.click(toggle)

      await waitFor(() => {
        expect(sidebar).toHaveClass('closed')
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
        expect(screen.getByText(/better reporting/i)).toBeInTheDocument()
      })
    })
  })

  describe('Template Selection Display', () => {
    it('should show selected template', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText(/#14.*Inventory Management/)).toBeInTheDocument()
      })
    })

    it('should display customization notes', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByTestId('customization-notes')).toBeInTheDocument()
        expect(screen.getByText(/barcode scanning/i)).toBeInTheDocument()
      })
    })
  })

  describe('Progress Summary', () => {
    it('should show step completion count', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText('1 / 2')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator initially', () => {
      render(<SessionDashboard sessionId="session_123" />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })
})
