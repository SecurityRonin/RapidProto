/**
 * TDD: Step Checklist Component Tests
 * Tests component behavior with mocked server actions (Option 3)
 *
 * Test Strategy:
 * - Mock server actions at the boundary
 * - Test user interactions and DOM rendering
 * - Verify action calls with expected parameters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { StepChecklist } from '../../components/session/step-checklist'

// Mock server actions - setup-dom.ts provides defaults, but we can override
vi.mock('@/lib/actions', () => ({
  updateStep: vi.fn(() => Promise.resolve({ success: true })),
}))

describe('StepChecklist', () => {
  const mockSteps = [
    {
      id: 'step_1',
      phase: 'discovery',
      stepNumber: 1,
      title: 'Review client requirements',
      description: 'Read through facilitator notes',
      estimatedMinutes: 3,
      status: 'completed' as const,
      timeSpent: 180,
      sessionId: 'session_1',
      startedAt: new Date(),
      completedAt: new Date(),
      notes: null,
      createdAt: new Date(),
    },
    {
      id: 'step_2',
      phase: 'discovery',
      stepNumber: 2,
      title: 'Select template',
      description: 'Choose best-fit template',
      estimatedMinutes: 4,
      status: 'in_progress' as const,
      timeSpent: null,
      sessionId: 'session_1',
      startedAt: new Date(),
      completedAt: null,
      notes: null,
      createdAt: new Date(),
    },
    {
      id: 'step_3',
      phase: 'discovery',
      stepNumber: 3,
      title: 'Plan customizations',
      description: 'Note required changes',
      estimatedMinutes: 3,
      status: 'pending' as const,
      timeSpent: null,
      sessionId: 'session_1',
      startedAt: null,
      completedAt: null,
      notes: null,
      createdAt: new Date(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Step Display', () => {
    it('should render all steps', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      expect(screen.getByText('Review client requirements')).toBeInTheDocument()
      expect(screen.getByText('Select template')).toBeInTheDocument()
      expect(screen.getByText('Plan customizations')).toBeInTheDocument()
    })

    it('should show step numbers for non-completed steps', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Step 1 is completed - shows checkmark, not number
      // Steps 2 and 3 should show their numbers
      const step2 = screen.getByTestId('step-step_2')
      const step3 = screen.getByTestId('step-step_3')

      expect(within(step2).getByText('2')).toBeInTheDocument()
      expect(within(step3).getByText('3')).toBeInTheDocument()
    })

    it('should display step descriptions when expanded', async () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Click to expand step 2
      const step2 = screen.getByTestId('step-step_2')
      fireEvent.click(step2)

      expect(screen.getByText(/choose best-fit template/i)).toBeInTheDocument()
    })

    it('should show estimated time per step', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Multiple steps may have the same duration, use getAllBy
      const threeMinElements = screen.getAllByText('3 min')
      expect(threeMinElements.length).toBeGreaterThan(0)
      expect(screen.getByText('4 min')).toBeInTheDocument()
    })
  })

  describe('Step Status Indicators', () => {
    it('should show checkmark for completed steps', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const completedStep = screen.getByTestId('step-step_1')
      expect(completedStep.querySelector('.check-icon')).toBeInTheDocument()
    })

    it('should highlight in-progress step', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const activeStep = screen.getByTestId('step-step_2')
      expect(activeStep).toHaveClass('active')
      expect(activeStep).toHaveClass('border-blue-500')
    })

    it('should dim pending steps', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const pendingStep = screen.getByTestId('step-step_3')
      expect(pendingStep).toHaveClass('opacity-60')
    })

    it('should show time spent for completed steps when expanded', async () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Time spent should be visible without expansion (shown in the step header)
      expect(screen.getByText('3:00 spent')).toBeInTheDocument()
    })
  })

  describe('Step Actions', () => {
    it('should allow starting a pending step', async () => {
      const { updateStep } = await import('@/lib/actions')

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step3 = screen.getByTestId('step-step_3')
      const startButton = step3.querySelector('button[aria-label="Start step"]')
      expect(startButton).toBeInTheDocument()

      fireEvent.click(startButton!)

      await waitFor(() => {
        expect(updateStep).toHaveBeenCalledWith('step_3', { status: 'in_progress' })
      })
    })

    it('should allow completing an in-progress step', async () => {
      const { updateStep } = await import('@/lib/actions')

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step2 = screen.getByTestId('step-step_2')
      const completeButton = step2.querySelector('button[aria-label="Complete step"]')
      expect(completeButton).toBeInTheDocument()

      fireEvent.click(completeButton!)

      await waitFor(() => {
        expect(updateStep).toHaveBeenCalledWith('step_2', expect.objectContaining({
          status: 'completed'
        }))
      })
    })

    it('should allow skipping a step', async () => {
      const { updateStep } = await import('@/lib/actions')

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step3 = screen.getByTestId('step-step_3')
      const skipButton = step3.querySelector('button[aria-label="Skip step"]')
      expect(skipButton).toBeInTheDocument()

      fireEvent.click(skipButton!)

      await waitFor(() => {
        expect(updateStep).toHaveBeenCalledWith('step_3', { status: 'skipped' })
      })
    })
  })

  describe('Phase Filtering', () => {
    const allSteps = [
      ...mockSteps,
      {
        id: 'step_4',
        phase: 'build' as const,
        stepNumber: 1,
        title: 'Clone template',
        description: 'Set up project from template',
        estimatedMinutes: 5,
        status: 'pending' as const,
        timeSpent: null,
        sessionId: 'session_1',
        startedAt: null,
        completedAt: null,
        notes: null,
        createdAt: new Date(),
      },
    ]

    it('should only show steps for current phase', () => {
      render(<StepChecklist steps={allSteps} currentPhase="discovery" />)

      expect(screen.getByText('Review client requirements')).toBeInTheDocument()
      expect(screen.queryByText('Clone template')).not.toBeInTheDocument()
    })

    it('should update when phase changes', () => {
      const { rerender } = render(<StepChecklist steps={allSteps} currentPhase="discovery" />)

      expect(screen.getByText('Review client requirements')).toBeInTheDocument()

      rerender(<StepChecklist steps={allSteps} currentPhase="build" />)

      expect(screen.queryByText('Review client requirements')).not.toBeInTheDocument()
      expect(screen.getByText('Clone template')).toBeInTheDocument()
    })
  })

  describe('Progress Summary', () => {
    it('should show completion percentage', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      expect(screen.getByText('33% complete')).toBeInTheDocument()
    })

    it('should display step count', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      expect(screen.getByText(/1 of 3 steps/)).toBeInTheDocument()
    })

    it('should show total estimated time', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      expect(screen.getByText(/~10 min total/)).toBeInTheDocument()
    })
  })

  describe('Notes Editing', () => {
    it('should allow adding notes to a step', async () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // First expand the step
      const step2 = screen.getByTestId('step-step_2')
      fireEvent.click(step2)

      // Find and click the notes button
      const notesButton = step2.querySelector('button[aria-label="Add notes"]')
      expect(notesButton).toBeInTheDocument()

      fireEvent.click(notesButton!)

      // Textarea should appear
      expect(screen.getByPlaceholderText(/add notes/i)).toBeInTheDocument()
    })

    it('should save notes when submitted', async () => {
      const { updateStep } = await import('@/lib/actions')

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Expand step
      const step2 = screen.getByTestId('step-step_2')
      fireEvent.click(step2)

      // Click add notes
      const notesButton = step2.querySelector('button[aria-label="Add notes"]')
      fireEvent.click(notesButton!)

      // Type note
      const textarea = screen.getByPlaceholderText(/add notes/i)
      fireEvent.change(textarea, { target: { value: 'Client prefers Template #14' } })

      // Save
      const saveButton = screen.getByRole('button', { name: /save notes/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(updateStep).toHaveBeenCalledWith('step_2', {
          notes: 'Client prefers Template #14'
        })
      })
    })
  })

  describe('Expandable Steps', () => {
    it('should expand step to show full description', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step1 = screen.getByTestId('step-step_1')

      // Initially description might not be visible (collapsed)
      // Click to expand
      fireEvent.click(step1)

      // Now description should be visible with expanded class
      const description = step1.querySelector('.description')
      expect(description).toHaveClass('expanded')
    })

    it('should collapse when clicked again', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step1 = screen.getByTestId('step-step_1')

      // Expand
      fireEvent.click(step1)
      expect(step1.querySelector('.description')).toHaveClass('expanded')

      // Collapse - description element may be removed or no longer have class
      fireEvent.click(step1)
      const description = step1.querySelector('.description')
      // Either the element is removed or it no longer has 'expanded' class
      if (description) {
        expect(description).not.toHaveClass('expanded')
      } else {
        // Element removed when collapsed - that's also valid
        expect(description).toBeNull()
      }
    })
  })
})
