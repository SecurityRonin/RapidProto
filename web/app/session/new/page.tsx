'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createSession } from '@/lib/actions'
import { ArrowLeft, ArrowRight, Timer, Layers, Rocket, Loader2 } from 'lucide-react'

export default function NewSessionPage() {
  const router = useRouter()
  const [projectName, setProjectName] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartSession = async () => {
    setIsStarting(true)
    setError(null)
    try {
      const result = await createSession({
        role: 'builder',
        sessionTitle: projectName || 'Untitled Prototype',
      })
      if (result.success && result.data) {
        router.push(`/session/${result.data.id}`)
      } else {
        setError('error' in result ? result.error : 'Failed to create session')
        setIsStarting(false)
      }
    } catch (err) {
      console.error('Failed to create session:', err)
      setError('Something went wrong. Please try again.')
      setIsStarting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">New Session</h1>
            <p className="text-sm text-muted-foreground">Start your 50-minute prototype sprint</p>
          </div>
        </div>

        {/* Project Name Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">What are you building?</CardTitle>
            <CardDescription>
              Give your prototype a name. You can always change this later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g., Todo App, Landing Page, API Dashboard..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-lg h-12"
              autoFocus
            />
          </CardContent>
        </Card>

        {/* Session Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Session Timeline</CardTitle>
            <CardDescription>
              50 minutes of focused building, broken into 3 phases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PhaseRow
              icon={<Layers className="w-4 h-4" />}
              title="Discovery"
              duration="10 min"
              description="Define what you're building, pick a template"
            />
            <PhaseRow
              icon={<Timer className="w-4 h-4" />}
              title="Build"
              duration="30 min"
              description="Code the core functionality"
              highlighted
            />
            <PhaseRow
              icon={<Rocket className="w-4 h-4" />}
              title="Verify"
              duration="10 min"
              description="Test, fix critical issues, ship"
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-destructive bg-destructive/5">
            <CardContent className="py-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Start Button */}
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            className="w-full max-w-sm h-14 text-lg"
            onClick={handleStartSession}
            disabled={isStarting}
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Start 50-min Session
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            The timer starts immediately. Ready?
          </p>
        </div>
      </div>
    </main>
  )
}

function PhaseRow({
  icon,
  title,
  duration,
  description,
  highlighted = false,
}: {
  icon: React.ReactNode
  title: string
  duration: string
  description: string
  highlighted?: boolean
}) {
  return (
    <div className={`
      flex items-center gap-4 p-3 rounded-lg transition-colors
      ${highlighted ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'}
    `}>
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
        ${highlighted ? 'bg-primary text-primary-foreground' : 'bg-muted'}
      `}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          <Badge variant={highlighted ? 'default' : 'secondary'} className="text-xs">
            {duration}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
