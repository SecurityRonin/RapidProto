/**
 * Client Booking Form Component
 * Collects client information and creates appointments
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, DollarSign, AlertTriangle, User } from 'lucide-react'
import { createAppointment, checkClientBlocked } from '@/lib/actions'
import { cn } from '@/lib/utils'

interface BookingDetails {
  providerId: string
  providerName: string
  serviceId: string
  serviceName: string
  servicePrice: number
  serviceDuration: number
  depositRequired: boolean
  depositAmount?: number
  scheduledAt: Date
}

interface ClientBookingFormProps {
  bookingDetails: BookingDetails
  onSuccess: (appointmentId: string) => void
  onCancel: () => void
  initialData?: {
    clientName?: string
    clientEmail?: string
    clientPhone?: string
  }
}

export function ClientBookingForm({
  bookingDetails,
  onSuccess,
  onCancel,
  initialData,
}: ClientBookingFormProps) {
  const [formData, setFormData] = useState({
    clientName: initialData?.clientName || '',
    clientEmail: initialData?.clientEmail || '',
    clientPhone: initialData?.clientPhone || '',
    notes: '',
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientStatus, setClientStatus] = useState<{
    isBlocked: boolean
    noShowCount: number
  } | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const hasFormData = Object.values(formData).some(v => v.trim().length > 0)

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePhone = (phone: string) => {
    return /^[\d\s\-\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.clientName.trim()) {
      errors.clientName = 'Name is required'
    }

    if (!formData.clientEmail.trim()) {
      errors.clientEmail = 'Email is required'
    } else if (!validateEmail(formData.clientEmail)) {
      errors.clientEmail = 'Invalid email format'
    }

    if (!formData.clientPhone.trim()) {
      errors.clientPhone = 'Phone is required'
    } else if (!validatePhone(formData.clientPhone)) {
      errors.clientPhone = 'Invalid phone number'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEmailBlur = async () => {
    if (formData.clientEmail && validateEmail(formData.clientEmail)) {
      const result = await checkClientBlocked(formData.clientEmail)
      if (result.success) {
        setClientStatus(result.data)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (clientStatus?.isBlocked) return

    setSubmitting(true)
    setError(null)

    const result = await createAppointment({
      providerId: bookingDetails.providerId,
      serviceId: bookingDetails.serviceId,
      scheduledAt: bookingDetails.scheduledAt,
      clientName: formData.clientName,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      notes: formData.notes || undefined,
    })

    setSubmitting(false)

    if (result.success) {
      onSuccess(result.data.id)
    } else {
      setError(result.error || 'Failed to create appointment')
    }
  }

  const handleCancel = () => {
    if (hasFormData) {
      setShowCancelDialog(true)
    } else {
      onCancel()
    }
  }

  const confirmCancel = () => {
    setShowCancelDialog(false)
    onCancel()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Booking Summary */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Summary</h2>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <div className="text-sm text-gray-600">Provider</div>
              <div className="font-medium">{bookingDetails.providerName}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <div className="text-sm text-gray-600">Date</div>
              <div className="font-medium">{formatDate(bookingDetails.scheduledAt)}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <div className="text-sm text-gray-600">Time</div>
              <div className="font-medium">
                {formatTime(bookingDetails.scheduledAt)} ({bookingDetails.serviceDuration} min)
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <div className="text-sm text-gray-600">Service</div>
              <div className="font-medium">{bookingDetails.serviceName}</div>
              <div className="text-sm text-gray-600 mt-1">
                ${bookingDetails.servicePrice}
                {bookingDetails.depositRequired && (
                  <span className="ml-2 text-yellow-700">
                    (${bookingDetails.depositAmount} deposit required)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Information Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Information</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {clientStatus && clientStatus.isBlocked && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-red-700">
                <div className="font-medium">Account Blocked</div>
                <div className="text-sm mt-1">
                  This account is blocked due to excessive no-shows. Please contact us to resolve.
                </div>
              </div>
            </div>
          </div>
        )}

        {clientStatus && !clientStatus.isBlocked && clientStatus.noShowCount > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-yellow-700 text-sm">
                You have {clientStatus.noShowCount} previous no-show{clientStatus.noShowCount > 1 ? 's' : ''}.
                Please cancel appointments if you can't make them.
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              id="clientName"
              type="text"
              value={formData.clientName}
              onChange={e => setFormData({ ...formData, clientName: e.target.value })}
              className={cn(
                'w-full px-4 py-2 border rounded-lg',
                formErrors.clientName && 'border-red-500'
              )}
            />
            {formErrors.clientName && (
              <p className="mt-1 text-sm text-red-600">{formErrors.clientName}</p>
            )}
          </div>

          <div>
            <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              id="clientEmail"
              type="email"
              value={formData.clientEmail}
              onChange={e => setFormData({ ...formData, clientEmail: e.target.value })}
              onBlur={handleEmailBlur}
              className={cn(
                'w-full px-4 py-2 border rounded-lg',
                formErrors.clientEmail && 'border-red-500'
              )}
            />
            {formErrors.clientEmail && (
              <p className="mt-1 text-sm text-red-600">{formErrors.clientEmail}</p>
            )}
          </div>

          <div>
            <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              id="clientPhone"
              type="tel"
              value={formData.clientPhone}
              onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
              onBlur={() => {
                if (formData.clientPhone && !validatePhone(formData.clientPhone)) {
                  setFormErrors({ ...formErrors, clientPhone: 'Invalid phone number' })
                } else {
                  const { clientPhone, ...rest } = formErrors
                  setFormErrors(rest)
                }
              }}
              className={cn(
                'w-full px-4 py-2 border rounded-lg',
                formErrors.clientPhone && 'border-red-500'
              )}
              placeholder="(555) 123-4567"
            />
            {formErrors.clientPhone && (
              <p className="mt-1 text-sm text-red-600">{formErrors.clientPhone}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Any special requests or notes..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="submit"
            disabled={submitting || clientStatus?.isBlocked}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating Appointment...' : 'Confirm Booking'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Discard Changes?</h3>
            <p className="text-gray-600 mb-4">
              You have unsaved changes. Are you sure you want to cancel?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={confirmCancel}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Discard
              </button>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
