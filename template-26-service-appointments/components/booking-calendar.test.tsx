/**
 * Booking Calendar Component Tests
 * Tests for date picker showing available days
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BookingCalendar } from './booking-calendar'
import { getAvailableSlots } from '@/lib/actions'

// Mock server actions
vi.mock('@/lib/actions', () => ({
  getAvailableSlots: vi.fn(),
}))

describe('BookingCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Calendar Display', () => {
    it('should display current month and year', () => {
      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      const currentDate = new Date()
      const monthYear = currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })

      expect(screen.getByText(monthYear)).toBeInTheDocument()
    })

    it('should display days of week header', () => {
      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      expect(screen.getByText('Sun')).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument()
      expect(screen.getByText('Tue')).toBeInTheDocument()
      expect(screen.getByText('Wed')).toBeInTheDocument()
      expect(screen.getByText('Thu')).toBeInTheDocument()
      expect(screen.getByText('Fri')).toBeInTheDocument()
      expect(screen.getByText('Sat')).toBeInTheDocument()
    })

    it('should display all days of current month', () => {
      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      const currentDate = new Date()
      const daysInMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate()

      // Should have at least the number of days in the month
      const dayButtons = screen.getAllByRole('button', { name: /^\d+$/ })
      expect(dayButtons.length).toBeGreaterThanOrEqual(daysInMonth)
    })

    it('should highlight current day', () => {
      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      const today = new Date().getDate()
      const todayButton = screen.getByRole('button', { name: today.toString() })

      expect(todayButton).toHaveClass('current-day')
    })

    it('should show loading state initially', () => {
      vi.mocked(getAvailableSlots).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate to next month', () => {
      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      const currentDate = new Date()
      const nextButton = screen.getByRole('button', { name: /next month/i })
      fireEvent.click(nextButton)

      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      const nextMonthYear = nextMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })

      expect(screen.getByText(nextMonthYear)).toBeInTheDocument()
    })

    it('should navigate to previous month', () => {
      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      const currentDate = new Date()
      const prevButton = screen.getByRole('button', { name: /previous month/i })
      fireEvent.click(prevButton)

      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      const prevMonthYear = prevMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })

      expect(screen.getByText(prevMonthYear)).toBeInTheDocument()
    })

    it('should disable previous month if before current month', () => {
      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      const prevButton = screen.getByRole('button', { name: /previous month/i })
      expect(prevButton).toBeDisabled()
    })

    it('should limit advance booking to configured months', () => {
      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
          maxAdvanceMonths={3}
        />
      )

      const nextButton = screen.getByRole('button', { name: /next month/i })

      // Click next 3 times to reach limit
      fireEvent.click(nextButton)
      fireEvent.click(nextButton)
      fireEvent.click(nextButton)

      // Should be disabled now
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Available Days', () => {
    it('should fetch available slots for each day', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(getAvailableSlots).toHaveBeenCalled()
      })
    })

    it('should mark days with available slots', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [
          new Date('2026-02-15T10:00:00'),
          new Date('2026-02-15T11:00:00'),
        ],
      })

      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      await waitFor(() => {
        const dayButton = screen.getByRole('button', { name: '15' })
        expect(dayButton).not.toBeDisabled()
        expect(dayButton).toHaveClass('available')
      })
    })

    it('should disable days with no available slots', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [],
      })

      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      await waitFor(() => {
        const dayButtons = screen.getAllByRole('button', { name: /^\d+$/ })
        const futureDayButton = dayButtons.find(btn => {
          const day = parseInt(btn.textContent || '0')
          return day > new Date().getDate()
        })

        if (futureDayButton) {
          expect(futureDayButton).toBeDisabled()
        }
      })
    })

    it('should disable past days', () => {
      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      const today = new Date().getDate()
      const dayButtons = screen.getAllByRole('button', { name: /^\d+$/ })

      dayButtons.forEach(button => {
        const day = parseInt(button.textContent || '0')
        if (day < today) {
          expect(button).toBeDisabled()
        }
      })
    })

    it('should show slot count on available days', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [
          new Date('2026-02-15T10:00:00'),
          new Date('2026-02-15T11:00:00'),
          new Date('2026-02-15T12:00:00'),
        ],
      })

      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
          showSlotCount={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('3 slots')).toBeInTheDocument()
      })
    })
  })

  describe('Date Selection', () => {
    it('should call onDateSelect when clicking available day', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      const onDateSelect = vi.fn()

      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={onDateSelect}
        />
      )

      await waitFor(() => {
        const dayButton = screen.getByRole('button', { name: '15' })
        expect(dayButton).not.toBeDisabled()
      })

      const dayButton = screen.getByRole('button', { name: '15' })
      fireEvent.click(dayButton)

      expect(onDateSelect).toHaveBeenCalledWith(expect.any(Date))
    })

    it('should highlight selected date', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      await waitFor(() => {
        const dayButton = screen.getByRole('button', { name: '15' })
        expect(dayButton).not.toBeDisabled()
      })

      const dayButton = screen.getByRole('button', { name: '15' })
      fireEvent.click(dayButton)

      expect(dayButton).toHaveClass('selected')
    })

    it('should not call onDateSelect for disabled days', () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [],
      })

      const onDateSelect = vi.fn()

      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={onDateSelect}
        />
      )

      const today = new Date().getDate()
      const dayButtons = screen.getAllByRole('button', { name: /^\d+$/ })
      const pastDayButton = dayButtons.find(btn => {
        const day = parseInt(btn.textContent || '0')
        return day < today
      })

      if (pastDayButton) {
        fireEvent.click(pastDayButton)
        expect(onDateSelect).not.toHaveBeenCalled()
      }
    })
  })

  describe('Re-fetching on Provider/Service Change', () => {
    it('should re-fetch slots when provider changes', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [],
      })

      const { rerender } = render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(getAvailableSlots).toHaveBeenCalledTimes(1)
      })

      rerender(
        <BookingCalendar
          providerId="provider_2"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(getAvailableSlots).toHaveBeenCalledTimes(2)
      })
    })

    it('should re-fetch slots when service changes', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [],
      })

      const { rerender } = render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(getAvailableSlots).toHaveBeenCalledTimes(1)
      })

      rerender(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_2"
          onDateSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(getAvailableSlots).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should render in compact mode', () => {
      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
          compact={true}
        />
      )

      const calendar = screen.getByTestId('booking-calendar')
      expect(calendar).toHaveClass('compact')
    })

    it('should show abbreviated day names in compact mode', () => {
      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
          compact={true}
        />
      )

      expect(screen.getByText('S')).toBeInTheDocument() // Sun -> S
      expect(screen.getByText('M')).toBeInTheDocument() // Mon -> M
    })
  })

  describe('Error Handling', () => {
    it('should display error message when fetching fails', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: false,
        error: 'Failed to fetch available slots',
      })

      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument()
      })
    })

    it('should allow retry after error', async () => {
      vi.mocked(getAvailableSlots)
        .mockResolvedValueOnce({
          success: false,
          error: 'Failed to fetch',
        })
        .mockResolvedValueOnce({
          success: true,
          data: [new Date('2026-02-15T10:00:00')],
        })

      render(
        <BookingCalendar
          providerId="provider_1"
          serviceId="service_1"
          onDateSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.queryByText(/failed to fetch/i)).not.toBeInTheDocument()
      })
    })
  })
})
