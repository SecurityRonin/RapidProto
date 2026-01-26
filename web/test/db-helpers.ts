/**
 * Test Database Helpers
 * Uses in-memory SQLite for server action tests
 * Updated for dual-mode (builder + facilitator) support
 */

import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { sql } from 'drizzle-orm'
import * as schema from '@/lib/db/schema'

export type TestDb = ReturnType<typeof drizzle<typeof schema>>

/**
 * Create an in-memory SQLite database for testing
 */
export function createTestDb(): TestDb {
  const client = createClient({
    url: ':memory:',
  })
  return drizzle(client, { schema })
}

/**
 * Set up test database with schema
 * Creates all required tables with dual-mode support
 */
export async function setupTestDb(): Promise<TestDb> {
  const db = createTestDb()

  // Create sessions table with dual-mode columns
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed')),
      current_phase TEXT NOT NULL DEFAULT 'discovery' CHECK(current_phase IN ('discovery', 'build', 'demo')),
      phase_started_at INTEGER NOT NULL,
      discovery_duration INTEGER NOT NULL DEFAULT 10,
      build_duration INTEGER NOT NULL DEFAULT 30,
      demo_duration INTEGER NOT NULL DEFAULT 10,
      started_at INTEGER NOT NULL,
      paused_at INTEGER,
      completed_at INTEGER,
      total_paused_time INTEGER NOT NULL DEFAULT 0,
      user_id TEXT,
      session_title TEXT,
      builder_joined INTEGER NOT NULL DEFAULT 1,
      facilitator_joined INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // Create session_steps table with role and acquired_value
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS session_steps (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('builder', 'facilitator')),
      phase TEXT NOT NULL CHECK(phase IN ('discovery', 'build', 'demo', 'expectations', 'longterm', 'close')),
      step_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      estimated_minutes INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'skipped')),
      acquired_value TEXT,
      started_at INTEGER,
      completed_at INTEGER,
      time_spent INTEGER,
      notes TEXT,
      created_at INTEGER NOT NULL
    )
  `)

  // Create client_info table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS client_info (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      client_name TEXT NOT NULL,
      client_email TEXT,
      client_phone TEXT,
      business_type TEXT,
      company_size TEXT,
      problem_statement TEXT NOT NULL,
      current_solution TEXT,
      why_now TEXT,
      three_wins TEXT,
      pain_points TEXT,
      must_have_features TEXT,
      nice_to_have_features TEXT,
      budget TEXT,
      timeline TEXT,
      decision_makers TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // Create template_selections table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS template_selections (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      template_number INTEGER NOT NULL,
      template_name TEXT NOT NULL,
      template_category TEXT,
      fit_score INTEGER,
      fit_reason TEXT,
      is_selected INTEGER NOT NULL DEFAULT 0,
      selected_at INTEGER,
      selected_by TEXT,
      customization_notes TEXT,
      estimated_build_time INTEGER,
      custom_fields TEXT,
      custom_logic TEXT,
      ai_suggested INTEGER DEFAULT 0,
      ai_reasoning TEXT,
      created_at INTEGER NOT NULL
    )
  `)

  // Create session_notes table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS session_notes (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      phase TEXT NOT NULL CHECK(phase IN ('discovery', 'build', 'demo', 'expectations', 'longterm', 'close', 'general')),
      content TEXT NOT NULL,
      created_by TEXT NOT NULL CHECK(created_by IN ('builder', 'facilitator')),
      tags TEXT,
      is_pinned INTEGER DEFAULT 0,
      is_action_item INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  return db
}

/**
 * Clear all data from test database
 */
export async function clearDatabase(db: TestDb): Promise<void> {
  await db.delete(schema.sessionNotes)
  await db.delete(schema.templateSelections)
  await db.delete(schema.clientInfo)
  await db.delete(schema.sessionSteps)
  await db.delete(schema.sessions)
}

/**
 * Seed a test session with dual-mode support
 */
export async function seedTestSession(
  db: TestDb,
  options: {
    id?: string
    status?: 'active' | 'paused' | 'completed'
    currentPhase?: 'discovery' | 'build' | 'demo'
    builderJoined?: boolean
    facilitatorJoined?: boolean
    sessionTitle?: string
  } = {}
) {
  const now = new Date()
  const sessionId = options.id ?? `session_${Date.now()}`

  const session = {
    id: sessionId,
    status: options.status ?? 'active',
    currentPhase: options.currentPhase ?? 'discovery',
    phaseStartedAt: now,
    discoveryDuration: 10,
    buildDuration: 30,
    demoDuration: 10,
    startedAt: now,
    pausedAt: null,
    completedAt: null,
    totalPausedTime: 0,
    userId: null,
    sessionTitle: options.sessionTitle ?? 'Test Session',
    builderJoined: options.builderJoined ?? true,
    facilitatorJoined: options.facilitatorJoined ?? false,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24h TTL
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(schema.sessions).values(session)
  return session
}

/**
 * Seed test steps for a session with role support
 */
export async function seedTestSteps(
  db: TestDb,
  sessionId: string,
  role: 'builder' | 'facilitator' = 'builder',
  phase: schema.Phase = 'discovery'
) {
  const now = new Date()
  const steps = [
    {
      id: `step_${Date.now()}_1`,
      sessionId,
      role,
      phase,
      stepNumber: 1,
      title: 'Test Step 1',
      description: 'First test step',
      estimatedMinutes: 5,
      status: 'pending' as const,
      acquiredValue: null,
      startedAt: null,
      completedAt: null,
      timeSpent: null,
      notes: null,
      createdAt: now,
    },
    {
      id: `step_${Date.now()}_2`,
      sessionId,
      role,
      phase,
      stepNumber: 2,
      title: 'Test Step 2',
      description: 'Second test step',
      estimatedMinutes: 5,
      status: 'pending' as const,
      acquiredValue: null,
      startedAt: null,
      completedAt: null,
      timeSpent: null,
      notes: null,
      createdAt: now,
    },
  ]

  await db.insert(schema.sessionSteps).values(steps)
  return steps
}
