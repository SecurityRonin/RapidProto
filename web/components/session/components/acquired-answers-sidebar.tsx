/**
 * Acquired Answers Sidebar
 *
 * Collapsible left sidebar showing all captured client answers from both roles.
 * Synchronized between builder and facilitator for shared visibility.
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ClipboardList, Code2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { SessionStep } from '@/lib/store'

interface AcquiredAnswersSidebarProps {
  steps: SessionStep[]
  isOpen?: boolean
  onToggle?: (isOpen: boolean) => void
}

interface GroupedAnswers {
  builder: { phase: string; title: string; value: string }[]
  facilitator: { phase: string; title: string; value: string }[]
}

const PHASE_LABELS: Record<string, string> = {
  discovery: 'Discovery',
  build: 'Build',
  demo: 'Demo/Verify',
  expectations: 'Expectations',
  longterm: 'Long Term',
  close: 'Close',
}

export function AcquiredAnswersSidebar({
  steps,
  isOpen: controlledOpen,
  onToggle,
}: AcquiredAnswersSidebarProps) {
  // Support both controlled and uncontrolled modes
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen ?? internalOpen

  // Load saved preference
  useEffect(() => {
    if (typeof window !== 'undefined' && controlledOpen === undefined) {
      const saved = localStorage.getItem('rapidproto_sidebar_open')
      if (saved === 'true') setInternalOpen(true)
    }
  }, [controlledOpen])

  const handleToggle = () => {
    const newState = !isOpen
    if (onToggle) {
      onToggle(newState)
    } else {
      setInternalOpen(newState)
      localStorage.setItem('rapidproto_sidebar_open', String(newState))
    }
  }

  // Group answers by role and filter to only those with values
  const grouped: GroupedAnswers = {
    builder: [],
    facilitator: [],
  }

  for (const step of steps) {
    if (step.acquiredValue && step.acquiredValue.trim()) {
      const entry = {
        phase: step.phase,
        title: step.title,
        value: step.acquiredValue,
      }
      if (step.role === 'builder') {
        grouped.builder.push(entry)
      } else {
        grouped.facilitator.push(entry)
      }
    }
  }

  const totalAnswers = grouped.builder.length + grouped.facilitator.length
  const hasAnswers = totalAnswers > 0

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-background border-r shadow-lg transition-all duration-300 z-20',
          isOpen ? 'w-72' : 'w-0'
        )}
      >
        {isOpen && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Captured Answers</h2>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {totalAnswers}
              </span>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4">
              {!hasAnswers ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No answers captured yet.
                  <br />
                  <span className="text-xs">Complete steps to see them here.</span>
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Builder Answers */}
                  {grouped.builder.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Code2 className="w-4 h-4 text-blue-500" />
                        <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Builder
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {grouped.builder.map((item, i) => (
                          <AnswerCard
                            key={`builder-${i}`}
                            phase={item.phase}
                            title={item.title}
                            value={item.value}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Facilitator Answers */}
                  {grouped.facilitator.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-violet-500" />
                        <h3 className="text-sm font-medium text-violet-600 dark:text-violet-400">
                          Facilitator
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {grouped.facilitator.map((item, i) => (
                          <AnswerCard
                            key={`facilitator-${i}`}
                            phase={item.phase}
                            title={item.title}
                            value={item.value}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </aside>

      {/* Toggle Button - Always visible */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggle}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-30 h-12 w-6 rounded-l-none border-l-0 shadow-md transition-all duration-300',
          isOpen ? 'left-72' : 'left-0'
        )}
        title={isOpen ? 'Hide answers' : 'Show captured answers'}
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <div className="flex flex-col items-center">
            <ChevronRight className="w-4 h-4" />
            {hasAnswers && (
              <span className="text-[10px] font-medium text-primary">{totalAnswers}</span>
            )}
          </div>
        )}
      </Button>
    </>
  )
}

// Individual answer card
function AnswerCard({
  phase,
  title,
  value,
}: {
  phase: string
  title: string
  value: string
}) {
  return (
    <div className="p-2 rounded-md bg-muted/50 border border-border/50">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {PHASE_LABELS[phase] || phase}
        </span>
      </div>
      <p className="text-xs font-medium text-foreground/80 mb-1">{title}</p>
      <p className="text-sm text-foreground break-words">{value}</p>
    </div>
  )
}
