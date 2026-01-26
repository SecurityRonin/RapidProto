/**
 * Session Dashboard Component
 * Main orchestrator for Builder and Facilitator sessions
 *
 * Refactored to use:
 * - SessionProvider for centralized state
 * - useAction hook for action execution
 * - parseStringArray for safe JSON parsing
 */

'use client'

import { Pause, Play, SkipForward, CheckCircle, Menu, X } from 'lucide-react'
import {
  pauseSession,
  resumeSession,
  advancePhase,
  completeSession,
} from '@/lib/actions'
import { SessionProvider, useSession, useSessionTimer, useClientInfo, useCurrentPhase } from '@/hooks/use-session'
import { useAction } from '@/hooks/use-action'
import { parseStringArray } from '@/lib/utils/json-fields'
import { SessionTimer } from './session-timer'
import { StepChecklist } from './step-checklist'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface SessionDashboardProps {
  sessionId: string
}

/**
 * Main dashboard content - consumes SessionContext
 */
function SessionDashboardContent({ sessionId }: { sessionId: string }) {
  const { session, loading, error, refresh } = useSession()
  const timeRemaining = useSessionTimer()
  const clientInfo = useClientInfo()
  const currentPhase = useCurrentPhase()
  const [sidebarOpen, setSidebarOpen] = useState(true)

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

  // Check if any action is in progress
  const isActionPending =
    pauseAction.isPending ||
    resumeAction.isPending ||
    advanceAction.isPending ||
    completeAction.isPending

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading session...</div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">{error || 'Session not found'}</div>
      </div>
    )
  }

  const isActive = session.session.status === 'active'
  const isPaused = session.session.status === 'paused'
  const isCompleted = session.session.status === 'completed'
  const phase = currentPhase ?? 'discovery'

  // Parse threeWins safely - handles both raw JSON strings and pre-parsed arrays
  const threeWins: string[] = clientInfo?.threeWins
    ? (typeof clientInfo.threeWins === 'string'
        ? parseStringArray(clientInfo.threeWins)
        : clientInfo.threeWins)
    : []

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-white border-r transform transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0 open' : '-translate-x-full closed lg:translate-x-0',
          'mobile-collapsed lg:block'
        )}
      >
        <div className="h-full overflow-y-auto p-6 space-y-6">
          {/* Session Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                {session.session.role === 'builder' ? 'Builder' : 'Facilitator'} Session
              </h2>
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded',
                isActive && 'bg-green-100 text-green-800',
                isPaused && 'bg-yellow-100 text-yellow-800',
                isCompleted && 'bg-gray-100 text-gray-800'
              )}>
                {session.session.status}
              </span>
            </div>
            {session.session.sessionTitle && (
              <p className="text-sm text-gray-600">{session.session.sessionTitle}</p>
            )}
          </div>

          {/* Phase Progress */}
          <div data-testid="phase-container" className="space-y-2 vertical-layout lg:horizontal-layout">
            {(['discovery', 'build', 'demo'] as const).map((p, index) => {
              const isCurrentPhase = phase === p
              const isCompletedPhase =
                (p === 'discovery' && ['build', 'demo'].includes(phase)) ||
                (p === 'build' && phase === 'demo')

              return (
                <div
                  key={p}
                  data-testid={`phase-${p}`}
                  className={cn(
                    'p-3 rounded-lg border transition-colors',
                    isCurrentPhase && 'active bg-blue-50 border-blue-500',
                    isCompletedPhase && 'completed bg-green-50 border-green-500',
                    !isCurrentPhase && !isCompletedPhase && 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                      isCompletedPhase && 'bg-green-600 text-white',
                      isCurrentPhase && 'bg-blue-600 text-white',
                      !isCurrentPhase && !isCompletedPhase && 'bg-gray-300 text-gray-600'
                    )}>
                      {isCompletedPhase ? '✓' : index + 1}
                    </div>
                    <span className={cn(
                      'font-medium capitalize',
                      isCurrentPhase && 'text-blue-900',
                      !isCurrentPhase && 'text-gray-700'
                    )}>
                      {p}
                    </span>
                  </div>
                  <div className="mt-1 ml-8 text-sm text-gray-600">
                    {p === 'discovery' && `${session.session.discoveryDuration} min`}
                    {p === 'build' && `${session.session.buildDuration} min`}
                    {p === 'demo' && `${session.session.demoDuration} min`}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Client Info */}
          {clientInfo && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Client</h3>
              <p className="text-gray-700">{clientInfo.clientName}</p>
              {clientInfo.businessType && (
                <p className="text-sm text-gray-600 mt-1">{clientInfo.businessType}</p>
              )}

              {threeWins.length > 0 && (
                <div data-testid="three-wins" className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-gray-700">Three Wins:</p>
                  {threeWins.map((win: string, i: number) => (
                    <p key={i} className="text-xs text-gray-600">• {win}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Template */}
          {session.selectedTemplate && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Template</h3>
              <p className="text-gray-700">
                #{session.selectedTemplate.templateNumber} {session.selectedTemplate.templateName}
              </p>
              {session.selectedTemplate.customizationNotes && (
                <div data-testid="customization-notes" className="mt-2 text-sm text-gray-600">
                  {session.selectedTemplate.customizationNotes}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 space-y-6">
          {/* Header with Controls */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              {/* Mobile Sidebar Toggle */}
              <button
                data-testid="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Timer */}
              <div className="flex-1 min-w-[200px]">
                {timeRemaining && (
                  <SessionTimer
                    remainingMinutes={timeRemaining.remainingMinutes}
                    totalMinutes={timeRemaining.totalMinutes}
                    phase={phase}
                    isOvertime={timeRemaining.isOvertime}
                    overtimeMinutes={timeRemaining.overtimeMinutes}
                    isPaused={isPaused}
                  />
                )}
              </div>

              {/* Session Controls */}
              <div className="flex items-center gap-2">
                {isActive && (
                  <button
                    onClick={() => pauseAction.execute()}
                    disabled={isActionPending}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium disabled:opacity-50"
                  >
                    <Pause className="w-4 h-4" />
                    {pauseAction.isPending ? 'Pausing...' : 'Pause'}
                  </button>
                )}

                {isPaused && (
                  <button
                    onClick={() => resumeAction.execute()}
                    disabled={isActionPending}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    {resumeAction.isPending ? 'Resuming...' : 'Resume'}
                  </button>
                )}

                {isActive && phase !== 'demo' && (
                  <button
                    onClick={() => advanceAction.execute()}
                    disabled={isActionPending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                  >
                    <SkipForward className="w-4 h-4" />
                    {advanceAction.isPending ? 'Advancing...' : phase === 'discovery' ? 'Start Build' : 'Start Demo'}
                  </button>
                )}

                {isActive && phase === 'demo' && (
                  <button
                    onClick={() => completeAction.execute()}
                    disabled={isActionPending}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {completeAction.isPending ? 'Completing...' : 'Complete Session'}
                  </button>
                )}
              </div>
            </div>

            {/* Error Display */}
            {(pauseAction.error || resumeAction.error || advanceAction.error || completeAction.error) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {pauseAction.error || resumeAction.error || advanceAction.error || completeAction.error}
              </div>
            )}
          </div>

          {/* Step Checklist */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase Steps
            </h2>
            {session.session.steps && (
              <StepChecklist
                steps={session.session.steps}
                currentPhase={phase}
              />
            )}
          </div>

          {/* Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-600">Steps Completed</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {session.stepsCompleted} / {session.stepsTotal}
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-600">Current Phase</div>
              <div className="text-2xl font-bold text-gray-900 mt-1 capitalize">
                {phase}
              </div>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="text-sm text-gray-600">Status</div>
              <div className="text-2xl font-bold text-gray-900 mt-1 capitalize">
                {session.session.status}
              </div>
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
