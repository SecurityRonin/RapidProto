/**
 * TDD: Step Checklist Component Tests
 * Minimal design - clean list with checkboxes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { StepChecklist } from '../../components/session/step-checklist'

vi.mock('@/lib/client-actions', () => ({
  updateStep: vi.fn(() => ({ success: true })),
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
      role: 'builder' as const,
      timeSpent: 180,
      sessionId: 'session_1',
      startedAt: new Date(),
      completedAt: new Date(),
      notes: null,
      acquiredValue: null,
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
      role: 'builder' as const,
      timeSpent: null,
      sessionId: 'session_1',
      startedAt: new Date(),
      completedAt: null,
      notes: null,
      acquiredValue: null,
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
      role: 'builder' as const,
      timeSpent: null,
      sessionId: 'session_1',
      startedAt: null,
      completedAt: null,
      notes: null,
      acquiredValue: null,
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
      const { updateStep } = await import('@/lib/client-actions')

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
      const { updateStep } = await import('@/lib/client-actions')

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
        role: 'builder' as const,
        timeSpent: null,
        sessionId: 'session_1',
        startedAt: null,
        completedAt: null,
        notes: null,
        acquiredValue: null,
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
      const { updateStep } = await import('@/lib/client-actions')

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

      // Save notes (not "Save Answer")
      const saveButtons = screen.getAllByRole('button', { name: /^save$/i })
      fireEvent.click(saveButtons[0])

      await waitFor(() => {
        expect(updateStep).toHaveBeenCalledWith('step_2', {
          notes: 'Client prefers Template #14'
        })
      })
    })
  })

  describe('Acquired Value Input (Bidirectional Sync)', () => {
    const builderSteps = [
      {
        id: 'step_1',
        phase: 'discovery' as const,
        stepNumber: 1,
        title: 'Define the core feature',
        description: 'What is the ONE thing this prototype must do?',
        estimatedMinutes: 3,
        status: 'pending' as const,
        role: 'builder' as const,
        timeSpent: null,
        sessionId: 'session_1',
        startedAt: null,
        completedAt: null,
        notes: null,
        acquiredValue: null,
        createdAt: new Date(),
      },
      {
        id: 'step_2',
        phase: 'discovery' as const,
        stepNumber: 2,
        title: 'Pick a template',
        description: 'Choose a starting point',
        estimatedMinutes: 4,
        status: 'pending' as const,
        role: 'builder' as const,
        timeSpent: null,
        sessionId: 'session_1',
        startedAt: null,
        completedAt: null,
        notes: null,
        acquiredValue: 'Next.js SaaS starter',
        createdAt: new Date(),
      },
    ]

    it('should show answer input when builder step is expanded', async () => {
      render(<StepChecklist steps={builderSteps} currentPhase="discovery" />)

      // Expand step 1
      const step1 = screen.getByTestId('step-step_1')
      const titleArea = step1.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step1)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/your answer/i)).toBeInTheDocument()
      })
    })

    it('should display existing acquiredValue in input', async () => {
      render(<StepChecklist steps={builderSteps} currentPhase="discovery" />)

      // Expand step 2 which has an existing acquiredValue
      const step2 = screen.getByTestId('step-step_2')
      const titleArea = step2.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step2)

      await waitFor(() => {
        const input = screen.getByDisplayValue('Next.js SaaS starter')
        expect(input).toBeInTheDocument()
      })
    })

    it('should save acquiredValue when submitted', async () => {
      const { updateStep } = await import('@/lib/client-actions')

      render(<StepChecklist steps={builderSteps} currentPhase="discovery" />)

      // Expand step 1
      const step1 = screen.getByTestId('step-step_1')
      const titleArea = step1.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step1)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/your answer/i)).toBeInTheDocument()
      })

      // Type answer
      const input = screen.getByPlaceholderText(/your answer/i)
      fireEvent.change(input, { target: { value: 'User login with OAuth' } })

      // Save
      const saveButton = screen.getByRole('button', { name: /save answer/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(updateStep).toHaveBeenCalledWith('step_1', {
          acquiredValue: 'User login with OAuth'
        })
      })
    })

    it('should not show answer input for facilitator steps', async () => {
      const facilitatorSteps = [
        {
          id: 'fac_1',
          phase: 'expectations' as const,
          stepNumber: 1,
          title: 'Define prototype scope',
          description: 'Today\'s demo will show...',
          estimatedMinutes: 3,
          status: 'pending' as const,
          role: 'facilitator' as const,
          timeSpent: null,
          sessionId: 'session_1',
          startedAt: null,
          completedAt: null,
          notes: null,
          acquiredValue: null,
          createdAt: new Date(),
        },
      ]

      render(<StepChecklist steps={facilitatorSteps} currentPhase="expectations" />)

      // Expand facilitator step
      const step = screen.getByTestId('step-fac_1')
      const titleArea = step.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step)

      await waitFor(() => {
        expect(screen.getByText(/today's demo will show/i)).toBeInTheDocument()
      })

      // Should NOT have answer input for facilitator
      expect(screen.queryByPlaceholderText(/your answer/i)).not.toBeInTheDocument()
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

  describe('Error Handling', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('should handle updateStep failure when toggling status', async () => {
      const { updateStep } = await import('@/lib/client-actions')
      vi.mocked(updateStep).mockReturnValue({ success: false, error: 'Network error' })

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step3 = screen.getByTestId('step-step_3')
      const checkbox = step3.querySelector('button')
      fireEvent.click(checkbox!)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update step:', 'Network error')
      })
    })

    it('should handle updateStep exception when toggling status', async () => {
      const { updateStep } = await import('@/lib/client-actions')
      vi.mocked(updateStep).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      const step3 = screen.getByTestId('step-step_3')
      const checkbox = step3.querySelector('button')
      fireEvent.click(checkbox!)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error updating step:', expect.any(Error))
      })
    })

    it('should handle updateStep failure when saving notes', async () => {
      const { updateStep } = await import('@/lib/client-actions')
      vi.mocked(updateStep).mockReturnValue({ success: false, error: 'Database error' })

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Expand step
      const step2 = screen.getByTestId('step-step_2')
      const titleArea = step2.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step2)

      await waitFor(() => {
        expect(screen.getByText(/add notes/i)).toBeInTheDocument()
      })

      // Add notes
      fireEvent.click(screen.getByText(/add notes/i))
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add notes/i)).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText(/add notes/i)
      fireEvent.change(textarea, { target: { value: 'Test note' } })

      const saveButtons = screen.getAllByRole('button', { name: /^save$/i })
      fireEvent.click(saveButtons[0])

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save notes:', 'Database error')
      })
    })

    it('should handle updateStep exception when saving notes', async () => {
      const { updateStep } = await import('@/lib/client-actions')
      vi.mocked(updateStep).mockImplementation(() => {
        throw new Error('Connection failed')
      })

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Expand step
      const step2 = screen.getByTestId('step-step_2')
      const titleArea = step2.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step2)

      await waitFor(() => {
        expect(screen.getByText(/add notes/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/add notes/i))
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/add notes/i)).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText(/add notes/i)
      fireEvent.change(textarea, { target: { value: 'Test note' } })

      const saveButtons = screen.getAllByRole('button', { name: /^save$/i })
      fireEvent.click(saveButtons[0])

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error saving notes:', expect.any(Error))
      })
    })

    it('should handle updateStep failure when saving acquired value', async () => {
      const { updateStep } = await import('@/lib/client-actions')
      vi.mocked(updateStep).mockReturnValue({ success: false, error: 'Save failed' })

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Expand step
      const step2 = screen.getByTestId('step-step_2')
      const titleArea = step2.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step2)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/your answer/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/your answer/i)
      fireEvent.change(input, { target: { value: 'Test answer' } })

      const saveButton = screen.getByRole('button', { name: /save answer/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save answer:', 'Save failed')
      })
    })

    it('should handle updateStep exception when saving acquired value', async () => {
      const { updateStep } = await import('@/lib/client-actions')
      vi.mocked(updateStep).mockImplementation(() => {
        throw new Error('Network timeout')
      })

      render(<StepChecklist steps={mockSteps} currentPhase="discovery" />)

      // Expand step
      const step2 = screen.getByTestId('step-step_2')
      const titleArea = step2.querySelector('[class*="cursor-pointer"]')
      fireEvent.click(titleArea || step2)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/your answer/i)).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/your answer/i)
      fireEvent.change(input, { target: { value: 'Test answer' } })

      const saveButton = screen.getByRole('button', { name: /save answer/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error saving answer:', expect.any(Error))
      })
    })
  })
})
