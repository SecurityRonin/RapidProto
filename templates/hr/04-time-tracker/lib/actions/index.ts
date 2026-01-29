/**
 * Template #4: Time Tracker
 * Server actions for time tracking with projects, timer, and reporting
 */

'use server'

import { db } from '@/lib/db'
import { projects, timeEntries, type Project, type TimeEntry } from '../db/schema'
import { eq, and, gte, lte, isNull, desc, sql } from 'drizzle-orm'
import { z } from 'zod'

// ============================================
// RESULT TYPE
// ============================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  clientName: z.string().optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
  budgetHours: z.number().positive('Budget hours must be positive').optional(),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  userId: z.string().min(1, 'User ID is required'),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').optional(),
  clientName: z.string().optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
  budgetHours: z.number().positive('Budget hours must be positive').optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
})

export const startTimerSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  projectId: z.string().optional(),
  taskDescription: z.string().optional(),
  billable: z.boolean().default(true),
  hourlyRate: z.number().positive().optional(),
})

export const createTimeEntrySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  projectId: z.string().optional(),
  taskDescription: z.string().optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().min(0).optional(),
  billable: z.boolean().default(true),
  hourlyRate: z.number().positive().optional(),
})

export const updateTimeEntrySchema = z.object({
  projectId: z.string().optional(),
  taskDescription: z.string().optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  duration: z.number().min(0).optional(),
  billable: z.boolean().optional(),
  hourlyRate: z.number().positive().optional(),
  status: z.enum(['running', 'completed', 'approved']).optional(),
})

export const timeEntriesFilterSchema = z.object({
  userId: z.string(),
  projectId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  billable: z.boolean().optional(),
  status: z.enum(['running', 'completed', 'approved']).optional(),
})

// ============================================
// PROJECT ACTIONS
// ============================================

/**
 * Create a new project
 */
export async function createProject(
  input: z.infer<typeof createProjectSchema>
): Promise<ActionResult<Project>> {
  try {
    const validated = createProjectSchema.parse(input)

    const newProject = {
      id: crypto.randomUUID(),
      name: validated.name,
      clientName: validated.clientName || null,
      hourlyRate: validated.hourlyRate || null,
      budgetHours: validated.budgetHours || null,
      status: validated.status,
      userId: validated.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const [created] = await db.insert(projects).values(newProject).returning()

    return { success: true, data: created }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create project' }
  }
}

/**
 * Get projects for a user with optional status filter
 */
export async function getProjects(filters: {
  userId: string
  status?: 'active' | 'completed' | 'archived'
}): Promise<ActionResult<Project[]>> {
  try {
    const conditions = [eq(projects.userId, filters.userId)]

    if (filters.status) {
      conditions.push(eq(projects.status, filters.status))
    }

    const results = await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(desc(projects.createdAt))

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch projects' }
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<ActionResult<Project>> {
  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, id))

    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    return { success: true, data: project }
  } catch (error) {
    return { success: false, error: 'Failed to fetch project' }
  }
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  input: z.infer<typeof updateProjectSchema>
): Promise<ActionResult<Project>> {
  try {
    const validated = updateProjectSchema.parse(input)

    const [updated] = await db
      .update(projects)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning()

    if (!updated) {
      return { success: false, error: 'Project not found' }
    }

    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update project' }
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<ActionResult<void>> {
  try {
    await db.delete(projects).where(eq(projects.id, id))
    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: 'Failed to delete project' }
  }
}

// ============================================
// TIMER ACTIONS
// ============================================

/**
 * Start a new timer (creates running time entry)
 */
export async function startTimer(
  input: z.infer<typeof startTimerSchema>
): Promise<ActionResult<TimeEntry>> {
  try {
    const validated = startTimerSchema.parse(input)

    // Check for existing running timer
    const [existingTimer] = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, validated.userId),
          eq(timeEntries.status, 'running')
        )
      )

    if (existingTimer) {
      return { success: false, error: 'Timer already running. Stop the current timer first.' }
    }

    // Get hourly rate from project if not specified
    let hourlyRate = validated.hourlyRate || null
    if (!hourlyRate && validated.projectId) {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, validated.projectId))

      if (project?.hourlyRate) {
        hourlyRate = project.hourlyRate
      }
    }

    const newEntry = {
      id: crypto.randomUUID(),
      userId: validated.userId,
      projectId: validated.projectId || null,
      taskDescription: validated.taskDescription || null,
      startTime: new Date(),
      endTime: null,
      duration: null,
      billable: validated.billable,
      hourlyRate,
      status: 'running' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const [created] = await db.insert(timeEntries).values(newEntry).returning()

    return { success: true, data: created }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to start timer' }
  }
}

