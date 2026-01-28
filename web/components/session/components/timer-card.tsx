/**
 * Timer Card Component
 *
 * Central timer display with phase indicator and progress bar.
 * Includes visual warnings at key time thresholds.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { TimeRemaining, BuilderPhase, FacilitatorStage, Role } from '../types'
import { BUILDER_PHASE_NAMES, FACILITATOR_STAGE_NAMES } from '../constants'
import { BuilderPhaseIndicators, FacilitatorStageIndicators } from './phase-indicators'

// Time warning thresholds (in minutes)
const WARNING_THRESHOLDS = {
  fiveMinutes: 5,
  oneMinute: 1,
  tenSeconds: 10 / 60, // 10 seconds in minutes
} as const

type WarningLevel = 'none' | 'yellow' | 'red' | 'urgent'

/**
 * Determine the warning level based on remaining time
 */
function getWarningLevel(timeRemaining: TimeRemaining | null): WarningLevel {
  if (!timeRemaining || timeRemaining.isOvertime) return 'none'

  const minutes = timeRemaining.remainingMinutes

  if (minutes <= WARNING_THRESHOLDS.tenSeconds) return 'urgent'
  if (minutes <= WARNING_THRESHOLDS.oneMinute) return 'red'
  if (minutes <= WARNING_THRESHOLDS.fiveMinutes) return 'yellow'

  return 'none'
}

interface TimerCardProps {
  role: Role
  phase: BuilderPhase
  facilitatorStage: FacilitatorStage
  timeRemaining: TimeRemaining | null
  isPaused: boolean
}

/**
 * Format minutes to MM:SS display
 */
function formatTime(minutes: number): string {
  const mins = Math.floor(minutes)
  const secs = Math.floor((minutes - mins) * 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Calculate progress percentage
 */
function calculateProgress(timeRemaining: TimeRemaining | null): number {
  if (!timeRemaining) return 0
  const { totalMinutes, remainingMinutes } = timeRemaining
  return ((totalMinutes - remainingMinutes) / totalMinutes) * 100
}

export function TimerCard({
  role,
  phase,
  facilitatorStage,
  timeRemaining,
  isPaused,
}: TimerCardProps) {
  const isBuilder = role === 'builder'
  const displayPhase = isBuilder ? phase : facilitatorStage
  const displayName = isBuilder
    ? BUILDER_PHASE_NAMES[phase]
    : FACILITATOR_STAGE_NAMES[facilitatorStage]

  const progressPercentage = calculateProgress(timeRemaining)
  const isOvertime = timeRemaining?.isOvertime ?? false
  const warningLevel = getWarningLevel(timeRemaining)

  // Warning badge text
  const warningBadge = warningLevel === 'red' || warningLevel === 'urgent' ? '1 MIN LEFT' : null

  return (
    <Card
      className={cn(
        'border-0 shadow-lg transition-all duration-300',
        // Warning-level styling
        warningLevel === 'yellow' && 'ring-2 ring-yellow-400/50',
        warningLevel === 'red' && 'ring-2 ring-red-400/70',
        warningLevel === 'urgent' && 'ring-4 ring-red-500'
      )}
    >
      <CardContent className="p-8 text-center space-y-6">
        {/* Phase/Stage Label with Warning Badge */}
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="uppercase tracking-widest text-xs">
            {displayName}
          </Badge>
          {warningBadge && !isPaused && (
            <Badge
              variant="destructive"
              className={cn(
                'uppercase tracking-widest text-xs',
                warningLevel === 'urgent' && 'animate-pulse'
              )}
            >
              {warningBadge}
            </Badge>
          )}
        </div>

        {/* Timer Display */}
        <div
          className={cn(
            'text-6xl sm:text-7xl md:text-8xl font-light tracking-tight tabular-nums font-mono transition-colors duration-300',
            // Color states
            isOvertime && 'text-destructive',
            isPaused && 'opacity-50',
            // Warning colors (only when not paused and not overtime)
            !isPaused && !isOvertime && warningLevel === 'yellow' && 'text-yellow-500',
            !isPaused && !isOvertime && warningLevel === 'red' && 'text-red-500',
            !isPaused && !isOvertime && warningLevel === 'urgent' && 'text-red-600 animate-pulse'
          )}
        >
          {timeRemaining ? (
            isOvertime ? (
              <span>+{formatTime(timeRemaining.overtimeMinutes)}</span>
            ) : (
              formatTime(timeRemaining.remainingMinutes)
            )
          ) : (
            '--:--'
          )}
        </div>

        {/* Progress Bar */}
        <div className="max-w-sm mx-auto">
          <Progress
            value={Math.min(progressPercentage, 100)}
            className={cn(
              'h-2 transition-colors duration-300',
              isOvertime && '[&>div]:bg-destructive',
              !isOvertime && warningLevel === 'yellow' && '[&>div]:bg-yellow-500',
              !isOvertime && warningLevel === 'red' && '[&>div]:bg-red-500',
              !isOvertime && warningLevel === 'urgent' && '[&>div]:bg-red-600'
            )}
          />
        </div>

        {/* Phase/Stage Progress Indicators */}
        {isBuilder ? (
          <BuilderPhaseIndicators currentPhase={phase} />
        ) : (
          <FacilitatorStageIndicators currentStage={facilitatorStage} />
        )}
      </CardContent>
    </Card>
  )
}
