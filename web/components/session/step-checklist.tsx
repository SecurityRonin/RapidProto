/**
 * Step Checklist Component
 * Minimal & Sophisticated design - clean list with checkboxes
 */

'use client'

import { useState } from 'react'
import { Check, Circle, ChevronDown, ChevronUp } from 'lucide-react'
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

  const handleToggleStep = async (stepId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
      const result = await updateStep(stepId, { status: newStatus })
      if (!result.success) {
        console.error('Failed to update step:', result.error)
      }
    } catch (error) {
      console.error('Error updating step:', error)
    }
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

  return (
    <div data-testid="step-checklist" className="space-y-1">
      {phaseSteps.map((step) => {
        const isExpanded = expandedSteps.has(step.id)
        const isActive = step.status === 'in_progress'
        const isCompleted = step.status === 'completed'
        const isSkipped = step.status === 'skipped'

        return (
          <div
            key={step.id}
            data-testid={`step-${step.id}`}
            className={cn(
              'group rounded-xl transition-all',
              isActive && 'active bg-gray-50',
              isCompleted && 'completed',
              isSkipped && 'opacity-50'
            )}
          >
            <div className="flex items-start gap-4 p-4">
              {/* Checkbox */}
              <button
                onClick={() => handleToggleStep(step.id, step.status)}
                className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                  isCompleted
                    ? 'bg-gray-900 border-gray-900'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                {isCompleted && (
                  <Check className="w-3.5 h-3.5 text-white check-icon" strokeWidth={3} />
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
                      isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                    )}>
                      {step.title}
                    </h4>
                    {step.estimatedMinutes && !isCompleted && (
                      <span className="text-xs text-gray-400">{step.estimatedMinutes}m</span>
                    )}
                  </div>

                  <button className="p-1 text-gray-300 hover:text-gray-500 transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className={cn('description mt-3 space-y-3', isExpanded && 'expanded')}>
                    {step.description && (
                      <p className="text-sm text-gray-500">{step.description}</p>
                    )}

                    {/* Notes Section */}
                    {editingNotes === step.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={notesValue}
                          onChange={e => setNotesValue(e.target.value)}
                          placeholder="Add notes..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveNotes(step.id)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingNotes(null)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : step.notes ? (
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                        {step.notes}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingNotes(step.id)
                          setNotesValue(step.notes || '')
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        + Add notes
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
