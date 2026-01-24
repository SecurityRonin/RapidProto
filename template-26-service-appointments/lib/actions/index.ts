/**
 * Template #26: Service Appointment Booking
 * Server Actions - implemented to pass TDD tests
 *
 * Universal appointment scheduling for salons, medical, auto repair, home services
 */

'use server'

import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import {
  providers,
  services,
  availability,
  appointments,
  bookingSettings,
  noShows,
  blockouts,
  type Provider,
  type Service,
  type Appointment,
} from '@/lib/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

// ============================================================================
// Validation Schemas
// ============================================================================

const createProviderSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  specialties: z.array(z.string()).optional(),
})

const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().positive(),
  price: z.number().positive(),
  requiresDeposit: z.boolean().optional(),
  depositAmount: z.number().positive().optional(),
  category: z.string().optional(),
})

const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
})

const createAppointmentSchema = z.object({
  providerId: z.string(),
  serviceId: z.string(),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(1),
  clientNotes: z.string().optional(),
  scheduledAt: z.date(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    count: z.number().positive(),
  }).optional(),
})

// ============================================================================
// Provider Management
// ============================================================================

export async function createProvider(input: z.infer<typeof createProviderSchema>) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = createProviderSchema.parse(input)
    const now = new Date()

    const [provider] = await db.insert(providers).values({
      id: nanoid(),
      userId,
      name: validated.name,
      email: validated.email,
      phone: validated.phone ?? null,
      specialties: validated.specialties ? JSON.stringify(validated.specialties) : null,
      isActive: true,
      createdAt: now,
    }).returning()

    return { success: true, data: provider }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create provider' }
  }
}

export async function getProviders(filters?: { activeOnly?: boolean; specialty?: string }) {
  try {
    let query = db.select().from(providers)

    if (filters?.activeOnly) {
      query = query.where(eq(providers.isActive, true))
    }

    const results = await query

    if (filters?.specialty) {
      return {
        success: true,
        data: results.filter(p =>
          p.specialties && JSON.parse(p.specialties).includes(filters.specialty)
        ),
      }
    }

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch providers' }
  }
}

export async function updateProvider(providerId: string, updates: Partial<Provider>) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const [updated] = await db.update(providers)
      .set(updates)
      .where(eq(providers.id, providerId))
      .returning()

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to update provider' }
  }
}

// ============================================================================
// Service Management
// ============================================================================

export async function createService(input: z.infer<typeof createServiceSchema>) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = createServiceSchema.parse(input)
    const now = new Date()

    const [service] = await db.insert(services).values({
      id: nanoid(),
      name: validated.name,
      description: validated.description ?? null,
      duration: validated.duration,
      price: validated.price,
      requiresDeposit: validated.requiresDeposit ?? false,
      depositAmount: validated.depositAmount ?? null,
      category: validated.category ?? null,
      isActive: true,
      createdAt: now,
    }).returning()

    return { success: true, data: service }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create service' }
  }
}

export async function getServices(filters?: { category?: string; activeOnly?: boolean }) {
  try {
    let query = db.select().from(services)

    const conditions = []
    if (filters?.activeOnly) {
      conditions.push(eq(services.isActive, true))
    }
    if (filters?.category) {
      conditions.push(eq(services.category, filters.category))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const results = await query
    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch services' }
  }
}

export async function updateService(serviceId: string, updates: Partial<Service>) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const [updated] = await db.update(services)
      .set(updates)
      .where(eq(services.id, serviceId))
      .returning()

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to update service' }
  }
}

// ============================================================================
// Availability Management
// ============================================================================