/**
 * Stop a running timer and calculate duration
 */
export async function stopTimer(entryId: string): Promise<ActionResult<TimeEntry>> {
  try {
    // Get the entry
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, entryId))

    if (!entry) {
      return { success: false, error: 'Time entry not found' }
    }

    if (entry.status !== 'running') {
      return { success: false, error: 'Timer is not running' }
    }

    const endTime = new Date()
    const duration = Math.round((endTime.getTime() - entry.startTime.getTime()) / 60000) // Minutes

    const [updated] = await db
      .update(timeEntries)
      .set({
        endTime,
        duration,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(timeEntries.id, entryId))
      .returning()

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to stop timer' }
  }
}

/**
 * Get the currently running timer for a user
 */
export async function getRunningTimer(userId: string): Promise<ActionResult<TimeEntry | null>> {
  try {
    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          eq(timeEntries.status, 'running')
        )
      )

    return { success: true, data: entry || null }
  } catch (error) {
    return { success: false, error: 'Failed to fetch running timer' }
  }
}

// ============================================
// TIME ENTRY ACTIONS
// ============================================

/**
 * Create a manual time entry
 */
export async function createTimeEntry(
  input: z.infer<typeof createTimeEntrySchema>
): Promise<ActionResult<TimeEntry>> {
  try {
    const validated = createTimeEntrySchema.parse(input)

    // Validate end time is after start time if provided
    if (validated.endTime && validated.endTime < validated.startTime) {
      return { success: false, error: 'End time must be after start time' }
    }

    // Calculate duration
    let duration = validated.duration
    if (!duration && validated.endTime) {
      duration = Math.round(
        (validated.endTime.getTime() - validated.startTime.getTime()) / 60000
      )
    }

    // Get hourly rate from project if not specified
    let hourlyRate = validated.hourlyRate || null
    if (!hourlyRate && validated.projectId) {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, validated.projectId))

      if (project?.hourlyRate) {
        hourlyRate = project.hourlyRate
      }
    }

    const newEntry = {
      id: crypto.randomUUID(),
      userId: validated.userId,
      projectId: validated.projectId || null,
      taskDescription: validated.taskDescription || null,
      startTime: validated.startTime,
      endTime: validated.endTime || null,
      duration: duration ?? null,
      billable: validated.billable,
      hourlyRate,
      status: validated.endTime ? ('completed' as const) : ('running' as const),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const [created] = await db.insert(timeEntries).values(newEntry).returning()

    return { success: true, data: created }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create time entry' }
  }
}

/**
 * Get time entries with filters
 */
export async function getTimeEntries(
  filters: z.infer<typeof timeEntriesFilterSchema>
): Promise<ActionResult<TimeEntry[]>> {
  try {
    const validated = timeEntriesFilterSchema.parse(filters)
    const conditions = [eq(timeEntries.userId, validated.userId)]

    if (validated.projectId) {
      conditions.push(eq(timeEntries.projectId, validated.projectId))
    }

    if (validated.startDate) {
      conditions.push(gte(timeEntries.startTime, validated.startDate))
    }

    if (validated.endDate) {
      conditions.push(lte(timeEntries.startTime, validated.endDate))
    }

    if (validated.billable !== undefined) {
      conditions.push(eq(timeEntries.billable, validated.billable))
    }

    if (validated.status) {
      conditions.push(eq(timeEntries.status, validated.status))
    }

    const results = await db
      .select()
      .from(timeEntries)
      .where(and(...conditions))
      .orderBy(desc(timeEntries.startTime))

    return { success: true, data: results }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to fetch time entries' }
  }
}

/**
 * Get a single time entry by ID
 */
export async function getTimeEntry(id: string): Promise<ActionResult<TimeEntry>> {
  try {
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id))

    if (!entry) {
      return { success: false, error: 'Time entry not found' }
    }

    return { success: true, data: entry }
  } catch (error) {
    return { success: false, error: 'Failed to fetch time entry' }
  }
}

/**
 * Update a time entry
 */
