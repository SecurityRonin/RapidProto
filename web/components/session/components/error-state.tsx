/**
 * Error State Component
 *
 * Full-screen error display with recovery action.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message?: string
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <p className="text-muted-foreground">{message || 'Session not found'}</p>
      <Button variant="outline" asChild>
        <Link href="/session/new">Start a new session</Link>
      </Button>
    </div>
  )
}
