/**
 * Template #4: Time Tracker
 * Database schema for time tracking with projects, entries, and reporting
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

/**
 * Projects table
 * Organizes time entries by project/client
 */
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  clientName: text('client_name'),
  hourlyRate: real('hourly_rate'), // Default rate for billable entries
  budgetHours: real('budget_hours'), // Total budget in hours
  status: text('status', { enum: ['active', 'completed', 'archived'] })
    .notNull()
    .default('active'),
  userId: text('user_id').notNull(), // Multi-tenant support
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

/**
 * Time Entries table
 * Individual time records with timer support
 */
export const timeEntries = sqliteTable('time_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  taskDescription: text('task_description'),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }), // Null when timer is running
  duration: integer('duration'), // Duration in minutes, computed on stop
  billable: integer('billable', { mode: 'boolean' }).notNull().default(true),
  hourlyRate: real('hourly_rate'), // Override project rate if specified
  status: text('status', { enum: ['running', 'completed', 'approved'] })
    .notNull()
    .default('running'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

// Type exports
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

export type TimeEntry = typeof timeEntries.$inferSelect
export type NewTimeEntry = typeof timeEntries.$inferInsert

// Status type helpers
export type ProjectStatus = 'active' | 'completed' | 'archived'
export type TimeEntryStatus = 'running' | 'completed' | 'approved'
