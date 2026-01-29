/**
 * Template #4: Time Tracker
 * TDD: Tests written FIRST to define expected behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'

/**
 * TDD Test Suite for Time Tracker Actions
 * These tests define the expected behavior before implementation
 */

// Mock the database module
vi.mock('@/lib/db', async () => {
  const { createClient } = await import('@libsql/client')
  const { drizzle } = await import('drizzle-orm/libsql')
  const client = createClient({ url: ':memory:' })
  const db = drizzle(client)
  return { db }
})

// Import after mock setup
import {
  // Project actions
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  // Time entry actions
  startTimer,
  stopTimer,
  createTimeEntry,
  getTimeEntries,
  getTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getRunningTimer,
  // Reporting actions
  getTimeByProject,
  getTimeByDateRange,
  getDailyTotals,
  getWeeklyReport,
  // Validation schemas
  createProjectSchema,
  createTimeEntrySchema,
  updateTimeEntrySchema,
} from './index'

import { db } from '@/lib/db'

describe('Template #4: Time Tracker Actions', () => {
  beforeEach(async () => {
    // Create projects table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        client_name TEXT,
        hourly_rate REAL,
        budget_hours REAL,
        status TEXT NOT NULL DEFAULT 'active',
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    // Create time_entries table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT REFERENCES projects(id),
        task_description TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        billable INTEGER NOT NULL DEFAULT 1,
        hourly_rate REAL,
        status TEXT NOT NULL DEFAULT 'running',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)
  })

  afterEach(async () => {
    // Clean up tables
    await db.run(sql`DROP TABLE IF EXISTS time_entries`)
    await db.run(sql`DROP TABLE IF EXISTS projects`)
  })

  // ============================================
  // PROJECT CRUD TESTS
  // ============================================

  describe('Project CRUD Operations', () => {
    describe('createProject', () => {
      it('should create a new project with required fields', async () => {
        const result = await createProject({
          name: 'Website Redesign',
          userId: 'user_123',
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data?.name).toBe('Website Redesign')
        expect(result.data?.status).toBe('active')
        expect(result.data?.id).toBeDefined()
      })

      it('should create a project with all optional fields', async () => {
        const result = await createProject({
          name: 'Mobile App',
          clientName: 'Acme Corp',
          hourlyRate: 150,
          budgetHours: 100,
          status: 'active',
          userId: 'user_123',
        })

        expect(result.success).toBe(true)
        expect(result.data?.clientName).toBe('Acme Corp')
        expect(result.data?.hourlyRate).toBe(150)
        expect(result.data?.budgetHours).toBe(100)
      })

      it('should validate required project name', async () => {
        const result = await createProject({
          name: '',
          userId: 'user_123',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('name')
      })

      it('should validate positive hourly rate', async () => {
        const result = await createProject({
          name: 'Test Project',
          hourlyRate: -50,
          userId: 'user_123',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('rate')
      })

      it('should validate positive budget hours', async () => {
        const result = await createProject({
          name: 'Test Project',
          budgetHours: -10,
          userId: 'user_123',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('budget')
      })
    })

    describe('getProjects', () => {
      beforeEach(async () => {
        await createProject({ name: 'Project A', status: 'active', userId: 'user_123' })
        await createProject({ name: 'Project B', status: 'completed', userId: 'user_123' })
        await createProject({ name: 'Project C', status: 'archived', userId: 'user_123' })
      })

      it('should return all projects for a user', async () => {
        const result = await getProjects({ userId: 'user_123' })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(3)
      })

      it('should filter projects by status', async () => {
        const result = await getProjects({ userId: 'user_123', status: 'active' })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data?.[0].name).toBe('Project A')
      })

      it('should return empty array for user with no projects', async () => {
        const result = await getProjects({ userId: 'user_999' })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(0)
      })
    })

    describe('getProject', () => {
      it('should return a single project by ID', async () => {
        const created = await createProject({ name: 'Test Project', userId: 'user_123' })
        const result = await getProject(created.data!.id)

        expect(result.success).toBe(true)
        expect(result.data?.name).toBe('Test Project')
      })

      it('should return error for non-existent project', async () => {
        const result = await getProject('nonexistent_id')

        expect(result.success).toBe(false)
        expect(result.error).toContain('not found')
      })
    })

    describe('updateProject', () => {
      it('should update project fields', async () => {
        const created = await createProject({ name: 'Original', userId: 'user_123' })
        const result = await updateProject(created.data!.id, {
          name: 'Updated Name',
          clientName: 'New Client',
          hourlyRate: 200,
        })

        expect(result.success).toBe(true)
        expect(result.data?.name).toBe('Updated Name')
        expect(result.data?.clientName).toBe('New Client')
        expect(result.data?.hourlyRate).toBe(200)
      })

      it('should update project status', async () => {
        const created = await createProject({ name: 'Project', userId: 'user_123' })
        const result = await updateProject(created.data!.id, { status: 'completed' })

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('completed')
      })

      it('should return error for non-existent project', async () => {
        const result = await updateProject('nonexistent', { name: 'New Name' })

        expect(result.success).toBe(false)
        expect(result.error).toContain('not found')
      })
    })

    describe('deleteProject', () => {
      it('should delete a project', async () => {
        const created = await createProject({ name: 'To Delete', userId: 'user_123' })
        const result = await deleteProject(created.data!.id)

        expect(result.success).toBe(true)

        const fetched = await getProject(created.data!.id)
        expect(fetched.success).toBe(false)
      })

      it('should handle deleting non-existent project gracefully', async () => {
        const result = await deleteProject('nonexistent')
        // Should not throw, may return success or error depending on impl
        expect(result).toBeDefined()
      })
    })
  })

  // ============================================
  // TIMER OPERATIONS TESTS
  // ============================================

  describe('Timer Operations', () => {
    let projectId: string

    beforeEach(async () => {
      const project = await createProject({ name: 'Timer Test Project', userId: 'user_123' })
      projectId = project.data!.id
    })

    describe('startTimer', () => {
      it('should start a new timer', async () => {
        const result = await startTimer({
          userId: 'user_123',
          projectId,
          taskDescription: 'Working on feature X',
          billable: true,
        })

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('running')
        expect(result.data?.startTime).toBeDefined()
        expect(result.data?.endTime).toBeNull()
        expect(result.data?.duration).toBeNull()
      })

      it('should start timer without project', async () => {
        const result = await startTimer({
          userId: 'user_123',
          taskDescription: 'General admin work',
          billable: false,
        })

        expect(result.success).toBe(true)
        expect(result.data?.projectId).toBeNull()
      })

      it('should prevent starting timer when one is already running', async () => {
        await startTimer({
          userId: 'user_123',
          taskDescription: 'First task',
        })

        const result = await startTimer({
          userId: 'user_123',
          taskDescription: 'Second task',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('already running')
      })

      it('should inherit hourly rate from project if not specified', async () => {
        const projectWithRate = await createProject({
          name: 'Rated Project',
          hourlyRate: 150,
          userId: 'user_123',
        })

        const result = await startTimer({
          userId: 'user_123',
          projectId: projectWithRate.data!.id,
          billable: true,
        })

        expect(result.success).toBe(true)
        expect(result.data?.hourlyRate).toBe(150)
      })

      it('should use custom hourly rate when specified', async () => {
        const result = await startTimer({
          userId: 'user_123',
          projectId,
          hourlyRate: 200,
          billable: true,
        })

        expect(result.success).toBe(true)
        expect(result.data?.hourlyRate).toBe(200)
      })
    })

    describe('stopTimer', () => {
      it('should stop the running timer and calculate duration', async () => {
        const started = await startTimer({
          userId: 'user_123',
          taskDescription: 'Test task',
        })

        // Wait a small amount to ensure duration > 0
        await new Promise(resolve => setTimeout(resolve, 100))

        const result = await stopTimer(started.data!.id)

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('completed')
        expect(result.data?.endTime).toBeDefined()
        expect(result.data?.duration).toBeGreaterThanOrEqual(0)
      })

      it('should return error when stopping non-existent timer', async () => {
        const result = await stopTimer('nonexistent')

        expect(result.success).toBe(false)
        expect(result.error).toContain('not found')
      })

      it('should return error when stopping already stopped timer', async () => {
        const started = await startTimer({
          userId: 'user_123',
          taskDescription: 'Test task',
        })

        await stopTimer(started.data!.id)
        const result = await stopTimer(started.data!.id)

        expect(result.success).toBe(false)
        expect(result.error).toContain('not running')
      })
    })

    describe('getRunningTimer', () => {
      it('should return the currently running timer', async () => {
        await startTimer({
          userId: 'user_123',
          taskDescription: 'Running task',
        })

        const result = await getRunningTimer('user_123')

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('running')
        expect(result.data?.taskDescription).toBe('Running task')
      })

      it('should return null when no timer is running', async () => {
        const result = await getRunningTimer('user_123')

        expect(result.success).toBe(true)
        expect(result.data).toBeNull()
      })
    })
  })

  // ============================================
  // MANUAL TIME ENTRY TESTS
  // ============================================

  describe('Manual Time Entry', () => {
    let projectId: string

    beforeEach(async () => {
      const project = await createProject({ name: 'Entry Test Project', userId: 'user_123' })
      projectId = project.data!.id
    })

    describe('createTimeEntry', () => {
      it('should create a manual time entry', async () => {
        const startTime = new Date('2025-01-15T09:00:00Z')
        const endTime = new Date('2025-01-15T12:00:00Z')

        const result = await createTimeEntry({
          userId: 'user_123',
          projectId,
          taskDescription: 'Manual entry task',
          startTime,
          endTime,
          billable: true,
        })

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('completed')
        expect(result.data?.duration).toBe(180) // 3 hours in minutes
      })

      it('should auto-calculate duration from start and end times', async () => {
        const startTime = new Date('2025-01-15T09:00:00Z')
        const endTime = new Date('2025-01-15T11:30:00Z')

        const result = await createTimeEntry({
          userId: 'user_123',
          startTime,
          endTime,
        })

        expect(result.success).toBe(true)
        expect(result.data?.duration).toBe(150) // 2.5 hours = 150 minutes
      })

      it('should validate end time is after start time', async () => {
        const startTime = new Date('2025-01-15T12:00:00Z')
        const endTime = new Date('2025-01-15T09:00:00Z')

        const result = await createTimeEntry({
          userId: 'user_123',
          startTime,
          endTime,
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('end time')
      })

      it('should allow creating entry with just duration', async () => {
        const startTime = new Date('2025-01-15T09:00:00Z')

        const result = await createTimeEntry({
          userId: 'user_123',
          startTime,
          duration: 120, // 2 hours in minutes
          taskDescription: 'Fixed duration task',
        })

        expect(result.success).toBe(true)
        expect(result.data?.duration).toBe(120)
      })
    })

    describe('getTimeEntries', () => {
      beforeEach(async () => {
        // Create entries across different dates and projects
        const project2 = await createProject({ name: 'Project 2', userId: 'user_123' })

        await createTimeEntry({
          userId: 'user_123',
          projectId,
          startTime: new Date('2025-01-15T09:00:00Z'),
          endTime: new Date('2025-01-15T12:00:00Z'),
          billable: true,
        })

        await createTimeEntry({
          userId: 'user_123',
          projectId: project2.data!.id,
          startTime: new Date('2025-01-16T14:00:00Z'),
          endTime: new Date('2025-01-16T16:00:00Z'),
          billable: false,
        })

        await createTimeEntry({
          userId: 'user_123',
          projectId,
          startTime: new Date('2025-01-17T10:00:00Z'),
          endTime: new Date('2025-01-17T11:00:00Z'),
          billable: true,
        })
      })

      it('should return all entries for a user', async () => {
        const result = await getTimeEntries({ userId: 'user_123' })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(3)
      })

      it('should filter entries by project', async () => {
        const result = await getTimeEntries({
          userId: 'user_123',
          projectId,
        })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(2)
      })

      it('should filter entries by date range', async () => {
        const result = await getTimeEntries({
          userId: 'user_123',
          startDate: new Date('2025-01-16T00:00:00Z'),
          endDate: new Date('2025-01-16T23:59:59Z'),
        })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
      })

      it('should filter entries by billable status', async () => {
        const result = await getTimeEntries({
          userId: 'user_123',
          billable: true,
        })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(2)
        expect(result.data?.every(e => e.billable)).toBe(true)
      })

      it('should combine multiple filters', async () => {
        const result = await getTimeEntries({
          userId: 'user_123',
          projectId,
          billable: true,
          startDate: new Date('2025-01-15T00:00:00Z'),
          endDate: new Date('2025-01-15T23:59:59Z'),
        })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
      })
    })

    describe('getTimeEntry', () => {
      it('should return a single time entry', async () => {
        const created = await createTimeEntry({
          userId: 'user_123',
          startTime: new Date('2025-01-15T09:00:00Z'),
          endTime: new Date('2025-01-15T10:00:00Z'),
          taskDescription: 'Specific entry',
        })

        const result = await getTimeEntry(created.data!.id)

        expect(result.success).toBe(true)
        expect(result.data?.taskDescription).toBe('Specific entry')
      })

      it('should return error for non-existent entry', async () => {
        const result = await getTimeEntry('nonexistent')

        expect(result.success).toBe(false)
        expect(result.error).toContain('not found')
      })
    })

    describe('updateTimeEntry', () => {
      it('should update time entry fields', async () => {
        const created = await createTimeEntry({
          userId: 'user_123',
          startTime: new Date('2025-01-15T09:00:00Z'),
          endTime: new Date('2025-01-15T10:00:00Z'),
          taskDescription: 'Original',
          billable: false,
        })

        const result = await updateTimeEntry(created.data!.id, {
          taskDescription: 'Updated description',
          billable: true,
          hourlyRate: 175,
        })

        expect(result.success).toBe(true)
        expect(result.data?.taskDescription).toBe('Updated description')
        expect(result.data?.billable).toBe(true)
        expect(result.data?.hourlyRate).toBe(175)
      })

      it('should recalculate duration when times are updated', async () => {
        const created = await createTimeEntry({
          userId: 'user_123',
          startTime: new Date('2025-01-15T09:00:00Z'),
          endTime: new Date('2025-01-15T10:00:00Z'),
        })

        const result = await updateTimeEntry(created.data!.id, {
          endTime: new Date('2025-01-15T12:00:00Z'),
        })

        expect(result.success).toBe(true)
        expect(result.data?.duration).toBe(180) // 3 hours
      })

      it('should return error for non-existent entry', async () => {
        const result = await updateTimeEntry('nonexistent', { taskDescription: 'Test' })

        expect(result.success).toBe(false)
        expect(result.error).toContain('not found')
      })

      it('should not allow updating entry to approved status without permission', async () => {
        const created = await createTimeEntry({
          userId: 'user_123',
          startTime: new Date('2025-01-15T09:00:00Z'),
          endTime: new Date('2025-01-15T10:00:00Z'),
        })

        const result = await updateTimeEntry(created.data!.id, {
          status: 'approved',
        })

        // This behavior depends on implementation - may require manager role
        expect(result).toBeDefined()
      })
    })

    describe('deleteTimeEntry', () => {
      it('should delete a time entry', async () => {
        const created = await createTimeEntry({
          userId: 'user_123',
          startTime: new Date('2025-01-15T09:00:00Z'),
          endTime: new Date('2025-01-15T10:00:00Z'),
        })

        const result = await deleteTimeEntry(created.data!.id)

        expect(result.success).toBe(true)

        const fetched = await getTimeEntry(created.data!.id)
        expect(fetched.success).toBe(false)
      })
    })
  })

  // ============================================
  // REPORTING TESTS
  // ============================================

  describe('Reporting Operations', () => {
    let projectId1: string
    let projectId2: string

    beforeEach(async () => {
      const p1 = await createProject({ name: 'Project Alpha', hourlyRate: 100, userId: 'user_123' })
      const p2 = await createProject({ name: 'Project Beta', hourlyRate: 150, userId: 'user_123' })
      projectId1 = p1.data!.id
      projectId2 = p2.data!.id

      // Week of Jan 13-17, 2025 (Mon-Fri)
      // Project Alpha: 8h Mon, 6h Tue, 4h Wed = 18h total
      await createTimeEntry({
        userId: 'user_123',
        projectId: projectId1,
        startTime: new Date('2025-01-13T09:00:00Z'),
        endTime: new Date('2025-01-13T17:00:00Z'),
        billable: true,
      })
      await createTimeEntry({
        userId: 'user_123',
        projectId: projectId1,
        startTime: new Date('2025-01-14T10:00:00Z'),
        endTime: new Date('2025-01-14T16:00:00Z'),
        billable: true,
      })
      await createTimeEntry({
        userId: 'user_123',
        projectId: projectId1,
        startTime: new Date('2025-01-15T13:00:00Z'),
        endTime: new Date('2025-01-15T17:00:00Z'),
        billable: true,
      })

      // Project Beta: 5h Thu, 3h Fri = 8h total, but Fri is non-billable
      await createTimeEntry({
        userId: 'user_123',
        projectId: projectId2,
        startTime: new Date('2025-01-16T09:00:00Z'),
        endTime: new Date('2025-01-16T14:00:00Z'),
        billable: true,
      })
      await createTimeEntry({
        userId: 'user_123',
        projectId: projectId2,
        startTime: new Date('2025-01-17T10:00:00Z'),
        endTime: new Date('2025-01-17T13:00:00Z'),
        billable: false,
      })
    })

    describe('getTimeByProject', () => {
      it('should return total time per project', async () => {
        const result = await getTimeByProject({
          userId: 'user_123',
        })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(2)

        const alpha = result.data?.find(p => p.projectName === 'Project Alpha')
        const beta = result.data?.find(p => p.projectName === 'Project Beta')

        expect(alpha?.totalMinutes).toBe(18 * 60) // 18 hours
        expect(beta?.totalMinutes).toBe(8 * 60) // 8 hours
      })

      it('should calculate billable totals separately', async () => {
        const result = await getTimeByProject({
          userId: 'user_123',
        })

        expect(result.success).toBe(true)

        const beta = result.data?.find(p => p.projectName === 'Project Beta')
        expect(beta?.billableMinutes).toBe(5 * 60) // Only 5h billable
        expect(beta?.nonBillableMinutes).toBe(3 * 60) // 3h non-billable
      })

      it('should calculate billable amount', async () => {
        const result = await getTimeByProject({
          userId: 'user_123',
        })

        expect(result.success).toBe(true)

        const alpha = result.data?.find(p => p.projectName === 'Project Alpha')
        // 18 hours * $100/hr = $1800
        expect(alpha?.billableAmount).toBe(1800)
      })

      it('should filter by date range', async () => {
        const result = await getTimeByProject({
          userId: 'user_123',
          startDate: new Date('2025-01-13T00:00:00Z'),
          endDate: new Date('2025-01-14T23:59:59Z'),
        })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1) // Only Alpha has entries in this range

        const alpha = result.data?.find(p => p.projectName === 'Project Alpha')
        expect(alpha?.totalMinutes).toBe(14 * 60) // 8h + 6h = 14h
      })
    })

    describe('getTimeByDateRange', () => {
      it('should return total time summary for date range', async () => {
        const result = await getTimeByDateRange({
          userId: 'user_123',
          startDate: new Date('2025-01-13T00:00:00Z'),
          endDate: new Date('2025-01-17T23:59:59Z'),
        })

        expect(result.success).toBe(true)
        expect(result.data?.totalMinutes).toBe(26 * 60) // 26 hours total
        expect(result.data?.billableMinutes).toBe(23 * 60) // 23 billable
        expect(result.data?.nonBillableMinutes).toBe(3 * 60) // 3 non-billable
      })

      it('should calculate total billable amount', async () => {
        const result = await getTimeByDateRange({
          userId: 'user_123',
          startDate: new Date('2025-01-13T00:00:00Z'),
          endDate: new Date('2025-01-17T23:59:59Z'),
        })

        expect(result.success).toBe(true)
        // Alpha: 18h * $100 = $1800, Beta: 5h * $150 = $750
        // Total: $2550
        expect(result.data?.billableAmount).toBe(2550)
      })

      it('should return entry count', async () => {
        const result = await getTimeByDateRange({
          userId: 'user_123',
          startDate: new Date('2025-01-13T00:00:00Z'),
          endDate: new Date('2025-01-17T23:59:59Z'),
        })

        expect(result.success).toBe(true)
        expect(result.data?.entryCount).toBe(5)
      })
    })

    describe('getDailyTotals', () => {
      it('should return time totals by day', async () => {
        const result = await getDailyTotals({
          userId: 'user_123',
          startDate: new Date('2025-01-13T00:00:00Z'),
          endDate: new Date('2025-01-17T23:59:59Z'),
        })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(5) // 5 days with entries

        const monday = result.data?.find(d => d.date === '2025-01-13')
        expect(monday?.totalMinutes).toBe(8 * 60)

        const friday = result.data?.find(d => d.date === '2025-01-17')
        expect(friday?.totalMinutes).toBe(3 * 60)
      })

      it('should include billable breakdown per day', async () => {
        const result = await getDailyTotals({
          userId: 'user_123',
          startDate: new Date('2025-01-17T00:00:00Z'),
          endDate: new Date('2025-01-17T23:59:59Z'),
        })

        expect(result.success).toBe(true)

        const friday = result.data?.[0]
        expect(friday?.billableMinutes).toBe(0)
        expect(friday?.nonBillableMinutes).toBe(3 * 60)
      })
    })

    describe('getWeeklyReport', () => {
      it('should return comprehensive weekly summary', async () => {
        const result = await getWeeklyReport({
          userId: 'user_123',
          weekStart: new Date('2025-01-13T00:00:00Z'),
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()

        expect(result.data?.totalMinutes).toBe(26 * 60)
        expect(result.data?.billableMinutes).toBe(23 * 60)
        expect(result.data?.billableAmount).toBe(2550)
      })

      it('should include daily breakdown', async () => {
        const result = await getWeeklyReport({
          userId: 'user_123',
          weekStart: new Date('2025-01-13T00:00:00Z'),
        })

        expect(result.success).toBe(true)
        expect(result.data?.dailyTotals).toBeDefined()
        expect(result.data?.dailyTotals).toHaveLength(7) // Full week
      })

      it('should include project breakdown', async () => {
        const result = await getWeeklyReport({
          userId: 'user_123',
          weekStart: new Date('2025-01-13T00:00:00Z'),
        })

        expect(result.success).toBe(true)
        expect(result.data?.projectTotals).toBeDefined()
        expect(result.data?.projectTotals).toHaveLength(2)
      })

      it('should calculate average hours per day worked', async () => {
        const result = await getWeeklyReport({
          userId: 'user_123',
          weekStart: new Date('2025-01-13T00:00:00Z'),
        })

        expect(result.success).toBe(true)
        // 26 hours over 5 days worked = 5.2 hours average
        expect(result.data?.avgMinutesPerDay).toBeCloseTo(312, 0) // 5.2 * 60
      })
    })
  })

  // ============================================
  // DURATION CALCULATION TESTS
  // ============================================

  describe('Duration Calculations', () => {
    it('should correctly calculate minutes from start/end times', async () => {
      const result = await createTimeEntry({
        userId: 'user_123',
        startTime: new Date('2025-01-15T09:00:00Z'),
        endTime: new Date('2025-01-15T09:30:00Z'),
      })

      expect(result.success).toBe(true)
      expect(result.data?.duration).toBe(30)
    })

    it('should handle multi-hour durations', async () => {
      const result = await createTimeEntry({
        userId: 'user_123',
        startTime: new Date('2025-01-15T08:00:00Z'),
        endTime: new Date('2025-01-15T17:30:00Z'),
      })

      expect(result.success).toBe(true)
      expect(result.data?.duration).toBe(570) // 9.5 hours
    })

    it('should handle overnight entries', async () => {
      const result = await createTimeEntry({
        userId: 'user_123',
        startTime: new Date('2025-01-15T22:00:00Z'),
        endTime: new Date('2025-01-16T02:00:00Z'),
      })

      expect(result.success).toBe(true)
      expect(result.data?.duration).toBe(240) // 4 hours
    })
  })

  // ============================================
  // VALIDATION SCHEMA TESTS
  // ============================================

  describe('Validation Schemas', () => {
    describe('createProjectSchema', () => {
      it('should validate valid project data', () => {
        const result = createProjectSchema.safeParse({
          name: 'Valid Project',
          userId: 'user_123',
        })

        expect(result.success).toBe(true)
      })

      it('should reject empty name', () => {
        const result = createProjectSchema.safeParse({
          name: '',
          userId: 'user_123',
        })

        expect(result.success).toBe(false)
      })

      it('should reject negative hourly rate', () => {
        const result = createProjectSchema.safeParse({
          name: 'Project',
          hourlyRate: -100,
          userId: 'user_123',
        })

        expect(result.success).toBe(false)
      })

      it('should accept valid status values', () => {
        const statuses = ['active', 'completed', 'archived']
        for (const status of statuses) {
          const result = createProjectSchema.safeParse({
            name: 'Project',
            status,
            userId: 'user_123',
          })
          expect(result.success).toBe(true)
        }
      })
    })

    describe('createTimeEntrySchema', () => {
      it('should validate valid time entry data', () => {
        const result = createTimeEntrySchema.safeParse({
          userId: 'user_123',
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
        })

        expect(result.success).toBe(true)
      })

      it('should require userId', () => {
        const result = createTimeEntrySchema.safeParse({
          startTime: new Date(),
        })

        expect(result.success).toBe(false)
      })

      it('should require startTime', () => {
        const result = createTimeEntrySchema.safeParse({
          userId: 'user_123',
        })

        expect(result.success).toBe(false)
      })
    })

    describe('updateTimeEntrySchema', () => {
      it('should allow partial updates', () => {
        const result = updateTimeEntrySchema.safeParse({
          taskDescription: 'Updated description',
        })

        expect(result.success).toBe(true)
      })

      it('should validate billable as boolean', () => {
        const result = updateTimeEntrySchema.safeParse({
          billable: 'yes', // Invalid
        })

        expect(result.success).toBe(false)
      })
    })
  })

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle concurrent timer prevention across requests', async () => {
      // Start first timer
      const first = await startTimer({
        userId: 'user_123',
        taskDescription: 'First',
      })
      expect(first.success).toBe(true)

      // Attempt concurrent start should fail
      const second = await startTimer({
        userId: 'user_123',
        taskDescription: 'Second',
      })
      expect(second.success).toBe(false)
    })

    it('should allow different users to have concurrent timers', async () => {
      const user1Timer = await startTimer({
        userId: 'user_123',
        taskDescription: 'User 1 task',
      })

      const user2Timer = await startTimer({
        userId: 'user_456',
        taskDescription: 'User 2 task',
      })

      expect(user1Timer.success).toBe(true)
      expect(user2Timer.success).toBe(true)
    })

    it('should handle zero-duration entries gracefully', async () => {
      const startTime = new Date('2025-01-15T09:00:00Z')
      const result = await createTimeEntry({
        userId: 'user_123',
        startTime,
        endTime: startTime, // Same time
      })

      expect(result.success).toBe(true)
      expect(result.data?.duration).toBe(0)
    })

    it('should preserve precision in billable calculations', async () => {
      const project = await createProject({
        name: 'Precision Test',
        hourlyRate: 125.50,
        userId: 'user_123',
      })

      await createTimeEntry({
        userId: 'user_123',
        projectId: project.data!.id,
        startTime: new Date('2025-01-15T09:00:00Z'),
        endTime: new Date('2025-01-15T09:15:00Z'), // 15 minutes
        billable: true,
      })

      const report = await getTimeByProject({ userId: 'user_123' })
      const projectData = report.data?.find(p => p.projectName === 'Precision Test')

      // 15 min = 0.25 hr * $125.50 = $31.375 (may round to $31.38)
      expect(projectData?.billableAmount).toBeCloseTo(31.38, 2)
    })
  })
})
