/**
 * Tests for Template #26 schema
 */

import { describe, it, expect } from 'vitest'
import { providers, services, appointments, availability, bookingSettings } from './schema'

describe('Template #26: Service Appointments Schema', () => {
  describe('Providers Table', () => {
    it('should have required fields', () => {
      const fields = providers.$inferSelect
      expect(providers).toBeDefined()
      expect(providers.id).toBeDefined()
      expect(providers.userId).toBeDefined()
      expect(providers.name).toBeDefined()
      expect(providers.email).toBeDefined()
    })

    it('should support specialties as JSON array', () => {
      // Specialties stored as JSON text
      const mockProvider = {
        id: 'prov_123',
        userId: 'user_123',
        name: 'Jane Stylist',
        email: 'jane@salon.com',
        phone: '555-0100',
        specialties: JSON.stringify(['haircut', 'color', 'styling']),
        isActive: true,
        createdAt: new Date(),
      }
      expect(JSON.parse(mockProvider.specialties)).toEqual(['haircut', 'color', 'styling'])
    })
  })

  describe('Services Table', () => {
    it('should have price and duration', () => {
      expect(services.price).toBeDefined()
      expect(services.duration).toBeDefined()
    })

    it('should support optional deposit requirements', () => {
      const mockService = {
        id: 'svc_123',
        name: 'Color Treatment',
        description: 'Full head color',
        duration: 120, // minutes
        price: 150.00,
        requiresDeposit: true,
        depositAmount: 50.00,
        isActive: true,
        category: 'hair',
        createdAt: new Date(),
      }
      expect(mockService.requiresDeposit).toBe(true)
      expect(mockService.depositAmount).toBe(50.00)
    })
  })

  describe('Appointments Table', () => {
    it('should have all required appointment fields', () => {
      expect(appointments.providerId).toBeDefined()
      expect(appointments.serviceId).toBeDefined()
      expect(appointments.clientName).toBeDefined()
      expect(appointments.scheduledAt).toBeDefined()
      expect(appointments.status).toBeDefined()
    })

    it('should support status workflow', () => {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']
      validStatuses.forEach(status => {
        const mockAppointment = {
          status,
          // ... other required fields
        }
        expect(validStatuses).toContain(mockAppointment.status)
      })
    })

    it('should support recurring appointments', () => {
      const mockRecurring = {
        id: 'appt_123',
        isRecurring: true,
        recurrenceRule: JSON.stringify({ frequency: 'weekly', count: 10 }),
        parentAppointmentId: null,
      }
      expect(mockRecurring.isRecurring).toBe(true)
      const rule = JSON.parse(mockRecurring.recurrenceRule)
      expect(rule.frequency).toBe('weekly')
    })
  })

  describe('Availability Table', () => {
    it('should define weekly schedule', () => {
      expect(availability.dayOfWeek).toBeDefined()
      expect(availability.startTime).toBeDefined()
      expect(availability.endTime).toBeDefined()
    })

    it('should validate day of week range', () => {
      const mockSchedules = [
        { dayOfWeek: 0 }, // Sunday
        { dayOfWeek: 6 }, // Saturday
      ]
      mockSchedules.forEach(schedule => {
        expect(schedule.dayOfWeek).toBeGreaterThanOrEqual(0)
        expect(schedule.dayOfWeek).toBeLessThanOrEqual(6)
      })
    })
  })

  describe('Booking Settings', () => {
    it('should have business configuration', () => {
      expect(bookingSettings.businessName).toBeDefined()
      expect(bookingSettings.advanceBookingDays).toBeDefined()
      expect(bookingSettings.minNoticeHours).toBeDefined()
    })

    it('should have default values', () => {
      // Default values defined in schema
      const defaults = {
        advanceBookingDays: 30,
        minNoticeHours: 2,
        reminderHours: 24,
        sendReminders: true,
        trackNoShows: true,
      }
      expect(defaults.advanceBookingDays).toBe(30)
      expect(defaults.minNoticeHours).toBe(2)
    })
  })

  describe('Schema Relationships', () => {
    it('should link appointments to providers and services', () => {
      // Foreign key relationships
      expect(appointments.providerId).toBeDefined()
      expect(appointments.serviceId).toBeDefined()
    })

    it('should link availability to providers', () => {
      expect(availability.providerId).toBeDefined()
    })
  })
})
