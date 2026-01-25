/**
 * Template #20: CPE CLE Tracking
 * Server actions
 */

'use server'

import { db } from '@/lib/db'
import { items } from '../db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

// Validation schemas
export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})

// Create item
export async function createItem(data: z.infer<typeof createItemSchema>) {
  const validated = createItemSchema.parse(data)

  const [item] = await db.insert(items).values({
    id: crypto.randomUUID(),
    ...validated,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()

  return { success: true, data: item }
}

// Get all items
export async function getItems() {
  const allItems = await db.select().from(items)
  return { success: true, data: allItems }
}

// Get single item
export async function getItem(id: string) {
  const [item] = await db.select().from(items).where(eq(items.id, id))
  if (!item) {
    return { success: false, error: 'Item not found' }
  }
  return { success: true, data: item }
}

// Update item
export async function updateItem(id: string, data: Partial<z.infer<typeof createItemSchema>>) {
  const [item] = await db
    .update(items)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning()

  if (!item) {
    return { success: false, error: 'Item not found' }
  }

  return { success: true, data: item }
}

// Delete item
export async function deleteItem(id: string) {
  await db.delete(items).where(eq(items.id, id))
  return { success: true }
}
