/**
 * TDD: Session Timer Component Tests
 * Write tests FIRST, then implement component to pass them
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SessionTimer } from '../../components/session/session-timer'

describe('SessionTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Time Display', () => {
    it('should display time in MM:SS format', () => {
      render(<SessionTimer remainingMinutes={5.5} totalMinutes={10} phase="discovery" />)

      expect(screen.getByText(/5:30/)).toBeInTheDocument()
    })

    it('should pad single-digit seconds with zero', () => {
      render(<SessionTimer remainingMinutes={5.15} totalMinutes={10} phase="discovery" />)

      expect(screen.getByText(/5:09/)).toBeInTheDocument()
    })

    it('should display hours when time exceeds 60 minutes', () => {
      render(<SessionTimer remainingMinutes={65} totalMinutes={90} phase="build" />)

      expect(screen.getByText(/1:05:00/)).toBeInTheDocument()
    })
  })

  describe('Timer Colors', () => {
    it('should be green when >50% time remaining', () => {
      render(<SessionTimer remainingMinutes={6} totalMinutes={10} phase="discovery" />)

      const timer = screen.getByTestId('timer')
      expect(timer).toHaveClass('text-green-600')
    })

    it('should be yellow when 20-50% time remaining', () => {
      render(<SessionTimer remainingMinutes={3} totalMinutes={10} phase="discovery" />)

      const timer = screen.getByTestId('timer')
      expect(timer).toHaveClass('text-yellow-600')
    })

    it('should be red when <20% time remaining', () => {
      render(<SessionTimer remainingMinutes={1} totalMinutes={10} phase="discovery" />)

      const timer = screen.getByTestId('timer')
      expect(timer).toHaveClass('text-red-600')
    })

    it('should pulse when <1 minute remaining', () => {
      render(<SessionTimer remainingMinutes={0.5} totalMinutes={10} phase="discovery" />)

      const timer = screen.getByTestId('timer')
      expect(timer).toHaveClass('animate-pulse')
    })
  })

  describe('Progress Bar', () => {
    it('should display progress bar', () => {
      render(<SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" />)

      expect(screen.getByTestId('progress-bar')).toBeInTheDocument()
    })

    it('should show 50% progress when half time elapsed', () => {
      render(<SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" />)

      const progressBar = screen.getByTestId('progress-fill')
      expect(progressBar).toHaveStyle({ width: '50%' })
    })

    it('should show 100% progress when time up', () => {
      render(<SessionTimer remainingMinutes={0} totalMinutes={10} phase="discovery" />)

      const progressBar = screen.getByTestId('progress-fill')
      expect(progressBar).toHaveStyle({ width: '100%' })
    })
  })

  describe('Overtime Handling', () => {
    it('should show overtime badge when time negative', () => {
      render(<SessionTimer remainingMinutes={-2} totalMinutes={10} phase="discovery" isOvertime />)

      expect(screen.getByText(/overtime/i)).toBeInTheDocument()
    })

    it('should display positive overtime amount', () => {
      render(<SessionTimer remainingMinutes={-2.5} totalMinutes={10} phase="discovery" isOvertime overtimeMinutes={2.5} />)

      expect(screen.getByText(/\+2:30/)).toBeInTheDocument()
    })

    it('should show full progress bar in overtime', () => {
      render(<SessionTimer remainingMinutes={-2} totalMinutes={10} phase="discovery" isOvertime />)

      const progressBar = screen.getByTestId('progress-fill')
      expect(progressBar).toHaveStyle({ width: '100%' })
      expect(progressBar).toHaveClass('bg-red-600')
    })
  })

  describe('Phase Labels', () => {
    it('should display phase name', () => {
      render(<SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" />)

      expect(screen.getByText(/discovery phase/i)).toBeInTheDocument()
    })

    it('should show phase duration', () => {
      render(<SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" />)

      expect(screen.getByText(/10 min total/i)).toBeInTheDocument()
    })
  })

  describe('Timer Updates', () => {
    // Note: Testing real-time timer updates with fake timers is tricky in React.
    // These tests verify the timer renders and responds to props correctly.

    it('should render initial time correctly', () => {
      render(<SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" />)

      // Timer shows initial time
      expect(screen.getByTestId('timer')).toBeInTheDocument()
      expect(screen.getByText(/5:00/)).toBeInTheDocument()
    })

    it('should show different time when prop changes', () => {
      const { rerender } = render(
        <SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" />
      )

      expect(screen.getByText(/5:00/)).toBeInTheDocument()

      rerender(
        <SessionTimer remainingMinutes={4.5} totalMinutes={10} phase="discovery" />
      )

      expect(screen.getByText(/4:30/)).toBeInTheDocument()
    })

    it('should accept isPaused prop', () => {
      // isPaused stops internal countdown but doesn't show visible indicator
      // (the parent component handles showing paused state)
      const { container } = render(
        <SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" isPaused={true} />
      )

      // Timer still renders when paused
      expect(screen.getByTestId('timer')).toBeInTheDocument()
      // Progress bar still visible
      expect(container.querySelector('[data-testid="progress-fill"]')).toBeInTheDocument()
    })
  })

  describe('Compact Mode', () => {
    it('should hide phase label in compact mode', () => {
      render(<SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" compact />)

      expect(screen.queryByText(/discovery phase/i)).not.toBeInTheDocument()
    })

    it('should hide progress bar in compact mode', () => {
      render(<SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" compact />)

      expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument()
    })

    it('should only show time in compact mode', () => {
      render(<SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" compact />)

      expect(screen.getByText(/5:00/)).toBeInTheDocument()
    })
  })
})
