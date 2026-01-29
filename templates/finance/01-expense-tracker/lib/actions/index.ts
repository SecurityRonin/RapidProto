/**
 * Template #1: Expense Tracker
 * Server actions with validation and error handling
 */

'use server'

import { auth } from '@clerk/nextjs'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import {
  expenses,
  expenseCategories,
  EXPENSE_STATUSES,
  type Expense,
  type ExpenseCategory,
} from '@/lib/db/schema'

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Schema for creating a new expense
 */
export const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  vendor: z.string().min(1, 'Vendor is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  description: z.string().optional(),
  receipt_url: z.string().url('Receipt URL must be a valid URL').optional(),
})

/**
 * Schema for updating an expense
 */
export const updateExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  category: z.string().min(1).optional(),
  vendor: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description: z.string().optional(),
  receipt_url: z.string().url().optional().nullable(),
  status: z.enum(EXPENSE_STATUSES).optional(),
})

/**
 * Schema for creating a category
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  budgetLimit: z.number().positive('Budget limit must be positive').optional(),
})

/**
 * Schema for filtering expenses
 */
const expenseFiltersSchema = z.object({
  category: z.string().optional(),
  status: z.enum(EXPENSE_STATUSES).optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
})

// ============================================
// RETURN TYPE HELPERS
// ============================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================
// EXPENSE CRUD ACTIONS
// ============================================

/**
 * Create a new expense
 */
export async function createExpense(
  input: z.infer<typeof createExpenseSchema>
): Promise<ActionResult<Expense>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = createExpenseSchema.parse(input)

    const newExpense = {
      id: nanoid(),
      amount: validated.amount,
      category: validated.category,
      vendor: validated.vendor,
      date: validated.date,
      description: validated.description || null,
      receipt_url: validated.receipt_url || null,
      status: 'pending' as const,
      userId,
    }

    const [created] = await db.insert(expenses).values(newExpense).returning()

    return { success: true, data: created }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create expense' }
  }
}

/**
 * Get expenses for the current user with optional filters
 */
export async function getExpenses(
  filters?: z.infer<typeof expenseFiltersSchema>
): Promise<ActionResult<Expense[]>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const conditions = [eq(expenses.userId, userId)]

    if (filters?.category) {
      conditions.push(eq(expenses.category, filters.category))
    }

    if (filters?.status) {
      conditions.push(eq(expenses.status, filters.status))
    }

    if (filters?.dateStart) {
      conditions.push(gte(expenses.date, filters.dateStart))
    }

    if (filters?.dateEnd) {
      conditions.push(lte(expenses.date, filters.dateEnd))
    }

    const results = await db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(expenses.date)

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch expenses' }
  }
}

/**
 * Get a single expense by ID
 */
export async function getExpenseById(id: string): Promise<ActionResult<Expense>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const [expense] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))

    if (!expense) {
      return { success: false, error: 'Expense not found' }
    }

    return { success: true, data: expense }
  } catch (error) {
    return { success: false, error: 'Failed to fetch expense' }
  }
}

/**
 * Update an expense
 */
export async function updateExpense(
  id: string,
  input: z.infer<typeof updateExpenseSchema>
): Promise<ActionResult<Expense>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = updateExpenseSchema.parse(input)

    const [updated] = await db
      .update(expenses)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning()

    if (!updated) {
      return { success: false, error: 'Expense not found' }
    }

    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update expense' }
  }
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<ActionResult<void>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const [deleted] = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning()

    if (!deleted) {
      return { success: false, error: 'Expense not found' }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: 'Failed to delete expense' }
  }
}

// ============================================
// STATUS WORKFLOW ACTIONS
// ============================================

/**
 * Approve an expense
 */
export async function approveExpense(id: string): Promise<ActionResult<Expense>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const [updated] = await db
      .update(expenses)
      .set({
        status: 'approved',
        updatedAt: new Date(),
      })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning()

    if (!updated) {
      return { success: false, error: 'Expense not found' }
    }

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to approve expense' }
  }
}

/**
 * Reject an expense
 */
export async function rejectExpense(id: string): Promise<ActionResult<Expense>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const [updated] = await db
      .update(expenses)
      .set({
        status: 'rejected',
        updatedAt: new Date(),
      })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning()

    if (!updated) {
      return { success: false, error: 'Expense not found' }
    }

    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to reject expense' }
  }
}

// ============================================
// AGGREGATION ACTIONS
// ============================================

/**
 * Category aggregation result
 */
export type CategoryAggregation = {
  category: string
  total: number
  count: number
}

/**
 * Get expenses aggregated by category
 */
export async function getExpensesByCategory(
  filters?: { dateStart?: string; dateEnd?: string }
): Promise<ActionResult<CategoryAggregation[]>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const conditions = [eq(expenses.userId, userId)]

    if (filters?.dateStart) {
      conditions.push(gte(expenses.date, filters.dateStart))
    }

    if (filters?.dateEnd) {
      conditions.push(lte(expenses.date, filters.dateEnd))
    }

    const results = await db
      .select({
        category: expenses.category,
        total: sql<number>`sum(${expenses.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(and(...conditions))
      .groupBy(expenses.category)

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch category aggregations' }
  }
}

/**
 * Monthly totals result
 */
export type MonthlyTotal = {
  year: number
  month: number
  total: number
  count: number
}

/**
 * Get monthly expense totals
 */
export async function getMonthlyTotals(
  filters?: { year?: number }
): Promise<ActionResult<MonthlyTotal[]>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const conditions = [eq(expenses.userId, userId)]

    if (filters?.year) {
      conditions.push(
        gte(expenses.date, `${filters.year}-01-01`),
        lte(expenses.date, `${filters.year}-12-31`)
      )
    }

    const results = await db
      .select({
        year: sql<number>`cast(strftime('%Y', ${expenses.date}) as integer)`,
        month: sql<number>`cast(strftime('%m', ${expenses.date}) as integer)`,
        total: sql<number>`sum(${expenses.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(and(...conditions))
      .groupBy(
        sql`strftime('%Y', ${expenses.date})`,
        sql`strftime('%m', ${expenses.date})`
      )
      .orderBy(
        sql`strftime('%Y', ${expenses.date})`,
        sql`strftime('%m', ${expenses.date})`
      )

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch monthly totals' }
  }
}

// ============================================
// CATEGORY MANAGEMENT ACTIONS
// ============================================

/**
 * Create a new expense category
 */
export async function createCategory(
  input: z.infer<typeof createCategorySchema>
): Promise<ActionResult<ExpenseCategory>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = createCategorySchema.parse(input)

    const newCategory = {
      id: nanoid(),
      name: validated.name,
      budgetLimit: validated.budgetLimit || null,
      userId,
    }

    const [created] = await db
      .insert(expenseCategories)
      .values(newCategory)
      .returning()

    return { success: true, data: created }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create category' }
  }
}

/**
 * Get all categories for the current user
 */
export async function getCategories(): Promise<ActionResult<ExpenseCategory[]>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const results = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.userId, userId))
      .orderBy(expenseCategories.name)

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch categories' }
  }
}
