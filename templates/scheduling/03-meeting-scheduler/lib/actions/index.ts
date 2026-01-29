/**
 * Template #3: Meeting Scheduler
 * Server Actions - Meeting scheduling, attendee management, and availability
 */

'use server'

import { db } from '@/lib/db'
import {
  meetings,
  meetingAttendees,
  availabilitySlots,
  type Meeting,
  type MeetingAttendee,
  type AvailabilitySlot,
  type MeetingStatus,
  type AttendeeStatus,
} from '../db/schema'
import { eq, and, gte, lte, desc, asc, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { nanoid } from 'nanoid'

// ============================================================================
// Validation Schemas
// ============================================================================

export const attendeeSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required'),
})

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().optional(),
  meetingUrl: z.string().url('Invalid URL format').optional(),
  organizerId: z.string().min(1, 'Organizer ID is required'),
  attendees: z.array(attendeeSchema).optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: 'End time must be after start time', path: ['endTime'] }
)

export const updateMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  location: z.string().optional(),
  meetingUrl: z.string().url('Invalid URL format').optional(),
  status: z.enum(['scheduled', 'cancelled', 'completed']).optional(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.endTime > data.startTime
    }
    return true
  },
  { message: 'End time must be after start time', path: ['endTime'] }
)

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6, 'Day of week must be 0-6'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'),
}).refine(
  (data) => {
    const [startHour, startMin] = data.startTime.split(':').map(Number)
    const [endHour, endMin] = data.endTime.split(':').map(Number)
    return (endHour * 60 + endMin) > (startHour * 60 + startMin)
  },
  { message: 'End time must be after start time', path: ['endTime'] }
)

// ============================================================================
// Result Types
// ============================================================================

type ActionResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: string
}

type MeetingWithAttendees = Meeting & {
  attendees?: MeetingAttendee[]
}

// ============================================================================
// Meeting CRUD Operations
// ============================================================================

/**
 * Create a new meeting with optional attendees
 */
export async function createMeeting(
  input: z.infer<typeof createMeetingSchema>
): Promise<ActionResult<MeetingWithAttendees>> {
  try {
    // Validate input
    const validated = createMeetingSchema.parse(input)

    // Check for conflicts with existing meetings
    const conflictCheck = await checkMeetingConflict(
      validated.organizerId,
      validated.startTime,
      validated.endTime
    )

    if (conflictCheck.hasConflict) {
      return { success: false, error: 'Meeting conflict detected with existing meeting' }
    }

    const now = new Date()
    const meetingId = nanoid()

    // Create the meeting
    const [meeting] = await db.insert(meetings).values({
      id: meetingId,
      title: validated.title,
      description: validated.description ?? null,
      startTime: validated.startTime,
      endTime: validated.endTime,
      location: validated.location ?? null,
      meetingUrl: validated.meetingUrl ?? null,
      organizerId: validated.organizerId,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    }).returning()

    // Add attendees if provided
    let attendees: MeetingAttendee[] = []
    if (validated.attendees && validated.attendees.length > 0) {
      attendees = await db.insert(meetingAttendees).values(
        validated.attendees.map((att) => ({
          id: nanoid(),
          meetingId,
          email: att.email,
          name: att.name,
          status: 'pending' as AttendeeStatus,
          respondedAt: null,
          createdAt: now,
        }))
      ).returning()
    }

    return {
      success: true,
      data: { ...meeting, attendees },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create meeting' }
  }
}

/**
 * Get meetings with optional filters
 */
export async function getMeetings(filters: {
  organizerId?: string
  startDate?: Date
  endDate?: Date
  status?: MeetingStatus
}): Promise<ActionResult<Meeting[]>> {
  try {
    const conditions = []

    if (filters.organizerId) {
      conditions.push(eq(meetings.organizerId, filters.organizerId))
    }
    if (filters.startDate) {
      conditions.push(gte(meetings.startTime, filters.startDate))
    }
    if (filters.endDate) {
      conditions.push(lte(meetings.startTime, filters.endDate))
    }
    if (filters.status) {
      conditions.push(eq(meetings.status, filters.status))
    }

    let query = db.select().from(meetings)

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    const results = await query.orderBy(asc(meetings.startTime))

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch meetings' }
  }
}

/**
 * Get a single meeting by ID with attendees
 */
export async function getMeetingById(
  meetingId: string
): Promise<ActionResult<MeetingWithAttendees>> {
  try {
    const [meeting] = await db.select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))

    if (!meeting) {
      return { success: false, error: 'Meeting not found' }
    }

    const attendees = await db.select()
      .from(meetingAttendees)
      .where(eq(meetingAttendees.meetingId, meetingId))

    return {
      success: true,
      data: { ...meeting, attendees },
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch meeting' }
  }
}

