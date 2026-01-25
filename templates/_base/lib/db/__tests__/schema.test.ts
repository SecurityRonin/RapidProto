import { describe, it, expect, beforeEach } from 'vitest'
import { eq } from 'drizzle-orm'
import { setupTestDb, seedTestUser, seedTestItem, clearDatabase } from '@/test/db-helpers'
import { users, items } from '../schema'

describe('Database Schema', () => {
  let db: Awaited<ReturnType<typeof setupTestDb>>

  beforeEach(async () => {
    db = await setupTestDb()
    await clearDatabase(db)
  })

  describe('users table', () => {
    it('should insert a user', async () => {
      const newUser = {
        id: 'user_123',
        email: 'john@example.com',
        name: 'John Doe',
      }

      await db.insert(users).values(newUser)

      const result = await db.select().from(users).where(eq(users.id, 'user_123'))

      expect(result).toHaveLength(1)
      expect(result[0].email).toBe('john@example.com')
      expect(result[0].name).toBe('John Doe')
    })

    it('should auto-generate timestamps', async () => {
      const newUser = {
        id: 'user_456',
        email: 'jane@example.com',
      }

      await db.insert(users).values(newUser)

      const result = await db.select().from(users).where(eq(users.id, 'user_456'))

      expect(result[0].createdAt).toBeInstanceOf(Date)
      expect(result[0].updatedAt).toBeInstanceOf(Date)
    })

    it('should enforce email not null', async () => {
      const invalidUser = {
        id: 'user_789',
        // @ts-expect-error Testing constraint
        email: null,
      }

      await expect(db.insert(users).values(invalidUser)).rejects.toThrow()
    })
  })

  describe('items table', () => {
    beforeEach(async () => {
      await seedTestUser(db)
    })

    it('should insert an item', async () => {
      const newItem = {
        id: 'item_123',
        title: 'Test Item',
        description: 'Test Description',
        status: 'active' as const,
        userId: 'user_test123',
      }

      await db.insert(items).values(newItem)

      const result = await db.select().from(items).where(eq(items.id, 'item_123'))

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Test Item')
      expect(result[0].status).toBe('active')
    })

    it('should default status to active', async () => {
      const newItem = {
        id: 'item_456',
        title: 'Another Item',
        userId: 'user_test123',
      }

      await db.insert(items).values(newItem)

      const result = await db.select().from(items).where(eq(items.id, 'item_456'))

      expect(result[0].status).toBe('active')
    })

    it('should cascade delete items when user is deleted', async () => {
      await seedTestItem(db, 'user_test123')

      await db.delete(users).where(eq(users.id, 'user_test123'))

      const remainingItems = await db.select().from(items)
      expect(remainingItems).toHaveLength(0)
    })

    it('should enforce foreign key constraint', async () => {
      const invalidItem = {
        id: 'item_999',
        title: 'Orphan Item',
        userId: 'nonexistent_user',
      }

      await expect(db.insert(items).values(invalidItem)).rejects.toThrow()
    })
  })

  describe('relationships', () => {
    it('should query items with their users', async () => {
      await seedTestUser(db)
      await seedTestItem(db)

      const result = await db
        .select({
          item: items,
          user: users,
        })
        .from(items)
        .leftJoin(users, eq(items.userId, users.id))

      expect(result).toHaveLength(1)
      expect(result[0].item.title).toBe('Test Item')
      expect(result[0].user?.email).toBe('test@example.com')
    })
  })
})
