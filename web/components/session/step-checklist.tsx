/**
 * Step Checklist Component
 * Displays and manages session steps with status tracking
 */

'use client'

import { useState } from 'react'
import { Check, Circle, Clock, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { updateStep } from '@/lib/actions'
import { cn } from '@/lib/utils'
import type { SessionStep } from '@/lib/db/schema'

interface StepChecklistProps {
  steps: SessionStep[]
  currentPhase: 'discovery' | 'build' | 'demo'
}

export function StepChecklist({ steps, currentPhase }: StepChecklistProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')

  // Filter steps for current phase
  const phaseSteps = steps.filter(step => step.phase === currentPhase)

  // Calculate progress
  const completedCount = phaseSteps.filter(s => s.status === 'completed').length
  const totalCount = phaseSteps.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Calculate total estimated time
  const totalEstimatedMinutes = phaseSteps.reduce((sum, step) => {
    return sum + (step.estimatedMinutes || 0)
  }, 0)

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

  const handleStartStep = async (stepId: string) => {
    try {
      const result = await updateStep(stepId, { status: 'in_progress' })
      if (!result.success) {
        console.error('Failed to start step:', result.error)
      }
    } catch (error) {
      console.error('Error starting step:', error)
    }
  }

  const handleCompleteStep = async (stepId: string) => {
    try {
      const result = await updateStep(stepId, { status: 'completed' })
      if (!result.success) {
        console.error('Failed to complete step:', result.error)
      }
    } catch (error) {
      console.error('Error completing step:', error)
    }
  }

  const handleSkipStep = async (stepId: string) => {
    try {
      const result = await updateStep(stepId, { status: 'skipped' })
      if (!result.success) {
        console.error('Failed to skip step:', result.error)
      }
    } catch (error) {
      console.error('Error skipping step:', error)
    }
  }

  const handleAddNotes = (stepId: string, currentNotes?: string | null) => {
    setEditingNotes(stepId)
    setNotesValue(currentNotes || '')
  }

  const handleSaveNotes = async (stepId: string) => {
    try {
      const result = await updateStep(stepId, { notes: notesValue })
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

  const formatTimeSpent = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')} spent`
  }

  return (
    <div data-testid="step-checklist" className="space-y-4">
      {/* Progress Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">{completedCount} of {totalCount} steps</span>
          <span className="text-gray-500">~{totalEstimatedMinutes} min total</span>
        </div>
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-600 text-center">{percentage}% complete</div>
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {phaseSteps.map((step) => {
          const isExpanded = expandedSteps.has(step.id)
          const isActive = step.status === 'in_progress'
          const isCompleted = step.status === 'completed'
          const isSkipped = step.status === 'skipped'
          const isPending = step.status === 'pending'

          return (
            <div
              key={step.id}
              data-testid={`step-${step.id}`}
              className={cn(
                'border rounded-lg p-4 transition-all',
                isActive && 'active border-blue-500 bg-blue-50',
                isCompleted && 'bg-green-50 border-green-200',
                isSkipped && 'bg-gray-100 border-gray-300',
                isPending && 'opacity-60 hover:opacity-100',
                'cursor-pointer'
              )}
              onClick={() => toggleExpanded(step.id)}
            >
              <div className="flex items-start gap-3">
                {/* Step Number / Status Icon */}
                <div className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  isCompleted && 'bg-green-600 text-white',
                  isActive && 'bg-blue-600 text-white',
                  isPending && 'bg-gray-300 text-gray-600',
                  isSkipped && 'bg-gray-400 text-gray-700'
                )}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 check-icon" />
                  ) : (
                    step.stepNumber
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{step.title}</h4>
                      {step.estimatedMinutes && (
                        <span className="text-xs text-gray-500">{step.estimatedMinutes} min</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {isPending && (
                        <button
                          onClick={() => handleStartStep(step.id)}
                          aria-label="Start step"
                          className="p-1 hover:bg-blue-100 rounded text-blue-600"
                          title="Start"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}

                      {isActive && (
                        <button
                          onClick={() => handleCompleteStep(step.id)}
                          aria-label="Complete step"
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title="Complete"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {(isPending || isActive) && (
                        <button
                          onClick={() => handleSkipStep(step.id)}
                          aria-label="Skip step"
                          className="p-1 hover:bg-gray-100 rounded text-gray-600"
                          title="Skip"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleAddNotes(step.id, step.notes)}
                        aria-label="Add notes"
                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                        title="Add notes"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Time Spent */}
                  {isCompleted && step.timeSpent && (
                    <div className="mt-1 text-xs text-gray-600">
                      {formatTimeSpent(step.timeSpent)}
                    </div>
                  )}

                  {/* Expanded Description */}
                  {isExpanded && (
                    <div className={cn('description mt-3 text-sm text-gray-600', isExpanded && 'expanded')}>
                      {step.description}

                      {/* Notes Section */}
                      {editingNotes === step.id ? (
                        <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
                          <textarea
                            value={notesValue}
                            onChange={e => setNotesValue(e.target.value)}
                            placeholder="Add notes..."
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveNotes(step.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                            >
                              Save notes
                            </button>
                            <button
                              onClick={() => setEditingNotes(null)}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : step.notes ? (
                        <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
                          <p className="font-medium text-yellow-900">Notes:</p>
                          <p className="text-yellow-800 mt-1">{step.notes}</p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
