'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Users, Loader2, UserCircle } from 'lucide-react'
import { saveSession, type Session, type SessionStep } from '@/lib/store'
import { nanoid } from 'nanoid'

export default function JoinSessionPage() {
  const router = useRouter()
  const [sessionCode, setSessionCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isStartingPractice, setIsStartingPractice] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoinSession = async () => {
    if (!sessionCode.trim()) {
      setError('Please enter a session code')
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      // Call join API
      const response = await fetch(`/api/session/${sessionCode.toUpperCase()}/join`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        // Store role in localStorage for this session
        localStorage.setItem(`rapidproto_role_${sessionCode.toUpperCase()}`, 'facilitator')
        router.push(`/session/${sessionCode.toUpperCase()}`)
      } else {
        setError(result.error || 'Failed to join session')
        setIsJoining(false)
      }
    } catch (err) {
      console.error('Failed to join session:', err)
      setError('Something went wrong. Please check the code and try again.')
      setIsJoining(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isJoining) {
      handleJoinSession()
    }
  }

  // Create facilitator steps for practice session
  const getFacilitatorSteps = (sessionId: string): SessionStep[] => {
    const now = new Date()
    const base = { sessionId, role: 'facilitator' as const, acquiredValue: null, startedAt: null, completedAt: null, timeSpent: null, notes: null, createdAt: now }

    return [
      // Expectations stage (~10 min)
      { ...base, id: nanoid(), phase: 'expectations', stepNumber: 1, title: 'Define prototype scope', description: "Today's demo will show [X, Y, Z]", estimatedMinutes: 3, status: 'pending' },
      { ...base, id: nanoid(), phase: 'expectations', stepNumber: 2, title: 'Clarify out of scope', description: "We won't be covering [A, B, C] today", estimatedMinutes: 3, status: 'pending' },
      { ...base, id: nanoid(), phase: 'expectations', stepNumber: 3, title: 'Set success criteria', description: 'What would make this demo a win for you?', estimatedMinutes: 2, status: 'pending' },
      { ...base, id: nanoid(), phase: 'expectations', stepNumber: 4, title: 'Explain technical limitations', description: 'Some parts will be mocked/simulated', estimatedMinutes: 2, status: 'pending' },
      // Long Term stage (~10 min)
      { ...base, id: nanoid(), phase: 'longterm', stepNumber: 1, title: 'Feature roadmap', description: 'After the prototype, what features matter most?', estimatedMinutes: 3, status: 'pending' },
      { ...base, id: nanoid(), phase: 'longterm', stepNumber: 2, title: 'Priority order', description: 'If you had to pick the top 3 for v1...', estimatedMinutes: 2, status: 'pending' },
      { ...base, id: nanoid(), phase: 'longterm', stepNumber: 3, title: 'Timeline expectations', description: 'When would you ideally launch the full product?', estimatedMinutes: 2, status: 'pending' },
      { ...base, id: nanoid(), phase: 'longterm', stepNumber: 4, title: 'Ongoing relationship', description: 'How do you see us working together after launch?', estimatedMinutes: 3, status: 'pending' },
      // Close stage (~10 min)
      { ...base, id: nanoid(), phase: 'close', stepNumber: 1, title: 'Pricing discussion', description: "Let me walk you through our pricing structure", estimatedMinutes: 3, status: 'pending' },
      { ...base, id: nanoid(), phase: 'close', stepNumber: 2, title: 'Package options', description: "Here's what's included at each tier", estimatedMinutes: 2, status: 'pending' },
      { ...base, id: nanoid(), phase: 'close', stepNumber: 3, title: 'Next steps', description: "If the demo goes well, here's what happens next", estimatedMinutes: 3, status: 'pending' },
      { ...base, id: nanoid(), phase: 'close', stepNumber: 4, title: 'Commitment/deposit', description: "To move forward, we'd need [X]", estimatedMinutes: 2, status: 'pending' },
    ]
  }

  const handleStartPractice = () => {
    setIsStartingPractice(true)
    setError(null)

    try {
      const now = new Date()
      const sessionId = nanoid(6)

      const session: Session = {
        id: sessionId,
        status: 'active',
        currentPhase: 'discovery', // Timer still follows builder phases
        phaseStartedAt: now,
        discoveryDuration: 10,
        buildDuration: 30,
        demoDuration: 10,
        startedAt: now,
        pausedAt: null,
        completedAt: null,
        totalPausedTime: 0,
        sessionTitle: 'Practice Session',
        builderJoined: false, // No builder in practice mode
        facilitatorJoined: true,
        facilitatorStage: 'expectations',
        syncedInputs: {},
        createdAt: now,
        updatedAt: now,
        steps: getFacilitatorSteps(sessionId),
      }

      saveSession(session)
      localStorage.setItem(`rapidproto_role_${sessionId}`, 'facilitator')
      router.push(`/session/${sessionId}`)
    } catch (err) {
      console.error('Failed to start practice session:', err)
      setError('Something went wrong. Please try again.')
      setIsStartingPractice(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Join Session</h1>
            <p className="text-sm text-muted-foreground">Enter the code from your builder</p>
          </div>
        </div>

        {/* Join Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Join as Facilitator</CardTitle>
            <CardDescription>
              Your timer will sync with the builder's session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session Code Input */}
            <div className="space-y-2">
              <label htmlFor="session-code" className="text-sm font-medium">
                Session Code
              </label>
              <Input
                id="session-code"
                placeholder="ABC123"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                className="text-center text-2xl tracking-widest font-mono h-14"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                6-character code from the builder
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
            )}

            {/* Join Button */}
            <Button
              className="w-full h-12"
              onClick={handleJoinSession}
              disabled={isJoining || !sessionCode.trim()}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Session'
              )}
            </Button>

            {/* Info */}
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p>You'll see the same timer as the builder</p>
              <p>but with your own facilitator checklist</p>
            </div>
          </CardContent>
        </Card>

        {/* Separator */}
        <div className="flex items-center gap-4 my-8">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        {/* Practice Solo Card */}
        <Card className="bg-muted/30">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
              <UserCircle className="w-6 h-6 text-secondary-foreground" />
            </div>
            <CardTitle className="text-lg">Practice Solo</CardTitle>
            <CardDescription>
              Run through the facilitator flow on your own
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleStartPractice}
              disabled={isStartingPractice}
            >
              {isStartingPractice ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Practice Session'
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Perfect for preparing before a real session
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