export async function setAvailability(
  providerId: string,
  slots: z.infer<typeof availabilitySlotSchema>[]
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate all slots
    for (const slot of slots) {
      availabilitySlotSchema.parse(slot)

      // Validate end time after start time
      const [startHour, startMin] = slot.startTime.split(':').map(Number)
      const [endHour, endMin] = slot.endTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin

      if (endMinutes <= startMinutes) {
        return { success: false, error: 'End time must be after start time' }
      }
    }

    // Delete existing availability for provider
    await db.delete(availability).where(eq(availability.providerId, providerId))

    // Insert new availability
    const created = await db.insert(availability).values(
      slots.map(slot => ({
        id: nanoid(),
        providerId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: true,
      }))
    ).returning()

    return { success: true, data: created }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to set availability' }
  }
}

export async function getAvailableSlots(params: {
  providerId: string
  serviceId: string
  date: string
}) {
  try {
    const { providerId, serviceId, date } = params

    // Get service details
    const [service] = await db.select().from(services).where(eq(services.id, serviceId))
    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    // Get booking settings
    const [settings] = await db.select().from(bookingSettings).limit(1)
    const minNoticeHours = settings?.minNoticeHours ?? 2

    // Parse date and get day of week
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()

    // Get provider availability for this day
    const availabilitySlots = await db.select()
      .from(availability)
      .where(and(
        eq(availability.providerId, providerId),
        eq(availability.dayOfWeek, dayOfWeek),
        eq(availability.isActive, true)
      ))

    if (availabilitySlots.length === 0) {
      return { success: true, data: [] }
    }

    // Get existing appointments for this day
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    const existingAppointments = await db.select()
      .from(appointments)
      .where(and(
        eq(appointments.providerId, providerId),
        gte(appointments.scheduledAt, dayStart),
        lte(appointments.scheduledAt, dayEnd),
        sql`${appointments.status} NOT IN ('cancelled', 'no_show')`
      ))

    // Get blockouts for this day
    const blockoutPeriods = await db.select()
      .from(blockouts)
      .where(and(
        sql`${blockouts.providerId} IS NULL OR ${blockouts.providerId} = ${providerId}`,
        lte(blockouts.startTime, dayEnd),
        gte(blockouts.endTime, dayStart)
      ))

    // Generate time slots
    const slots: Date[] = []
    const now = new Date()
    const minNoticeTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000)

    for (const avail of availabilitySlots) {
      const [startHour, startMin] = avail.startTime.split(':').map(Number)
      const [endHour, endMin] = avail.endTime.split(':').map(Number)

      let currentTime = new Date(targetDate)
      currentTime.setHours(startHour, startMin, 0, 0)

      const endTime = new Date(targetDate)
      endTime.setHours(endHour, endMin, 0, 0)

      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + service.duration * 60 * 1000)

        // Check if slot is in the future with minimum notice
        if (currentTime >= minNoticeTime) {
          // Check if slot conflicts with existing appointments
          const hasConflict = existingAppointments.some(apt => {
            const aptEnd = new Date(apt.scheduledAt.getTime() + apt.duration * 60 * 1000)
            return (
              currentTime < aptEnd &&
              slotEnd > apt.scheduledAt
            )
          })

          // Check if slot conflicts with blockouts
          const hasBlockout = blockoutPeriods.some(block => {
            return (
              currentTime < block.endTime &&
              slotEnd > block.startTime
            )
          })

          if (!hasConflict && !hasBlockout) {
            slots.push(new Date(currentTime))
          }
        }

        currentTime = new Date(currentTime.getTime() + service.duration * 60 * 1000)
      }
    }

    return { success: true, data: slots }
  } catch (error) {
    return { success: false, error: 'Failed to get available slots' }
  }
}

// ============================================================================
// Appointment Management
// ============================================================================