/**
 * Update a meeting
 */
export async function updateMeeting(
  meetingId: string,
  input: z.infer<typeof updateMeetingSchema>
): Promise<ActionResult<Meeting>> {
  try {
    // Validate input
    const validated = updateMeetingSchema.parse(input)

    if (Object.keys(validated).length === 0) {
      return { success: false, error: 'No fields to update' }
    }

    // Get current meeting
    const [current] = await db.select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))

    if (!current) {
      return { success: false, error: 'Meeting not found' }
    }

    // Check if meeting can be updated
    if (current.status === 'cancelled') {
      return { success: false, error: 'Cannot update a cancelled meeting' }
    }

    // Validate status transitions
    if (validated.status) {
      const validTransitions: Record<MeetingStatus, MeetingStatus[]> = {
        scheduled: ['cancelled', 'completed'],
        cancelled: [],
        completed: [],
      }

      if (!validTransitions[current.status as MeetingStatus].includes(validated.status)) {
        return { success: false, error: 'Invalid status transition' }
      }
    }

    // Check for conflicts if times are changing
    if (validated.startTime || validated.endTime) {
      const newStartTime = validated.startTime || current.startTime
      const newEndTime = validated.endTime || current.endTime

      const conflictCheck = await checkMeetingConflict(
        current.organizerId,
        newStartTime,
        newEndTime,
        meetingId // Exclude current meeting from conflict check
      )

      if (conflictCheck.hasConflict) {
        return { success: false, error: 'Meeting conflict detected with existing meeting' }
      }
    }

    const now = new Date()

    const [updated] = await db.update(meetings)
      .set({
        ...validated,
        updatedAt: now,
      })
      .where(eq(meetings.id, meetingId))
      .returning()

    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update meeting' }
  }
}

/**
 * Cancel a meeting with optional reason
 */
export async function cancelMeeting(
  meetingId: string,
  options?: { reason?: string }
): Promise<ActionResult<Meeting>> {
  try {
    // Get current meeting
    const [current] = await db.select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))

    if (!current) {
      return { success: false, error: 'Meeting not found' }
    }

    if (current.status === 'cancelled') {
      return { success: false, error: 'Meeting is already cancelled' }
    }

    const now = new Date()

    // Update meeting status
    const [updated] = await db.update(meetings)
      .set({
        status: 'cancelled',
        description: options?.reason
          ? `${current.description || ''}\n\nCancellation reason: ${options.reason}`.trim()
          : current.description,
        updatedAt: now,
      })
      .where(eq(meetings.id, meetingId))
      .returning()

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to cancel meeting' }
  }
}

// ============================================================================
// Attendee Management
// ============================================================================

/**
 * Add an attendee to a meeting
 */
