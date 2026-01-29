/**
 * Template #3: Meeting Scheduler
 * Database schema for meeting scheduling system
 *
 * Supports: team meetings, 1:1s, recurring meetings, availability management
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// ============================================================================
// Meetings Table
// ============================================================================

/**
 * Core meeting entity
 * Supports one-time and recurring meetings with virtual/in-person locations
 */
export const meetings = sqliteTable('meetings', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),

  // Time information (stored as ISO timestamps for timezone support)
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),

  // Location details
  location: text('location'), // Physical location (optional)
  meetingUrl: text('meeting_url'), // Virtual meeting URL (optional)

  // Organizer
  organizerId: text('organizer_id').notNull(), // User ID (e.g., Clerk user ID)

  // Status
  status: text('status').notNull(), // 'scheduled' | 'cancelled' | 'completed'

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// ============================================================================
// Meeting Attendees Table
// ============================================================================

/**
 * Junction table for meeting attendees
 * Tracks invitation status for each attendee
 */
export const meetingAttendees = sqliteTable('meeting_attendees', {
  id: text('id').primaryKey(),
  meetingId: text('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull(), // 'pending' | 'accepted' | 'declined' | 'tentative'
  respondedAt: integer('responded_at', { mode: 'timestamp' }), // When they responded
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// ============================================================================
// Availability Slots Table
// ============================================================================

/**
 * User availability for scheduling
 * Defines recurring weekly availability windows
 */
export const availabilitySlots = sqliteTable('availability_slots', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // User ID

  // Weekly recurring pattern
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 6=Saturday

  // Time window (stored as HH:MM strings for timezone flexibility)
  startTime: text('start_time').notNull(), // HH:MM format
  endTime: text('end_time').notNull(), // HH:MM format

  // Active flag
  isAvailable: integer('is_available', { mode: 'boolean' }).notNull().default(true),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// ============================================================================
// Type Exports
// ============================================================================

export type Meeting = typeof meetings.$inferSelect
export type NewMeeting = typeof meetings.$inferInsert

export type MeetingAttendee = typeof meetingAttendees.$inferSelect
export type NewMeetingAttendee = typeof meetingAttendees.$inferInsert

export type AvailabilitySlot = typeof availabilitySlots.$inferSelect
export type NewAvailabilitySlot = typeof availabilitySlots.$inferInsert

// Status type unions
export type MeetingStatus = 'scheduled' | 'cancelled' | 'completed'
export type AttendeeStatus = 'pending' | 'accepted' | 'declined' | 'tentative'
