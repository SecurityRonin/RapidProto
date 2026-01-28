/**
 * Session Controls Component
 *
 * Action buttons for pausing, resuming, navigating stages, and completing sessions.
 * Facilitator can navigate back and forth between stages.
 */

import { Pause, Play, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Role, SessionStatus, BuilderPhase, FacilitatorStage } from '../types'
import { getVisibleActions } from '../use-session-actions'

interface SessionControlsProps {
  role: Role
  status: SessionStatus
  phase: BuilderPhase
  facilitatorStage?: FacilitatorStage
  isPending: boolean
  onPause: () => void
  onResume: () => void
  onBack: () => void
  onAdvance: () => void
  onComplete: () => void
}

export function SessionControls({
  role,
  status,
  phase,
  facilitatorStage,
  isPending,
  onPause,
  onResume,
  onBack,
  onAdvance,
  onComplete,
}: SessionControlsProps) {
  const { showPause, showResume, showBack, showAdvance, showComplete, backLabel, advanceLabel } =
    getVisibleActions({
      role,
      status,
      phase,
      facilitatorStage,
    })

  // Don't render anything for completed sessions
  if (status === 'completed') {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Pause Button */}
      {showPause && (
        <Button
          variant="outline"
          size="lg"
          onClick={onPause}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Pause className="w-4 h-4 mr-2" />
          )}
          Pause
        </Button>
      )}

      {/* Resume Button */}
      {showResume && (
        <Button size="lg" onClick={onResume} disabled={isPending}>
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Resume
        </Button>
      )}

      {/* Back Button (facilitator only) */}
      {showBack && backLabel && (
        <Button variant="outline" size="lg" onClick={onBack} disabled={isPending}>
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ArrowLeft className="w-4 h-4 mr-2" />
          )}
          {backLabel}
        </Button>
      )}

      {/* Advance Button (phase or stage) */}
      {showAdvance && advanceLabel && (
        <Button size="lg" onClick={onAdvance} disabled={isPending}>
          {advanceLabel}
          {isPending ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4 ml-2" />
          )}
        </Button>
      )}

      {/* Complete Button */}
      {showComplete && (
        <Button size="lg" onClick={onComplete} disabled={isPending}>
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 mr-2" />
          )}
          Complete
        </Button>
      )}
    </div>
  )
}
