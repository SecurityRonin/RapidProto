/**
 * TDD: Session Timer Component Tests
 * Write tests FIRST, then implement component to pass them
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SessionTimer } from './session-timer'

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
    it('should update every second', async () => {
      render(<SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" />)

      const initialTime = screen.getByTestId('timer').textContent

      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        const newTime = screen.getByTestId('timer').textContent
        expect(newTime).not.toBe(initialTime)
      })
    })

    it('should stop updating when paused', async () => {
      const { rerender } = render(
        <SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" isPaused={false} />
      )

      const time1 = screen.getByTestId('timer').textContent

      rerender(
        <SessionTimer remainingMinutes={5} totalMinutes={10} phase="discovery" isPaused={true} />
      )

      vi.advanceTimersByTime(2000)

      const time2 = screen.getByTestId('timer').textContent
      expect(time2).toBe(time1)
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
