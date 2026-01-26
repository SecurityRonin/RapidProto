'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Users, Loader2 } from 'lucide-react'

export default function JoinSessionPage() {
  const router = useRouter()
  const [sessionCode, setSessionCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
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
      </div>
    </main>
  )
}
