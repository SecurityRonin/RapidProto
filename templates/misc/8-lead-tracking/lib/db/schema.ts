/**
 * Template #8: Lead Tracking
 * Database schema for sales lead management
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

/**
 * Lead Sources
 * Track where leads come from (can be tied to marketing campaigns)
 */
export const leadSources = sqliteTable('lead_sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  campaignId: text('campaign_id'),
})

export type LeadSource = typeof leadSources.$inferSelect
export type NewLeadSource = typeof leadSources.$inferInsert

/**
 * Leads
 * Core lead tracking table with sales pipeline status
 */
export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  source: text('source', { enum: ['web', 'referral', 'event', 'cold'] }).notNull(),
  status: text('status', { enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] }).notNull().default('new'),
  value: real('value'), // Potential deal value
  assignedTo: text('assigned_to'),
  notes: text('notes'),
  lastContactedAt: integer('last_contacted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert

/**
 * Lead Activities
 * Track all interactions and follow-ups with leads
 */
export const leadActivities = sqliteTable('lead_activities', {
  id: text('id').primaryKey(),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['call', 'email', 'meeting', 'note'] }).notNull(),
  description: text('description').notNull(),
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  userId: text('user_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type LeadActivity = typeof leadActivities.$inferSelect
export type NewLeadActivity = typeof leadActivities.$inferInsert

// Keeping for backward compatibility (will be removed in future)
export const items = leads
export type Item = Lead
