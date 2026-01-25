import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createItem, getItems, updateItem, deleteItem } from '../items'
import { setupTestDb, seedTestUser, clearDatabase } from '@/test/db-helpers'

// Mock Clerk auth
vi.mock('@clerk/nextjs', async () => {
  const actual = await vi.importActual('@clerk/nextjs')
  return {
    ...actual,
    auth: vi.fn(() => ({ userId: 'user_test123' })),
  }
})

describe('Item Actions', () => {
  let db: Awaited<ReturnType<typeof setupTestDb>>

  beforeEach(async () => {
    db = await setupTestDb()
    await clearDatabase(db)
    await seedTestUser(db)
  })

  describe('createItem', () => {
    it('should create a new item', async () => {
      const result = await createItem({
        title: 'New Task',
        description: 'Task description',
      })

      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('New Task')
      expect(result.data?.userId).toBe('user_test123')
    })

    it('should validate required fields', async () => {
      const result = await createItem({
        // @ts-expect-error Testing validation
        title: '',
        description: 'No title',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject unauthenticated requests', async () => {
      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: null } as any)

      const result = await createItem({
        title: 'Unauthorized',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('getItems', () => {
    it('should return user items', async () => {
      await createItem({ title: 'Item 1' })
      await createItem({ title: 'Item 2' })

      const result = await getItems()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('should filter by status', async () => {
      await createItem({ title: 'Active Item' })

      const item2 = await createItem({ title: 'Inactive Item' })
      if (item2.data) {
        await updateItem(item2.data.id, { status: 'inactive' })
      }

      const result = await getItems({ status: 'active' })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].title).toBe('Active Item')
    })

    it('should only return current user items', async () => {
      const { auth } = await import('@clerk/nextjs')

      // Create item as user_test123
      await createItem({ title: 'My Item' })

      // Switch to different user
      vi.mocked(auth).mockReturnValueOnce({ userId: 'user_other' } as any)

      const result = await getItems()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })
  })

  describe('updateItem', () => {
    it('should update an item', async () => {
      const created = await createItem({ title: 'Original' })

      const result = await updateItem(created.data!.id, {
        title: 'Updated',
        status: 'inactive',
      })

      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('Updated')
      expect(result.data?.status).toBe('inactive')
    })

    it('should not update items from other users', async () => {
      const created = await createItem({ title: 'My Item' })

      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: 'user_other' } as any)

      const result = await updateItem(created.data!.id, { title: 'Hacked' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should validate update data', async () => {
      const created = await createItem({ title: 'Item' })

      const result = await updateItem(created.data!.id, {
        // @ts-expect-error Testing validation
        status: 'invalid_status',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('deleteItem', () => {
    it('should delete an item', async () => {
      const created = await createItem({ title: 'To Delete' })

      const result = await deleteItem(created.data!.id)

      expect(result.success).toBe(true)

      const check = await getItems()
      expect(check.data).toHaveLength(0)
    })

    it('should not delete items from other users', async () => {
      const created = await createItem({ title: 'Protected' })

      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: 'user_other' } as any)

      const result = await deleteItem(created.data!.id)

      expect(result.success).toBe(false)
    })
  })
})
