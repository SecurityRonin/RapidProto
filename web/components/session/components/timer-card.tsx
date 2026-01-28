/**
 * Timer Card Component
 *
 * Central timer display with phase indicator and progress bar.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { TimeRemaining, BuilderPhase, FacilitatorStage, Role } from '../types'
import { BUILDER_PHASE_NAMES, FACILITATOR_STAGE_NAMES } from '../constants'
import { BuilderPhaseIndicators, FacilitatorStageIndicators } from './phase-indicators'

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

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-8 text-center space-y-6">
        {/* Phase/Stage Label */}
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="uppercase tracking-widest text-xs">
            {displayName}
          </Badge>
        </div>

        {/* Timer Display */}
        <div
          className={cn(
            'text-6xl sm:text-7xl md:text-8xl font-light tracking-tight tabular-nums font-mono',
            isOvertime && 'text-destructive',
            isPaused && 'opacity-50'
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
            className={cn('h-2', isOvertime && '[&>div]:bg-destructive')}
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
