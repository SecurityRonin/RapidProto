/**
 * Step Checklist Component
 * Clean design using shadcn/ui components
 * Features debounced autosave for acquired values
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateStep } from '@/lib/client-actions'
import { cn } from '@/lib/utils'
import type { SessionStep } from '@/lib/store'

interface StepChecklistProps {
  steps: SessionStep[]
  currentPhase: 'discovery' | 'build' | 'demo' | 'expectations' | 'longterm' | 'close'
}

// Autosave states
type SaveStatus = 'idle' | 'saving' | 'saved'

export function StepChecklist({ steps, currentPhase }: StepChecklistProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [acquiredValues, setAcquiredValues] = useState<Record<string, string>>({})

  // Autosave state
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({})
  const saveTimers = useRef<Record<string, NodeJS.Timeout>>({})
  const savedTimers = useRef<Record<string, NodeJS.Timeout>>({})

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(clearTimeout)
      Object.values(savedTimers.current).forEach(clearTimeout)
    }
  }, [])

  // Initialize acquired values from steps
  const getAcquiredValue = (step: SessionStep): string => {
    if (acquiredValues[step.id] !== undefined) return acquiredValues[step.id]
    return step.acquiredValue || ''
  }

  // Debounced autosave function
  const debouncedSave = useCallback((stepId: string, value: string) => {
    // Clear existing timer for this step
    if (saveTimers.current[stepId]) {
      clearTimeout(saveTimers.current[stepId])
    }

    // Set saving status
    setSaveStatus(prev => ({ ...prev, [stepId]: 'saving' }))

    // Debounce: save after 1500ms of no typing
    saveTimers.current[stepId] = setTimeout(() => {
      try {
        const result = updateStep(stepId, { acquiredValue: value })
        if (result.success) {
          setSaveStatus(prev => ({ ...prev, [stepId]: 'saved' }))
          // Reset to idle after showing "Saved" for 2 seconds
          savedTimers.current[stepId] = setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, [stepId]: 'idle' }))
          }, 2000)
        } else {
          console.error('Failed to save answer:', result.error)
          setSaveStatus(prev => ({ ...prev, [stepId]: 'idle' }))
        }
      } catch (error) {
        console.error('Error saving answer:', error)
        setSaveStatus(prev => ({ ...prev, [stepId]: 'idle' }))
      }
    }, 1500)
  }, [])

  const handleAcquiredValueChange = (stepId: string, value: string) => {
    setAcquiredValues(prev => ({ ...prev, [stepId]: value }))
    debouncedSave(stepId, value)
  }

  const handleSaveAcquiredValue = (stepId: string) => {
    // Clear any pending debounce timer
    if (saveTimers.current[stepId]) {
      clearTimeout(saveTimers.current[stepId])
    }

    try {
      const result = updateStep(stepId, { acquiredValue: acquiredValues[stepId] })
      if (!result.success) {
        console.error('Failed to save answer:', result.error)
      } else {
        setSaveStatus(prev => ({ ...prev, [stepId]: 'saved' }))
        savedTimers.current[stepId] = setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [stepId]: 'idle' }))
        }, 2000)
      }
    } catch (error) {
      console.error('Error saving answer:', error)
    }
  }

  const phaseSteps = steps.filter(step => step.phase === currentPhase)

  const toggleExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  const handleToggleStep = (stepId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
      const result = updateStep(stepId, { status: newStatus })
      if (!result.success) {
        console.error('Failed to update step:', result.error)
      }
    } catch (error) {
      console.error('Error updating step:', error)
    }
  }

  const handleSaveNotes = (stepId: string) => {
    try {
      const result = updateStep(stepId, { notes: notesValue })
      if (!result.success) {
        console.error('Failed to save notes:', result.error)
      } else {
        setEditingNotes(null)
        setNotesValue('')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
    }
  }

  return (
    <div data-testid="step-checklist" className="space-y-2">
      {phaseSteps.map((step) => {
        const isExpanded = expandedSteps.has(step.id)
        const isActive = step.status === 'in_progress'
        const isCompleted = step.status === 'completed'
        const isSkipped = step.status === 'skipped'

        return (
          <Card
            key={step.id}
            data-testid={`step-${step.id}`}
            className={cn(
              'transition-all',
              isActive && 'active border-primary/50 bg-primary/5',
              isCompleted && 'completed',
              isSkipped && 'opacity-50'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleStep(step.id, step.status)}
                  className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5',
                    isCompleted
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                  )}
                >
                  {isCompleted && (
                    <Check className="w-3.5 h-3.5 text-primary-foreground check-icon" strokeWidth={3} />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className="flex items-start justify-between gap-2 cursor-pointer"
                    onClick={() => toggleExpanded(step.id)}
                  >
                    <div className="flex-1">
                      <h4 className={cn(
                        'font-medium transition-colors',
                        isCompleted ? 'text-muted-foreground line-through' : ''
                      )}>
                        {step.title}
                      </h4>
                      {step.estimatedMinutes && !isCompleted && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {step.estimatedMinutes}m
                        </Badge>
                      )}
                    </div>

                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className={cn('description mt-4 space-y-3', isExpanded && 'expanded')}>
                      {step.description && (
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      )}

                      {/* Acquired Value Input (for capturing answers/insights) */}
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={getAcquiredValue(step)}
                            onChange={e => handleAcquiredValueChange(step.id, e.target.value)}
                            placeholder={step.role === 'facilitator' ? "Client's response..." : "Your answer..."}
                            className="w-full px-3 py-2 pr-20 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          {/* Autosave status indicator */}
                          {saveStatus[step.id] === 'saving' && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Saving...
                            </span>
                          )}
                          {saveStatus[step.id] === 'saved' && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Saved
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSaveAcquiredValue(step.id)}
                        >
                          Save {step.role === 'facilitator' ? 'Response' : 'Answer'}
                        </Button>
                      </div>

                      {/* Notes Section */}
                      {editingNotes === step.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={notesValue}
                            onChange={e => setNotesValue(e.target.value)}
                            placeholder="Add notes..."
                            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveNotes(step.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingNotes(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : step.notes ? (
                        <div className="p-3 bg-muted rounded-md text-sm">
                          {step.notes}
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => {
                            setEditingNotes(step.id)
                            setNotesValue(step.notes || '')
                          }}
                        >
                          + Add notes
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