export async function addAttendee(
  meetingId: string,
  input: z.infer<typeof attendeeSchema>
): Promise<ActionResult<MeetingAttendee>> {
  try {
    const validated = attendeeSchema.parse(input)

    // Check if meeting exists
    const [meeting] = await db.select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))

    if (!meeting) {
      return { success: false, error: 'Meeting not found' }
    }

    // Check if attendee already exists
    const [existing] = await db.select()
      .from(meetingAttendees)
      .where(and(
        eq(meetingAttendees.meetingId, meetingId),
        eq(meetingAttendees.email, validated.email)
      ))

    if (existing) {
      return { success: false, error: 'Attendee already added to this meeting' }
    }

    const now = new Date()

    const [attendee] = await db.insert(meetingAttendees).values({
      id: nanoid(),
      meetingId,
      email: validated.email,
      name: validated.name,
      status: 'pending',
      respondedAt: null,
      createdAt: now,
    }).returning()

    return { success: true, data: attendee }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to add attendee' }
  }
}

/**
 * Remove an attendee from a meeting
 */
export async function removeAttendee(
  meetingId: string,
  email: string
): Promise<ActionResult<{ removed: boolean }>> {
  try {
    // Check if attendee exists
    const [existing] = await db.select()
      .from(meetingAttendees)
      .where(and(
        eq(meetingAttendees.meetingId, meetingId),
        eq(meetingAttendees.email, email)
      ))

    if (!existing) {
      return { success: false, error: 'Attendee not found' }
    }

    await db.delete(meetingAttendees)
      .where(and(
        eq(meetingAttendees.meetingId, meetingId),
        eq(meetingAttendees.email, email)
      ))

    return { success: true, data: { removed: true } }
  } catch (error) {
    return { success: false, error: 'Failed to remove attendee' }
  }
}

/**
 * Update attendee status (accept/decline/tentative)
 */
export async function updateAttendeeStatus(
  meetingId: string,
  email: string,
  status: AttendeeStatus
): Promise<ActionResult<MeetingAttendee>> {
  try {
    // Validate status
    const validStatuses: AttendeeStatus[] = ['pending', 'accepted', 'declined', 'tentative']
    if (!validStatuses.includes(status)) {
      return { success: false, error: 'Invalid status value' }
    }

    // Check if attendee exists
    const [existing] = await db.select()
      .from(meetingAttendees)
      .where(and(
        eq(meetingAttendees.meetingId, meetingId),
        eq(meetingAttendees.email, email)
      ))

    if (!existing) {
      return { success: false, error: 'Attendee not found' }
    }

    const now = new Date()

    const [updated] = await db.update(meetingAttendees)
      .set({
        status,
        respondedAt: status !== 'pending' ? now : null,
      })
      .where(and(
        eq(meetingAttendees.meetingId, meetingId),
        eq(meetingAttendees.email, email)
      ))
      .returning()

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to update attendee status' }
  }
}

// ============================================================================
// Availability Management
// ============================================================================

/**
 * Set availability slots for a user (replaces existing)
 */
export async function setAvailability(
  userId: string,
  slots: z.infer<typeof availabilitySlotSchema>[]
): Promise<ActionResult<AvailabilitySlot[]>> {
  try {
    // Validate all slots
    for (const slot of slots) {
      const result = availabilitySlotSchema.safeParse(slot)
      if (!result.success) {
        return { success: false, error: result.error.errors[0].message }
      }
    }

    // Delete existing availability for user
    await db.delete(availabilitySlots)
      .where(eq(availabilitySlots.userId, userId))

    if (slots.length === 0) {
      return { success: true, data: [] }
    }

    const now = new Date()

    // Insert new availability slots
    const created = await db.insert(availabilitySlots).values(
      slots.map((slot) => ({
        id: nanoid(),
        userId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: true,
        createdAt: now,
        updatedAt: now,
      }))
    ).returning()

    return { success: true, data: created }
  } catch (error) {
    return { success: false, error: 'Failed to set availability' }
  }
}

/**
 * Get availability slots for a user
 */
export async function getAvailability(
  userId: string
): Promise<ActionResult<AvailabilitySlot[]>> {
  try {
    const slots = await db.select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.userId, userId))

    return { success: true, data: slots }
  } catch (error) {
    return { success: false, error: 'Failed to get availability' }
  }
}

