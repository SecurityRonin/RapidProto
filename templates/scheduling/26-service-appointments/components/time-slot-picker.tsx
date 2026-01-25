/**
 * Time Slot Picker Component
 * Displays and allows selection of available appointment times
 */

'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { getAvailableSlots } from '@/lib/actions'
import { cn } from '@/lib/utils'

interface TimeSlotPickerProps {
  providerId: string
  serviceId: string
  date: Date
  onSlotSelect: (time: Date | null) => void
  selectedTime?: Date | null
  serviceDuration?: number
  showDuration?: boolean
  showEndTime?: boolean
  popularTimes?: string[]
  groupByTimeOfDay?: boolean
  layout?: 'grid' | 'list'
  compact?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function TimeSlotPicker({
  providerId,
  serviceId,
  date,
  onSlotSelect,
  selectedTime = null,
  serviceDuration,
  showDuration = false,
  showEndTime = false,
  popularTimes = [],
  groupByTimeOfDay = false,
  layout = 'grid',
  compact = false,
  autoRefresh = false,
  refreshInterval = 30000,
}: TimeSlotPickerProps) {
  const [slots, setSlots] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Date | null>(selectedTime)

  const fetchSlots = async () => {
    setLoading(true)
    setError(null)

    const dateStr = date.toISOString().split('T')[0]
    const result = await getAvailableSlots({
      providerId,
      serviceId,
      date: dateStr,
    })

    if (result.success) {
      setSlots(result.data)
      setError(null)
    } else {
      setError(result.error || 'Failed to fetch slots')
    }
    setLoading(false)
  }

  const retryFetch = () => {
    fetchSlots()
  }

  // Fetch slots when date, provider, or service changes
  useEffect(() => {
    fetchSlots()
  }, [date, providerId, serviceId])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchSlots, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, date, providerId, serviceId])

  // Update selected when prop changes
  useEffect(() => {
    setSelected(selectedTime)
  }, [selectedTime])

  const handleSlotClick = (slot: Date) => {
    if (selected && selected.getTime() === slot.getTime()) {
      setSelected(null)
      onSlotSelect(null)
    } else {
      setSelected(slot)
      onSlotSelect(slot)
    }
  }

  const formatTime = (date: Date, abbreviate = false) => {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12

    if (abbreviate) {
      return `${displayHours}:${minutes.toString().padStart(2, '0')}`
    }

    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
  }

  const formatTimeRange = (start: Date, duration: number) => {
    const end = new Date(start.getTime() + duration * 60000)
    return `${formatTime(start)} - ${formatTime(end)}`
  }

  const getTimeOfDay = (date: Date) => {
    const hours = date.getHours()
    if (hours < 12) return 'Morning'
    if (hours < 17) return 'Afternoon'
    return 'Evening'
  }

  const isPopularTime = (slot: Date) => {
    const timeStr = `${slot.getHours()}:${slot.getMinutes().toString().padStart(2, '0')}`
    return popularTimes.includes(timeStr)
  }

  const groupSlotsByTimeOfDay = () => {
    const groups: { [key: string]: Date[] } = {
      Morning: [],
      Afternoon: [],
      Evening: [],
    }

    slots.forEach(slot => {
      const timeOfDay = getTimeOfDay(slot)
      groups[timeOfDay].push(slot)
    })

    return groups
  }

  const renderSlot = (slot: Date) => {
    const isSelected = selected && selected.getTime() === slot.getTime()
    const popular = isPopularTime(slot)

    return (
      <button
        key={slot.getTime()}
        onClick={() => handleSlotClick(slot)}
        aria-label={formatTime(slot)}
        className={cn(
          'p-3 rounded-lg border transition-colors text-left',
          'hover:border-blue-500 hover:bg-blue-50',
          isSelected && 'selected bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
          !isSelected && 'bg-white',
          compact && 'p-2'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className={cn('w-4 h-4', isSelected ? 'text-white' : 'text-gray-600')} />
            <span className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
              {showEndTime && serviceDuration
                ? formatTimeRange(slot, serviceDuration)
                : formatTime(slot, compact)}
            </span>
          </div>

          {popular && !isSelected && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Popular
            </span>
          )}
        </div>

        {showDuration && serviceDuration && (
          <div className={cn('mt-1 text-gray-600', compact ? 'text-xs' : 'text-sm')}>
            {serviceDuration} min
          </div>
        )}
      </button>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-8 text-gray-600">Loading available times...</div>
      </div>
    )
  }

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

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center py-8 text-gray-500">
          No available slots for this date
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className={cn('font-semibold mb-4', compact ? 'text-base' : 'text-lg')}>
        Select a Time
      </h3>

      {groupByTimeOfDay ? (
        <div className="space-y-6">
          {Object.entries(groupSlotsByTimeOfDay()).map(([timeOfDay, slots]) => {
            if (slots.length === 0) return null

            return (
              <div key={timeOfDay}>
                <h4 className="text-sm font-medium text-gray-700 mb-2">{timeOfDay}</h4>
                <div
                  data-testid="slot-container"
                  className={cn(
                    layout === 'grid'
                      ? 'grid grid-cols-2 md:grid-cols-3 gap-2'
                      : 'list flex flex-col gap-2',
                    compact && 'compact'
                  )}
                >
                  {slots.map(slot => renderSlot(slot))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          data-testid="slot-container"
          className={cn(
            layout === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 gap-2'
              : 'list flex flex-col gap-2',
            compact && 'compact'
          )}
        >
          {slots.map(slot => renderSlot(slot))}
        </div>
      )}
    </div>
  )
}
