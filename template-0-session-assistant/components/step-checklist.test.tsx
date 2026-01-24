/**
 * TDD: Step Checklist Component Tests
 * Write tests FIRST, then implement component to pass them
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StepChecklist } from './step-checklist'

// Mock server actions
vi.mock('@/lib/actions', () => ({
  updateStep: vi.fn(),
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
      status: 'completed',
      timeSpent: 180,
    },
    {
      id: 'step_2',
      phase: 'discovery',
      stepNumber: 2,
      title: 'Select template',
      description: 'Choose best-fit template',
      estimatedMinutes: 4,
      status: 'in_progress',
      timeSpent: null,
    },
    {
      id: 'step_3',
      phase: 'discovery',
      stepNumber: 3,
      title: 'Plan customizations',
      description: 'Note required changes',
      estimatedMinutes: 3,
      status: 'pending',
      timeSpent: null,
    },
  ]

  describe('Step Display', () => {
    it('should render all steps', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      expect(screen.getByText('Review client requirements')).toBeInTheDocument()
      expect(screen.getByText('Select template')).toBeInTheDocument()
      expect(screen.getByText('Plan customizations')).toBeInTheDocument()
    })

    it('should show step numbers', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should display step descriptions', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      expect(screen.getByText(/read through facilitator notes/i)).toBeInTheDocument()
    })

    it('should show estimated time per step', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      expect(screen.getByText(/3 min/)).toBeInTheDocument()
      expect(screen.getByText(/4 min/)).toBeInTheDocument()
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
      expect(activeStep).toHaveClass('active', 'border-blue-500')
    })

    it('should dim pending steps', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const pendingStep = screen.getByTestId('step-step_3')
      expect(pendingStep).toHaveClass('opacity-60')
    })

    it('should show time spent for completed steps', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      expect(screen.getByText(/3:00 spent/)).toBeInTheDocument()
    })
  })

  describe('Step Actions', () => {
    it('should allow starting a pending step', async () => {
      const { updateStep } = await import('@/lib/actions')

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step3 = screen.getByTestId('step-step_3')
      const startButton = step3.querySelector('button[aria-label="Start step"]')

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
        phase: 'build',
        stepNumber: 1,
        title: 'Clone template',
        status: 'pending',
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

      expect(screen.getByText(/33% complete/i)).toBeInTheDocument()
    })

    it('should display step count', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      expect(screen.getByText(/1 of 3 steps/i)).toBeInTheDocument()
    })

    it('should show total estimated time', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      expect(screen.getByText(/~10 min total/i)).toBeInTheDocument()
    })
  })

  describe('Notes Editing', () => {
    it('should allow adding notes to a step', async () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step2 = screen.getByTestId('step-step_2')
      const notesButton = step2.querySelector('button[aria-label="Add notes"]')

      fireEvent.click(notesButton!)

      expect(screen.getByPlaceholderText(/add notes/i)).toBeInTheDocument()
    })

    it('should save notes when submitted', async () => {
      const { updateStep } = await import('@/lib/actions')

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step2 = screen.getByTestId('step-step_2')
      const notesButton = step2.querySelector('button[aria-label="Add notes"]')

      fireEvent.click(notesButton!)

      const textarea = screen.getByPlaceholderText(/add notes/i)
      fireEvent.change(textarea, { target: { value: 'Client prefers Template #14' } })

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

      expect(step1.querySelector('.description')).not.toHaveClass('expanded')

      fireEvent.click(step1)

      expect(step1.querySelector('.description')).toHaveClass('expanded')
    })

    it('should collapse when clicked again', () => {
      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step1 = screen.getByTestId('step-step_1')

      fireEvent.click(step1)
      expect(step1.querySelector('.description')).toHaveClass('expanded')

      fireEvent.click(step1)
      expect(step1.querySelector('.description')).not.toHaveClass('expanded')
    })
  })
})
