/**
 * Step Checklist Component
 * Clean design using shadcn/ui components
 */

'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
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

export function StepChecklist({ steps, currentPhase }: StepChecklistProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [acquiredValues, setAcquiredValues] = useState<Record<string, string>>({})

  // Initialize acquired values from steps
  const getAcquiredValue = (step: SessionStep): string => {
    if (acquiredValues[step.id] !== undefined) return acquiredValues[step.id]
    return step.acquiredValue || ''
  }

  const handleAcquiredValueChange = (stepId: string, value: string) => {
    setAcquiredValues(prev => ({ ...prev, [stepId]: value }))
  }

  const handleSaveAcquiredValue = (stepId: string) => {
    try {
      const result = updateStep(stepId, { acquiredValue: acquiredValues[stepId] })
      if (!result.success) {
        console.error('Failed to save answer:', result.error)
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
                        <input
                          type="text"
                          value={getAcquiredValue(step)}
                          onChange={e => handleAcquiredValueChange(step.id, e.target.value)}
                          placeholder={step.role === 'facilitator' ? "Client's response..." : "Your answer..."}
                          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        />
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
