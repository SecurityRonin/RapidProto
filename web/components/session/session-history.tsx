/**
 * Session History Component
 * Displays completed sessions with export functionality
 * Requires session code to reopen (weak authentication)
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Download, Trash2, FileText, FileJson, ChevronDown, ChevronUp, Play, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getSessions,
  getCompletedSessions,
  deleteSession,
  calculateSessionDuration,
  type Session,
} from '@/lib/store'
import { exportSessionAsMarkdown, exportSessionAsJson, downloadFile } from '@/lib/export-session'
import { cn } from '@/lib/utils'

interface SessionHistoryProps {
  /** Number of recent sessions to show directly (default 3) */
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

export function SessionHistory({ maxItems = 3, showExpanded = false }: SessionHistoryProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Reopen dialog state
  const [reopenDialog, setReopenDialog] = useState<{ open: boolean; session: Session | null }>({
    open: false,
    session: null,
  })
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  // Dropdown selection
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('')

  // Load sessions on mount
  useEffect(() => {
    setMounted(true)
    // Get all sessions (not just completed) sorted by updatedAt
    const all = getSessions().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    setAllSessions(all)
    setSessions(getCompletedSessions())
  }, [])

  const handleDelete = (id: string) => {
    if (!confirm('Delete this session from history?')) return
    deleteSession(id)
    const all = getSessions().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    setAllSessions(all)
    setSessions(getCompletedSessions())
  }

  // Initiate reopen with code verification
  const handleReopenClick = (session: Session, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setReopenDialog({ open: true, session })
    setCodeInput('')
    setCodeError(null)
  }

  // Verify code and navigate
  const handleVerifyAndReopen = () => {
    if (!reopenDialog.session) return

    const normalizedInput = codeInput.trim().toUpperCase()
    const sessionCode = reopenDialog.session.id.slice(0, 6).toUpperCase()

    if (normalizedInput === sessionCode || normalizedInput === reopenDialog.session.id.toUpperCase()) {
      // Get stored role for this session, default to builder
      const storedRole = typeof window !== 'undefined'
        ? localStorage.getItem(`rapidproto_role_${reopenDialog.session.id}`)
        : null
      const role = storedRole || 'builder'

      setReopenDialog({ open: false, session: null })
      router.push(`/session/${reopenDialog.session.id}?role=${role}`)
    } else {
      setCodeError('Invalid session code. Please try again.')
    }
  }

  // Handle dropdown selection
  const handleHistorySelect = (sessionId: string) => {
    if (!sessionId) return
    const session = allSessions.find(s => s.id === sessionId)
    if (session) {
      handleReopenClick(session)
    }
    setSelectedHistoryId('')
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => handleReopenClick(session, e)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Reopen
                    </Button>
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

        {/* Dropdown for all historical sessions */}
        {allSessions.length > maxItems && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <History className="w-4 h-4" />
              <span>All Sessions ({allSessions.length})</span>
            </div>
            <Select value={selectedHistoryId} onValueChange={handleHistorySelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a session to reopen..." />
              </SelectTrigger>
              <SelectContent>
                {allSessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={session.status === 'completed' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {session.status}
                      </Badge>
                      <span className="truncate">
                        {session.sessionTitle || 'Untitled'} - {formatDate(session.updatedAt)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>

      {/* Session Code Verification Dialog */}
      <Dialog open={reopenDialog.open} onOpenChange={(open) => {
        if (!open) {
          setReopenDialog({ open: false, session: null })
          setCodeError(null)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Session Code</DialogTitle>
            <DialogDescription>
              Enter the 6-character session code to reopen this session.
              This prevents unauthorized access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {reopenDialog.session && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{reopenDialog.session.sessionTitle || 'Untitled Session'}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(reopenDialog.session.updatedAt)} &bull; {reopenDialog.session.status}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Input
                placeholder="ABC123"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase())
                  setCodeError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyAndReopen()
                  }
                }}
                className="font-mono text-center text-lg tracking-widest uppercase"
                maxLength={21}
                autoFocus
              />
              {codeError && (
                <p className="text-sm text-destructive">{codeError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setReopenDialog({ open: false, session: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleVerifyAndReopen} disabled={!codeInput.trim()}>
              Verify & Open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
