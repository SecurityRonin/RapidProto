/**
 * TDD: Action Tests for Service Appointment Booking
 * Write tests FIRST, then implement actions to pass them
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createProvider,
  getProviders,
  updateProvider,
  createService,
  getServices,
  updateService,
  setAvailability,
  getAvailableSlots,
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  getBookingSettings,
  updateBookingSettings,
  recordNoShow,
  getNoShowCount,
  checkClientBlocked,
  createBlockout,
  getBlockouts,
} from './index'

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [
          {
            id: 'provider_123',
            name: 'Jane Smith',
            email: 'jane@example.com',
            isActive: true,
          },
        ]),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => [
          {
            id: 'provider_123',
            name: 'Jane Smith',
            isActive: true,
          },
        ]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => [{ id: 'provider_123' }]),
        })),
      })),
    })),
  },
}))

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => ({ userId: 'user_123' })),
}))

describe('Service Appointment Booking Actions', () => {
  describe('Provider Management', () => {
    describe('createProvider', () => {
      it('should create a new service provider', async () => {
        const result = await createProvider({
          name: 'Jane Smith',
          email: 'jane@salon.com',
          phone: '555-0123',
          specialties: ['haircut', 'color', 'styling'],
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data.name).toBe('Jane Smith')
        expect(result.data.email).toBe('jane@salon.com')
      })

      it('should validate email format', async () => {
        const result = await createProvider({
          name: 'Jane Smith',
          email: 'invalid-email',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('email')
      })

      it('should require authentication', async () => {
        vi.mock('@clerk/nextjs', () => ({
          auth: vi.fn(() => ({ userId: null })),
        }))

        const result = await createProvider({
          name: 'Jane Smith',
          email: 'jane@salon.com',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('Unauthorized')
      })

      it('should store specialties as JSON', async () => {
        const result = await createProvider({
          name: 'Jane Smith',
          email: 'jane@salon.com',
          specialties: ['haircut', 'color'],
        })

        expect(result.success).toBe(true)
        expect(result.data.specialties).toBeDefined()
      })
    })

    describe('getProviders', () => {
      it('should return all active providers', async () => {
        const result = await getProviders()

        expect(result.success).toBe(true)
        expect(result.data).toBeInstanceOf(Array)
      })

      it('should filter by active status', async () => {
        const result = await getProviders({ activeOnly: true })

        expect(result.success).toBe(true)
        result.data.forEach(provider => {
          expect(provider.isActive).toBe(true)
        })
      })

      it('should filter by specialty', async () => {
        const result = await getProviders({ specialty: 'haircut' })

        expect(result.success).toBe(true)
        result.data.forEach(provider => {
          expect(JSON.parse(provider.specialties)).toContain('haircut')
        })
      })
    })

    describe('updateProvider', () => {
      it('should update provider details', async () => {
        const result = await updateProvider('provider_123', {
          phone: '555-9999',
        })

        expect(result.success).toBe(true)
        expect(result.data.id).toBe('provider_123')
      })

      it('should allow activating/deactivating provider', async () => {
        const result = await updateProvider('provider_123', {
          isActive: false,
        })

        expect(result.success).toBe(true)
        expect(result.data.isActive).toBe(false)
      })
    })
  })

  describe('Service Management', () => {
    describe('createService', () => {
      it('should create a new service', async () => {
        const result = await createService({
          name: 'Haircut',
          duration: 30,
          price: 45.00,
        })

        expect(result.success).toBe(true)
        expect(result.data.name).toBe('Haircut')
        expect(result.data.duration).toBe(30)
        expect(result.data.price).toBe(45.00)
      })

      it('should support deposit requirements', async () => {
        const result = await createService({
          name: 'Hair Color',
          duration: 120,
          price: 150.00,
          requiresDeposit: true,
          depositAmount: 50.00,
        })

        expect(result.success).toBe(true)
        expect(result.data.requiresDeposit).toBe(true)
        expect(result.data.depositAmount).toBe(50.00)
      })

      it('should categorize services', async () => {
        const result = await createService({
          name: 'Haircut',
          duration: 30,
          price: 45.00,
          category: 'Hair Services',
        })

        expect(result.success).toBe(true)
        expect(result.data.category).toBe('Hair Services')
      })

      it('should validate duration is positive', async () => {
        const result = await createService({
          name: 'Haircut',
          duration: -10,
          price: 45.00,
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('duration')
      })

      it('should validate price is positive', async () => {
        const result = await createService({
          name: 'Haircut',
          duration: 30,
          price: -45.00,
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('price')
      })
    })

    describe('getServices', () => {
      it('should return all active services', async () => {
        const result = await getServices()

        expect(result.success).toBe(true)
        expect(result.data).toBeInstanceOf(Array)
      })

      it('should filter by category', async () => {
        const result = await getServices({ category: 'Hair Services' })

        expect(result.success).toBe(true)
        result.data.forEach(service => {
          expect(service.category).toBe('Hair Services')
        })
      })

      it('should filter by active status', async () => {
        const result = await getServices({ activeOnly: true })

        expect(result.success).toBe(true)
        result.data.forEach(service => {
          expect(service.isActive).toBe(true)
        })
      })
    })

    describe('updateService', () => {
      it('should update service details', async () => {
        const result = await updateService('service_123', {
          price: 50.00,
        })

        expect(result.success).toBe(true)
        expect(result.data.price).toBe(50.00)
      })
    })
  })

  describe('Availability Management', () => {
    describe('setAvailability', () => {
      it('should set provider weekly availability', async () => {
        const result = await setAvailability('provider_123', [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
        ])

        expect(result.success).toBe(true)
        expect(result.data.length).toBe(2)
      })

      it('should validate time format', async () => {
        const result = await setAvailability('provider_123', [
          { dayOfWeek: 1, startTime: '25:00', endTime: '17:00' },
        ])

        expect(result.success).toBe(false)
        expect(result.error).toContain('time')
      })

      it('should validate end time after start time', async () => {
        const result = await setAvailability('provider_123', [
          { dayOfWeek: 1, startTime: '17:00', endTime: '09:00' },
        ])

        expect(result.success).toBe(false)
        expect(result.error).toContain('end time')
      })
    })

    describe('getAvailableSlots', () => {
      it('should return available time slots for a date', async () => {
        const result = await getAvailableSlots({
          providerId: 'provider_123',
          serviceId: 'service_123',
          date: '2026-02-01',
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeInstanceOf(Array)
      })

      it('should exclude already booked times', async () => {
        const result = await getAvailableSlots({
          providerId: 'provider_123',
          serviceId: 'service_123',
          date: '2026-02-01',
        })

        expect(result.success).toBe(true)
        // Slots should not overlap with existing appointments
      })

      it('should respect minimum notice hours', async () => {
        const result = await getAvailableSlots({
          providerId: 'provider_123',
          serviceId: 'service_123',
          date: new Date().toISOString().split('T')[0], // Today
        })

        expect(result.success).toBe(true)
        // Should not return slots within minimum notice period
      })

      it('should exclude blockout times', async () => {
        const result = await getAvailableSlots({
          providerId: 'provider_123',
          serviceId: 'service_123',
          date: '2026-02-01',
        })

        expect(result.success).toBe(true)
        // Should not return slots during blockouts
      })

      it('should account for service duration', async () => {
        const result = await getAvailableSlots({
          providerId: 'provider_123',
          serviceId: 'service_123', // 30-minute service
          date: '2026-02-01',
        })

        expect(result.success).toBe(true)
        // Slots should be spaced by service duration
      })
    })
  })

  describe('Appointment Management', () => {
    describe('createAppointment', () => {
      it('should create a new appointment', async () => {
        const result = await createAppointment({
          providerId: 'provider_123',
          serviceId: 'service_123',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          clientPhone: '555-1234',
          scheduledAt: new Date('2026-02-01T10:00:00'),
        })

        expect(result.success).toBe(true)
        expect(result.data.clientName).toBe('John Doe')
        expect(result.data.status).toBe('pending')
      })

      it('should prevent double booking', async () => {
        const result = await createAppointment({
          providerId: 'provider_123',
          serviceId: 'service_123',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          clientPhone: '555-1234',
          scheduledAt: new Date('2026-02-01T10:00:00'), // Already booked
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('not available')
      })

      it('should check minimum notice requirement', async () => {
        const now = new Date()
        const tooSoon = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now

        const result = await createAppointment({
          providerId: 'provider_123',
          serviceId: 'service_123',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          clientPhone: '555-1234',
          scheduledAt: tooSoon,
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('minimum notice')
      })

      it('should block clients with too many no-shows', async () => {
        const result = await createAppointment({
          providerId: 'provider_123',
          serviceId: 'service_123',
          clientName: 'Serial No-Show',
          clientEmail: 'noshow@example.com',
          clientPhone: '555-1234',
          scheduledAt: new Date('2026-02-01T10:00:00'),
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('no-show')
      })

      it('should handle recurring appointments', async () => {
        const result = await createAppointment({
          providerId: 'provider_123',
          serviceId: 'service_123',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          clientPhone: '555-1234',
          scheduledAt: new Date('2026-02-01T10:00:00'),
          isRecurring: true,
          recurrenceRule: { frequency: 'weekly', count: 4 },
        })

        expect(result.success).toBe(true)
        expect(result.data.isRecurring).toBe(true)
        // Should create 4 appointments
      })

      it('should copy service price to appointment', async () => {
        const result = await createAppointment({
          providerId: 'provider_123',
          serviceId: 'service_123',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          clientPhone: '555-1234',
          scheduledAt: new Date('2026-02-01T10:00:00'),
        })

        expect(result.success).toBe(true)
        expect(result.data.price).toBeGreaterThan(0)
      })

      it('should handle deposit requirements', async () => {
        const result = await createAppointment({
          providerId: 'provider_123',
          serviceId: 'service_deposit', // Requires deposit
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          clientPhone: '555-1234',
          scheduledAt: new Date('2026-02-01T10:00:00'),
        })

        expect(result.success).toBe(true)
        expect(result.data.depositAmount).toBeGreaterThan(0)
        expect(result.data.paymentStatus).toBe('deposit')
      })
    })

    describe('getAppointments', () => {
      it('should return appointments for a provider', async () => {
        const result = await getAppointments({
          providerId: 'provider_123',
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeInstanceOf(Array)
      })

      it('should filter by date range', async () => {
        const result = await getAppointments({
          providerId: 'provider_123',
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-28'),
        })

        expect(result.success).toBe(true)
        result.data.forEach(apt => {
          expect(apt.scheduledAt).toBeGreaterThanOrEqual(new Date('2026-02-01'))
          expect(apt.scheduledAt).toBeLessThanOrEqual(new Date('2026-02-28'))
        })
      })

      it('should filter by status', async () => {
        const result = await getAppointments({
          providerId: 'provider_123',
          status: 'confirmed',
        })

        expect(result.success).toBe(true)
        result.data.forEach(apt => {
          expect(apt.status).toBe('confirmed')
        })
      })

      it('should include service details', async () => {
        const result = await getAppointments({
          providerId: 'provider_123',
        })

        expect(result.success).toBe(true)
        result.data.forEach(apt => {
          expect(apt.service).toBeDefined()
          expect(apt.service.name).toBeDefined()
        })
      })
    })

    describe('updateAppointmentStatus', () => {
      it('should update appointment status', async () => {
        const result = await updateAppointmentStatus('appt_123', 'confirmed')

        expect(result.success).toBe(true)
        expect(result.data.status).toBe('confirmed')
      })

      it('should allow valid status transitions', async () => {
        const transitions = [
          ['pending', 'confirmed'],
          ['confirmed', 'completed'],
          ['confirmed', 'cancelled'],
        ]

        for (const [from, to] of transitions) {
          const result = await updateAppointmentStatus('appt_123', to)
          expect(result.success).toBe(true)
        }
      })

      it('should prevent invalid status transitions', async () => {
        const result = await updateAppointmentStatus('appt_completed', 'pending')

        expect(result.success).toBe(false)
        expect(result.error).toContain('invalid')
      })

      it('should record no-show when marked', async () => {
        const result = await updateAppointmentStatus('appt_123', 'no_show')

        expect(result.success).toBe(true)
        expect(result.data.status).toBe('no_show')
        // Should create no-show record
      })
    })

    describe('cancelAppointment', () => {
      it('should cancel an appointment', async () => {
        const result = await cancelAppointment('appt_123')

        expect(result.success).toBe(true)
        expect(result.data.status).toBe('cancelled')
      })

      it('should enforce cancellation policy', async () => {
        const result = await cancelAppointment('appt_tomorrow') // <24 hours

        expect(result.success).toBe(false)
        expect(result.error).toContain('cancellation policy')
      })

      it('should allow override with reason', async () => {
        const result = await cancelAppointment('appt_tomorrow', {
          override: true,
          reason: 'Emergency',
        })

        expect(result.success).toBe(true)
        expect(result.data.status).toBe('cancelled')
      })

      it('should handle deposit refunds', async () => {
        const result = await cancelAppointment('appt_with_deposit')

        expect(result.success).toBe(true)
        expect(result.data.paymentStatus).toBe('refunded')
      })
    })

    describe('rescheduleAppointment', () => {
      it('should reschedule to a new time', async () => {
        const result = await rescheduleAppointment('appt_123', {
          newScheduledAt: new Date('2026-02-02T10:00:00'),
        })

        expect(result.success).toBe(true)
        expect(result.data.scheduledAt).toEqual(new Date('2026-02-02T10:00:00'))
      })

      it('should check new slot availability', async () => {
        const result = await rescheduleAppointment('appt_123', {
          newScheduledAt: new Date('2026-02-02T10:00:00'), // Already booked
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('not available')
      })

      it('should preserve appointment details', async () => {
        const result = await rescheduleAppointment('appt_123', {
          newScheduledAt: new Date('2026-02-02T10:00:00'),
        })

        expect(result.success).toBe(true)
        expect(result.data.clientName).toBe('John Doe')
        expect(result.data.serviceId).toBe('service_123')
      })
    })
  })

  describe('Booking Settings', () => {
    describe('getBookingSettings', () => {
      it('should return business booking settings', async () => {
        const result = await getBookingSettings()

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data.businessName).toBeDefined()
      })
    })

    describe('updateBookingSettings', () => {
      it('should update booking settings', async () => {
        const result = await updateBookingSettings({
          advanceBookingDays: 60,
          minNoticeHours: 4,
        })

        expect(result.success).toBe(true)
        expect(result.data.advanceBookingDays).toBe(60)
        expect(result.data.minNoticeHours).toBe(4)
      })

      it('should update cancellation policy', async () => {
        const result = await updateBookingSettings({
          cancellationHours: 48,
          cancelLatePolicy: 'Deposit forfeited',
        })

        expect(result.success).toBe(true)
        expect(result.data.cancellationHours).toBe(48)
      })

      it('should update reminder settings', async () => {
        const result = await updateBookingSettings({
          sendReminders: true,
          reminderHours: 48,
        })

        expect(result.success).toBe(true)
        expect(result.data.sendReminders).toBe(true)
      })
    })
  })

  describe('No-Show Management', () => {
    describe('recordNoShow', () => {
      it('should record a no-show', async () => {
        const result = await recordNoShow({
          appointmentId: 'appt_123',
          clientEmail: 'john@example.com',
          notes: 'Did not show up or call',
        })

        expect(result.success).toBe(true)
        expect(result.data.appointmentId).toBe('appt_123')
      })

      it('should update appointment status', async () => {
        const result = await recordNoShow({
          appointmentId: 'appt_123',
          clientEmail: 'john@example.com',
        })

        expect(result.success).toBe(true)
        // Appointment should be marked as no_show
      })
    })

    describe('getNoShowCount', () => {
      it('should return no-show count for client', async () => {
        const result = await getNoShowCount('john@example.com')

        expect(result.success).toBe(true)
        expect(typeof result.data.count).toBe('number')
      })
    })

    describe('checkClientBlocked', () => {
      it('should return false for clients below threshold', async () => {
        const result = await checkClientBlocked('good@example.com')

        expect(result.success).toBe(true)
        expect(result.data.isBlocked).toBe(false)
      })

      it('should return true for clients above threshold', async () => {
        const result = await checkClientBlocked('serial-noshow@example.com')

        expect(result.success).toBe(true)
        expect(result.data.isBlocked).toBe(true)
      })

      it('should include no-show count in response', async () => {
        const result = await checkClientBlocked('john@example.com')

        expect(result.success).toBe(true)
        expect(result.data.noShowCount).toBeDefined()
      })
    })
  })

  describe('Blockout Management', () => {
    describe('createBlockout', () => {
      it('should create a blockout period', async () => {
        const result = await createBlockout({
          startTime: new Date('2026-02-01T00:00:00'),
          endTime: new Date('2026-02-01T23:59:59'),
          reason: 'Holiday',
        })

        expect(result.success).toBe(true)
        expect(result.data.reason).toBe('Holiday')
      })

      it('should block specific provider', async () => {
        const result = await createBlockout({
          providerId: 'provider_123',
          startTime: new Date('2026-02-01T12:00:00'),
          endTime: new Date('2026-02-01T13:00:00'),
          reason: 'Lunch Break',
        })

        expect(result.success).toBe(true)
        expect(result.data.providerId).toBe('provider_123')
      })

      it('should block all providers when not specified', async () => {
        const result = await createBlockout({
          startTime: new Date('2026-12-25T00:00:00'),
          endTime: new Date('2026-12-25T23:59:59'),
          reason: 'Christmas',
        })

        expect(result.success).toBe(true)
        expect(result.data.providerId).toBeNull()
      })

      it('should validate end time after start time', async () => {
        const result = await createBlockout({
          startTime: new Date('2026-02-01T17:00:00'),
          endTime: new Date('2026-02-01T09:00:00'),
          reason: 'Invalid',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('end time')
      })
    })

    describe('getBlockouts', () => {
      it('should return blockouts for date range', async () => {
        const result = await getBlockouts({
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-28'),
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeInstanceOf(Array)
      })

      it('should filter by provider', async () => {
        const result = await getBlockouts({
          providerId: 'provider_123',
          startDate: new Date('2026-02-01'),
          endDate: new Date('2026-02-28'),
        })

        expect(result.success).toBe(true)
        result.data.forEach(blockout => {
          expect([null, 'provider_123']).toContain(blockout.providerId)
        })
      })
    })
  })
})
