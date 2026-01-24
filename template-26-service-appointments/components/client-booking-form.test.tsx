/**
 * Client Booking Form Component Tests
 * Tests for client information and booking confirmation
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClientBookingForm } from './client-booking-form'
import { createAppointment, checkClientBlocked } from '@/lib/actions'

// Mock server actions
vi.mock('@/lib/actions', () => ({
  createAppointment: vi.fn(),
  checkClientBlocked: vi.fn(),
}))

describe('ClientBookingForm', () => {
  const mockBookingDetails = {
    providerId: 'provider_1',
    providerName: 'Dr. Smith',
    serviceId: 'service_1',
    serviceName: 'Consultation',
    servicePrice: 100,
    serviceDuration: 60,
    depositRequired: false,
    scheduledAt: new Date('2026-02-15T10:00:00'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Display', () => {
    it('should display booking summary', () => {
      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
      expect(screen.getByText('Consultation')).toBeInTheDocument()
      expect(screen.getByText('$100')).toBeInTheDocument()
      expect(screen.getByText('60 min')).toBeInTheDocument()
    })

    it('should display appointment date and time', () => {
      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      expect(screen.getByText(/February 15, 2026/i)).toBeInTheDocument()
      expect(screen.getByText(/10:00 AM/i)).toBeInTheDocument()
    })

    it('should show deposit requirement', () => {
      const detailsWithDeposit = {
        ...mockBookingDetails,
        depositRequired: true,
        depositAmount: 25,
      }

      render(
        <ClientBookingForm
          bookingDetails={detailsWithDeposit}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      expect(screen.getByText(/\$25 deposit required/i)).toBeInTheDocument()
    })

    it('should display required fields', () => {
      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    })

    it('should show notes field', () => {
      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      const submitButton = screen.getByRole('button', { name: /confirm booking/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/phone is required/i)).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
      })
    })

    it('should validate phone format', async () => {
      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      const phoneInput = screen.getByLabelText(/phone/i)
      fireEvent.change(phoneInput, { target: { value: '123' } })
      fireEvent.blur(phoneInput)

      await waitFor(() => {
        expect(screen.getByText(/invalid phone/i)).toBeInTheDocument()
      })
    })

    it('should clear errors when valid input provided', async () => {
      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'invalid' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
      })

      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Client Blocking Check', () => {
    it('should check if client is blocked on email blur', async () => {
      vi.mocked(checkClientBlocked).mockResolvedValue({
        success: true,
        data: { isBlocked: false, noShowCount: 0 },
      })

      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'client@example.com' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(checkClientBlocked).toHaveBeenCalledWith('client@example.com')
      })
    })

    it('should show blocked message for blocked clients', async () => {
      vi.mocked(checkClientBlocked).mockResolvedValue({
        success: true,
        data: { isBlocked: true, noShowCount: 3 },
      })

      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'blocked@example.com' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText(/blocked due to excessive no-shows/i)).toBeInTheDocument()
      })
    })

    it('should disable submit button for blocked clients', async () => {
      vi.mocked(checkClientBlocked).mockResolvedValue({
        success: true,
        data: { isBlocked: true, noShowCount: 3 },
      })

      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'blocked@example.com' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /confirm booking/i })
        expect(submitButton).toBeDisabled()
      })
    })

    it('should show warning for clients with no-shows', async () => {
      vi.mocked(checkClientBlocked).mockResolvedValue({
        success: true,
        data: { isBlocked: false, noShowCount: 1 },
      })

      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'client@example.com' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText(/1 previous no-show/i)).toBeInTheDocument()
      })
    })
  })

  describe('Appointment Creation', () => {
    it('should create appointment on form submit', async () => {
      vi.mocked(checkClientBlocked).mockResolvedValue({
        success: true,
        data: { isBlocked: false, noShowCount: 0 },
      })
      vi.mocked(createAppointment).mockResolvedValue({
        success: true,
        data: {
          id: 'appointment_123',
          providerId: 'provider_1',
          serviceId: 'service_1',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          clientPhone: '555-1234',
          scheduledAt: new Date('2026-02-15T10:00:00'),
          duration: 60,
          price: 100,
          status: 'pending',
          paymentStatus: 'unpaid',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const onSuccess = vi.fn()

      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={onSuccess}
          onCancel={() => {}}
        />
      )

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const phoneInput = screen.getByLabelText(/phone/i)

      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(phoneInput, { target: { value: '555-1234' } })

      await waitFor(() => {
        expect(checkClientBlocked).toHaveBeenCalled()
      })

      const submitButton = screen.getByRole('button', { name: /confirm booking/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(createAppointment).toHaveBeenCalledWith({
          providerId: 'provider_1',
          serviceId: 'service_1',
          scheduledAt: new Date('2026-02-15T10:00:00'),
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          clientPhone: '555-1234',
          notes: '',
        })
        expect(onSuccess).toHaveBeenCalledWith('appointment_123')
      })
    })

    it('should include notes in appointment', async () => {
      vi.mocked(checkClientBlocked).mockResolvedValue({
        success: true,
        data: { isBlocked: false, noShowCount: 0 },
      })
      vi.mocked(createAppointment).mockResolvedValue({
        success: true,
        data: {
          id: 'appointment_123',
          providerId: 'provider_1',
          serviceId: 'service_1',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          clientPhone: '555-1234',
          scheduledAt: new Date('2026-02-15T10:00:00'),
          duration: 60,
          price: 100,
          status: 'pending',
          paymentStatus: 'unpaid',
          notes: 'Special request',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '555-1234' } })
      fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Special request' } })

      await waitFor(() => {
        expect(checkClientBlocked).toHaveBeenCalled()
      })

      fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }))

      await waitFor(() => {
        expect(createAppointment).toHaveBeenCalledWith(
          expect.objectContaining({ notes: 'Special request' })
        )
      })
    })

    it('should show loading state during submission', async () => {
      vi.mocked(checkClientBlocked).mockResolvedValue({
        success: true,
        data: { isBlocked: false, noShowCount: 0 },
      })
      vi.mocked(createAppointment).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '555-1234' } })

      await waitFor(() => {
        expect(checkClientBlocked).toHaveBeenCalled()
      })

      fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }))

      await waitFor(() => {
        expect(screen.getByText(/creating appointment/i)).toBeInTheDocument()
      })
    })

    it('should display error message on failure', async () => {
      vi.mocked(checkClientBlocked).mockResolvedValue({
        success: true,
        data: { isBlocked: false, noShowCount: 0 },
      })
      vi.mocked(createAppointment).mockResolvedValue({
        success: false,
        error: 'Time slot no longer available',
      })

      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
      fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '555-1234' } })

      await waitFor(() => {
        expect(checkClientBlocked).toHaveBeenCalled()
      })

      fireEvent.click(screen.getByRole('button', { name: /confirm booking/i }))

      await waitFor(() => {
        expect(screen.getByText(/time slot no longer available/i)).toBeInTheDocument()
      })
    })
  })

  describe('Cancel Action', () => {
    it('should call onCancel when cancel button clicked', () => {
      const onCancel = vi.fn()

      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={onCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it('should show confirmation dialog before canceling', () => {
      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Some text' } })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)

      expect(screen.getByText(/discard changes/i)).toBeInTheDocument()
    })
  })

  describe('Pre-filled Data', () => {
    it('should pre-fill form with existing client data', () => {
      const existingData = {
        clientName: 'Jane Doe',
        clientEmail: 'jane@example.com',
        clientPhone: '555-5678',
      }

      render(
        <ClientBookingForm
          bookingDetails={mockBookingDetails}
          initialData={existingData}
          onSuccess={() => {}}
          onCancel={() => {}}
        />
      )

      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('555-5678')).toBeInTheDocument()
    })
  })
})
