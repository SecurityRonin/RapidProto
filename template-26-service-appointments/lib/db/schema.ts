/**
 * Template #26: Service Appointment Booking
 *
 * Database schema for appointment scheduling system
 * Universal applicability: Salons, medical, auto repair, home services
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// Service providers (stylists, doctors, technicians, etc.)
export const providers = sqliteTable('providers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  specialties: text('specialties'), // JSON array: ["haircut", "color", "styling"]
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Services offered (haircut, checkup, oil change, etc.)
export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  duration: integer('duration').notNull(), // minutes
  price: real('price').notNull(),
  requiresDeposit: integer('requires_deposit', { mode: 'boolean' }).default(false),
  depositAmount: real('deposit_amount'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  category: text('category'), // For grouping services
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Provider availability schedules
export const availability = sqliteTable('availability', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull().references(() => providers.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 6=Saturday
  startTime: text('start_time').notNull(), // HH:MM format
  endTime: text('end_time').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
})

// Appointments
export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').notNull().references(() => providers.id),
  serviceId: text('service_id').notNull().references(() => services.id),

  // Client information
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  clientPhone: text('client_phone').notNull(),
  clientNotes: text('client_notes'),

  // Appointment details
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }).notNull(),
  duration: integer('duration').notNull(), // minutes
  status: text('status').notNull(), // pending, confirmed, completed, cancelled, no_show

  // Payment
  price: real('price').notNull(),
  depositPaid: integer('deposit_paid', { mode: 'boolean' }).default(false),
  depositAmount: real('deposit_amount'),
  paymentStatus: text('payment_status'), // unpaid, deposit, paid, refunded

  // Reminders
  reminderSent: integer('reminder_sent', { mode: 'boolean' }).default(false),
  reminderSentAt: integer('reminder_sent_at', { mode: 'timestamp' }),

  // Recurring appointments
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurrenceRule: text('recurrence_rule'), // JSON: {frequency: "weekly", count: 10}
  parentAppointmentId: text('parent_appointment_id'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Booking settings (business configuration)
export const bookingSettings = sqliteTable('booking_settings', {
  id: text('id').primaryKey(),
  businessName: text('business_name').notNull(),
  timezone: text('timezone').notNull().default('America/New_York'),

  // Booking window
  advanceBookingDays: integer('advance_booking_days').default(30), // How far in advance clients can book
  minNoticeHours: integer('min_notice_hours').default(2), // Minimum notice required

  // Cancellation policy
  cancellationHours: integer('cancellation_hours').default(24), // Hours before appointment
  cancelLatePolicy: text('cancel_late_policy'), // What happens if cancelled late

  // Reminders
  sendReminders: integer('send_reminders', { mode: 'boolean' }).default(true),
  reminderHours: integer('reminder_hours').default(24), // Hours before appointment

  // No-show tracking
  trackNoShows: integer('track_no_shows', { mode: 'boolean' }).default(true),
  noShowThreshold: integer('no_show_threshold').default(2), // Block after X no-shows

  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// No-show tracking
export const noShows = sqliteTable('no_shows', {
  id: text('id').primaryKey(),
  appointmentId: text('appointment_id').notNull().references(() => appointments.id),
  clientEmail: text('client_email').notNull(),
  occurredAt: integer('occurred_at', { mode: 'timestamp' }).notNull(),
  notes: text('notes'),
})

// Block-out times (holidays, breaks, closures)
export const blockouts = sqliteTable('blockouts', {
  id: text('id').primaryKey(),
  providerId: text('provider_id').references(() => providers.id), // null = all providers
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  reason: text('reason').notNull(), // "Holiday", "Lunch Break", "Training", etc.
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type Provider = typeof providers.$inferSelect
export type Service = typeof services.$inferSelect
export type Availability = typeof availability.$inferSelect
export type Appointment = typeof appointments.$inferSelect
export type BookingSettings = typeof bookingSettings.$inferSelect
export type NoShow = typeof noShows.$inferSelect
export type Blockout = typeof blockouts.$inferSelect
