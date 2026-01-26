/**
 * Session Dashboard Component
 * Minimal & Sophisticated design - focused single-column layout
 */

'use client'

import { Pause, Play, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  pauseSession,
  resumeSession,
  advancePhase,
  completeSession,
} from '@/lib/actions'
import { SessionProvider, useSession, useSessionTimer, useCurrentPhase } from '@/hooks/use-session'
import { useAction } from '@/hooks/use-action'
import { StepChecklist } from './step-checklist'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface SessionDashboardProps {
  sessionId: string
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
 * Main dashboard content - consumes SessionContext
 */
function SessionDashboardContent({ sessionId }: { sessionId: string }) {
  const { session, loading, error, refresh } = useSession()
  const timeRemaining = useSessionTimer()
  const currentPhase = useCurrentPhase()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Action hooks with automatic refresh on success
  const pauseAction = useAction(
    () => pauseSession(sessionId),
    { onSuccess: () => refresh() }
  )

  const resumeAction = useAction(
    () => resumeSession(sessionId),
    { onSuccess: () => refresh() }
  )

  const advanceAction = useAction(
    () => advancePhase(sessionId),
    { onSuccess: () => refresh() }
  )

  const completeAction = useAction(
    () => completeSession(sessionId),
    { onSuccess: () => refresh() }
  )

  const isActionPending =
    pauseAction.isPending ||
    resumeAction.isPending ||
    advanceAction.isPending ||
    completeAction.isPending

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error || 'Session not found'}</p>
        <Link href="/session/new" className="text-gray-900 underline hover:no-underline">
          Start a new session
        </Link>
      </div>
    )
  }

  const isActive = session.session.status === 'active'
  const isPaused = session.session.status === 'paused'
  const isCompleted = session.session.status === 'completed'
  const phase = currentPhase ?? 'discovery'

  const progressPercentage = timeRemaining
    ? ((timeRemaining.totalMinutes - timeRemaining.remainingMinutes) / timeRemaining.totalMinutes) * 100
    : 0

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">RapidProto</span>
          </Link>

          <div className="flex items-center gap-3">
            {session.session.sessionTitle && (
              <span className="text-sm text-gray-600 hidden sm:block">
                {session.session.sessionTitle}
              </span>
            )}
            <span className={cn(
              'px-3 py-1 text-xs font-medium rounded-full',
              isActive && 'bg-gray-900 text-white',
              isPaused && 'bg-gray-200 text-gray-600',
              isCompleted && 'bg-gray-100 text-gray-500'
            )}>
              {session.session.status}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {/* Timer Section */}
          <div className="text-center space-y-6">
            {/* Phase Label */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                {phase}
              </span>
              <span className="text-xs text-gray-300">
                {session.session.role === 'builder' ? 'Builder' : 'Facilitator'}
              </span>
            </div>

            {/* Timer Display */}
            <div className={cn(
              'text-7xl md:text-8xl font-light tracking-tight tabular-nums',
              timeRemaining?.isOvertime && 'text-red-500',
              isPaused && 'opacity-50'
            )}>
              {timeRemaining ? (
                timeRemaining.isOvertime ? (
                  <span>+{formatTime(timeRemaining.overtimeMinutes)}</span>
                ) : (
                  formatTime(timeRemaining.remainingMinutes)
                )
              ) : (
                '--:--'
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs mx-auto">
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-1000',
                    timeRemaining?.isOvertime ? 'bg-red-500' : 'bg-gray-900'
                  )}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Phase Steps Progress */}
            <div className="flex items-center justify-center gap-6 text-sm">
              {(['discovery', 'build', 'demo'] as const).map((p, index) => {
                const isCurrentPhase = phase === p
                const isCompletedPhase =
                  (p === 'discovery' && ['build', 'demo'].includes(phase)) ||
                  (p === 'build' && phase === 'demo')

                return (
                  <div key={p} className="flex items-center gap-2">
                    {index > 0 && <div className="w-4 h-px bg-gray-200" />}
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      isCompletedPhase && 'bg-gray-900',
                      isCurrentPhase && 'bg-gray-900 ring-4 ring-gray-200',
                      !isCurrentPhase && !isCompletedPhase && 'bg-gray-200'
                    )} />
                    <span className={cn(
                      'capitalize',
                      isCurrentPhase ? 'text-gray-900 font-medium' : 'text-gray-400'
                    )}>
                      {p}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Control Buttons */}
          {!isCompleted && (
            <div className="flex items-center justify-center gap-3">
              {isActive && (
                <button
                  onClick={() => pauseAction.execute()}
                  disabled={isActionPending}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  <Pause className="w-4 h-4" />
                  {pauseAction.isPending ? 'Pausing...' : 'Pause'}
                </button>
              )}

              {isPaused && (
                <button
                  onClick={() => resumeAction.execute()}
                  disabled={isActionPending}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                  <Play className="w-4 h-4" />
                  {resumeAction.isPending ? 'Resuming...' : 'Resume'}
                </button>
              )}

              {isActive && phase !== 'demo' && (
                <button
                  onClick={() => advanceAction.execute()}
                  disabled={isActionPending}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                  {advanceAction.isPending ? 'Advancing...' : phase === 'discovery' ? 'Start Build' : 'Start Demo'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {isActive && phase === 'demo' && (
                <button
                  onClick={() => completeAction.execute()}
                  disabled={isActionPending}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  {completeAction.isPending ? 'Completing...' : 'Complete'}
                </button>
              )}
            </div>
          )}

          {/* Error Display */}
          {(pauseAction.error || resumeAction.error || advanceAction.error || completeAction.error) && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center">
              {pauseAction.error || resumeAction.error || advanceAction.error || completeAction.error}
            </div>
          )}

          {/* Step Checklist */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              {phase} Steps
            </h2>
            {session.session.steps && (
              <StepChecklist
                steps={session.session.steps}
                currentPhase={phase}
              />
            )}
          </div>

          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">
                {session.stepsCompleted}/{session.stepsTotal}
              </div>
              <div className="text-xs text-gray-400 mt-1">Steps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900 capitalize">
                {phase}
              </div>
              <div className="text-xs text-gray-400 mt-1">Phase</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-gray-900">
                {timeRemaining ? Math.round(timeRemaining.elapsedMinutes) : 0}m
              </div>
              <div className="text-xs text-gray-400 mt-1">Elapsed</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

/**
 * SessionDashboard - wraps content with SessionProvider
 */
export function SessionDashboard({ sessionId }: SessionDashboardProps) {
  return (
    <SessionProvider sessionId={sessionId}>
      <SessionDashboardContent sessionId={sessionId} />
    </SessionProvider>
  )
}
