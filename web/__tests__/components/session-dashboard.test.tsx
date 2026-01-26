/**
 * TDD: Session Dashboard Component Tests
 * Minimal & Sophisticated design
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionDashboard } from '../../components/session/session-dashboard'

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
        sessionTitle: 'Test Session',
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
      clientInfo: null,
      selectedTemplate: null,
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
        expect(screen.getAllByText(/discovery/i).length).toBeGreaterThan(0)
      })
    })

    it('should show role indicator', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText(/builder/i)).toBeInTheDocument()
      })
    })

    it('should display session status badge', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getAllByText(/active/i).length).toBeGreaterThan(0)
      })
    })

    it('should show session title in header', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText('Test Session')).toBeInTheDocument()
      })
    })
  })

  describe('Timer Display', () => {
    it('should show time remaining', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        // Time displays as MM:SS format
        expect(screen.getByText(/05:00|5:00|05:|:00/)).toBeInTheDocument()
      })
    })

    it('should show progress bar', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        // Progress bar element exists (shadcn Progress component)
        const progressContainer = document.querySelector('[role="progressbar"], [class*="progress"], .bg-gray-100.rounded-full')
        expect(progressContainer).toBeInTheDocument()
      })
    })
  })

  describe('Phase Progress', () => {
    it('should show all three phases', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getAllByText(/discovery/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/build/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/demo/i).length).toBeGreaterThan(0)
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

  describe('Step Checklist Integration', () => {
    it('should display steps for current phase', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        expect(screen.getByText('Review client requirements')).toBeInTheDocument()
        expect(screen.getByText('Select template')).toBeInTheDocument()
      })
    })
  })

  describe('Progress Summary', () => {
    it('should show step completion stats', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        // Shows as "1/2" in the footer stats
        expect(screen.getByText('1/2')).toBeInTheDocument()
      })
    })

    it('should show current phase in summary', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        // Phase appears in multiple places
        const allText = document.body.textContent || ''
        expect(allText).toMatch(/discovery/i)
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      render(<SessionDashboard sessionId="session_123" />)

      // Spinner has animate-spin class
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should have back link to home', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /rapidproto/i })
        expect(backLink).toHaveAttribute('href', '/')
      })
    })
  })
})
