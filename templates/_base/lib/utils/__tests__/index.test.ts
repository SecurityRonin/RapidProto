import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  formatCurrency,
  formatRelativeTime,
  sleep,
  debounce,
  truncate,
  getInitials,
} from '../index'

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active', false && 'inactive')).toBe('base active')
    })

    it('should merge conflicting Tailwind classes', () => {
      // tailwind-merge should keep the last class
      expect(cn('p-4', 'p-8')).toBe('p-8')
    })
  })

  describe('formatCurrency', () => {
    it('should format USD by default', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should format other currencies', () => {
      expect(formatCurrency(1234.56, 'EUR', 'de-DE')).toContain('1.234,56')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-100)).toBe('-$100.00')
    })
  })

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should show "just now" for recent times', () => {
      const now = new Date()
      vi.setSystemTime(now)

      const recent = new Date(now.getTime() - 30 * 1000) // 30 seconds ago
      expect(formatRelativeTime(recent)).toBe('just now')
    })

    it('should show minutes ago', () => {
      const now = new Date()
      vi.setSystemTime(now)

      const past = new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
      expect(formatRelativeTime(past)).toBe('5m ago')
    })

    it('should show hours ago', () => {
      const now = new Date()
      vi.setSystemTime(now)

      const past = new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3 hours ago
      expect(formatRelativeTime(past)).toBe('3h ago')
    })

    it('should show days ago', () => {
      const now = new Date()
      vi.setSystemTime(now)

      const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      expect(formatRelativeTime(past)).toBe('2d ago')
    })
  })

  describe('sleep', () => {
    it('should delay execution', async () => {
      vi.useFakeTimers()
      const promise = sleep(1000)
      vi.advanceTimersByTime(1000)
      await promise
      expect(true).toBe(true) // If we get here, sleep worked
      vi.useRealTimers()
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should debounce function calls', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      debounced()
      debounced()

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments correctly', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('hello', 'world')

      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('hello', 'world')
    })
  })

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...')
    })

    it('should not truncate short strings', () => {
      expect(truncate('Hi', 10)).toBe('Hi')
    })

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello')
    })
  })

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should handle multiple names', () => {
      expect(getInitials('John Michael Doe')).toBe('JM')
    })

    it('should uppercase initials', () => {
      expect(getInitials('john doe')).toBe('JD')
    })
  })
})
