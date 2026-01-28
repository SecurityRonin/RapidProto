/**
 * Session History Component
 * Displays completed sessions with export functionality
 */

'use client'

import { useState, useEffect } from 'react'
import { Clock, Download, Trash2, FileText, FileJson, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getCompletedSessions,
  deleteSession,
  calculateSessionDuration,
  type Session,
} from '@/lib/store'
import { exportSessionAsMarkdown, exportSessionAsJson, downloadFile } from '@/lib/export-session'
import { cn } from '@/lib/utils'

interface SessionHistoryProps {
  maxItems?: number
  showExpanded?: boolean
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format duration for display
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function SessionHistory({ maxItems = 5, showExpanded = false }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Load sessions on mount
  useEffect(() => {
    setMounted(true)
    setSessions(getCompletedSessions())
  }, [])

  const handleDelete = (id: string) => {
    if (!confirm('Delete this session from history?')) return
    deleteSession(id)
    setSessions(getCompletedSessions())
  }

  const handleExportMarkdown = (session: Session) => {
    const content = exportSessionAsMarkdown(session)
    const filename = `session-${session.sessionTitle || session.id}-${formatDate(session.completedAt || session.createdAt)}.md`
    downloadFile(content, filename, 'text/markdown')
  }

  const handleExportJson = (session: Session) => {
    const content = exportSessionAsJson(session)
    const filename = `session-${session.sessionTitle || session.id}-${formatDate(session.completedAt || session.createdAt)}.json`
    downloadFile(content, filename, 'application/json')
  }

  // Don't render on server or if no sessions
  if (!mounted) return null
  if (sessions.length === 0) return null

  const displaySessions = maxItems ? sessions.slice(0, maxItems) : sessions

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displaySessions.map(session => {
          const isExpanded = expandedId === session.id
          const duration = calculateSessionDuration(session)
          const completedSteps = session.steps.filter(s => s.status === 'completed').length
          const totalSteps = session.steps.length

          return (
            <div
              key={session.id}
              className={cn(
                'p-3 rounded-lg border bg-card transition-colors',
                isExpanded && 'bg-muted/50'
              )}
            >
              {/* Header Row */}
              <div
                className="flex items-center justify-between gap-2 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">
                    {session.sessionTitle || 'Untitled Session'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(session.completedAt || session.createdAt)} &bull; {formatDuration(duration)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {completedSteps}/{totalSteps} steps
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  {/* Synced Inputs Summary */}
                  {session.syncedInputs && Object.keys(session.syncedInputs).length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Key Decisions</h5>
                      <ul className="text-sm space-y-1">
                        {session.syncedInputs.coreFeature && (
                          <li><strong>Core Feature:</strong> {session.syncedInputs.coreFeature}</li>
                        )}
                        {session.syncedInputs.template && (
                          <li><strong>Template:</strong> {session.syncedInputs.template}</li>
                        )}
                        {session.syncedInputs.requiredChanges && (
                          <li><strong>Changes:</strong> {session.syncedInputs.requiredChanges}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExportMarkdown(session)
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Export MD
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExportJson(session)
                      }}
                    >
                      <FileJson className="w-4 h-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive ml-auto"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(session.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {sessions.length > displaySessions.length && (
          <p className="text-sm text-muted-foreground text-center pt-2">
            +{sessions.length - displaySessions.length} more sessions
          </p>
        )}
      </CardContent>
    </Card>
  )
}
