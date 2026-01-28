/**
 * Phase Indicators Component
 *
 * Displays progress through phases/stages with connected dots.
 * Shared between builder and facilitator views.
 */

import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface PhaseIndicatorItem {
  id: string
  label: string
  isCurrent: boolean
  isCompleted: boolean
}

interface PhaseIndicatorsProps {
  items: PhaseIndicatorItem[]
}

/**
 * Renders a horizontal phase progress indicator.
 *
 * @example
 * ```tsx
 * <PhaseIndicators items={[
 *   { id: 'discovery', label: 'Discovery', isCurrent: true, isCompleted: false },
 *   { id: 'build', label: 'Build', isCurrent: false, isCompleted: false },
 *   { id: 'demo', label: 'Verify', isCurrent: false, isCompleted: false },
 * ]} />
 * ```
 */
export function PhaseIndicators({ items }: PhaseIndicatorsProps) {
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-3">
          {/* Separator between items */}
          {index > 0 && <Separator className="w-6" />}

          {/* Phase/Stage indicator */}
          <div className="flex items-center gap-2">
            {/* Dot */}
            <div
              className={cn(
                'w-2.5 h-2.5 rounded-full transition-all',
                item.isCompleted && 'bg-primary',
                item.isCurrent && 'bg-primary ring-4 ring-primary/20',
                !item.isCurrent && !item.isCompleted && 'bg-muted'
              )}
            />

            {/* Label */}
            <span
              className={cn(
                'text-sm',
                item.isCurrent ? 'font-medium' : 'text-muted-foreground'
              )}
            >
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// BUILDER-SPECIFIC INDICATORS
// =============================================================================

import type { BuilderPhase } from '../types'
import { BUILDER_PHASE_NAMES, isBuilderPhaseCompleted } from '../constants'

interface BuilderPhaseIndicatorsProps {
  currentPhase: BuilderPhase
}

export function BuilderPhaseIndicators({ currentPhase }: BuilderPhaseIndicatorsProps) {
  const phases: BuilderPhase[] = ['discovery', 'build', 'demo']

  const items: PhaseIndicatorItem[] = phases.map((phase) => ({
    id: phase,
    label: BUILDER_PHASE_NAMES[phase],
    isCurrent: phase === currentPhase,
    isCompleted: isBuilderPhaseCompleted(phase, currentPhase),
  }))

  return <PhaseIndicators items={items} />
}

// =============================================================================
// FACILITATOR-SPECIFIC INDICATORS
// =============================================================================

import type { FacilitatorStage } from '../types'
import { FACILITATOR_STAGE_NAMES, isFacilitatorStageCompleted } from '../constants'

interface FacilitatorStageIndicatorsProps {
  currentStage: FacilitatorStage
}

export function FacilitatorStageIndicators({ currentStage }: FacilitatorStageIndicatorsProps) {
  const stages: FacilitatorStage[] = ['expectations', 'longterm', 'close']

  const items: PhaseIndicatorItem[] = stages.map((stage) => ({
    id: stage,
    label: FACILITATOR_STAGE_NAMES[stage],
    isCurrent: stage === currentStage,
    isCompleted: isFacilitatorStageCompleted(stage, currentStage),
  }))

  return <PhaseIndicators items={items} />
}
