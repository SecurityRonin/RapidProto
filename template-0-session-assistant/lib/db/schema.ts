/**
 * Template #0: RapidProto Session Assistant
 * Database schema - implemented to pass TDD tests
 *
 * Guides Builder and Facilitator through the 50-minute process
 * with real-time tracking and countdown timers
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// Main sessions table
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  role: text('role', { enum: ['builder', 'facilitator'] }).notNull(),
  status: text('status', { enum: ['active', 'paused', 'completed'] })
    .notNull()
    .default('active'),

  // Phase tracking
  currentPhase: text('current_phase', { enum: ['discovery', 'build', 'demo'] })
    .notNull()
    .default('discovery'),
  phaseStartedAt: integer('phase_started_at', { mode: 'timestamp' }).notNull(),

  // Phase durations (customizable per session)
  discoveryDuration: integer('discovery_duration').notNull().default(10), // minutes
  buildDuration: integer('build_duration').notNull().default(30), // minutes
  demoDuration: integer('demo_duration').notNull().default(10), // minutes

  // Timer tracking
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  pausedAt: integer('paused_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  totalPausedTime: integer('total_paused_time').notNull().default(0), // milliseconds

  // Session metadata
  userId: text('user_id').notNull(), // Clerk user ID
  teamId: text('team_id'), // For team sessions
  sessionTitle: text('session_title'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Individual steps within each phase
export const sessionSteps = sqliteTable('session_steps', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),

  phase: text('phase', { enum: ['discovery', 'build', 'demo'] }).notNull(),
  stepNumber: integer('step_number').notNull(), // Order within phase
  title: text('title').notNull(),
  description: text('description'),
  estimatedMinutes: integer('estimated_minutes'), // Expected duration

  status: text('status', {
    enum: ['pending', 'in_progress', 'completed', 'skipped'],
  })
    .notNull()
    .default('pending'),

  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  timeSpent: integer('time_spent'), // seconds

  notes: text('notes'), // Step-specific notes
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Client information captured during discovery
export const clientInfo = sqliteTable('client_info', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),

  // Basic client details
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email'),
  clientPhone: text('client_phone'),
  businessType: text('business_type'), // Industry/sector
  companySize: text('company_size'), // employees, revenue, etc.

  // Problem discovery
  problemStatement: text('problem_statement').notNull(),
  currentSolution: text('current_solution'), // What they use now
  whyNow: text('why_now'), // Why solving this now

  // Three Wins framework
  threeWins: text('three_wins'), // JSON: ["win1", "win2", "win3"]

  // Requirements
  painPoints: text('pain_points'), // JSON: ["pain1", "pain2", ...]
  mustHaveFeatures: text('must_have_features'), // JSON array
  niceToHaveFeatures: text('nice_to_have_features'), // JSON array

  // Budget & timeline
  budget: text('budget'), // Budget range or amount
  timeline: text('timeline'), // When they need it
  decisionMakers: text('decision_makers'), // Who's involved in decision

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Template selections and recommendations
export const templateSelections = sqliteTable('template_selections', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),

  templateNumber: integer('template_number').notNull(),
  templateName: text('template_name').notNull(),
  templateCategory: text('template_category'),

  // Scoring
  fitScore: integer('fit_score'), // 1-10, how well template fits needs
  fitReason: text('fit_reason'), // Why this score

  // Selection
  isSelected: integer('is_selected', { mode: 'boolean' }).notNull().default(false),
  selectedAt: integer('selected_at', { mode: 'timestamp' }),
  selectedBy: text('selected_by'), // 'builder' or 'facilitator'

  // Customization planning
  customizationNotes: text('customization_notes'),
  estimatedBuildTime: integer('estimated_build_time'), // minutes
  customFields: text('custom_fields'), // JSON: fields to add
  customLogic: text('custom_logic'), // JSON: business rules to implement

  // AI suggestions
  aiSuggested: integer('ai_suggested', { mode: 'boolean' }).default(false),
  aiReasoning: text('ai_reasoning'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Free-form notes throughout session
export const sessionNotes = sqliteTable('session_notes', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),

  phase: text('phase', { enum: ['discovery', 'build', 'demo', 'general'] }).notNull(),
  content: text('content').notNull(),
  createdBy: text('created_by', { enum: ['builder', 'facilitator'] }).notNull(),

  // Organization
  tags: text('tags'), // JSON: ['technical', 'pricing', 'follow-up']
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  isActionItem: integer('is_action_item', { mode: 'boolean' }).default(false),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Export types
export type Session = typeof sessions.$inferSelect
export type SessionStep = typeof sessionSteps.$inferSelect
export type ClientInfo = typeof clientInfo.$inferSelect
export type TemplateSelection = typeof templateSelections.$inferSelect
export type SessionNote = typeof sessionNotes.$inferSelect
