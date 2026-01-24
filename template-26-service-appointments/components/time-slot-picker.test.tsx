/**
 * Time Slot Picker Component Tests
 * Tests for selecting appointment time slots
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TimeSlotPicker } from './time-slot-picker'
import { getAvailableSlots } from '@/lib/actions'

// Mock server actions
vi.mock('@/lib/actions', () => ({
  getAvailableSlots: vi.fn(),
}))

describe('TimeSlotPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Slot Display', () => {
    it('should display available time slots', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [
          new Date('2026-02-15T10:00:00'),
          new Date('2026-02-15T11:00:00'),
          new Date('2026-02-15T14:00:00'),
        ],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument()
        expect(screen.getByText('11:00 AM')).toBeInTheDocument()
        expect(screen.getByText('2:00 PM')).toBeInTheDocument()
      })
    })

    it('should format times in 12-hour format', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [
          new Date('2026-02-15T09:00:00'),
          new Date('2026-02-15T13:00:00'),
        ],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('9:00 AM')).toBeInTheDocument()
        expect(screen.getByText('1:00 PM')).toBeInTheDocument()
      })
    })

    it('should show loading state', () => {
      vi.mocked(getAvailableSlots).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
        />
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should show empty state when no slots available', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/no available slots/i)).toBeInTheDocument()
      })
    })

    it('should group slots by morning, afternoon, evening', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [
          new Date('2026-02-15T09:00:00'),
          new Date('2026-02-15T10:00:00'),
          new Date('2026-02-15T14:00:00'),
          new Date('2026-02-15T15:00:00'),
          new Date('2026-02-15T18:00:00'),
          new Date('2026-02-15T19:00:00'),
        ],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
          groupByTimeOfDay={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Morning')).toBeInTheDocument()
        expect(screen.getByText('Afternoon')).toBeInTheDocument()
        expect(screen.getByText('Evening')).toBeInTheDocument()
      })
    })
  })

  describe('Slot Selection', () => {
    it('should call onSlotSelect when clicking a slot', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      const onSlotSelect = vi.fn()

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={onSlotSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument()
      })

      const slotButton = screen.getByRole('button', { name: '10:00 AM' })
      fireEvent.click(slotButton)

      expect(onSlotSelect).toHaveBeenCalledWith(expect.any(Date))
    })

    it('should highlight selected slot', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [
          new Date('2026-02-15T10:00:00'),
          new Date('2026-02-15T11:00:00'),
        ],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument()
      })

      const slotButton = screen.getByRole('button', { name: '10:00 AM' })
      fireEvent.click(slotButton)

      expect(slotButton).toHaveClass('selected')
    })

    it('should deselect when clicking selected slot', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      const onSlotSelect = vi.fn()

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={onSlotSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument()
      })

      const slotButton = screen.getByRole('button', { name: '10:00 AM' })

      // First click selects
      fireEvent.click(slotButton)
      expect(onSlotSelect).toHaveBeenCalledWith(expect.any(Date))

      // Second click deselects
      fireEvent.click(slotButton)
      expect(onSlotSelect).toHaveBeenCalledWith(null)
    })

    it('should show selected time from props', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          selectedTime={new Date('2026-02-15T10:00:00')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        const slotButton = screen.getByRole('button', { name: '10:00 AM' })
        expect(slotButton).toHaveClass('selected')
      })
    })
  })

  describe('Slot Information', () => {
    it('should show service duration for each slot', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
          serviceDuration={60}
          showDuration={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('60 min')).toBeInTheDocument()
      })
    })

    it('should show end time based on duration', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
          serviceDuration={90}
          showEndTime={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('10:00 AM - 11:30 AM')).toBeInTheDocument()
      })
    })

    it('should show popular time badge', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [
          new Date('2026-02-15T10:00:00'),
          new Date('2026-02-15T14:00:00'),
        ],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
          popularTimes={['10:00']}
        />
      )

      await waitFor(() => {
        const popularSlot = screen.getByRole('button', { name: /10:00 AM/i })
        expect(popularSlot).toHaveTextContent(/popular/i)
      })
    })
  })

  describe('Grid Layout', () => {
    it('should render slots in grid layout', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [
          new Date('2026-02-15T10:00:00'),
          new Date('2026-02-15T11:00:00'),
        ],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
          layout="grid"
        />
      )

      await waitFor(() => {
        const container = screen.getByTestId('slot-container')
        expect(container).toHaveClass('grid')
      })
    })

    it('should render slots in list layout', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [
          new Date('2026-02-15T10:00:00'),
          new Date('2026-02-15T11:00:00'),
        ],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
          layout="list"
        />
      )

      await waitFor(() => {
        const container = screen.getByTestId('slot-container')
        expect(container).toHaveClass('list')
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should refresh slots when date changes', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      const { rerender } = render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(getAvailableSlots).toHaveBeenCalledTimes(1)
      })

      rerender(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-16')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(getAvailableSlots).toHaveBeenCalledTimes(2)
      })
    })

    it('should refresh slots when provider changes', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      const { rerender } = render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(getAvailableSlots).toHaveBeenCalledTimes(1)
      })

      rerender(
        <TimeSlotPicker
          providerId="provider_2"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(getAvailableSlots).toHaveBeenCalledTimes(2)
      })
    })

    it('should auto-refresh at configured interval', async () => {
      vi.useFakeTimers()

      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
          autoRefresh={true}
          refreshInterval={30000}
        />
      )

      await waitFor(() => {
        expect(getAvailableSlots).toHaveBeenCalledTimes(1)
      })

      vi.advanceTimersByTime(30000)

      await waitFor(() => {
        expect(getAvailableSlots).toHaveBeenCalledTimes(2)
      })

      vi.useRealTimers()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when fetching fails', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: false,
        error: 'Failed to fetch slots',
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument()
      })
    })

    it('should show retry button on error', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: false,
        error: 'Failed to fetch slots',
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('should retry fetching on button click', async () => {
      vi.mocked(getAvailableSlots)
        .mockResolvedValueOnce({
          success: false,
          error: 'Failed',
        })
        .mockResolvedValueOnce({
          success: true,
          data: [new Date('2026-02-15T10:00:00')],
        })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('10:00 AM')).toBeInTheDocument()
      })
    })
  })

  describe('Compact Mode', () => {
    it('should render in compact layout', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
          compact={true}
        />
      )

      await waitFor(() => {
        const container = screen.getByTestId('slot-container')
        expect(container).toHaveClass('compact')
      })
    })

    it('should show abbreviated times in compact mode', async () => {
      vi.mocked(getAvailableSlots).mockResolvedValue({
        success: true,
        data: [new Date('2026-02-15T10:00:00')],
      })

      render(
        <TimeSlotPicker
          providerId="provider_1"
          serviceId="service_1"
          date={new Date('2026-02-15')}
          onSlotSelect={() => {}}
          compact={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })
    })
  })
})
