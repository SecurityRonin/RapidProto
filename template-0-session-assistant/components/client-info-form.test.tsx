/**
 * TDD: Client Info Form Component Tests
 * Write tests FIRST, then implement component to pass them
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClientInfoForm } from './client-info-form'

// Mock server actions
vi.mock('@/lib/actions', () => ({
  saveClientInfo: vi.fn(),
}))

describe('ClientInfoForm', () => {
  describe('Basic Info Section', () => {
    it('should render client name field', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument()
    })

    it('should render contact fields', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    })

    it('should render business type field', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      expect(screen.getByLabelText(/business type/i)).toBeInTheDocument()
    })

    it('should render problem statement textarea', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      const textarea = screen.getByLabelText(/problem statement/i)
      expect(textarea.tagName).toBe('TEXTAREA')
    })
  })

  describe('Three Wins Framework', () => {
    it('should render three wins section', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      expect(screen.getByText(/three wins/i)).toBeInTheDocument()
    })

    it('should have three input fields for wins', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      const win1 = screen.getByPlaceholderText(/win #1/i)
      const win2 = screen.getByPlaceholderText(/win #2/i)
      const win3 = screen.getByPlaceholderText(/win #3/i)

      expect(win1).toBeInTheDocument()
      expect(win2).toBeInTheDocument()
      expect(win3).toBeInTheDocument()
    })

    it('should provide guidance text for Three Wins', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      expect(screen.getByText(/what are the top 3 outcomes/i)).toBeInTheDocument()
    })
  })

  describe('Pain Points Section', () => {
    it('should render pain points section', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      expect(screen.getByText(/pain points/i)).toBeInTheDocument()
    })

    it('should allow adding multiple pain points', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      const addButton = screen.getByRole('button', { name: /add pain point/i })

      expect(screen.getAllByPlaceholder(/pain point/i)).toHaveLength(1)

      fireEvent.click(addButton)

      expect(screen.getAllByPlaceholder(/pain point/i)).toHaveLength(2)
    })

    it('should allow removing pain points', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      const addButton = screen.getByRole('button', { name: /add pain point/i })
      fireEvent.click(addButton)

      expect(screen.getAllByPlaceholder(/pain point/i)).toHaveLength(2)

      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      fireEvent.click(removeButtons[1])

      expect(screen.getAllByPlaceholder(/pain point/i)).toHaveLength(1)
    })
  })

  describe('Features Section', () => {
    it('should separate must-have and nice-to-have features', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      expect(screen.getByText(/must-have features/i)).toBeInTheDocument()
      expect(screen.getByText(/nice-to-have features/i)).toBeInTheDocument()
    })

    it('should allow adding must-have features', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      const addButton = screen.getByRole('button', { name: /add must-have/i })

      fireEvent.click(addButton)

      expect(screen.getAllByPlaceholder(/must-have/i)).toHaveLength(2)
    })

    it('should allow adding nice-to-have features', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      const addButton = screen.getByRole('button', { name: /add nice-to-have/i })

      fireEvent.click(addButton)

      expect(screen.getAllByPlaceholder(/nice-to-have/i)).toHaveLength(2)
    })
  })

  describe('Budget & Timeline Section', () => {
    it('should render budget field', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      expect(screen.getByLabelText(/budget/i)).toBeInTheDocument()
    })

    it('should render timeline field', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      expect(screen.getByLabelText(/timeline/i)).toBeInTheDocument()
    })

    it('should render decision makers field', () => {
      render(<ClientInfoForm sessionId="session_123" />)

      expect(screen.getByLabelText(/decision makers/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should require client name', async () => {
      render(<ClientInfoForm sessionId="session_123" />)

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/client name is required/i)).toBeInTheDocument()
      })
    })

    it('should require problem statement', async () => {
      render(<ClientInfoForm sessionId="session_123" />)

      const clientName = screen.getByLabelText(/client name/i)
      fireEvent.change(clientName, { target: { value: 'Acme Corp' } })

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/problem statement is required/i)).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      render(<ClientInfoForm sessionId="session_123" />)

      const email = screen.getByLabelText(/email/i)
      fireEvent.change(email, { target: { value: 'invalid-email' } })

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit form data', async () => {
      const { saveClientInfo } = await import('@/lib/actions')

      render(<ClientInfoForm sessionId="session_123" />)

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/client name/i), {
        target: { value: 'Acme Corp' }
      })
      fireEvent.change(screen.getByLabelText(/problem statement/i), {
        target: { value: 'Manual inventory tracking' }
      })

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(saveClientInfo).toHaveBeenCalledWith('session_123', expect.objectContaining({
          clientName: 'Acme Corp',
          problemStatement: 'Manual inventory tracking',
        }))
      })
    })

    it('should include Three Wins in submission', async () => {
      const { saveClientInfo } = await import('@/lib/actions')

      render(<ClientInfoForm sessionId="session_123" />)

      fireEvent.change(screen.getByLabelText(/client name/i), {
        target: { value: 'Acme Corp' }
      })
      fireEvent.change(screen.getByLabelText(/problem statement/i), {
        target: { value: 'Need better tracking' }
      })

      fireEvent.change(screen.getByPlaceholderText(/win #1/i), {
        target: { value: 'Save 10 hours/week' }
      })
      fireEvent.change(screen.getByPlaceholderText(/win #2/i), {
        target: { value: 'Reduce errors' }
      })
      fireEvent.change(screen.getByPlaceholderText(/win #3/i), {
        target: { value: 'Better insights' }
      })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(saveClientInfo).toHaveBeenCalledWith('session_123', expect.objectContaining({
          threeWins: ['Save 10 hours/week', 'Reduce errors', 'Better insights'],
        }))
      })
    })

    it('should show success message after save', async () => {
      const { saveClientInfo } = await import('@/lib/actions')
      saveClientInfo.mockResolvedValue({ success: true })

      render(<ClientInfoForm sessionId="session_123" />)

      fireEvent.change(screen.getByLabelText(/client name/i), {
        target: { value: 'Acme Corp' }
      })
      fireEvent.change(screen.getByLabelText(/problem statement/i), {
        target: { value: 'Problem' }
      })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(screen.getByText(/saved successfully/i)).toBeInTheDocument()
      })
    })
  })

  describe('Auto-save', () => {
    it('should auto-save after 2 seconds of inactivity', async () => {
      const { saveClientInfo } = await import('@/lib/actions')
      vi.useFakeTimers()

      render(<ClientInfoForm sessionId="session_123" autoSave />)

      fireEvent.change(screen.getByLabelText(/client name/i), {
        target: { value: 'Acme Corp' }
      })

      vi.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(saveClientInfo).toHaveBeenCalled()
      })

      vi.useRealTimers()
    })

    it('should show auto-save indicator', async () => {
      render(<ClientInfoForm sessionId="session_123" autoSave />)

      fireEvent.change(screen.getByLabelText(/client name/i), {
        target: { value: 'Acme Corp' }
      })

      await waitFor(() => {
        expect(screen.getByText(/saving.../i)).toBeInTheDocument()
      })
    })
  })

  describe('Pre-populated Data', () => {
    const existingData = {
      clientName: 'Acme Corp',
      clientEmail: 'john@acme.com',
      problemStatement: 'Need inventory system',
      threeWins: ['Win 1', 'Win 2', 'Win 3'],
      painPoints: ['Pain 1', 'Pain 2'],
    }

    it('should populate form with existing data', () => {
      render(<ClientInfoForm sessionId="session_123" initialData={existingData} />)

      expect(screen.getByLabelText(/client name/i)).toHaveValue('Acme Corp')
      expect(screen.getByLabelText(/email/i)).toHaveValue('john@acme.com')
      expect(screen.getByLabelText(/problem statement/i)).toHaveValue('Need inventory system')
    })

    it('should populate Three Wins', () => {
      render(<ClientInfoForm sessionId="session_123" initialData={existingData} />)

      expect(screen.getByPlaceholderText(/win #1/i)).toHaveValue('Win 1')
      expect(screen.getByPlaceholderText(/win #2/i)).toHaveValue('Win 2')
      expect(screen.getByPlaceholderText(/win #3/i)).toHaveValue('Win 3')
    })

    it('should populate pain points list', () => {
      render(<ClientInfoForm sessionId="session_123" initialData={existingData} />)

      const painPoints = screen.getAllByPlaceholder(/pain point/i)
      expect(painPoints).toHaveLength(2)
      expect(painPoints[0]).toHaveValue('Pain 1')
      expect(painPoints[1]).toHaveValue('Pain 2')
    })
  })
})