export async function updateTimeEntry(
  id: string,
  input: z.infer<typeof updateTimeEntrySchema>
): Promise<ActionResult<TimeEntry>> {
  try {
    const validated = updateTimeEntrySchema.parse(input)

    // Get existing entry for duration recalculation
    const [existing] = await db.select().from(timeEntries).where(eq(timeEntries.id, id))

    if (!existing) {
      return { success: false, error: 'Time entry not found' }
    }

    // Recalculate duration if times changed
    let duration = validated.duration
    const startTime = validated.startTime || existing.startTime
    const endTime = validated.endTime || existing.endTime

    if ((validated.startTime || validated.endTime) && endTime) {
      duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
    }

    const [updated] = await db
      .update(timeEntries)
      .set({
        ...validated,
        duration: duration ?? existing.duration,
        updatedAt: new Date(),
      })
      .where(eq(timeEntries.id, id))
      .returning()

    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update time entry' }
  }
}

/**
 * Delete a time entry
 */
export async function deleteTimeEntry(id: string): Promise<ActionResult<void>> {
  try {
    await db.delete(timeEntries).where(eq(timeEntries.id, id))
    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: 'Failed to delete time entry' }
  }
}

// ============================================
// REPORTING ACTIONS
// ============================================

type ProjectSummary = {
  projectId: string | null
  projectName: string
  totalMinutes: number
  billableMinutes: number
  nonBillableMinutes: number
  billableAmount: number
  entryCount: number
}

type DateSummary = {
  totalMinutes: number
  billableMinutes: number
  nonBillableMinutes: number
  billableAmount: number
  entryCount: number
}

type DailyTotal = {
  date: string
  totalMinutes: number
  billableMinutes: number
  nonBillableMinutes: number
  billableAmount: number
  entryCount: number
}

type WeeklyReport = {
  weekStart: string
  weekEnd: string
  totalMinutes: number
  billableMinutes: number
  nonBillableMinutes: number
  billableAmount: number
  entryCount: number
  avgMinutesPerDay: number
  dailyTotals: DailyTotal[]
  projectTotals: ProjectSummary[]
}

/**
 * Get time totals grouped by project
 */
export async function getTimeByProject(filters: {
  userId: string
  startDate?: Date
  endDate?: Date
}): Promise<ActionResult<ProjectSummary[]>> {
  try {
    const conditions = [eq(timeEntries.userId, filters.userId)]

    if (filters.startDate) {
      conditions.push(gte(timeEntries.startTime, filters.startDate))
    }

    if (filters.endDate) {
      conditions.push(lte(timeEntries.startTime, filters.endDate))
    }

    // Get all entries matching filters
    const entries = await db
      .select({
        entry: timeEntries,
        project: projects,
      })
      .from(timeEntries)
      .leftJoin(projects, eq(timeEntries.projectId, projects.id))
      .where(and(...conditions))

    // Aggregate by project
    const projectMap = new Map<string | null, ProjectSummary>()

    for (const { entry, project } of entries) {
      const projectId = entry.projectId
      const key = projectId || '__no_project__'

      if (!projectMap.has(key)) {
        projectMap.set(key, {
          projectId,
          projectName: project?.name || 'No Project',
          totalMinutes: 0,
          billableMinutes: 0,
          nonBillableMinutes: 0,
          billableAmount: 0,
          entryCount: 0,
        })
      }

      const summary = projectMap.get(key)!
      const duration = entry.duration || 0
      const hourlyRate = entry.hourlyRate || project?.hourlyRate || 0

      summary.totalMinutes += duration
      summary.entryCount += 1

      if (entry.billable) {
        summary.billableMinutes += duration
        summary.billableAmount += (duration / 60) * hourlyRate
      } else {
        summary.nonBillableMinutes += duration
      }
    }

    // Round billable amounts to 2 decimal places
    const results = Array.from(projectMap.values()).map(p => ({
      ...p,
      billableAmount: Math.round(p.billableAmount * 100) / 100,
    }))

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch project time summary' }
  }
}

/**
 * Get time totals for a date range
 */
export async function getTimeByDateRange(filters: {
  userId: string
  startDate: Date
  endDate: Date
}): Promise<ActionResult<DateSummary>> {
  try {
    const entries = await db
      .select({
        entry: timeEntries,
        project: projects,
      })
      .from(timeEntries)
      .leftJoin(projects, eq(timeEntries.projectId, projects.id))
      .where(
        and(
          eq(timeEntries.userId, filters.userId),
          gte(timeEntries.startTime, filters.startDate),
          lte(timeEntries.startTime, filters.endDate)
        )
      )

    const summary: DateSummary = {
      totalMinutes: 0,
      billableMinutes: 0,
      nonBillableMinutes: 0,
      billableAmount: 0,
      entryCount: entries.length,
    }

    for (const { entry, project } of entries) {
      const duration = entry.duration || 0
      const hourlyRate = entry.hourlyRate || project?.hourlyRate || 0

      summary.totalMinutes += duration

      if (entry.billable) {
        summary.billableMinutes += duration
        summary.billableAmount += (duration / 60) * hourlyRate
      } else {
        summary.nonBillableMinutes += duration
      }
    }

    summary.billableAmount = Math.round(summary.billableAmount * 100) / 100

    return { success: true, data: summary }
  } catch (error) {
    return { success: false, error: 'Failed to fetch date range summary' }
  }
}

