/**
 * Session Timer Component
 * Displays countdown timer with color-coded urgency and progress bar
 */

'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SessionTimerProps {
  remainingMinutes: number
  totalMinutes: number
  phase: 'discovery' | 'build' | 'demo'
  isOvertime?: boolean
  overtimeMinutes?: number
  isPaused?: boolean
  compact?: boolean
}

export function SessionTimer({
  remainingMinutes,
  totalMinutes,
  phase,
  isOvertime = false,
  overtimeMinutes = 0,
  isPaused = false,
  compact = false,
}: SessionTimerProps) {
  const [localRemainingMs, setLocalRemainingMs] = useState(remainingMinutes * 60 * 1000)

  // Update local countdown every second
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setLocalRemainingMs(prev => Math.max(0, prev - 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused])

  // Sync with prop changes
  useEffect(() => {
    setLocalRemainingMs(remainingMinutes * 60 * 1000)
  }, [remainingMinutes])

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

  const shouldPulse = remainingMinutes < 1 && !isOvertime

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
          shouldPulse && 'animate-pulse'
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
