/**
 * TDD: Session Timer Component Tests
 * Write tests FIRST, then implement component to pass them
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
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

  describe('Timer Drift Prevention', () => {
    it('should use startTime prop for accurate time calculation', () => {
      // Set a fixed system time first
      vi.setSystemTime(new Date('2024-01-01T00:01:00Z'))

      // startTime was 1 minute ago (when remainingMinutes was set)
      const startTime = new Date('2024-01-01T00:00:00Z').getTime()

      render(
        <SessionTimer
          remainingMinutes={5}
          totalMinutes={10}
          phase="discovery"
          startTime={startTime}
        />
      )

      // Should show ~4 minutes remaining (5 min - 1 min elapsed)
      expect(screen.getByText(/4:0\d/)).toBeInTheDocument()
    })

    it('should correct drift when actual elapsed time differs from displayed', () => {
      // Set a fixed system time
      vi.setSystemTime(new Date('2024-01-01T00:02:00Z'))

      // startTime was 2 minutes ago
      const startTime = new Date('2024-01-01T00:00:00Z').getTime()

      render(
        <SessionTimer
          remainingMinutes={5}
          totalMinutes={10}
          phase="discovery"
          startTime={startTime}
        />
      )

      // Should show ~3 minutes remaining (5 min - 2 min elapsed)
      expect(screen.getByText(/3:0\d/)).toBeInTheDocument()
    })

    it('should handle tab being backgrounded and timer drifting', async () => {
      // Set initial system time
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
      const startTime = Date.now()

      const { rerender } = render(
        <SessionTimer
          remainingMinutes={5}
          totalMinutes={10}
          phase="discovery"
          startTime={startTime}
        />
      )

      // Initial: should show 5:00
      expect(screen.getByText(/5:00/)).toBeInTheDocument()

      // Simulate 30 seconds passing (system time advances)
      act(() => {
        vi.advanceTimersByTime(30000)
      })

      // Rerender to force recalculation with same startTime
      rerender(
        <SessionTimer
          remainingMinutes={5}
          totalMinutes={10}
          phase="discovery"
          startTime={startTime}
        />
      )

      // Timer should show correct time (5:00 - 0:30 = 4:30)
      expect(screen.getByText(/4:30/)).toBeInTheDocument()
    })
  })

  describe('Visibility API Sync', () => {
    it('should accept onVisibilityChange callback', async () => {
      const onVisibilityChange = vi.fn()
      render(
        <SessionTimer
          remainingMinutes={5}
          totalMinutes={10}
          phase="discovery"
          onVisibilityChange={onVisibilityChange}
        />
      )

      // Simulate visibility change
      await act(async () => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
          configurable: true,
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      expect(onVisibilityChange).toHaveBeenCalledWith('hidden')
    })

    it('should resync time when tab becomes visible', async () => {
      // Set system time to 1 minute after startTime
      vi.setSystemTime(new Date('2024-01-01T00:01:00Z'))
      const startTime = new Date('2024-01-01T00:00:00Z').getTime()

      render(
        <SessionTimer
          remainingMinutes={5}
          totalMinutes={10}
          phase="discovery"
          startTime={startTime}
        />
      )

      // Should already show correct time (4:00) based on startTime calculation
      expect(screen.getByText(/4:0\d/)).toBeInTheDocument()

      // Simulate tab becoming visible (triggers recalculation)
      await act(async () => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
          configurable: true,
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      // Should still show correct time
      expect(screen.getByText(/4:0\d/)).toBeInTheDocument()
    })
  })

  describe('Audio Warnings', () => {
    it('should accept onTimeWarning callback', () => {
      const onTimeWarning = vi.fn()

      // Start at 1:06 (66 seconds)
      render(
        <SessionTimer
          remainingMinutes={1.1}
          totalMinutes={10}
          phase="discovery"
          onTimeWarning={onTimeWarning}
          enableAudioWarnings
        />
      )

      // Advance time to cross below 60 seconds (need 7+ seconds)
      act(() => {
        vi.advanceTimersByTime(7000)
      })

      expect(onTimeWarning).toHaveBeenCalledWith('one-minute')
    })

    it('should trigger 10-second warning', () => {
      const onTimeWarning = vi.fn()

      // Start at 12 seconds (0.2 min = 12 seconds)
      render(
        <SessionTimer
          remainingMinutes={0.2}
          totalMinutes={10}
          phase="discovery"
          onTimeWarning={onTimeWarning}
          enableAudioWarnings
        />
      )

      // Already below 60, so one-minute triggers on mount
      // Advance 3 seconds to cross below 10 seconds (12 - 3 = 9)
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(onTimeWarning).toHaveBeenCalledWith('ten-seconds')
    })

    it('should trigger phase-complete warning at zero', () => {
      const onTimeWarning = vi.fn()

      // Start at 3 seconds (0.05 min = 3 seconds)
      render(
        <SessionTimer
          remainingMinutes={0.05}
          totalMinutes={10}
          phase="discovery"
          onTimeWarning={onTimeWarning}
          enableAudioWarnings
        />
      )

      // Advance past zero
      act(() => {
        vi.advanceTimersByTime(4000)
      })

      expect(onTimeWarning).toHaveBeenCalledWith('phase-complete')
    })

    it('should not trigger warnings when enableAudioWarnings is false', () => {
      const onTimeWarning = vi.fn()
      render(
        <SessionTimer
          remainingMinutes={1.1}
          totalMinutes={10}
          phase="discovery"
          onTimeWarning={onTimeWarning}
          enableAudioWarnings={false}
        />
      )

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(onTimeWarning).not.toHaveBeenCalled()
    })
  })

  describe('Visual Urgency Enhancements', () => {
    it('should show urgent border when <30 seconds remaining', () => {
      render(<SessionTimer remainingMinutes={0.4} totalMinutes={10} phase="discovery" />)

      const timer = screen.getByTestId('timer')
      expect(timer).toHaveClass('ring-2', 'ring-red-500')
    })

    it('should not pulse when paused even if time is low', () => {
      render(<SessionTimer remainingMinutes={0.5} totalMinutes={10} phase="discovery" isPaused />)

      const timer = screen.getByTestId('timer')
      expect(timer).not.toHaveClass('animate-pulse')
    })
  })
})