/**
 * Find available time slots for scheduling
 */
export async function findAvailableSlots(params: {
  organizerId: string
  date: Date
  duration: number // in minutes
}): Promise<ActionResult<{ startTime: Date; endTime: Date }[]>> {
  try {
    const { organizerId, date, duration } = params
    const dayOfWeek = date.getDay()

    // Get availability for this day
    const availabilityForDay = await db.select()
      .from(availabilitySlots)
      .where(and(
        eq(availabilitySlots.userId, organizerId),
        eq(availabilitySlots.dayOfWeek, dayOfWeek),
        eq(availabilitySlots.isAvailable, true)
      ))

    if (availabilityForDay.length === 0) {
      return { success: true, data: [] }
    }

    // Get existing meetings for this day
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const existingMeetings = await db.select()
      .from(meetings)
      .where(and(
        eq(meetings.organizerId, organizerId),
        eq(meetings.status, 'scheduled'),
        gte(meetings.startTime, dayStart),
        lte(meetings.startTime, dayEnd)
      ))

    // Generate available slots
    const slots: { startTime: Date; endTime: Date }[] = []

    for (const avail of availabilityForDay) {
      const [startHour, startMin] = avail.startTime.split(':').map(Number)
      const [endHour, endMin] = avail.endTime.split(':').map(Number)

      let currentTime = new Date(date)
      currentTime.setHours(startHour, startMin, 0, 0)

      const windowEnd = new Date(date)
      windowEnd.setHours(endHour, endMin, 0, 0)

      while (currentTime < windowEnd) {
        const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000)

        // Don't exceed availability window
        if (slotEnd > windowEnd) {
          break
        }

        // Check for conflicts
        const hasConflict = existingMeetings.some((meeting) => {
          return (
            currentTime < meeting.endTime &&
            slotEnd > meeting.startTime
          )
        })

        if (!hasConflict) {
          slots.push({
            startTime: new Date(currentTime),
            endTime: new Date(slotEnd),
          })
        }

        // Move to next slot
        currentTime = new Date(currentTime.getTime() + duration * 60 * 1000)
      }
    }

    return { success: true, data: slots }
  } catch (error) {
    return { success: false, error: 'Failed to find available slots' }
  }
}

// ============================================================================
// Upcoming Meetings
// ============================================================================

/**
 * Get upcoming meetings
 */
export async function getUpcomingMeetings(params: {
  organizerId?: string
  limit?: number
}): Promise<ActionResult<Meeting[]>> {
  try {
    const { organizerId, limit = 10 } = params
    const now = new Date()

    const conditions = [
      eq(meetings.status, 'scheduled'),
      gte(meetings.startTime, now),
    ]

    if (organizerId) {
      conditions.push(eq(meetings.organizerId, organizerId))
    }

    const results = await db.select()
      .from(meetings)
      .where(and(...conditions))
      .orderBy(asc(meetings.startTime))
      .limit(limit)

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to get upcoming meetings' }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check for meeting conflicts
 */
async function checkMeetingConflict(
  organizerId: string,
  startTime: Date,
  endTime: Date,
  excludeMeetingId?: string
): Promise<{ hasConflict: boolean; conflictingMeetings?: Meeting[] }> {
  try {
    const conditions = [
      eq(meetings.organizerId, organizerId),
      eq(meetings.status, 'scheduled'),
      // Overlap check: new meeting overlaps if it starts before existing ends
      // AND ends after existing starts
      sql`${meetings.startTime} < ${endTime}`,
      sql`${meetings.endTime} > ${startTime}`,
    ]

    if (excludeMeetingId) {
      conditions.push(sql`${meetings.id} != ${excludeMeetingId}`)
    }

    const conflicts = await db.select()
      .from(meetings)
      .where(and(...conditions))

    return {
      hasConflict: conflicts.length > 0,
      conflictingMeetings: conflicts,
    }
  } catch (error) {
    return { hasConflict: false }
  }
}
