/**
 * Booking Calendar Component
 * Date picker showing available days for appointments
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getAvailableSlots } from '@/lib/actions'
import { cn } from '@/lib/utils'

interface BookingCalendarProps {
  providerId: string
  serviceId: string
  onDateSelect: (date: Date | null) => void
  maxAdvanceMonths?: number
  showSlotCount?: boolean
  compact?: boolean
}

export function BookingCalendar({
  providerId,
  serviceId,
  onDateSelect,
  maxAdvanceMonths = 3,
  showSlotCount = false,
  compact = false,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableSlots, setAvailableSlots] = useState<Map<string, Date[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate min and max dates
  const minDate = new Date(today)
  const maxDate = new Date(today)
  maxDate.setMonth(maxDate.getMonth() + maxAdvanceMonths)

  const fetchSlotsForMonth = async () => {
    setLoading(true)
    setError(null)

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const slotsMap = new Map<string, Date[]>()

    // Fetch slots for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (date >= minDate && date <= maxDate) {
        const dateStr = date.toISOString().split('T')[0]
        const result = await getAvailableSlots({
          providerId,
          serviceId,
          date: dateStr,
        })

        if (result.success) {
          slotsMap.set(dateStr, result.data)
        }
      }
    }

    setAvailableSlots(slotsMap)
    setLoading(false)
  }

  const retryFetch = () => {
    fetchSlotsForMonth()
  }

  // Fetch slots when month, provider, or service changes
  useEffect(() => {
    fetchSlotsForMonth()
  }, [currentMonth, providerId, serviceId])

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setCurrentMonth(newMonth)
  }

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    setCurrentMonth(newMonth)
  }

  const canGoPrevious = () => {
    const prevMonth = new Date(currentMonth)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    prevMonth.setDate(1)
    return prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1)
  }

  const canGoNext = () => {
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(1)
    return nextMonth <= maxDate
  }

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const slots = availableSlots.get(dateStr) || []

    if (slots.length === 0 || date < today) {
      return
    }

    if (selectedDate && selectedDate.toISOString() === date.toISOString()) {
      setSelectedDate(null)
      onDateSelect(null)
    } else {
      setSelectedDate(date)
      onDateSelect(date)
    }
  }

  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const slots = availableSlots.get(dateStr) || []
    return slots.length > 0
  }

  const getSlotCount = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const slots = availableSlots.get(dateStr) || []
    return slots.length
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      const isToday = date.toDateString() === today.toDateString()
      const isPast = date < today
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString()
      const isAvailable = isDateAvailable(date)
      const slotCount = getSlotCount(date)
      const isDisabled = isPast || !isAvailable

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          disabled={isDisabled}
          aria-label={day.toString()}
          className={cn(
            'p-2 rounded-lg text-center relative transition-colors',
            'hover:bg-gray-100 disabled:hover:bg-transparent',
            isToday && 'current-day font-bold',
            isSelected && 'selected bg-blue-600 text-white hover:bg-blue-700',
            isAvailable && !isSelected && 'available bg-blue-50 text-blue-900',
            isPast && 'text-gray-300',
            !isAvailable && !isPast && 'text-gray-400',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          <div>{day}</div>
          {showSlotCount && slotCount > 0 && (
            <div className="text-xs text-gray-600 mt-1">{slotCount} slots</div>
          )}
        </button>
      )
    }

    return days
  }

  const monthYear = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const dayNames = compact
    ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={retryFetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      data-testid="booking-calendar"
      className={cn('bg-white rounded-lg border p-6', compact && 'compact p-4')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious()}
          aria-label="Previous month"
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h2 className={cn('font-semibold', compact ? 'text-base' : 'text-lg')}>
          {monthYear}
        </h2>

        <button
          onClick={goToNextMonth}
          disabled={!canGoNext()}
          aria-label="Next month"
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading available dates...</div>
      ) : (
        <>
          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, index) => (
              <div
                key={index}
                className={cn(
                  'text-center font-medium text-gray-600',
                  compact ? 'text-xs p-1' : 'text-sm p-2'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </>
      )}
    </div>
  )
}
