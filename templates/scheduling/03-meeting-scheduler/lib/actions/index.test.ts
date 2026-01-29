/**
 * Tests for Template #3: Meeting Scheduler Actions
 * TDD: These tests are written FIRST, then implementation follows
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock dependencies before importing actions
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

// Import after mocking
import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  cancelMeeting,
  addAttendee,
  removeAttendee,
  updateAttendeeStatus,
  getAvailability,
  setAvailability,
  findAvailableSlots,
  getUpcomingMeetings,
  createMeetingSchema,
  updateMeetingSchema,
  attendeeSchema,
  availabilitySlotSchema,
} from './index'

// ============================================================================
// Test Helpers
// ============================================================================

const createMockMeeting = (overrides = {}) => ({
  id: 'meeting_123',
  title: 'Team Standup',
  description: 'Daily sync',
  startTime: new Date('2026-02-01T10:00:00Z'),
  endTime: new Date('2026-02-01T10:30:00Z'),
  location: 'Conference Room A',
  meetingUrl: null,
  organizerId: 'user_123',
  status: 'scheduled',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
})

const createMockAttendee = (overrides = {}) => ({
  id: 'attendee_123',
  meetingId: 'meeting_123',
  email: 'attendee@example.com',
  name: 'John Doe',
  status: 'pending',
  respondedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
})

const createMockAvailabilitySlot = (overrides = {}) => ({
  id: 'slot_123',
  userId: 'user_123',
  dayOfWeek: 1, // Monday
  startTime: '09:00',
  endTime: '17:00',
  isAvailable: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
})

// ============================================================================
// Schema Validation Tests
// ============================================================================

describe('Validation Schemas', () => {
  describe('createMeetingSchema', () => {
    it('should validate a valid meeting', () => {
      const validMeeting = {
        title: 'Team Meeting',
        startTime: new Date('2026-02-01T10:00:00Z'),
        endTime: new Date('2026-02-01T11:00:00Z'),
        organizerId: 'user_123',
      }

      const result = createMeetingSchema.safeParse(validMeeting)
      expect(result.success).toBe(true)
    })

    it('should require title', () => {
      const invalidMeeting = {
        startTime: new Date('2026-02-01T10:00:00Z'),
        endTime: new Date('2026-02-01T11:00:00Z'),
        organizerId: 'user_123',
      }

      const result = createMeetingSchema.safeParse(invalidMeeting)
      expect(result.success).toBe(false)
    })

    it('should require end time after start time', () => {
      const invalidMeeting = {
        title: 'Meeting',
        startTime: new Date('2026-02-01T11:00:00Z'),
        endTime: new Date('2026-02-01T10:00:00Z'), // Before start
        organizerId: 'user_123',
      }

      const result = createMeetingSchema.safeParse(invalidMeeting)
      expect(result.success).toBe(false)
    })

    it('should accept optional fields', () => {
      const meetingWithOptionals = {
        title: 'Meeting',
        description: 'A meeting description',
        startTime: new Date('2026-02-01T10:00:00Z'),
        endTime: new Date('2026-02-01T11:00:00Z'),
        location: 'Room 101',
        meetingUrl: 'https://zoom.us/j/123',
        organizerId: 'user_123',
        attendees: [
          { email: 'test@example.com', name: 'Test User' },
        ],
      }

      const result = createMeetingSchema.safeParse(meetingWithOptionals)
      expect(result.success).toBe(true)
    })

    it('should validate meeting URL format', () => {
      const invalidUrl = {
        title: 'Meeting',
        startTime: new Date('2026-02-01T10:00:00Z'),
        endTime: new Date('2026-02-01T11:00:00Z'),
        meetingUrl: 'not-a-url',
        organizerId: 'user_123',
      }

      const result = createMeetingSchema.safeParse(invalidUrl)
      expect(result.success).toBe(false)
    })
  })

  describe('attendeeSchema', () => {
    it('should validate valid attendee', () => {
      const validAttendee = {
        email: 'test@example.com',
        name: 'Test User',
      }

      const result = attendeeSchema.safeParse(validAttendee)
      expect(result.success).toBe(true)
    })

    it('should require valid email', () => {
      const invalidAttendee = {
        email: 'not-an-email',
        name: 'Test User',
      }

      const result = attendeeSchema.safeParse(invalidAttendee)
      expect(result.success).toBe(false)
    })

    it('should require name', () => {
      const invalidAttendee = {
        email: 'test@example.com',
        name: '',
      }

      const result = attendeeSchema.safeParse(invalidAttendee)
      expect(result.success).toBe(false)
    })
  })

  describe('availabilitySlotSchema', () => {
    it('should validate valid availability slot', () => {
      const validSlot = {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
      }

      const result = availabilitySlotSchema.safeParse(validSlot)
      expect(result.success).toBe(true)
    })

    it('should validate day of week range', () => {
      const invalidDay = {
        dayOfWeek: 7, // Invalid (0-6 only)
        startTime: '09:00',
        endTime: '17:00',
      }

      const result = availabilitySlotSchema.safeParse(invalidDay)
      expect(result.success).toBe(false)
    })

    it('should validate time format', () => {
      const invalidTime = {
        dayOfWeek: 1,
        startTime: '9:00', // Invalid format (needs leading zero)
        endTime: '17:00',
      }

      const result = availabilitySlotSchema.safeParse(invalidTime)
      expect(result.success).toBe(false)
    })

    it('should require end time after start time', () => {
      const invalidSlot = {
        dayOfWeek: 1,
        startTime: '17:00',
        endTime: '09:00', // Before start
      }

      const result = availabilitySlotSchema.safeParse(invalidSlot)
      expect(result.success).toBe(false)
    })
  })
})

// ============================================================================
// Meeting CRUD Tests
// ============================================================================

describe('Meeting CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createMeeting', () => {
    it('should create a meeting successfully', async () => {
      const mockMeeting = createMockMeeting()

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockMeeting]),
        }),
      })

      const result = await createMeeting({
        title: 'Team Standup',
        description: 'Daily sync',
        startTime: new Date('2026-02-01T10:00:00Z'),
        endTime: new Date('2026-02-01T10:30:00Z'),
        location: 'Conference Room A',
        organizerId: 'user_123',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.title).toBe('Team Standup')
    })

    it('should create meeting with attendees', async () => {
      const mockMeeting = createMockMeeting()
      const mockAttendee = createMockAttendee()

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn()
            .mockResolvedValueOnce([mockMeeting]) // First call for meeting
            .mockResolvedValueOnce([mockAttendee]), // Second call for attendee
        }),
      })

      const result = await createMeeting({
        title: 'Team Standup',
        startTime: new Date('2026-02-01T10:00:00Z'),
        endTime: new Date('2026-02-01T10:30:00Z'),
        organizerId: 'user_123',
        attendees: [
          { email: 'attendee@example.com', name: 'John Doe' },
        ],
      })

      expect(result.success).toBe(true)
      expect(result.data?.attendees).toBeDefined()
      expect(result.data?.attendees?.length).toBe(1)
    })

    it('should fail with invalid data', async () => {
      const result = await createMeeting({
        title: '', // Empty title
        startTime: new Date('2026-02-01T10:00:00Z'),
        endTime: new Date('2026-02-01T10:30:00Z'),
        organizerId: 'user_123',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should fail when end time is before start time', async () => {
      const result = await createMeeting({
        title: 'Meeting',
        startTime: new Date('2026-02-01T11:00:00Z'),
        endTime: new Date('2026-02-01T10:00:00Z'), // Before start
        organizerId: 'user_123',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('end')
    })
  })

  describe('getMeetings', () => {
    it('should return all meetings', async () => {
      const mockMeetings = [createMockMeeting(), createMockMeeting({ id: 'meeting_456' })]

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockMeetings),
          }),
          orderBy: vi.fn().mockResolvedValue(mockMeetings),
        }),
      })

      const result = await getMeetings({})

      expect(result.success).toBe(true)
      expect(result.data?.length).toBe(2)
    })

    it('should filter by date range', async () => {
      const mockMeetings = [createMockMeeting()]

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockMeetings),
          }),
        }),
      })

      const result = await getMeetings({
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-28'),
      })

      expect(result.success).toBe(true)
    })

    it('should filter by status', async () => {
      const mockMeetings = [createMockMeeting({ status: 'scheduled' })]

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockMeetings),
          }),
        }),
      })

      const result = await getMeetings({ status: 'scheduled' })

      expect(result.success).toBe(true)
      expect(result.data?.[0].status).toBe('scheduled')
    })

    it('should filter by organizer', async () => {
      const mockMeetings = [createMockMeeting({ organizerId: 'user_123' })]

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockMeetings),
          }),
        }),
      })

      const result = await getMeetings({ organizerId: 'user_123' })

      expect(result.success).toBe(true)
    })
  })

  describe('getMeetingById', () => {
    it('should return meeting with attendees', async () => {
      const mockMeeting = createMockMeeting()
      const mockAttendees = [createMockAttendee()]

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn()
            .mockResolvedValueOnce([mockMeeting])
            .mockResolvedValueOnce(mockAttendees),
        }),
      })

      const result = await getMeetingById('meeting_123')

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('meeting_123')
      expect(result.data?.attendees).toBeDefined()
    })

    it('should return error for non-existent meeting', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await getMeetingById('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('updateMeeting', () => {
    it('should update meeting fields', async () => {
      const mockMeeting = createMockMeeting({ title: 'Updated Title' })

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([createMockMeeting()]),
        }),
      })

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockMeeting]),
          }),
        }),
      })

      const result = await updateMeeting('meeting_123', {
        title: 'Updated Title',
      })

      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('Updated Title')
    })

    it('should fail for non-existent meeting', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await updateMeeting('nonexistent', { title: 'New Title' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should validate update data', async () => {
      const result = await updateMeeting('meeting_123', {
        title: '', // Invalid empty title
      })

      expect(result.success).toBe(false)
    })

    it('should not allow updating cancelled meeting', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([createMockMeeting({ status: 'cancelled' })]),
        }),
      })

      const result = await updateMeeting('meeting_123', { title: 'New Title' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('cancelled')
    })
  })

  describe('cancelMeeting', () => {
    it('should cancel a meeting', async () => {
      const mockMeeting = createMockMeeting()

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMeeting]),
        }),
      })

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockMeeting, status: 'cancelled' }]),
          }),
        }),
      })

      const result = await cancelMeeting('meeting_123')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('cancelled')
    })

    it('should cancel with reason', async () => {
      const mockMeeting = createMockMeeting()

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMeeting]),
        }),
      })

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockMeeting, status: 'cancelled' }]),
          }),
        }),
      })

      const result = await cancelMeeting('meeting_123', { reason: 'Schedule conflict' })

      expect(result.success).toBe(true)
    })

    it('should not cancel already cancelled meeting', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([createMockMeeting({ status: 'cancelled' })]),
        }),
      })

      const result = await cancelMeeting('meeting_123')

      expect(result.success).toBe(false)
      expect(result.error).toContain('already cancelled')
    })
  })
})

// ============================================================================
// Attendee Management Tests
// ============================================================================

describe('Attendee Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addAttendee', () => {
    it('should add attendee to meeting', async () => {
      const mockMeeting = createMockMeeting()
      const mockAttendee = createMockAttendee()

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn()
            .mockResolvedValueOnce([mockMeeting]) // Meeting exists check
            .mockResolvedValueOnce([]), // Attendee doesn't exist check
        }),
      })

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockAttendee]),
        }),
      })

      const result = await addAttendee('meeting_123', {
        email: 'attendee@example.com',
        name: 'John Doe',
      })

      expect(result.success).toBe(true)
      expect(result.data?.email).toBe('attendee@example.com')
    })

    it('should fail if meeting not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await addAttendee('nonexistent', {
        email: 'attendee@example.com',
        name: 'John Doe',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should fail if attendee already exists', async () => {
      const mockMeeting = createMockMeeting()
      const mockAttendee = createMockAttendee()

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn()
            .mockResolvedValueOnce([mockMeeting])
            .mockResolvedValueOnce([mockAttendee]), // Already exists
        }),
      })

      const result = await addAttendee('meeting_123', {
        email: 'attendee@example.com',
        name: 'John Doe',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('already')
    })
  })

  describe('removeAttendee', () => {
    it('should remove attendee from meeting', async () => {
      const mockAttendee = createMockAttendee()

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockAttendee]),
        }),
      })

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowsAffected: 1 }),
      })

      const result = await removeAttendee('meeting_123', 'attendee@example.com')

      expect(result.success).toBe(true)
    })

    it('should fail if attendee not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await removeAttendee('meeting_123', 'nonexistent@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('updateAttendeeStatus', () => {
    it('should update status to accepted', async () => {
      const mockAttendee = createMockAttendee()

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockAttendee]),
        }),
      })

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockAttendee, status: 'accepted' }]),
          }),
        }),
      })

      const result = await updateAttendeeStatus('meeting_123', 'attendee@example.com', 'accepted')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('accepted')
    })

    it('should update status to declined', async () => {
      const mockAttendee = createMockAttendee()

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockAttendee]),
        }),
      })

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockAttendee, status: 'declined' }]),
          }),
        }),
      })

      const result = await updateAttendeeStatus('meeting_123', 'attendee@example.com', 'declined')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('declined')
    })

    it('should update status to tentative', async () => {
      const mockAttendee = createMockAttendee()

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockAttendee]),
        }),
      })

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockAttendee, status: 'tentative' }]),
          }),
        }),
      })

      const result = await updateAttendeeStatus('meeting_123', 'attendee@example.com', 'tentative')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('tentative')
    })

    it('should fail for invalid status', async () => {
      const result = await updateAttendeeStatus('meeting_123', 'attendee@example.com', 'invalid' as any)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid')
    })

    it('should set respondedAt timestamp', async () => {
      const mockAttendee = createMockAttendee()

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockAttendee]),
        }),
      })

      const respondedAt = new Date()
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...mockAttendee,
              status: 'accepted',
              respondedAt,
            }]),
          }),
        }),
      })

      const result = await updateAttendeeStatus('meeting_123', 'attendee@example.com', 'accepted')

      expect(result.success).toBe(true)
      expect(result.data?.respondedAt).toBeDefined()
    })
  })
})

// ============================================================================
// Availability Management Tests
// ============================================================================

describe('Availability Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setAvailability', () => {
    it('should set availability slots', async () => {
      const mockSlots = [
        createMockAvailabilitySlot({ dayOfWeek: 1 }),
        createMockAvailabilitySlot({ dayOfWeek: 2, id: 'slot_456' }),
      ]

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowsAffected: 0 }),
      })

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockSlots),
        }),
      })

      const result = await setAvailability('user_123', [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      ])

      expect(result.success).toBe(true)
      expect(result.data?.length).toBe(2)
    })

    it('should replace existing availability', async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowsAffected: 3 }),
      })

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([createMockAvailabilitySlot()]),
        }),
      })

      const result = await setAvailability('user_123', [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      ])

      expect(result.success).toBe(true)
      expect(mockDb.delete).toHaveBeenCalled()
    })

    it('should fail with invalid time format', async () => {
      const result = await setAvailability('user_123', [
        { dayOfWeek: 1, startTime: '9:00', endTime: '17:00' }, // Invalid format
      ])

      expect(result.success).toBe(false)
    })

    it('should fail when end time is before start time', async () => {
      const result = await setAvailability('user_123', [
        { dayOfWeek: 1, startTime: '17:00', endTime: '09:00' },
      ])

      expect(result.success).toBe(false)
    })
  })

  describe('getAvailability', () => {
    it('should get availability for user', async () => {
      const mockSlots = [
        createMockAvailabilitySlot({ dayOfWeek: 1 }),
        createMockAvailabilitySlot({ dayOfWeek: 2, id: 'slot_456' }),
      ]

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockSlots),
        }),
      })

      const result = await getAvailability('user_123')

      expect(result.success).toBe(true)
      expect(result.data?.length).toBe(2)
    })

    it('should return empty array if no availability set', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await getAvailability('user_123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe('findAvailableSlots', () => {
    it('should find available time slots', async () => {
      const mockAvailability = [
        createMockAvailabilitySlot({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }),
      ]

      // Mock availability query
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn()
            .mockResolvedValueOnce(mockAvailability) // Availability slots
            .mockResolvedValueOnce([]), // Existing meetings (none)
        }),
      })

      const result = await findAvailableSlots({
        organizerId: 'user_123',
        date: new Date('2026-02-02'), // A Monday
        duration: 30, // 30 minutes
      })

      expect(result.success).toBe(true)
      expect(result.data?.length).toBeGreaterThan(0)
    })

    it('should exclude conflicting time slots', async () => {
      const mockAvailability = [
        createMockAvailabilitySlot({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' }),
      ]

      const existingMeeting = createMockMeeting({
        startTime: new Date('2026-02-02T09:00:00Z'),
        endTime: new Date('2026-02-02T10:00:00Z'),
      })

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn()
            .mockResolvedValueOnce(mockAvailability)
            .mockResolvedValueOnce([existingMeeting]),
        }),
      })

      const result = await findAvailableSlots({
        organizerId: 'user_123',
        date: new Date('2026-02-02'),
        duration: 30,
      })

      expect(result.success).toBe(true)
      // Should not include 9:00-9:30 or 9:30-10:00 slots
      const slots = result.data || []
      const conflictingSlots = slots.filter(slot => {
        const slotTime = new Date(slot.startTime)
        return slotTime.getUTCHours() === 9 && slotTime.getUTCMinutes() < 60
      })
      expect(conflictingSlots.length).toBe(0)
    })

    it('should return empty array if no availability', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await findAvailableSlots({
        organizerId: 'user_123',
        date: new Date('2026-02-01'), // A Saturday with no availability
        duration: 30,
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it('should handle duration properly', async () => {
      const mockAvailability = [
        createMockAvailabilitySlot({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }),
      ]

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn()
            .mockResolvedValueOnce(mockAvailability)
            .mockResolvedValueOnce([]),
        }),
      })

      const result = await findAvailableSlots({
        organizerId: 'user_123',
        date: new Date('2026-02-02'),
        duration: 30,
      })

      expect(result.success).toBe(true)
      // Should have 2 slots: 9:00-9:30 and 9:30-10:00
      expect(result.data?.length).toBe(2)
    })
  })
})

// ============================================================================
// Conflict Detection Tests
// ============================================================================

describe('Conflict Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect overlapping meetings', async () => {
    const existingMeeting = createMockMeeting({
      startTime: new Date('2026-02-01T10:00:00Z'),
      endTime: new Date('2026-02-01T11:00:00Z'),
    })

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([existingMeeting]),
      }),
    })

    // Attempt to create overlapping meeting
    const result = await createMeeting({
      title: 'Overlapping Meeting',
      startTime: new Date('2026-02-01T10:30:00Z'),
      endTime: new Date('2026-02-01T11:30:00Z'),
      organizerId: 'user_123',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('conflict')
  })

  it('should allow back-to-back meetings', async () => {
    const existingMeeting = createMockMeeting({
      startTime: new Date('2026-02-01T10:00:00Z'),
      endTime: new Date('2026-02-01T11:00:00Z'),
    })

    const newMeeting = createMockMeeting({
      id: 'meeting_456',
      startTime: new Date('2026-02-01T11:00:00Z'),
      endTime: new Date('2026-02-01T12:00:00Z'),
    })

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([existingMeeting]),
      }),
    })

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newMeeting]),
      }),
    })

    const result = await createMeeting({
      title: 'Back-to-back Meeting',
      startTime: new Date('2026-02-01T11:00:00Z'), // Starts exactly when previous ends
      endTime: new Date('2026-02-01T12:00:00Z'),
      organizerId: 'user_123',
    })

    expect(result.success).toBe(true)
  })

  it('should detect meeting fully contained within another', async () => {
    const existingMeeting = createMockMeeting({
      startTime: new Date('2026-02-01T09:00:00Z'),
      endTime: new Date('2026-02-01T12:00:00Z'),
    })

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([existingMeeting]),
      }),
    })

    const result = await createMeeting({
      title: 'Contained Meeting',
      startTime: new Date('2026-02-01T10:00:00Z'),
      endTime: new Date('2026-02-01T11:00:00Z'),
      organizerId: 'user_123',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('conflict')
  })
})

// ============================================================================
// Status Transition Tests
// ============================================================================

describe('Status Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow scheduled -> cancelled', async () => {
    const mockMeeting = createMockMeeting({ status: 'scheduled' })

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockMeeting]),
      }),
    })

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ ...mockMeeting, status: 'cancelled' }]),
        }),
      }),
    })

    const result = await cancelMeeting('meeting_123')

    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('cancelled')
  })

  it('should allow scheduled -> completed', async () => {
    const pastMeeting = createMockMeeting({
      status: 'scheduled',
      startTime: new Date('2026-01-01T10:00:00Z'),
      endTime: new Date('2026-01-01T11:00:00Z'),
    })

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([pastMeeting]),
      }),
    })

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ ...pastMeeting, status: 'completed' }]),
        }),
      }),
    })

    const result = await updateMeeting('meeting_123', { status: 'completed' })

    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('completed')
  })

  it('should not allow completed -> scheduled', async () => {
    const completedMeeting = createMockMeeting({ status: 'completed' })

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([completedMeeting]),
      }),
    })

    const result = await updateMeeting('meeting_123', { status: 'scheduled' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid status transition')
  })

  it('should not allow cancelled -> completed', async () => {
    const cancelledMeeting = createMockMeeting({ status: 'cancelled' })

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([cancelledMeeting]),
      }),
    })

    const result = await updateMeeting('meeting_123', { status: 'completed' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid status transition')
  })
})

// ============================================================================
// Upcoming Meetings Tests
// ============================================================================

describe('getUpcomingMeetings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return next N meetings', async () => {
    const futureMeetings = [
      createMockMeeting({ startTime: new Date('2026-02-01T10:00:00Z') }),
      createMockMeeting({ id: 'meeting_456', startTime: new Date('2026-02-02T10:00:00Z') }),
      createMockMeeting({ id: 'meeting_789', startTime: new Date('2026-02-03T10:00:00Z') }),
    ]

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(futureMeetings.slice(0, 2)),
          }),
        }),
      }),
    })

    const result = await getUpcomingMeetings({ limit: 2 })

    expect(result.success).toBe(true)
    expect(result.data?.length).toBe(2)
  })

  it('should filter by organizer', async () => {
    const futureMeetings = [
      createMockMeeting({ organizerId: 'user_123' }),
    ]

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(futureMeetings),
          }),
        }),
      }),
    })

    const result = await getUpcomingMeetings({ organizerId: 'user_123', limit: 5 })

    expect(result.success).toBe(true)
    expect(result.data?.[0].organizerId).toBe('user_123')
  })

  it('should only return scheduled meetings', async () => {
    const scheduledMeeting = createMockMeeting({ status: 'scheduled' })

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([scheduledMeeting]),
          }),
        }),
      }),
    })

    const result = await getUpcomingMeetings({ limit: 5 })

    expect(result.success).toBe(true)
    expect(result.data?.every(m => m.status === 'scheduled')).toBe(true)
  })

  it('should order by start time ascending', async () => {
    const meetings = [
      createMockMeeting({ id: 'meeting_1', startTime: new Date('2026-02-01T10:00:00Z') }),
      createMockMeeting({ id: 'meeting_2', startTime: new Date('2026-02-02T10:00:00Z') }),
    ]

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(meetings),
          }),
        }),
      }),
    })

    const result = await getUpcomingMeetings({ limit: 5 })

    expect(result.success).toBe(true)
    if (result.data && result.data.length >= 2) {
      expect(result.data[0].startTime < result.data[1].startTime).toBe(true)
    }
  })
})
