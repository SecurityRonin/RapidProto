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
} from '@/lib/actions'
import { SessionProvider, useSession, useSessionTimer, useCurrentPhase } from '@/hooks/use-session'
import { useAction } from '@/hooks/use-action'
import { StepChecklist } from './step-checklist'
import { cn } from '@/lib/utils'

interface SessionDashboardProps {
  sessionId: string
}

function formatTime(minutes: number): string {
  const mins = Math.floor(minutes)
  const secs = Math.floor((minutes - mins) * 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function SessionDashboardContent({ sessionId }: { sessionId: string }) {
  const { session, loading, error, refresh } = useSession()
  const timeRemaining = useSessionTimer()
  const currentPhase = useCurrentPhase()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
                <span className="text-xs text-muted-foreground">
                  {session.session.role === 'builder' ? 'Builder' : 'Facilitator'}
                </span>
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
                {(['discovery', 'build', 'demo'] as const).map((p, index) => {
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
                          {p}
                        </span>
                      </div>
                    </div>
                  )
                })}
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
                  onClick={() => pauseAction.execute()}
                  disabled={isActionPending}
                >
                  {pauseAction.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Pause className="w-4 h-4 mr-2" />
                  )}
                  {pauseAction.isPending ? 'Pausing...' : 'Pause'}
                </Button>
              )}

              {isPaused && (
                <Button
                  size="lg"
                  onClick={() => resumeAction.execute()}
                  disabled={isActionPending}
                >
                  {resumeAction.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {resumeAction.isPending ? 'Resuming...' : 'Resume'}
                </Button>
              )}

              {isActive && phase !== 'demo' && (
                <Button
                  size="lg"
                  onClick={() => advanceAction.execute()}
                  disabled={isActionPending}
                >
                  {advanceAction.isPending ? 'Advancing...' : phase === 'discovery' ? 'Start Build' : 'Start Demo'}
                  {advanceAction.isPending ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 ml-2" />
                  )}
                </Button>
              )}

              {isActive && phase === 'demo' && (
                <Button
                  size="lg"
                  onClick={() => completeAction.execute()}
                  disabled={isActionPending}
                >
                  {completeAction.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {completeAction.isPending ? 'Completing...' : 'Complete'}
                </Button>
              )}
            </div>
          )}

          {/* Error Display */}
          {(pauseAction.error || resumeAction.error || advanceAction.error || completeAction.error) && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="py-4 text-center">
                <p className="text-sm text-destructive">
                  {pauseAction.error || resumeAction.error || advanceAction.error || completeAction.error}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step Checklist */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
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
                    {phase}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Phase</div>
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

export function SessionDashboard({ sessionId }: SessionDashboardProps) {
  return (
    <SessionProvider sessionId={sessionId}>
      <SessionDashboardContent sessionId={sessionId} />
    </SessionProvider>
  )
}
