import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validateUrl,
  sanitizeInput,
  parseJsonSafely,
} from '../validation'

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(validateEmail('not-an-email')).toBe(false)
      expect(validateEmail('missing@domain')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://subdomain.example.com/path')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(validateUrl('not a url')).toBe(false)
      expect(validateUrl('example.com')).toBe(false) // Missing protocol
      expect(validateUrl('')).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
        'scriptalert("xss")/script'
      )
      expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello bWorld/b')
    })

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello')
    })

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput('   ')).toBe('')
    })
  })

  describe('parseJsonSafely', () => {
    it('should parse valid JSON', () => {
      const result = parseJsonSafely('{"name":"John","age":30}')
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ name: 'John', age: 30 })
    })

    it('should handle invalid JSON', () => {
      const result = parseJsonSafely('not json')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle empty strings', () => {
      const result = parseJsonSafely('')
      expect(result.success).toBe(false)
    })

    it('should parse arrays', () => {
      const result = parseJsonSafely('[1,2,3]')
      expect(result.success).toBe(true)
      expect(result.data).toEqual([1, 2, 3])
    })
  })
})
