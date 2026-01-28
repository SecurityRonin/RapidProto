/**
 * Loading State Component
 *
 * Full-screen loading indicator for session dashboard.
 */

import { Loader2 } from 'lucide-react'

export function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  )
}
