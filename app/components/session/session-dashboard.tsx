/**
 * Session Dashboard Component
 * Main orchestrator for Builder and Facilitator sessions
 */

'use client'

import { useState, useEffect } from 'react'
import { Pause, Play, SkipForward, CheckCircle, Menu, X } from 'lucide-react'
import {
  getSessionStatus,
  pauseSession,
  resumeSession,
  advancePhase,
  completeSession,
} from '@/lib/actions'
import { SessionTimer } from './session-timer'
import { StepChecklist } from './step-checklist'
import { cn } from '@/lib/utils'

interface SessionDashboardProps {
  sessionId: string
}

export function SessionDashboard({ sessionId }: SessionDashboardProps) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Fetch session status
  const fetchSessionStatus = async () => {
    const result = await getSessionStatus(sessionId)
    if (result.success) {
      setSession(result.data)
    }
    setLoading(false)
  }

  // Initial load
  useEffect(() => {
    fetchSessionStatus()
  }, [sessionId])

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchSessionStatus, 5000)
    return () => clearInterval(interval)
  }, [sessionId])

  const handlePause = async () => {
    await pauseSession(sessionId)
    fetchSessionStatus()
  }

  const handleResume = async () => {
    await resumeSession(sessionId)
    fetchSessionStatus()
  }

  const handleAdvancePhase = async () => {
    await advancePhase(sessionId)
    fetchSessionStatus()
  }

  const handleComplete = async () => {
    await completeSession(sessionId)
    fetchSessionStatus()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading session...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Session not found</div>
      </div>
    )
  }

  const isActive = session.session.status === 'active'
  const isPaused = session.session.status === 'paused'
  const isCompleted = session.session.status === 'completed'
  const currentPhase = session.session.currentPhase

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
            {['discovery', 'build', 'demo'].map((phase, index) => {
              const isCurrentPhase = currentPhase === phase
              const isCompletedPhase =
                (phase === 'discovery' && ['build', 'demo'].includes(currentPhase)) ||
                (phase === 'build' && currentPhase === 'demo')

              return (
                <div
                  key={phase}
                  data-testid={`phase-${phase}`}
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
                      {phase}
                    </span>
                  </div>
                  <div className="mt-1 ml-8 text-sm text-gray-600">
                    {phase === 'discovery' && `${session.session.discoveryDuration} min`}
                    {phase === 'build' && `${session.session.buildDuration} min`}
                    {phase === 'demo' && `${session.session.demoDuration} min`}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Client Info */}
          {session.clientInfo && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Client</h3>
              <p className="text-gray-700">{session.clientInfo.clientName}</p>
              {session.clientInfo.businessType && (
                <p className="text-sm text-gray-600 mt-1">{session.clientInfo.businessType}</p>
              )}

              {session.clientInfo.threeWins && (
                <div data-testid="three-wins" className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-gray-700">Three Wins:</p>
                  {JSON.parse(session.clientInfo.threeWins).map((win: string, i: number) => (
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
                {session.timeRemaining && (
                  <SessionTimer
                    remainingMinutes={session.timeRemaining.remainingMinutes}
                    totalMinutes={session.timeRemaining.totalMinutes}
                    phase={currentPhase}
                    isOvertime={session.timeRemaining.isOvertime}
                    overtimeMinutes={session.timeRemaining.overtimeMinutes}
                    isPaused={isPaused}
                  />
                )}
              </div>

              {/* Session Controls */}
              <div className="flex items-center gap-2">
                {isActive && (
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}

                {isPaused && (
                  <button
                    onClick={handleResume}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                )}

                {isActive && currentPhase !== 'demo' && (
                  <button
                    onClick={handleAdvancePhase}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <SkipForward className="w-4 h-4" />
                    {currentPhase === 'discovery' ? 'Start Build' : 'Start Demo'}
                  </button>
                )}

                {isActive && currentPhase === 'demo' && (
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete Session
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Step Checklist */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase Steps
            </h2>
            {session.session.steps && (
              <StepChecklist
                steps={session.session.steps}
                currentPhase={currentPhase}
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
                {currentPhase}
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
