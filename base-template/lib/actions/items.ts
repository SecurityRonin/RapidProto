'use server'

import { auth } from '@clerk/nextjs'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import { items, type Item } from '@/lib/db/schema'

/**
 * Server Actions for Items
 * Following TDD patterns with proper validation and error handling
 */

// Validation schemas
const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

const updateItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
})

// Return type helper
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Create a new item
 */
export async function createItem(
  input: z.infer<typeof createItemSchema>
): Promise<ActionResult<Item>> {
  try {
    // Check authentication
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validated = createItemSchema.parse(input)

    // Create item
    const newItem = {
      id: nanoid(),
      title: validated.title,
      description: validated.description || null,
      status: 'active' as const,
      userId,
    }

    const [created] = await db.insert(items).values(newItem).returning()

    return { success: true, data: created }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create item' }
  }
}

/**
 * Get items for current user
 */
export async function getItems(filters?: {
  status?: 'active' | 'inactive' | 'archived'
}): Promise<ActionResult<Item[]>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const conditions = [eq(items.userId, userId)]

    if (filters?.status) {
      conditions.push(eq(items.status, filters.status))
    }

    const results = await db
      .select()
      .from(items)
      .where(and(...conditions))
      .orderBy(items.createdAt)

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: 'Failed to fetch items' }
  }
}

/**
 * Update an item
 */
export async function updateItem(
  id: string,
  input: z.infer<typeof updateItemSchema>
): Promise<ActionResult<Item>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validated = updateItemSchema.parse(input)

    // Update only if user owns the item
    const [updated] = await db
      .update(items)
      .set(validated)
      .where(and(eq(items.id, id), eq(items.userId, userId)))
      .returning()

    if (!updated) {
      return { success: false, error: 'Item not found' }
    }

    return { success: true, data: updated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update item' }
  }
}

/**
 * Delete an item
 */
export async function deleteItem(id: string): Promise<ActionResult<void>> {
  try {
    const { userId } = auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const [deleted] = await db
      .delete(items)
      .where(and(eq(items.id, id), eq(items.userId, userId)))
      .returning()

    if (!deleted) {
      return { success: false, error: 'Item not found' }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: 'Failed to delete item' }
  }
}
