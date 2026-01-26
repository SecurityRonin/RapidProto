/**
 * TDD: Step Checklist Component Tests
 * Minimal design - clean list with checkboxes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { StepChecklist } from '../../components/session/step-checklist'

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

    it('should display step descriptions when expanded', async () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Click to expand step 2
      const step2 = screen.getByTestId('step-step_2')
      const titleArea = step2.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step2)

      await waitFor(() => {
        expect(screen.getByText(/choose best-fit template/i)).toBeInTheDocument()
      })
    })

    it('should show estimated time for non-completed steps', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Step 2 has 4 min
      expect(screen.getByText('4m')).toBeInTheDocument()
      // Step 3 has 3 min (pending)
      expect(screen.getByText('3m')).toBeInTheDocument()
    })
  })

  describe('Step Status Indicators', () => {
    it('should show checkmark for completed steps', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const completedStep = screen.getByTestId('step-step_1')
      expect(completedStep.querySelector('.check-icon')).toBeInTheDocument()
    })

    it('should show completed class on completed steps', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const completedStep = screen.getByTestId('step-step_1')
      expect(completedStep).toHaveClass('completed')
    })

    it('should show active class on in-progress step', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const activeStep = screen.getByTestId('step-step_2')
      expect(activeStep).toHaveClass('active')
    })

    it('should strikethrough completed step titles', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const completedStep = screen.getByTestId('step-step_1')
      const title = completedStep.querySelector('h4')
      expect(title).toHaveClass('line-through')
    })
  })

  describe('Step Actions', () => {
    it('should toggle step status when checkbox clicked', async () => {
      const { updateStep } = await import('@/lib/actions')

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Find and click the checkbox for step 3 (pending)
      const step3 = screen.getByTestId('step-step_3')
      const checkbox = step3.querySelector('button')
      expect(checkbox).toBeInTheDocument()

      fireEvent.click(checkbox!)

      await waitFor(() => {
        expect(updateStep).toHaveBeenCalledWith('step_3', { status: 'completed' })
      })
    })

    it('should allow unchecking completed steps', async () => {
      const { updateStep } = await import('@/lib/actions')

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Find and click the checkbox for step 1 (completed)
      const step1 = screen.getByTestId('step-step_1')
      const checkbox = step1.querySelector('button')

      fireEvent.click(checkbox!)

      await waitFor(() => {
        expect(updateStep).toHaveBeenCalledWith('step_1', { status: 'pending' })
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

  describe('Notes Editing', () => {
    it('should show add notes button when step is expanded', async () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step2 = screen.getByTestId('step-step_2')
      const titleArea = step2.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step2)

      await waitFor(() => {
        expect(screen.getByText(/add notes/i)).toBeInTheDocument()
      })
    })

    it('should show textarea when add notes is clicked', async () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step2 = screen.getByTestId('step-step_2')
      const titleArea = step2.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step2)

      await waitFor(() => {
        const addNotesButton = screen.getByText(/add notes/i)
        fireEvent.click(addNotesButton)
      })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add notes/i)).toBeInTheDocument()
      })
    })

    it('should save notes when submitted', async () => {
      const { updateStep } = await import('@/lib/actions')

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Expand step
      const step2 = screen.getByTestId('step-step_2')
      const titleArea = step2.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step2)

      await waitFor(() => {
        expect(screen.getByText(/add notes/i)).toBeInTheDocument()
      })

      // Click add notes
      const addNotesButton = screen.getByText(/add notes/i)
      fireEvent.click(addNotesButton)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add notes/i)).toBeInTheDocument()
      })

      // Type note
      const textarea = screen.getByPlaceholderText(/add notes/i)
      fireEvent.change(textarea, { target: { value: 'Client prefers Template #14' } })

      // Save
      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(updateStep).toHaveBeenCalledWith('step_2', {
          notes: 'Client prefers Template #14'
        })
      })
    })
  })

  describe('Expandable Steps', () => {
    it('should expand step to show full description', async () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step1 = screen.getByTestId('step-step_1')
      // Click the title area to expand
      const titleArea = step1.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step1)

      await waitFor(() => {
        const description = step1.querySelector('.description')
        expect(description).toBeInTheDocument()
        expect(description).toHaveClass('expanded')
      })
    })

    it('should collapse when clicked again', async () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step1 = screen.getByTestId('step-step_1')
      const titleArea = step1.querySelector('[class*="cursor-pointer"]')

      // Expand
      fireEvent.click(titleArea || step1)
      await waitFor(() => {
        expect(step1.querySelector('.description')).toHaveClass('expanded')
      })

      // Collapse
      fireEvent.click(titleArea || step1)
      await waitFor(() => {
        const description = step1.querySelector('.description')
        // Either element is removed or no longer has expanded class
        expect(description === null || !description.classList.contains('expanded')).toBe(true)
      })
    })
  })
})
