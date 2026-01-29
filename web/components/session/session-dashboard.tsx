/**
 * Session Dashboard Component
 *
 * Main dashboard for RapidProto sessions, supporting both builder and facilitator roles.
 *
 * Architecture:
 * - Types: ./types.ts - All TypeScript types
 * - Constants: ./constants.ts - Display names, keys, helpers
 * - Debug: ./debug.ts - Structured logging (enable via ?debug=true or localStorage)
 * - Hooks:
 *   - ./use-role.ts - Role detection with SSR safety
 *   - ./use-session-actions.ts - Action execution with error handling
 * - Components: ./components/ - Presentational sub-components
 *
 * Debug Mode:
 * - Add ?debug=true to URL for one-time debugging
 * - Run `__rapidproto_debug.enable()` in console for persistent debugging
 */

'use client'

import { useEffect, useMemo } from 'react'
import { SessionProvider, useSession, useSessionTimer, useCurrentPhase } from '@/hooks/use-session'
import { StepChecklist } from './step-checklist'
import { cn } from '@/lib/utils'

// Types & Constants
import type { SessionDashboardProps, FacilitatorStage, SyncedInputs } from './types'
import { BUILDER_PHASE_NAMES, FACILITATOR_STAGE_NAMES } from './constants'

// Hooks
import { useRole } from './use-role'
import { useSessionActions, getVisibleActions } from './use-session-actions'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

// Debug
import { debug, createDebugInfo } from './debug'

// Sub-components
import {
  LoadingState,
  ErrorState,
  DashboardHeader,
  TimerCard,
  SessionControls,
  SyncedInputsCard,
  ProgressSummary,
  ActionError,
  AcquiredAnswersSidebar,
} from './components'

// =============================================================================
// MAIN CONTENT COMPONENT
// =============================================================================

interface SessionDashboardContentProps {
  sessionId: string
  propRole?: 'builder' | 'facilitator'
}