export async function createAppointment(input: z.infer<typeof createAppointmentSchema>) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = createAppointmentSchema.parse(input)

    // Get service details
    const [service] = await db.select().from(services).where(eq(services.id, validated.serviceId))
    if (!service) {
      return { success: false, error: 'Service not found' }
    }

    // Get booking settings
    const [settings] = await db.select().from(bookingSettings).limit(1)
    const minNoticeHours = settings?.minNoticeHours ?? 2

    // Check minimum notice
    const now = new Date()
    const minNoticeTime = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000)
    if (validated.scheduledAt < minNoticeTime) {
      return { success: false, error: `Minimum ${minNoticeHours} hours notice required` }
    }

    // Check for no-show blocking
    const noShowCheck = await checkClientBlocked(validated.clientEmail)
    if (noShowCheck.success && noShowCheck.data.isBlocked) {
      return { success: false, error: 'Client blocked due to excessive no-shows' }
    }

    // Check for conflicts
    const slotEnd = new Date(validated.scheduledAt.getTime() + service.duration * 60 * 1000)
    const conflicts = await db.select()
      .from(appointments)
      .where(and(
        eq(appointments.providerId, validated.providerId),
        sql`${appointments.status} NOT IN ('cancelled', 'no_show')`,
        sql`${appointments.scheduledAt} < ${slotEnd}`,
        sql`datetime(${appointments.scheduledAt}, '+' || ${appointments.duration} || ' minutes') > ${validated.scheduledAt}`
      ))

    if (conflicts.length > 0) {
      return { success: false, error: 'Time slot not available' }
    }

    const appointmentId = nanoid()
    const now2 = new Date()

    // Create main appointment
    const [appointment] = await db.insert(appointments).values({
      id: appointmentId,
      providerId: validated.providerId,
      serviceId: validated.serviceId,
      clientName: validated.clientName,
      clientEmail: validated.clientEmail,
      clientPhone: validated.clientPhone,
      clientNotes: validated.clientNotes ?? null,
      scheduledAt: validated.scheduledAt,
      duration: service.duration,
      status: 'pending',
      price: service.price,
      depositPaid: false,
      depositAmount: service.requiresDeposit ? service.depositAmount : null,
      paymentStatus: service.requiresDeposit ? 'deposit' : 'unpaid',
      reminderSent: false,
      reminderSentAt: null,
      isRecurring: validated.isRecurring ?? false,
      recurrenceRule: validated.recurrenceRule ? JSON.stringify(validated.recurrenceRule) : null,
      parentAppointmentId: null,
      createdAt: now2,
      updatedAt: now2,
    }).returning()

    // Handle recurring appointments
    if (validated.isRecurring && validated.recurrenceRule) {
      const { frequency, count } = validated.recurrenceRule
      const recurringAppointments = []

      for (let i = 1; i < count; i++) {
        let nextDate = new Date(validated.scheduledAt)

        if (frequency === 'daily') {
          nextDate.setDate(nextDate.getDate() + i)
        } else if (frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + (i * 7))
        } else if (frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + i)
        }

        recurringAppointments.push({
          id: nanoid(),
          providerId: validated.providerId,
          serviceId: validated.serviceId,
          clientName: validated.clientName,
          clientEmail: validated.clientEmail,
          clientPhone: validated.clientPhone,
          clientNotes: validated.clientNotes ?? null,
          scheduledAt: nextDate,
          duration: service.duration,
          status: 'pending',
          price: service.price,
          depositPaid: false,
          depositAmount: service.requiresDeposit ? service.depositAmount : null,
          paymentStatus: service.requiresDeposit ? 'deposit' : 'unpaid',
          reminderSent: false,
          reminderSentAt: null,
          isRecurring: true,
          recurrenceRule: JSON.stringify(validated.recurrenceRule),
          parentAppointmentId: appointmentId,
          createdAt: now2,
          updatedAt: now2,
        })
      }

      if (recurringAppointments.length > 0) {
        await db.insert(appointments).values(recurringAppointments)
      }
    }

    return { success: true, data: appointment }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create appointment' }
  }
}

