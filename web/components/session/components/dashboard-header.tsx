/**
 * Dashboard Header Component
 *
 * Sticky header with navigation, session info, and role indicator.
 * Includes subtle color tint to differentiate builder vs facilitator.
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Role, SessionStatus } from '../types'
import { formatSessionCode, STATUS_BADGE_VARIANTS } from '../constants'

interface DashboardHeaderProps {
  sessionId: string
  role: Role
  status: SessionStatus
  sessionTitle?: string | null
}

export function DashboardHeader({
  sessionId,
  role,
  status,
  sessionTitle,
}: DashboardHeaderProps) {
  const isBuilder = role === 'builder'
  const isFacilitator = role === 'facilitator'

  return (
    <header
      className={cn(
        'sticky top-0 z-10 backdrop-blur-sm border-b',
        // Role-based color tint (subtle, non-intrusive)
        isBuilder && 'bg-background/80',
        isFacilitator && 'bg-violet-50/80 dark:bg-violet-950/30'
      )}
    >
      <div className="container max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Navigation - fixed: move gap-2 to Button */}
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">RapidProto</span>
          </Link>
        </Button>

        {/* Session Info */}
        <div className="flex items-center gap-3">
          {/* Session Code (builder only, for sharing) */}
          {isBuilder && (
            <Badge variant="outline" className="font-mono text-xs">
              {formatSessionCode(sessionId)}
            </Badge>
          )}

          {/* Role indicator (facilitator only) */}
          {isFacilitator && (
            <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
              Facilitator
            </Badge>
          )}

          {/* Session title */}
          {sessionTitle && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {sessionTitle}
            </span>
          )}

          {/* Status badge */}
          <Badge variant={STATUS_BADGE_VARIANTS[status]}>
            {status}
          </Badge>
        </div>
      </div>
    </header>
  )
}