/**
 * Get daily totals for a date range
 */
export async function getDailyTotals(filters: {
  userId: string
  startDate: Date
  endDate: Date
}): Promise<ActionResult<DailyTotal[]>> {
  try {
    const entries = await db
      .select({
        entry: timeEntries,
        project: projects,
      })
      .from(timeEntries)
      .leftJoin(projects, eq(timeEntries.projectId, projects.id))
      .where(
        and(
          eq(timeEntries.userId, filters.userId),
          gte(timeEntries.startTime, filters.startDate),
          lte(timeEntries.startTime, filters.endDate)
        )
      )

    // Group by date
    const dailyMap = new Map<string, DailyTotal>()

    for (const { entry, project } of entries) {
      const date = entry.startTime.toISOString().split('T')[0]

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          totalMinutes: 0,
          billableMinutes: 0,
          nonBillableMinutes: 0,
          billableAmount: 0,
          entryCount: 0,
        })
      }

      const daily = dailyMap.get(date)!
      const duration = entry.duration || 0
      const hourlyRate = entry.hourlyRate || project?.hourlyRate || 0

      daily.totalMinutes += duration
      daily.entryCount += 1

      if (entry.billable) {
        daily.billableMinutes += duration
        daily.billableAmount += (duration / 60) * hourlyRate
      } else {
        daily.nonBillableMinutes += duration
      }
    }

    // Sort by date and round amounts
    const results = Array.from(dailyMap.values())
      .map(d => ({
        ...d,
        billableAmount: Math.round(d.billableAmount * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch daily totals' }
  }
}

/**
 * Get comprehensive weekly report
 */
export async function getWeeklyReport(filters: {
  userId: string
  weekStart: Date
}): Promise<ActionResult<WeeklyReport>> {
  try {
    // Calculate week end (7 days from start)
    const weekEnd = new Date(filters.weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Get all data
    const [dateRangeResult, dailyTotalsResult, projectTotalsResult] = await Promise.all([
      getTimeByDateRange({
        userId: filters.userId,
        startDate: filters.weekStart,
        endDate: weekEnd,
      }),
      getDailyTotals({
        userId: filters.userId,
        startDate: filters.weekStart,
        endDate: weekEnd,
      }),
      getTimeByProject({
        userId: filters.userId,
        startDate: filters.weekStart,
        endDate: weekEnd,
      }),
    ])

    if (!dateRangeResult.success || !dailyTotalsResult.success || !projectTotalsResult.success) {
      return { success: false, error: 'Failed to compile weekly report' }
    }

    const summary = dateRangeResult.data!
    const dailyTotals = dailyTotalsResult.data!
    const projectTotals = projectTotalsResult.data!

    // Pad daily totals to include all 7 days
    const fullWeekDays: DailyTotal[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(filters.weekStart)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const existing = dailyTotals.find(d => d.date === dateStr)
      fullWeekDays.push(
        existing || {
          date: dateStr,
          totalMinutes: 0,
          billableMinutes: 0,
          nonBillableMinutes: 0,
          billableAmount: 0,
          entryCount: 0,
        }
      )
    }

    // Calculate average (only days with entries)
    const daysWorked = dailyTotals.filter(d => d.totalMinutes > 0).length
    const avgMinutesPerDay = daysWorked > 0 ? summary.totalMinutes / daysWorked : 0

    const report: WeeklyReport = {
      weekStart: filters.weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalMinutes: summary.totalMinutes,
      billableMinutes: summary.billableMinutes,
      nonBillableMinutes: summary.nonBillableMinutes,
      billableAmount: summary.billableAmount,
      entryCount: summary.entryCount,
      avgMinutesPerDay: Math.round(avgMinutesPerDay),
      dailyTotals: fullWeekDays,
      projectTotals,
    }

    return { success: true, data: report }
  } catch (error) {
    return { success: false, error: 'Failed to generate weekly report' }
  }
}