export async function getAppointments(filters: {
  providerId?: string
  startDate?: Date
  endDate?: Date
  status?: string
}) {
  try {
    const conditions = []

    if (filters.providerId) {
      conditions.push(eq(appointments.providerId, filters.providerId))
    }
    if (filters.startDate) {
      conditions.push(gte(appointments.scheduledAt, filters.startDate))
    }
    if (filters.endDate) {
      conditions.push(lte(appointments.scheduledAt, filters.endDate))
    }
    if (filters.status) {
      conditions.push(eq(appointments.status, filters.status))
    }

    const query = conditions.length > 0
      ? db.select().from(appointments).where(and(...conditions))
      : db.select().from(appointments)

    const results = await query

    // Fetch service details for each appointment
    const withServices = await Promise.all(
      results.map(async (apt) => {
        const [service] = await db.select().from(services).where(eq(services.id, apt.serviceId))
        return { ...apt, service }
      })
    )

    return { success: true, data: withServices }
  } catch (error) {
    return { success: false, error: 'Failed to fetch appointments' }
  }
}

export async function updateAppointmentStatus(appointmentId: string, newStatus: string) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get current appointment
    const [current] = await db.select().from(appointments).where(eq(appointments.id, appointmentId))
    if (!current) {
      return { success: false, error: 'Appointment not found' }
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled', 'no_show'],
      completed: [],
      cancelled: [],
      no_show: [],
    }

    if (!validTransitions[current.status]?.includes(newStatus)) {
      return { success: false, error: 'Invalid status transition' }
    }

    const now = new Date()

    // Update appointment
    const [updated] = await db.update(appointments)
      .set({
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(appointments.id, appointmentId))
      .returning()

    // Record no-show if applicable
    if (newStatus === 'no_show') {
      await db.insert(noShows).values({
        id: nanoid(),
        appointmentId,
        clientEmail: current.clientEmail,
        occurredAt: now,
        notes: null,
      })
    }

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to update appointment status' }
  }
}

export async function cancelAppointment(
  appointmentId: string,
  options?: { override?: boolean; reason?: string }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get appointment
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, appointmentId))
    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    // Get cancellation policy
    const [settings] = await db.select().from(bookingSettings).limit(1)
    const cancellationHours = settings?.cancellationHours ?? 24

    // Check cancellation policy
    if (!options?.override) {
      const now = new Date()
      const cancellationDeadline = new Date(appointment.scheduledAt.getTime() - cancellationHours * 60 * 60 * 1000)

      if (now > cancellationDeadline) {
        return { success: false, error: `Cancellation policy requires ${cancellationHours} hours notice` }
      }
    }

    const now = new Date()

    // Update appointment
    const [updated] = await db.update(appointments)
      .set({
        status: 'cancelled',
        paymentStatus: appointment.depositPaid ? 'refunded' : appointment.paymentStatus,
        updatedAt: now,
      })
      .where(eq(appointments.id, appointmentId))
      .returning()

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to cancel appointment' }
  }
}

export async function rescheduleAppointment(
  appointmentId: string,
  params: { newScheduledAt: Date }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get appointment
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, appointmentId))
    if (!appointment) {
      return { success: false, error: 'Appointment not found' }
    }

    // Check new slot availability
    const slotEnd = new Date(params.newScheduledAt.getTime() + appointment.duration * 60 * 1000)
    const conflicts = await db.select()
      .from(appointments)
      .where(and(
        eq(appointments.providerId, appointment.providerId),
        sql`${appointments.id} != ${appointmentId}`,
        sql`${appointments.status} NOT IN ('cancelled', 'no_show')`,
        sql`${appointments.scheduledAt} < ${slotEnd}`,
        sql`datetime(${appointments.scheduledAt}, '+' || ${appointments.duration} || ' minutes') > ${params.newScheduledAt}`
      ))

    if (conflicts.length > 0) {
      return { success: false, error: 'New time slot not available' }
    }

    const now = new Date()

    // Update appointment
    const [updated] = await db.update(appointments)
      .set({
        scheduledAt: params.newScheduledAt,
        updatedAt: now,
      })
      .where(eq(appointments.id, appointmentId))
      .returning()

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to reschedule appointment' }
  }
}

// ============================================================================
// Booking Settings
// ============================================================================

