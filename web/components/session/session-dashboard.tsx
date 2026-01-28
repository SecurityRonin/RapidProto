/**
 * Session Dashboard Component
 * Clean, focused design using shadcn/ui components
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pause, Play, ArrowRight, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  pauseSession,
  resumeSession,
  advancePhase,
  completeSession,
  advanceFacilitatorStage,
} from '@/lib/client-actions'
import { SessionProvider, useSession, useSessionTimer, useCurrentPhase } from '@/hooks/use-session'
import { StepChecklist } from './step-checklist'
import { cn } from '@/lib/utils'

type Role = 'builder' | 'facilitator'

interface SessionDashboardProps {
  sessionId: string
  role?: Role
}

function formatTime(minutes: number): string {
  const mins = Math.floor(minutes)
  const secs = Math.floor((minutes - mins) * 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Helper to get role from localStorage (client-side only)
function getStoredRole(sessionId: string): Role | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(`rapidproto_role_${sessionId}`)
  if (stored === 'builder' || stored === 'facilitator') return stored
  return null
}

function SessionDashboardContent({ sessionId, role: propRole }: { sessionId: string; role?: Role }) {
  const { session, loading, error, refresh } = useSession()
  const timeRemaining = useSessionTimer()
  const currentPhase = useCurrentPhase()
  const [mounted, setMounted] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine role: prop > localStorage > default
  // Only check localStorage after mount to avoid SSR/hydration mismatch
  const role: Role = propRole || (mounted ? getStoredRole(sessionId) : null) || 'builder'
  const isBuilder = role === 'builder'
  const isFacilitator = role === 'facilitator'

  const executeAction = (action: () => { success: boolean; error?: string }) => {
    setIsPending(true)
    setActionError(null)
    try {
      const result = action()
      if (!result.success && 'error' in result) {
        setActionError(result.error || 'Action failed')
      }
      refresh()
    } catch (err) {
      setActionError('Something went wrong')
    } finally {
      setIsPending(false)
    }
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">{error || 'Session not found'}</p>
        <Button variant="outline" asChild>
          <Link href="/session/new">Start a new session</Link>
        </Button>
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">RapidProto</span>
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            {/* Session Code (for builder to share) */}
            {isBuilder && (
              <Badge variant="outline" className="font-mono text-xs">
                {sessionId.toUpperCase().slice(0, 6)}
              </Badge>
            )}
            {/* Role indicator for facilitator */}
            {isFacilitator && (
              <Badge variant="secondary" className="text-xs">
                Facilitator
              </Badge>
            )}
            {session.session.sessionTitle && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {session.session.sessionTitle}
              </span>
            )}
            <Badge variant={isActive ? 'default' : isPaused ? 'secondary' : 'outline'}>
              {session.session.status}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Timer Card */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center space-y-6">
              {/* Phase Label */}
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="uppercase tracking-widest text-xs">
                  {phase}
                </Badge>
              </div>

              {/* Timer Display */}
              <div className={cn(
                'text-6xl sm:text-7xl md:text-8xl font-light tracking-tight tabular-nums font-mono',
                timeRemaining?.isOvertime && 'text-destructive',
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
              <div className="max-w-sm mx-auto">
                <Progress
                  value={Math.min(progressPercentage, 100)}
                  className={cn(
                    'h-2',
                    timeRemaining?.isOvertime && '[&>div]:bg-destructive'
                  )}
                />
              </div>

              {/* Phase Indicators */}
              <div className="flex items-center justify-center gap-4 pt-2">
                {isBuilder ? (
                  // Builder phases: Discovery → Build → Verify
                  (['discovery', 'build', 'demo'] as const).map((p, index) => {
                    const isCurrentPhase = phase === p
                    const isCompletedPhase =
                      (p === 'discovery' && ['build', 'demo'].includes(phase)) ||
                      (p === 'build' && phase === 'demo')

                    return (
                      <div key={p} className="flex items-center gap-3">
                        {index > 0 && <Separator className="w-6" />}
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-2.5 h-2.5 rounded-full transition-all',
                            isCompletedPhase && 'bg-primary',
                            isCurrentPhase && 'bg-primary ring-4 ring-primary/20',
                            !isCurrentPhase && !isCompletedPhase && 'bg-muted'
                          )} />
                          <span className={cn(
                            'text-sm capitalize',
                            isCurrentPhase ? 'font-medium' : 'text-muted-foreground'
                          )}>
                            {p === 'demo' ? 'verify' : p}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  // Facilitator stages: Expectations → Long Term → Close
                  (['expectations', 'longterm', 'close'] as const).map((s, index) => {
                    // Facilitator is active during builder's Build phase
                    const isBuildPhase = phase === 'build'
                    const isCurrentStage = isBuildPhase && index === 0 // Default to first stage
                    const isCompletedStage = false // TODO: track facilitator progress

                    return (
                      <div key={s} className="flex items-center gap-3">
                        {index > 0 && <Separator className="w-6" />}
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-2.5 h-2.5 rounded-full transition-all',
                            isCompletedStage && 'bg-primary',
                            isCurrentStage && 'bg-primary ring-4 ring-primary/20',
                            !isCurrentStage && !isCompletedStage && 'bg-muted'
                          )} />
                          <span className={cn(
                            'text-sm',
                            isCurrentStage ? 'font-medium' : 'text-muted-foreground'
                          )}>
                            {s === 'longterm' ? 'Long Term' : s === 'expectations' ? 'Expectations' : 'Close'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Control Buttons */}
          {!isCompleted && (
            <div className="flex items-center justify-center gap-3">
              {isActive && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => executeAction(() => pauseSession(sessionId))}
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

              {isPaused && (
                <Button
                  size="lg"
                  onClick={() => executeAction(() => resumeSession(sessionId))}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Resume
                </Button>
              )}

              {/* Builder: Advance Phase */}
              {isBuilder && isActive && phase !== 'demo' && (
                <Button
                  size="lg"
                  onClick={() => executeAction(() => advancePhase(sessionId))}
                  disabled={isPending}
                >
                  {phase === 'discovery' ? 'Start Build' : 'Start Verify'}
                  {isPending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 ml-2" />
                  )}
                </Button>
              )}

              {/* Facilitator: Advance Stage */}
              {isFacilitator && isActive && (session.session as any).facilitatorStage !== 'close' && (
                <Button
                  size="lg"
                  onClick={() => executeAction(() => advanceFacilitatorStage(sessionId))}
                  disabled={isPending}
                >
                  {(session.session as any).facilitatorStage === 'expectations' ? 'Start Long Term' : 'Start Close'}
                  {isPending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 ml-2" />
                  )}
                </Button>
              )}

              {/* Complete Session */}
              {isActive && ((isBuilder && phase === 'demo') || (isFacilitator && (session.session as any).facilitatorStage === 'close')) && (
                <Button
                  size="lg"
                  onClick={() => executeAction(() => completeSession(sessionId))}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Complete
                </Button>
              )}
            </div>
          )}

          {/* Error Display */}
          {actionError && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="py-4 text-center">
                <p className="text-sm text-destructive">{actionError}</p>
              </CardContent>
            </Card>
          )}

          {/* Synced Inputs from Other Role (Facilitator sees Builder's discoveries) */}
          {isFacilitator && (session.session as any).syncedInputs && (
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                  From Builder
                </h3>
                <div className="space-y-3">
                  {(session.session as any).syncedInputs.coreFeature && (
                    <div>
                      <p className="text-xs text-muted-foreground">Core Feature</p>
                      <p className="font-medium">{(session.session as any).syncedInputs.coreFeature}</p>
                    </div>
                  )}
                  {(session.session as any).syncedInputs.template && (
                    <div>
                      <p className="text-xs text-muted-foreground">Template</p>
                      <p className="font-medium">{(session.session as any).syncedInputs.template}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step Checklist */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              {isBuilder
                ? (phase === 'demo' ? 'Verify' : phase)
                : ((session.session as any).facilitatorStage || 'expectations')
              } Steps
            </h2>
            {session.session.steps && (
              <StepChecklist
                steps={session.session.steps}
                currentPhase={isBuilder ? phase : ((session.session as any).facilitatorStage || 'expectations')}
              />
            )}
          </div>

          {/* Progress Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-semibold">
                    {session.stepsCompleted}/{session.stepsTotal}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Steps</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold capitalize">
                    {isBuilder
                      ? (phase === 'demo' ? 'Verify' : phase)
                      : ((session.session as any).facilitatorStage || 'expectations')
                    }
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{isBuilder ? 'Phase' : 'Stage'}</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold">
                    {timeRemaining ? Math.round(timeRemaining.elapsedMinutes) : 0}m
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Elapsed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export function SessionDashboard({ sessionId, role }: SessionDashboardProps) {
  return (
    <SessionProvider sessionId={sessionId}>
      <SessionDashboardContent sessionId={sessionId} role={role} />
    </SessionProvider>
  )
}