function SessionDashboardContent({ sessionId, propRole }: SessionDashboardContentProps) {
  // ---------------------------------------------------------------------------
  // HOOKS
  // ---------------------------------------------------------------------------

  const { session, loading, error } = useSession()
  const timeRemaining = useSessionTimer()
  const currentPhase = useCurrentPhase()

  const { role, isReady, isBuilder, isFacilitator, source: roleSource } = useRole({
    sessionId,
    propRole,
  })

  const {
    isPending,
    error: actionError,
    pause,
    resume,
    advancePhase,
    advanceStage,
    regressStage,
    regressPhase,
    complete,
  } = useSessionActions({ sessionId, role })

  // Compute keyboard shortcut context
  const shortcutContext = useMemo(() => {
    if (!session) {
      return { isPaused: false, canAdvance: false, canGoBack: false }
    }

    const { session: sessionData } = session
    const phase = currentPhase ?? 'discovery'
    const facilitatorStage = sessionData.facilitatorStage ?? 'expectations'

    const { showAdvance, showBack, showPause, showResume } = getVisibleActions({
      role,
      status: sessionData.status,
      phase,
      facilitatorStage,
    })

    return {
      isPaused: sessionData.status === 'paused',
      canAdvance: showAdvance,
      canGoBack: showBack,
    }
  }, [session, currentPhase, role])

  // Keyboard shortcuts
  const { enabled: shortcutsEnabled, toggle: toggleShortcuts } = useKeyboardShortcuts({
    callbacks: {
      onPause: pause,
      onResume: resume,
      onAdvance: isBuilder ? advancePhase : advanceStage,
      onBack: isBuilder ? regressPhase : regressStage,
    },
    context: shortcutContext,
  })

  // ---------------------------------------------------------------------------
  // DEBUG LOGGING
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isReady && session) {
      debug.sessionLoaded(session)
      debug.render(
        createDebugInfo({
          role,
          roleSource,
          sessionId,
          session,
          mounted: isReady,
        })
      )
    }
  }, [isReady, session, role, roleSource, sessionId])

  // ---------------------------------------------------------------------------
  // LOADING & ERROR STATES
  // ---------------------------------------------------------------------------

  if (loading || !isReady) {
    return <LoadingState />
  }

  if (error || !session) {
    return <ErrorState message={error || undefined} />
  }

  // ---------------------------------------------------------------------------
  // DERIVED STATE
  // ---------------------------------------------------------------------------

  const { session: sessionData, stepsCompleted, stepsTotal } = session
  const phase = currentPhase ?? 'discovery'
  const facilitatorStage: FacilitatorStage = sessionData.facilitatorStage ?? 'expectations'
  const status = sessionData.status
  const isPaused = status === 'paused'

  // Get synced inputs if available (for facilitator view)
  const syncedInputs: SyncedInputs | undefined = sessionData.syncedInputs

  // Current step heading label
  const currentStepLabel = isBuilder
    ? BUILDER_PHASE_NAMES[phase]
    : FACILITATOR_STAGE_NAMES[facilitatorStage]

  // Current phase/stage for step filtering
  const currentStepPhase = isBuilder ? phase : facilitatorStage

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-b',
        // Role-based background tint (visible but not distracting)
        isBuilder && 'from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20',
        isFacilitator && 'from-violet-100 to-violet-200/50 dark:from-violet-950/40 dark:to-violet-900/20'
      )}
    >
      {/* Acquired Answers Sidebar - visible to both roles, synchronized via session steps */}
      {sessionData.steps && <AcquiredAnswersSidebar steps={sessionData.steps} />}

      {/* Header */}
      <DashboardHeader
        sessionId={sessionId}
        role={role}
        status={status}
        sessionTitle={sessionData.sessionTitle}
      />

      {/* Main Content */}
      <main className="container max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Timer Card */}
          <TimerCard
            role={role}
            phase={phase}
            facilitatorStage={facilitatorStage}
            timeRemaining={timeRemaining}
            isPaused={isPaused}
          />

          {/* Session Controls */}
          <SessionControls
            role={role}
            status={status}
            phase={phase}
            facilitatorStage={facilitatorStage}
            isPending={isPending}
            showShortcuts={shortcutsEnabled}
            onPause={pause}
            onResume={resume}
            onBack={isBuilder ? regressPhase : regressStage}
            onAdvance={isBuilder ? advancePhase : advanceStage}
            onComplete={complete}
          />

          {/* Action Error Display */}
          {actionError && <ActionError message={actionError} />}

          {/* Synced Inputs from Builder (facilitator only) */}
          {isFacilitator && syncedInputs && <SyncedInputsCard inputs={syncedInputs} />}

          {/* Step Checklist */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              {currentStepLabel} Steps
            </h2>
            {sessionData.steps && (
              <StepChecklist steps={sessionData.steps} currentPhase={currentStepPhase} />
            )}
          </div>

          {/* Progress Summary */}
          <ProgressSummary
            role={role}
            phase={phase}
            facilitatorStage={facilitatorStage}
            stepsCompleted={stepsCompleted}
            stepsTotal={stepsTotal}
            timeRemaining={timeRemaining}
          />
        </div>
      </main>
    </div>
  )
}

// =============================================================================
// EXPORTED WRAPPER
// =============================================================================

/**
 * Session Dashboard
 *
 * Main entry point for the session dashboard. Wraps content in SessionProvider.
 *
 * @param sessionId - The session ID to display
 * @param role - Optional explicit role override (otherwise detected from localStorage)
 *
 * @example
 * ```tsx
 * // Let role be detected from localStorage
 * <SessionDashboard sessionId="abc123" />
 *
 * // Force builder role
 * <SessionDashboard sessionId="abc123" role="builder" />
 *
 * // Force facilitator role
 * <SessionDashboard sessionId="abc123" role="facilitator" />
 * ```
 */
export function SessionDashboard({ sessionId, role }: SessionDashboardProps) {
  return (
    <SessionProvider sessionId={sessionId}>
      <SessionDashboardContent sessionId={sessionId} propRole={role} />
    </SessionProvider>
  )
}
