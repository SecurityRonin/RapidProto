/**
 * RapidProto Session Database Schema
 * Dual-mode support: Builder and Facilitator working together
 *
 * Session codes are 6-character alphanumeric IDs for easy sharing
 * Both roles see the same timer, different checklists
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Main sessions table
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // 6-char session code (e.g., 'ABC123')
  status: text('status', { enum: ['active', 'paused', 'completed'] })
    .notNull()
    .default('active'),

  // Phase tracking (builder's phases - facilitator has internal sub-phases)
  currentPhase: text('current_phase', { enum: ['discovery', 'build', 'demo'] })
    .notNull()
    .default('discovery'),
  phaseStartedAt: integer('phase_started_at', { mode: 'timestamp' }).notNull(),

  // Phase durations (minutes)
  discoveryDuration: integer('discovery_duration').notNull().default(10),
  buildDuration: integer('build_duration').notNull().default(30),
  demoDuration: integer('demo_duration').notNull().default(10),

  // Timer tracking
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  pausedAt: integer('paused_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  totalPausedTime: integer('total_paused_time').notNull().default(0), // milliseconds

  // Session metadata
  userId: text('user_id'), // Optional - for authenticated sessions
  sessionTitle: text('session_title'),

  // Dual-mode: track which roles have joined
  builderJoined: integer('builder_joined', { mode: 'boolean' }).notNull().default(true),
  facilitatorJoined: integer('facilitator_joined', { mode: 'boolean' }).notNull().default(false),

  // TTL
  expiresAt: integer('expires_at', { mode: 'timestamp' }), // 24h from creation

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Individual steps within each phase
// Role-specific: builder has discovery/build/demo phases
// Facilitator has expectations/longterm/close phases (during builder's build)
export const sessionSteps = sqliteTable('session_steps', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),

  // Role determines which checklist this step belongs to
  role: text('role', { enum: ['builder', 'facilitator'] }).notNull(),

  // Phase - builder uses discovery/build/demo
  // Facilitator uses expectations/longterm/close (maps to builder's build phase)
  phase: text('phase', {
    enum: ['discovery', 'build', 'demo', 'expectations', 'longterm', 'close'],
  }).notNull(),
  stepNumber: integer('step_number').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  estimatedMinutes: integer('estimated_minutes'),

  status: text('status', {
    enum: ['pending', 'in_progress', 'completed', 'skipped'],
  })
    .notNull()
    .default('pending'),

  // Acquired value - the input/answer captured for this step
  // This syncs to the other role's view
  acquiredValue: text('acquired_value'),

  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  timeSpent: integer('time_spent'), // seconds

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Client information captured during discovery (optional)
export const clientInfo = sqliteTable('client_info', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),

  clientName: text('client_name').notNull(),
  clientEmail: text('client_email'),
  clientPhone: text('client_phone'),
  businessType: text('business_type'),
  companySize: text('company_size'),

  problemStatement: text('problem_statement').notNull(),
  currentSolution: text('current_solution'),
  whyNow: text('why_now'),

  threeWins: text('three_wins'), // JSON array
  painPoints: text('pain_points'), // JSON array
  mustHaveFeatures: text('must_have_features'), // JSON array
  niceToHaveFeatures: text('nice_to_have_features'), // JSON array

  budget: text('budget'),
  timeline: text('timeline'),
  decisionMakers: text('decision_makers'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Template selections (optional)
export const templateSelections = sqliteTable('template_selections', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),

  templateNumber: integer('template_number').notNull(),
  templateName: text('template_name').notNull(),
  templateCategory: text('template_category'),

  fitScore: integer('fit_score'),
  fitReason: text('fit_reason'),

  isSelected: integer('is_selected', { mode: 'boolean' }).notNull().default(false),
  selectedAt: integer('selected_at', { mode: 'timestamp' }),
  selectedBy: text('selected_by'),

  customizationNotes: text('customization_notes'),
  estimatedBuildTime: integer('estimated_build_time'),
  customFields: text('custom_fields'),
  customLogic: text('custom_logic'),

  aiSuggested: integer('ai_suggested', { mode: 'boolean' }).default(false),
  aiReasoning: text('ai_reasoning'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Session notes (optional)
export const sessionNotes = sqliteTable('session_notes', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),

  phase: text('phase', {
    enum: ['discovery', 'build', 'demo', 'expectations', 'longterm', 'close', 'general'],
  }).notNull(),
  content: text('content').notNull(),
  createdBy: text('created_by', { enum: ['builder', 'facilitator'] }).notNull(),

  tags: text('tags'), // JSON array
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  isActionItem: integer('is_action_item', { mode: 'boolean' }).default(false),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Export types
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type SessionStep = typeof sessionSteps.$inferSelect
export type NewSessionStep = typeof sessionSteps.$inferInsert
export type ClientInfo = typeof clientInfo.$inferSelect
export type TemplateSelection = typeof templateSelections.$inferSelect
export type SessionNote = typeof sessionNotes.$inferSelect

// Role type for use across the app
export type Role = 'builder' | 'facilitator'

// Phase types
export type BuilderPhase = 'discovery' | 'build' | 'demo'
export type FacilitatorPhase = 'expectations' | 'longterm' | 'close'
export type Phase = BuilderPhase | FacilitatorPhase
