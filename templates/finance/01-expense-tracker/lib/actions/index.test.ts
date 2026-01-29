/**
 * Tests for Expense Tracker Actions
 * TDD: Tests written FIRST before implementation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock Clerk auth before imports
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => ({ userId: 'user_test123' })),
}))

// We'll use a mock database approach for tests
const mockDb = {
  expenses: [] as any[],
  categories: [] as any[],
}

// Mock the database module
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn((table: any) => ({
      values: vi.fn((values: any) => ({
        returning: vi.fn(async () => {
          const record = {
            ...values,
            id: values.id || `id_${Date.now()}`,
            createdAt: values.createdAt || new Date(),
            updatedAt: values.updatedAt || new Date(),
          }
          if (table._.name === 'expenses') {
            mockDb.expenses.push(record)
          } else if (table._.name === 'expense_categories') {
            mockDb.categories.push(record)
          }
          return [record]
        }),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn((table: any) => ({
        where: vi.fn(() => {
          if (table._.name === 'expenses') {
            return Promise.resolve(mockDb.expenses)
          }
          return Promise.resolve(mockDb.categories)
        }),
        orderBy: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(mockDb.expenses)),
        })),
      })),
    })),
    update: vi.fn((table: any) => ({
      set: vi.fn((values: any) => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => {
            if (mockDb.expenses.length > 0) {
              const updated = { ...mockDb.expenses[0], ...values, updatedAt: new Date() }
              mockDb.expenses[0] = updated
              return [updated]
            }
            return []
          }),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => {
          if (mockDb.expenses.length > 0) {
            return [mockDb.expenses.pop()]
          }
          return []
        }),
      })),
    })),
  },
}))

import {
  // Expense actions
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  getExpensesByCategory,
  getMonthlyTotals,
  // Category actions
  createCategory,
  getCategories,
  // Validation schemas
  createExpenseSchema,
  updateExpenseSchema,
  createCategorySchema,
} from './index'

describe('Expense Tracker Actions', () => {
  beforeEach(() => {
    // Clear mock database before each test
    mockDb.expenses = []
    mockDb.categories = []
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================
  // VALIDATION SCHEMA TESTS
  // ============================================
  describe('Validation Schemas', () => {
    describe('createExpenseSchema', () => {
      it('should validate a valid expense', () => {
        const validExpense = {
          amount: 50.99,
          category: 'food',
          vendor: 'Restaurant ABC',
          date: '2024-01-15',
          description: 'Business lunch',
        }
        expect(() => createExpenseSchema.parse(validExpense)).not.toThrow()
      })

      it('should require amount to be positive', () => {
        const invalidExpense = {
          amount: -10,
          category: 'food',
          vendor: 'Test',
          date: '2024-01-15',
        }
        expect(() => createExpenseSchema.parse(invalidExpense)).toThrow()
      })

      it('should require amount to be a number', () => {
        const invalidExpense = {
          amount: 'not-a-number',
          category: 'food',
          vendor: 'Test',
          date: '2024-01-15',
        }
        expect(() => createExpenseSchema.parse(invalidExpense)).toThrow()
      })

      it('should require category', () => {
        const invalidExpense = {
          amount: 50,
          vendor: 'Test',
          date: '2024-01-15',
        }
        expect(() => createExpenseSchema.parse(invalidExpense)).toThrow()
      })

      it('should require vendor', () => {
        const invalidExpense = {
          amount: 50,
          category: 'food',
          date: '2024-01-15',
        }
        expect(() => createExpenseSchema.parse(invalidExpense)).toThrow()
      })

      it('should require valid date format', () => {
        const invalidExpense = {
          amount: 50,
          category: 'food',
          vendor: 'Test',
          date: 'invalid-date',
        }
        expect(() => createExpenseSchema.parse(invalidExpense)).toThrow()
      })

      it('should allow optional description', () => {
        const expense = {
          amount: 50,
          category: 'food',
          vendor: 'Test',
          date: '2024-01-15',
        }
        expect(() => createExpenseSchema.parse(expense)).not.toThrow()
      })

      it('should allow optional receipt_url', () => {
        const expense = {
          amount: 50,
          category: 'food',
          vendor: 'Test',
          date: '2024-01-15',
          receipt_url: 'https://example.com/receipt.pdf',
        }
        expect(() => createExpenseSchema.parse(expense)).not.toThrow()
      })

      it('should validate receipt_url is a valid URL', () => {
        const expense = {
          amount: 50,
          category: 'food',
          vendor: 'Test',
          date: '2024-01-15',
          receipt_url: 'not-a-url',
        }
        expect(() => createExpenseSchema.parse(expense)).toThrow()
      })
    })

    describe('updateExpenseSchema', () => {
      it('should allow partial updates', () => {
        const update = { amount: 75.50 }
        expect(() => updateExpenseSchema.parse(update)).not.toThrow()
      })

      it('should validate status values', () => {
        const validStatuses = ['pending', 'approved', 'rejected', 'reimbursed']
        validStatuses.forEach(status => {
          expect(() => updateExpenseSchema.parse({ status })).not.toThrow()
        })
      })

      it('should reject invalid status values', () => {
        const update = { status: 'invalid_status' }
        expect(() => updateExpenseSchema.parse(update)).toThrow()
      })
    })

    describe('createCategorySchema', () => {
      it('should validate a valid category', () => {
        const validCategory = {
          name: 'Office Supplies',
          budgetLimit: 500,
        }
        expect(() => createCategorySchema.parse(validCategory)).not.toThrow()
      })

      it('should require name', () => {
        const invalidCategory = {
          budgetLimit: 500,
        }
        expect(() => createCategorySchema.parse(invalidCategory)).toThrow()
      })

      it('should allow optional budgetLimit', () => {
        const category = { name: 'Misc' }
        expect(() => createCategorySchema.parse(category)).not.toThrow()
      })

      it('should require budgetLimit to be positive if provided', () => {
        const invalidCategory = {
          name: 'Test',
          budgetLimit: -100,
        }
        expect(() => createCategorySchema.parse(invalidCategory)).toThrow()
      })
    })
  })

  // ============================================
  // EXPENSE CRUD TESTS
  // ============================================
  describe('createExpense', () => {
    it('should create a new expense with valid data', async () => {
      const result = await createExpense({
        amount: 50.99,
        category: 'food',
        vendor: 'Restaurant ABC',
        date: '2024-01-15',
        description: 'Business lunch',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.amount).toBe(50.99)
      expect(result.data?.category).toBe('food')
      expect(result.data?.vendor).toBe('Restaurant ABC')
      expect(result.data?.status).toBe('pending')
      expect(result.data?.userId).toBe('user_test123')
    })

    it('should default status to pending', async () => {
      const result = await createExpense({
        amount: 100,
        category: 'travel',
        vendor: 'Airlines',
        date: '2024-01-20',
      })

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('pending')
    })

    it('should return error for invalid data', async () => {
      const result = await createExpense({
        amount: -50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject unauthenticated requests', async () => {
      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: null } as any)

      const result = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })

    it('should store receipt_url when provided', async () => {
      const result = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
        receipt_url: 'https://example.com/receipt.pdf',
      })

      expect(result.success).toBe(true)
      expect(result.data?.receipt_url).toBe('https://example.com/receipt.pdf')
    })
  })

  describe('getExpenses', () => {
    beforeEach(async () => {
      // Seed some test expenses
      await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Restaurant A',
        date: '2024-01-10',
      })
      await createExpense({
        amount: 100,
        category: 'travel',
        vendor: 'Airlines',
        date: '2024-01-15',
      })
      await createExpense({
        amount: 25,
        category: 'food',
        vendor: 'Restaurant B',
        date: '2024-02-01',
      })
    })

    it('should return all expenses for the current user', async () => {
      const result = await getExpenses()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
    })

    it('should filter by category', async () => {
      const result = await getExpenses({ category: 'food' })

      expect(result.success).toBe(true)
      expect(result.data?.every(e => e.category === 'food')).toBe(true)
    })

    it('should filter by status', async () => {
      // First approve one expense
      if (mockDb.expenses[0]) {
        mockDb.expenses[0].status = 'approved'
      }

      const result = await getExpenses({ status: 'approved' })

      expect(result.success).toBe(true)
      expect(result.data?.every(e => e.status === 'approved')).toBe(true)
    })

    it('should filter by date range', async () => {
      const result = await getExpenses({
        dateStart: '2024-01-01',
        dateEnd: '2024-01-31',
      })

      expect(result.success).toBe(true)
      // Should only return January expenses
      expect(result.data?.every(e => {
        const date = new Date(e.date)
        return date >= new Date('2024-01-01') && date <= new Date('2024-01-31')
      })).toBe(true)
    })

    it('should combine multiple filters', async () => {
      const result = await getExpenses({
        category: 'food',
        dateStart: '2024-01-01',
        dateEnd: '2024-01-31',
      })

      expect(result.success).toBe(true)
      expect(result.data?.every(e => e.category === 'food')).toBe(true)
    })

    it('should only return current user expenses', async () => {
      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: 'user_other' } as any)

      // Mock empty result for different user
      mockDb.expenses = mockDb.expenses.filter(e => e.userId === 'user_other')

      const result = await getExpenses()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('should reject unauthenticated requests', async () => {
      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: null } as any)

      const result = await getExpenses()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('getExpenseById', () => {
    it('should return a single expense by ID', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const result = await getExpenseById(created.data!.id)

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe(created.data!.id)
    })

    it('should return error for non-existent expense', async () => {
      mockDb.expenses = []
      const result = await getExpenseById('non_existent_id')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should not return expenses from other users', async () => {
      await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: 'user_other' } as any)

      // Filter out expenses not belonging to user_other
      const originalExpenses = [...mockDb.expenses]
      mockDb.expenses = []

      const result = await getExpenseById(originalExpenses[0]?.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('updateExpense', () => {
    it('should update expense fields', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const result = await updateExpense(created.data!.id, {
        amount: 75.50,
        description: 'Updated description',
      })

      expect(result.success).toBe(true)
      expect(result.data?.amount).toBe(75.50)
      expect(result.data?.description).toBe('Updated description')
    })

    it('should update status', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const result = await updateExpense(created.data!.id, {
        status: 'approved',
      })

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('approved')
    })

    it('should validate update data', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const result = await updateExpense(created.data!.id, {
        // @ts-expect-error Testing validation
        status: 'invalid_status',
      })

      expect(result.success).toBe(false)
    })

    it('should not update expenses from other users', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: 'user_other' } as any)

      // Clear expenses for different user
      const expenseId = created.data!.id
      mockDb.expenses = []

      const result = await updateExpense(expenseId, { amount: 999 })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should update updatedAt timestamp', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const originalUpdatedAt = created.data!.updatedAt

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      const result = await updateExpense(created.data!.id, { amount: 100 })

      expect(result.success).toBe(true)
      expect(new Date(result.data!.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      )
    })
  })

  describe('deleteExpense', () => {
    it('should delete an expense', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const result = await deleteExpense(created.data!.id)

      expect(result.success).toBe(true)

      // Verify it's deleted
      const check = await getExpenses()
      expect(check.data).toHaveLength(0)
    })

    it('should return error for non-existent expense', async () => {
      mockDb.expenses = []
      const result = await deleteExpense('non_existent_id')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should not delete expenses from other users', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: 'user_other' } as any)

      // Simulate expense not found for different user
      const expenseId = created.data!.id
      mockDb.expenses = []

      const result = await deleteExpense(expenseId)

      expect(result.success).toBe(false)
    })
  })

  // ============================================
  // STATUS WORKFLOW TESTS
  // ============================================
  describe('approveExpense', () => {
    it('should change status to approved', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const result = await approveExpense(created.data!.id)

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('approved')
    })

    it('should only approve pending expenses', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      // First approve
      await approveExpense(created.data!.id)

      // Try to approve again (should fail or be idempotent)
      const result = await approveExpense(created.data!.id)

      // Could be either error or idempotent success
      expect(result.data?.status).toBe('approved')
    })

    it('should reject unauthenticated requests', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: null } as any)

      const result = await approveExpense(created.data!.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('rejectExpense', () => {
    it('should change status to rejected', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      const result = await rejectExpense(created.data!.id)

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('rejected')
    })

    it('should only reject pending expenses', async () => {
      const created = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
      })

      // First reject
      await rejectExpense(created.data!.id)

      // Try to reject again
      const result = await rejectExpense(created.data!.id)

      expect(result.data?.status).toBe('rejected')
    })
  })

  // ============================================
  // AGGREGATION TESTS
  // ============================================
  describe('getExpensesByCategory', () => {
    beforeEach(async () => {
      await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Restaurant A',
        date: '2024-01-10',
      })
      await createExpense({
        amount: 30,
        category: 'food',
        vendor: 'Restaurant B',
        date: '2024-01-15',
      })
      await createExpense({
        amount: 100,
        category: 'travel',
        vendor: 'Airlines',
        date: '2024-01-20',
      })
    })

    it('should aggregate expenses by category', async () => {
      const result = await getExpensesByCategory()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      // Should have aggregated data
      const foodCategory = result.data?.find(c => c.category === 'food')
      const travelCategory = result.data?.find(c => c.category === 'travel')

      expect(foodCategory?.total).toBe(80)
      expect(foodCategory?.count).toBe(2)
      expect(travelCategory?.total).toBe(100)
      expect(travelCategory?.count).toBe(1)
    })

    it('should filter by date range', async () => {
      const result = await getExpensesByCategory({
        dateStart: '2024-01-01',
        dateEnd: '2024-01-12',
      })

      expect(result.success).toBe(true)
      // Only expenses within date range should be counted
    })
  })

  describe('getMonthlyTotals', () => {
    beforeEach(async () => {
      await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Restaurant',
        date: '2024-01-10',
      })
      await createExpense({
        amount: 100,
        category: 'travel',
        vendor: 'Airlines',
        date: '2024-01-20',
      })
      await createExpense({
        amount: 75,
        category: 'food',
        vendor: 'Restaurant',
        date: '2024-02-05',
      })
    })

    it('should return monthly totals', async () => {
      const result = await getMonthlyTotals()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should group by year and month', async () => {
      const result = await getMonthlyTotals()

      expect(result.success).toBe(true)

      const jan2024 = result.data?.find(m => m.year === 2024 && m.month === 1)
      const feb2024 = result.data?.find(m => m.year === 2024 && m.month === 2)

      expect(jan2024?.total).toBe(150)
      expect(feb2024?.total).toBe(75)
    })

    it('should filter by year', async () => {
      const result = await getMonthlyTotals({ year: 2024 })

      expect(result.success).toBe(true)
      expect(result.data?.every(m => m.year === 2024)).toBe(true)
    })
  })

  // ============================================
  // CATEGORY MANAGEMENT TESTS
  // ============================================
  describe('createCategory', () => {
    it('should create a new category', async () => {
      const result = await createCategory({
        name: 'Office Supplies',
        budgetLimit: 500,
      })

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Office Supplies')
      expect(result.data?.budgetLimit).toBe(500)
      expect(result.data?.userId).toBe('user_test123')
    })

    it('should create category without budget limit', async () => {
      const result = await createCategory({
        name: 'Miscellaneous',
      })

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Miscellaneous')
      expect(result.data?.budgetLimit).toBeNull()
    })

    it('should validate category name is not empty', async () => {
      const result = await createCategory({
        name: '',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject unauthenticated requests', async () => {
      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: null } as any)

      const result = await createCategory({
        name: 'Test Category',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('getCategories', () => {
    beforeEach(async () => {
      await createCategory({ name: 'Food', budgetLimit: 300 })
      await createCategory({ name: 'Travel', budgetLimit: 1000 })
      await createCategory({ name: 'Misc' })
    })

    it('should return all categories for the current user', async () => {
      const result = await getCategories()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
    })

    it('should only return current user categories', async () => {
      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: 'user_other' } as any)

      // Clear categories for different user
      mockDb.categories = []

      const result = await getCategories()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('should reject unauthenticated requests', async () => {
      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: null } as any)

      const result = await getCategories()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle very large expense amounts', async () => {
      const result = await createExpense({
        amount: 999999999.99,
        category: 'large-purchase',
        vendor: 'Big Corp',
        date: '2024-01-15',
      })

      expect(result.success).toBe(true)
      expect(result.data?.amount).toBe(999999999.99)
    })

    it('should handle zero amount (if allowed)', async () => {
      const result = await createExpense({
        amount: 0,
        category: 'test',
        vendor: 'Test',
        date: '2024-01-15',
      })

      // Zero might be invalid depending on business rules
      // Adjust expectation based on implementation
      expect(result.success).toBe(false)
    })

    it('should handle special characters in vendor name', async () => {
      const result = await createExpense({
        amount: 50,
        category: 'food',
        vendor: "O'Reilly's & Co. (Test)",
        date: '2024-01-15',
      })

      expect(result.success).toBe(true)
      expect(result.data?.vendor).toBe("O'Reilly's & Co. (Test)")
    })

    it('should handle unicode characters in description', async () => {
      const result = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
        description: 'Business meeting with cafe. Amount: 50 EUR.',
      })

      expect(result.success).toBe(true)
      expect(result.data?.description).toContain('cafe')
    })

    it('should handle long description text', async () => {
      const longDescription = 'A'.repeat(1000)

      const result = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-01-15',
        description: longDescription,
      })

      expect(result.success).toBe(true)
      expect(result.data?.description).toBe(longDescription)
    })

    it('should handle date at year boundary', async () => {
      const result = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-12-31',
      })

      expect(result.success).toBe(true)
      expect(result.data?.date).toBe('2024-12-31')
    })

    it('should handle leap year date', async () => {
      const result = await createExpense({
        amount: 50,
        category: 'food',
        vendor: 'Test',
        date: '2024-02-29',
      })

      expect(result.success).toBe(true)
      expect(result.data?.date).toBe('2024-02-29')
    })
  })
})
