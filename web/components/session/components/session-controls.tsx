/**
 * Session Controls Component
 *
 * Action buttons for pausing, resuming, navigating stages, and completing sessions.
 * Facilitator can navigate back and forth between stages.
 * Shows keyboard shortcut hints when shortcuts are enabled.
 */

import { Pause, Play, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Role, SessionStatus, BuilderPhase, FacilitatorStage } from '../types'
import { getVisibleActions } from '../use-session-actions'
import { SHORTCUT_HINTS } from '@/hooks/use-keyboard-shortcuts'

interface SessionControlsProps {
  role: Role
  status: SessionStatus
  phase: BuilderPhase
  facilitatorStage?: FacilitatorStage
  isPending: boolean
  showShortcuts?: boolean
  onPause: () => void
  onResume: () => void
  onBack: () => void
  onAdvance: () => void
  onComplete: () => void
}

/**
 * Format button label with optional shortcut hint
 */
function withShortcut(label: string, shortcut: string | undefined, show: boolean): string {
  if (!show || !shortcut) return label
  return `${label} [${shortcut}]`
}

export function SessionControls({
  role,
  status,
  phase,
  facilitatorStage,
  isPending,
  showShortcuts = false,
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
          {withShortcut('Pause', SHORTCUT_HINTS.pause, showShortcuts)}
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
          {withShortcut('Resume', SHORTCUT_HINTS.resume, showShortcuts)}
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
          {withShortcut(backLabel, SHORTCUT_HINTS.back, showShortcuts)}
        </Button>
      )}

      {/* Advance Button (phase or stage) */}
      {showAdvance && advanceLabel && (
        <Button size="lg" onClick={onAdvance} disabled={isPending}>
          {withShortcut(advanceLabel, SHORTCUT_HINTS.advance, showShortcuts)}
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
