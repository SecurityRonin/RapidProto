/**
 * TDD: Session Dashboard Component Tests
 * Minimal & Sophisticated design
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionDashboard } from '../../components/session/session-dashboard'

vi.mock('@/lib/client-actions', () => ({
  getSessionStatus: vi.fn(() => ({
    success: true,
    data: {
      session: {
        id: 'session_123',
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
          { id: 'step_1', stepNumber: 1, title: 'Define the core feature', status: 'completed', phase: 'discovery', estimatedMinutes: 3 },
          { id: 'step_2', stepNumber: 2, title: 'Pick a template', status: 'in_progress', phase: 'discovery', estimatedMinutes: 4 },
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
    },
  })),
  pauseSession: vi.fn(() => ({ success: true, data: { status: 'paused' } })),
  resumeSession: vi.fn(() => ({ success: true, data: { status: 'active' } })),
  advancePhase: vi.fn(() => ({ success: true, data: { currentPhase: 'build' } })),
  completeSession: vi.fn(() => ({ success: true, data: { status: 'completed' } })),
  updateStep: vi.fn(() => ({ success: true })),
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
        expect(screen.getAllByText(/verify/i).length).toBeGreaterThan(0)
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
      const { pauseSession } = await import('@/lib/client-actions')

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
      const { advancePhase } = await import('@/lib/client-actions')

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
        expect(screen.getByText('Define the core feature')).toBeInTheDocument()
        expect(screen.getByText('Pick a template')).toBeInTheDocument()
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
    it('should render dashboard content after data loads', async () => {
      // With synchronous localStorage, loading is instant
      // Verify dashboard content renders after initial load
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        // Dashboard content should be visible
        expect(screen.getAllByText(/discovery/i).length).toBeGreaterThan(0)
      })
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

  // ============================================
  // ROLE-AWARE DASHBOARD TESTS (TDD)
  // ============================================

  describe('Role-Aware: Builder View', () => {
    it('should show builder phases (discovery, build, verify)', async () => {
      render(<SessionDashboard sessionId="session_123" role="builder" />)

      await waitFor(() => {
        expect(screen.getAllByText(/discovery/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/build/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/verify/i).length).toBeGreaterThan(0)
      })
    })

    it('should show builder checklist steps', async () => {
      render(<SessionDashboard sessionId="session_123" role="builder" />)

      await waitFor(() => {
        expect(screen.getByText('Define the core feature')).toBeInTheDocument()
        expect(screen.getByText('Pick a template')).toBeInTheDocument()
      })
    })

    it('should show session code for sharing', async () => {
      render(<SessionDashboard sessionId="ABC123" role="builder" />)

      await waitFor(() => {
        // Session code displayed in header for builder to share
        expect(screen.getByText(/ABC123/i)).toBeInTheDocument()
      })
    })
  })

  describe('Role-Aware: Facilitator View', () => {
    beforeEach(async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: {
          session: {
            id: 'session_123',
            status: 'active',
            currentPhase: 'build', // Facilitator is active during build phase
            phaseStartedAt: new Date(Date.now() - 5 * 60 * 1000),
            discoveryDuration: 10,
            buildDuration: 30,
            demoDuration: 10,
            startedAt: new Date(Date.now() - 15 * 60 * 1000),
            totalPausedTime: 0,
            sessionTitle: 'Test Session',
            steps: [
              // Facilitator steps (during build phase)
              { id: 'fstep_1', stepNumber: 1, title: 'Define prototype scope', status: 'completed', phase: 'expectations', estimatedMinutes: 3 },
              { id: 'fstep_2', stepNumber: 2, title: 'Clarify out of scope', status: 'in_progress', phase: 'expectations', estimatedMinutes: 3 },
            ],
          },
          currentPhase: 'build',
          timeRemaining: {
            phase: 'build',
            totalMinutes: 30,
            elapsedMinutes: 5,
            remainingMinutes: 25,
            isOvertime: false,
            overtimeMinutes: 0,
          },
          stepsCompleted: 1,
          stepsTotal: 2,
        },
      })
    })

    it('should show facilitator stages (expectations, long term, close)', async () => {
      render(<SessionDashboard sessionId="session_123" role="facilitator" />)

      await waitFor(() => {
        expect(screen.getAllByText(/expectations/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/long term/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/close/i).length).toBeGreaterThan(0)
      })
    })

    it('should show facilitator checklist steps', async () => {
      render(<SessionDashboard sessionId="session_123" role="facilitator" />)

      await waitFor(() => {
        expect(screen.getByText('Define prototype scope')).toBeInTheDocument()
        expect(screen.getByText('Clarify out of scope')).toBeInTheDocument()
      })
    })

    it('should indicate facilitator role in header', async () => {
      render(<SessionDashboard sessionId="session_123" role="facilitator" />)

      await waitFor(() => {
        // Should show "Facilitator" role indicator
        const allText = document.body.textContent || ''
        expect(allText).toMatch(/facilitator/i)
      })
    })
  })

  describe('Role-Aware: Synced Information Display', () => {
    beforeEach(async () => {
      const { getSessionStatus } = await import('@/lib/client-actions')
      vi.mocked(getSessionStatus).mockReturnValue({
        success: true,
        data: {
          session: {
            id: 'session_123',
            status: 'active',
            currentPhase: 'build',
            phaseStartedAt: new Date(Date.now() - 5 * 60 * 1000),
            discoveryDuration: 10,
            buildDuration: 30,
            demoDuration: 10,
            startedAt: new Date(Date.now() - 15 * 60 * 1000),
            totalPausedTime: 0,
            sessionTitle: 'Test Session',
            builderJoined: true,
            facilitatorJoined: true,
            steps: [],
            // Synced data from other role
            syncedInputs: {
              coreFeature: 'User login with OAuth',
              template: 'Next.js SaaS starter',
            },
          },
          currentPhase: 'build',
          timeRemaining: {
            phase: 'build',
            totalMinutes: 30,
            elapsedMinutes: 5,
            remainingMinutes: 25,
            isOvertime: false,
            overtimeMinutes: 0,
          },
          stepsCompleted: 0,
          stepsTotal: 0,
        },
      })
    })

    it('should show synced inputs from other role', async () => {
      render(<SessionDashboard sessionId="session_123" role="facilitator" />)

      await waitFor(() => {
        // Facilitator sees builder's discoveries
        expect(screen.getByText(/user login with oauth/i)).toBeInTheDocument()
        expect(screen.getByText(/next\.js saas starter/i)).toBeInTheDocument()
      })
    })

    it('should show "FROM BUILDER" section for facilitator', async () => {
      render(<SessionDashboard sessionId="session_123" role="facilitator" />)

      await waitFor(() => {
        expect(screen.getByText(/from builder/i)).toBeInTheDocument()
      })
    })
  })

  describe('Role Defaults', () => {
    it('should default to builder role when not specified', async () => {
      render(<SessionDashboard sessionId="session_123" />)

      await waitFor(() => {
        // Should show builder phases by default
        expect(screen.getAllByText(/verify/i).length).toBeGreaterThan(0)
      })
    })
  })
})
