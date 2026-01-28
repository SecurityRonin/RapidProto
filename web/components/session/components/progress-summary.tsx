/**
 * Progress Summary Component
 *
 * Bottom stats card showing steps completed, current phase/stage, and elapsed time.
 */

import { Card, CardContent } from '@/components/ui/card'
import type { Role, BuilderPhase, FacilitatorStage, TimeRemaining } from '../types'
import { BUILDER_PHASE_NAMES, FACILITATOR_STAGE_NAMES } from '../constants'

interface ProgressSummaryProps {
  role: Role
  phase: BuilderPhase
  facilitatorStage: FacilitatorStage
  stepsCompleted: number
  stepsTotal: number
  timeRemaining: TimeRemaining | null
}

export function ProgressSummary({
  role,
  phase,
  facilitatorStage,
  stepsCompleted,
  stepsTotal,
  timeRemaining,
}: ProgressSummaryProps) {
  const isBuilder = role === 'builder'
  const currentLabel = isBuilder
    ? BUILDER_PHASE_NAMES[phase]
    : FACILITATOR_STAGE_NAMES[facilitatorStage]

  const elapsedMinutes = timeRemaining ? Math.round(timeRemaining.elapsedMinutes) : 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-6 text-center">
          {/* Steps */}
          <div>
            <div className="text-2xl font-semibold">
              {stepsCompleted}/{stepsTotal}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Steps</div>
          </div>

          {/* Phase/Stage */}
          <div>
            <div className="text-2xl font-semibold capitalize">{currentLabel}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isBuilder ? 'Phase' : 'Stage'}
            </div>
          </div>

          {/* Elapsed */}
          <div>
            <div className="text-2xl font-semibold">{elapsedMinutes}m</div>
            <div className="text-xs text-muted-foreground mt-1">Elapsed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