export async function getBookingSettings() {
  try {
    const [settings] = await db.select().from(bookingSettings).limit(1)

    if (!settings) {
      return { success: false, error: 'Settings not found' }
    }

    return { success: true, data: settings }
  } catch (error) {
    return { success: false, error: 'Failed to fetch settings' }
  }
}

export async function updateBookingSettings(updates: Partial<typeof bookingSettings.$inferInsert>) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const now = new Date()

    // Get existing settings
    const [existing] = await db.select().from(bookingSettings).limit(1)

    if (existing) {
      const [updated] = await db.update(bookingSettings)
        .set({ ...updates, updatedAt: now })
        .where(eq(bookingSettings.id, existing.id))
        .returning()

      return { success: true, data: updated }
    } else {
      const [created] = await db.insert(bookingSettings)
        .values({
          id: nanoid(),
          businessName: updates.businessName ?? 'My Business',
          timezone: updates.timezone ?? 'America/New_York',
          ...updates,
          updatedAt: now,
        })
        .returning()

      return { success: true, data: created }
    }
  } catch (error) {
    return { success: false, error: 'Failed to update settings' }
  }
}

// ============================================================================
// No-Show Management
// ============================================================================

export async function recordNoShow(params: {
  appointmentId: string
  clientEmail: string
  notes?: string
}) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const now = new Date()

    // Create no-show record
    const [noShow] = await db.insert(noShows).values({
      id: nanoid(),
      appointmentId: params.appointmentId,
      clientEmail: params.clientEmail,
      occurredAt: now,
      notes: params.notes ?? null,
    }).returning()

    // Update appointment status
    await db.update(appointments)
      .set({ status: 'no_show', updatedAt: now })
      .where(eq(appointments.id, params.appointmentId))

    return { success: true, data: noShow }
  } catch (error) {
    return { success: false, error: 'Failed to record no-show' }
  }
}

export async function getNoShowCount(clientEmail: string) {
  try {
    const count = await db.select({ count: sql<number>`count(*)` })
      .from(noShows)
      .where(eq(noShows.clientEmail, clientEmail))

    return { success: true, data: { count: count[0].count } }
  } catch (error) {
    return { success: false, error: 'Failed to get no-show count' }
  }
}

export async function checkClientBlocked(clientEmail: string) {
  try {
    const countResult = await getNoShowCount(clientEmail)
    if (!countResult.success) {
      return countResult
    }

    const [settings] = await db.select().from(bookingSettings).limit(1)
    const threshold = settings?.noShowThreshold ?? 2

    return {
      success: true,
      data: {
        isBlocked: countResult.data.count >= threshold,
        noShowCount: countResult.data.count,
      },
    }
  } catch (error) {
    return { success: false, error: 'Failed to check client status' }
  }
}

// ============================================================================
// Blockout Management
// ============================================================================

export async function createBlockout(params: {
  providerId?: string
  startTime: Date
  endTime: Date
  reason: string
}) {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate end time after start time
    if (params.endTime <= params.startTime) {
      return { success: false, error: 'End time must be after start time' }
    }

    const now = new Date()

    const [blockout] = await db.insert(blockouts).values({
      id: nanoid(),
      providerId: params.providerId ?? null,
      startTime: params.startTime,
      endTime: params.endTime,
      reason: params.reason,
      createdAt: now,
    }).returning()

    return { success: true, data: blockout }
  } catch (error) {
    return { success: false, error: 'Failed to create blockout' }
  }
}

export async function getBlockouts(params: {
  providerId?: string
  startDate: Date
  endDate: Date
}) {
  try {
    const conditions = [
      lte(blockouts.startTime, params.endDate),
      gte(blockouts.endTime, params.startDate),
    ]

    if (params.providerId) {
      conditions.push(
        sql`${blockouts.providerId} IS NULL OR ${blockouts.providerId} = ${params.providerId}`
      )
    }

    const results = await db.select()
      .from(blockouts)
      .where(and(...conditions))

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch blockouts' }
  }
}
