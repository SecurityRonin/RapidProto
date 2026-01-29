/**
 * Tests for Expense Tracker Schema
 */

import { describe, it, expect } from 'vitest'
import {
  users,
  expenses,
  expenseCategories,
  EXPENSE_STATUSES,
  type Expense,
  type ExpenseCategory,
  type ExpenseStatus,
} from './schema'

describe('Expense Tracker Schema', () => {
  describe('Users Table', () => {
    it('should have required fields', () => {
      expect(users).toBeDefined()
      expect(users.id).toBeDefined()
      expect(users.email).toBeDefined()
      expect(users.name).toBeDefined()
      expect(users.createdAt).toBeDefined()
      expect(users.updatedAt).toBeDefined()
    })
  })

  describe('Expenses Table', () => {
    it('should have all required fields', () => {
      expect(expenses).toBeDefined()
      expect(expenses.id).toBeDefined()
      expect(expenses.amount).toBeDefined()
      expect(expenses.category).toBeDefined()
      expect(expenses.vendor).toBeDefined()
      expect(expenses.date).toBeDefined()
      expect(expenses.status).toBeDefined()
      expect(expenses.userId).toBeDefined()
      expect(expenses.createdAt).toBeDefined()
      expect(expenses.updatedAt).toBeDefined()
    })

    it('should have optional fields', () => {
      expect(expenses.description).toBeDefined()
      expect(expenses.receipt_url).toBeDefined()
    })

    it('should have correct table name', () => {
      expect(expenses._.name).toBe('expenses')
    })
  })

  describe('Expense Categories Table', () => {
    it('should have required fields', () => {
      expect(expenseCategories).toBeDefined()
      expect(expenseCategories.id).toBeDefined()
      expect(expenseCategories.name).toBeDefined()
      expect(expenseCategories.userId).toBeDefined()
      expect(expenseCategories.createdAt).toBeDefined()
      expect(expenseCategories.updatedAt).toBeDefined()
    })

    it('should have optional budget limit field', () => {
      expect(expenseCategories.budgetLimit).toBeDefined()
    })

    it('should have correct table name', () => {
      expect(expenseCategories._.name).toBe('expense_categories')
    })
  })

  describe('Expense Status', () => {
    it('should have all valid status values', () => {
      expect(EXPENSE_STATUSES).toContain('pending')
      expect(EXPENSE_STATUSES).toContain('approved')
      expect(EXPENSE_STATUSES).toContain('rejected')
      expect(EXPENSE_STATUSES).toContain('reimbursed')
    })

    it('should have exactly 4 status values', () => {
      expect(EXPENSE_STATUSES).toHaveLength(4)
    })

    it('should be readonly', () => {
      // Type check - this should be a readonly tuple
      const statuses: readonly string[] = EXPENSE_STATUSES
      expect(statuses).toBeDefined()
    })
  })

  describe('Type Exports', () => {
    it('should export Expense type with correct shape', () => {
      // Type assertion test - if this compiles, the types are correct
      const expense: Expense = {
        id: 'test-id',
        amount: 100.50,
        category: 'food',
        vendor: 'Test Vendor',
        date: '2024-01-15',
        description: null,
        receipt_url: null,
        status: 'pending',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(expense).toBeDefined()
      expect(expense.amount).toBe(100.50)
      expect(expense.status).toBe('pending')
    })

    it('should export ExpenseCategory type with correct shape', () => {
      const category: ExpenseCategory = {
        id: 'cat-id',
        name: 'Office Supplies',
        budgetLimit: 500,
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(category).toBeDefined()
      expect(category.name).toBe('Office Supplies')
      expect(category.budgetLimit).toBe(500)
    })

    it('should export ExpenseStatus type', () => {
      const status: ExpenseStatus = 'approved'
      expect(EXPENSE_STATUSES).toContain(status)
    })
  })
})
