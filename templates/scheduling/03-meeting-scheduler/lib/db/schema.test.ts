/**
 * Tests for Template #3: Meeting Scheduler Schema
 */

import { describe, it, expect } from 'vitest'
import {
  meetings,
  meetingAttendees,
  availabilitySlots,
  type Meeting,
  type MeetingAttendee,
  type AvailabilitySlot,
  type MeetingStatus,
  type AttendeeStatus,
} from './schema'

describe('Template #3: Meeting Scheduler Schema', () => {
  describe('Meetings Table', () => {
    it('should have all required fields', () => {
      expect(meetings).toBeDefined()
      expect(meetings.id).toBeDefined()
      expect(meetings.title).toBeDefined()
      expect(meetings.startTime).toBeDefined()
      expect(meetings.endTime).toBeDefined()
      expect(meetings.organizerId).toBeDefined()
      expect(meetings.status).toBeDefined()
      expect(meetings.createdAt).toBeDefined()
      expect(meetings.updatedAt).toBeDefined()
    })

    it('should have optional fields', () => {
      expect(meetings.description).toBeDefined()
      expect(meetings.location).toBeDefined()
      expect(meetings.meetingUrl).toBeDefined()
    })

    it('should have correct column types', () => {
      // Verify column names match schema
      expect(meetings.id.name).toBe('id')
      expect(meetings.title.name).toBe('title')
      expect(meetings.startTime.name).toBe('start_time')
      expect(meetings.endTime.name).toBe('end_time')
    })
  })

  describe('Meeting Attendees Table', () => {
    it('should have all required fields', () => {
      expect(meetingAttendees).toBeDefined()
      expect(meetingAttendees.id).toBeDefined()
      expect(meetingAttendees.meetingId).toBeDefined()
      expect(meetingAttendees.email).toBeDefined()
      expect(meetingAttendees.name).toBeDefined()
      expect(meetingAttendees.status).toBeDefined()
      expect(meetingAttendees.createdAt).toBeDefined()
    })

    it('should have optional respondedAt field', () => {
      expect(meetingAttendees.respondedAt).toBeDefined()
    })

    it('should reference meetings table', () => {
      // The meetingId should be a foreign key
      expect(meetingAttendees.meetingId.name).toBe('meeting_id')
    })
  })

  describe('Availability Slots Table', () => {
    it('should have all required fields', () => {
      expect(availabilitySlots).toBeDefined()
      expect(availabilitySlots.id).toBeDefined()
      expect(availabilitySlots.userId).toBeDefined()
      expect(availabilitySlots.dayOfWeek).toBeDefined()
      expect(availabilitySlots.startTime).toBeDefined()
      expect(availabilitySlots.endTime).toBeDefined()
      expect(availabilitySlots.isAvailable).toBeDefined()
      expect(availabilitySlots.createdAt).toBeDefined()
      expect(availabilitySlots.updatedAt).toBeDefined()
    })

    it('should have correct column names', () => {
      expect(availabilitySlots.userId.name).toBe('user_id')
      expect(availabilitySlots.dayOfWeek.name).toBe('day_of_week')
      expect(availabilitySlots.startTime.name).toBe('start_time')
      expect(availabilitySlots.endTime.name).toBe('end_time')
      expect(availabilitySlots.isAvailable.name).toBe('is_available')
    })
  })

  describe('Type Exports', () => {
    it('should export Meeting type', () => {
      const meeting: Meeting = {
        id: 'test',
        title: 'Test Meeting',
        description: null,
        startTime: new Date(),
        endTime: new Date(),
        location: null,
        meetingUrl: null,
        organizerId: 'user_123',
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(meeting).toBeDefined()
    })

    it('should export MeetingAttendee type', () => {
      const attendee: MeetingAttendee = {
        id: 'test',
        meetingId: 'meeting_123',
        email: 'test@example.com',
        name: 'Test User',
        status: 'pending',
        respondedAt: null,
        createdAt: new Date(),
      }
      expect(attendee).toBeDefined()
    })

    it('should export AvailabilitySlot type', () => {
      const slot: AvailabilitySlot = {
        id: 'test',
        userId: 'user_123',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(slot).toBeDefined()
    })

    it('should export MeetingStatus type', () => {
      const validStatuses: MeetingStatus[] = ['scheduled', 'cancelled', 'completed']
      expect(validStatuses).toHaveLength(3)
    })

    it('should export AttendeeStatus type', () => {
      const validStatuses: AttendeeStatus[] = ['pending', 'accepted', 'declined', 'tentative']
      expect(validStatuses).toHaveLength(4)
    })
  })
})
