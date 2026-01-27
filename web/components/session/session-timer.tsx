/**
 * Session Timer Component
 * Displays countdown timer with color-coded urgency and progress bar
 * Features: drift prevention, visibility API sync, audio warning callbacks
 */

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

export type TimeWarningType = 'one-minute' | 'ten-seconds' | 'phase-complete'

interface SessionTimerProps {
  remainingMinutes: number
  totalMinutes: number
  phase: 'discovery' | 'build' | 'demo'
  isOvertime?: boolean
  overtimeMinutes?: number
  isPaused?: boolean
  compact?: boolean
  /** Start time for drift prevention - uses Date.now() based calculation */
  startTime?: number
  /** Callback when visibility changes */
  onVisibilityChange?: (state: DocumentVisibilityState) => void
  /** Callback for time warnings (1 min, 10 sec, phase complete) */
  onTimeWarning?: (warning: TimeWarningType) => void
  /** Enable audio warning callbacks */
  enableAudioWarnings?: boolean
}

export function SessionTimer({
  remainingMinutes,
  totalMinutes,
  phase,
  isOvertime = false,
  overtimeMinutes = 0,
  isPaused = false,
  compact = false,
  startTime,
  onVisibilityChange,
  onTimeWarning,
  enableAudioWarnings = false,
}: SessionTimerProps) {
  // Track which warnings have been triggered to avoid duplicates
  const triggeredWarnings = useRef<Set<TimeWarningType>>(new Set())

  // Calculate remaining time based on startTime if provided (drift prevention)
  // startTime represents when the `remainingMinutes` value was accurate
  // This allows us to calculate actual remaining time based on real elapsed time
  const calculateRemainingMs = useCallback(() => {
    if (startTime && !isPaused) {
      const elapsedSinceStartMs = Date.now() - startTime
      const baseRemainingMs = remainingMinutes * 60 * 1000
      return Math.max(0, baseRemainingMs - elapsedSinceStartMs)
    }
    return remainingMinutes * 60 * 1000
  }, [startTime, remainingMinutes, isPaused])

  const [localRemainingMs, setLocalRemainingMs] = useState(calculateRemainingMs)

  // Update local countdown every second using Date.now() for accuracy
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      if (startTime) {
        // Use Date.now() for drift prevention
        setLocalRemainingMs(calculateRemainingMs())
      } else {
        // Fallback to interval-based countdown
        setLocalRemainingMs(prev => Math.max(0, prev - 1000))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused, startTime, calculateRemainingMs])

  // Sync with prop changes (when server/parent updates remainingMinutes)
  useEffect(() => {
    setLocalRemainingMs(calculateRemainingMs())
    // Reset triggered warnings when phase changes
    triggeredWarnings.current.clear()
  }, [remainingMinutes, calculateRemainingMs])

  // Visibility API - sync when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = document.visibilityState
      onVisibilityChange?.(state)

      if (state === 'visible' && startTime) {
        // Immediately recalculate on tab focus
        setLocalRemainingMs(calculateRemainingMs())
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [onVisibilityChange, startTime, calculateRemainingMs])

  // Audio warning triggers
  useEffect(() => {
    if (!enableAudioWarnings || !onTimeWarning || isPaused) return

    const remainingSeconds = Math.floor(localRemainingMs / 1000)

    // One-minute warning (60 seconds)
    if (remainingSeconds <= 60 && remainingSeconds > 10 && !triggeredWarnings.current.has('one-minute')) {
      triggeredWarnings.current.add('one-minute')
      onTimeWarning('one-minute')
    }

    // Ten-second warning
    if (remainingSeconds <= 10 && remainingSeconds > 0 && !triggeredWarnings.current.has('ten-seconds')) {
      triggeredWarnings.current.add('ten-seconds')
      onTimeWarning('ten-seconds')
    }

    // Phase complete
    if (remainingSeconds <= 0 && !triggeredWarnings.current.has('phase-complete')) {
      triggeredWarnings.current.add('phase-complete')
      onTimeWarning('phase-complete')
    }
  }, [localRemainingMs, enableAudioWarnings, onTimeWarning, isPaused])

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const pad = (n: number) => n.toString().padStart(2, '0')

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`
    }
    return `${minutes}:${pad(seconds)}`
  }

  // Calculate percentage for progress bar
  const calculateProgress = () => {
    if (isOvertime) return 100
    const elapsed = totalMinutes - remainingMinutes
    return Math.min(100, (elapsed / totalMinutes) * 100)
  }

  // Determine color based on remaining percentage
  const getTimerColor = () => {
    if (isOvertime) return 'text-red-600'
    const percentRemaining = (remainingMinutes / totalMinutes) * 100
    if (percentRemaining > 50) return 'text-green-600'
    if (percentRemaining > 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get progress bar color
  const getProgressColor = () => {
    if (isOvertime) return 'bg-red-600'
    const percentRemaining = (remainingMinutes / totalMinutes) * 100
    if (percentRemaining > 50) return 'bg-green-600'
    if (percentRemaining > 20) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  // Calculate urgency states
  const remainingSeconds = Math.floor(localRemainingMs / 1000)
  const shouldPulse = remainingMinutes < 1 && !isOvertime && !isPaused
  const isUrgent = remainingSeconds <= 30 && !isOvertime

  const phaseLabels = {
    discovery: 'Discovery Phase',
    build: 'Build Phase',
    demo: 'Demo Phase',
  }

  if (compact) {
    return (
      <div className={cn('text-2xl font-mono font-bold', getTimerColor())}>
        {isOvertime ? `+${formatTime(overtimeMinutes * 60 * 1000)}` : formatTime(localRemainingMs)}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Phase Label */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">{phaseLabels[phase]}</h3>
        <span className="text-xs text-gray-500">{totalMinutes} min total</span>
      </div>

      {/* Timer Display */}
      <div
        data-testid="timer"
        className={cn(
          'text-5xl font-mono font-bold text-center',
          getTimerColor(),
          shouldPulse && 'animate-pulse',
          isUrgent && 'ring-2 ring-red-500'
        )}
      >
        {isOvertime ? `+${formatTime(overtimeMinutes * 60 * 1000)}` : formatTime(localRemainingMs)}
      </div>

      {/* Overtime Badge */}
      {isOvertime && (
        <div className="flex justify-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Overtime
          </span>
        </div>
      )}

      {/* Progress Bar */}
      {!compact && (
        <div data-testid="progress-bar" className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            data-testid="progress-fill"
            className={cn('h-full transition-all duration-1000', getProgressColor())}
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      )}
    </div>
  )
}
