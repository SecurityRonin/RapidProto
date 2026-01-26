/**
 * TDD: JSON Field Utilities Tests
 * Write tests FIRST, then implement to pass them
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseJsonField,
  parseStringArray,
  parseThreeWins,
  parsePainPoints,
  parseMustHaveFeatures,
  parseNiceToHaveFeatures,
  parseTags,
  serializeStringArray,
} from '@/lib/utils/json-fields'

describe('JSON Field Utilities', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('parseJsonField', () => {
    it('should parse valid JSON string', () => {
      const result = parseJsonField('["a", "b", "c"]', [])
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('should return fallback for null value', () => {
      const result = parseJsonField(null, ['default'])
      expect(result).toEqual(['default'])
    })

    it('should return fallback for empty string', () => {
      const result = parseJsonField('', ['default'])
      expect(result).toEqual(['default'])
    })

    it('should return fallback for invalid JSON', () => {
      const result = parseJsonField('not valid json', ['fallback'])
      expect(result).toEqual(['fallback'])
    })

    it('should warn on invalid JSON', () => {
      parseJsonField('invalid', [])
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to parse JSON field:',
        'invalid',
        expect.any(Error)
      )
    })

    it('should parse objects', () => {
      const result = parseJsonField('{"key": "value"}', {})
      expect(result).toEqual({ key: 'value' })
    })

    it('should parse numbers', () => {
      const result = parseJsonField('42', 0)
      expect(result).toBe(42)
    })

    it('should parse booleans', () => {
      const result = parseJsonField('true', false)
      expect(result).toBe(true)
    })
  })

  describe('parseStringArray', () => {
    it('should parse valid string array', () => {
      const result = parseStringArray('["one", "two", "three"]')
      expect(result).toEqual(['one', 'two', 'three'])
    })

    it('should return empty array for null', () => {
      const result = parseStringArray(null)
      expect(result).toEqual([])
    })

    it('should return empty array for invalid JSON', () => {
      const result = parseStringArray('not an array')
      expect(result).toEqual([])
    })

    it('should handle empty array JSON', () => {
      const result = parseStringArray('[]')
      expect(result).toEqual([])
    })
  })

  describe('Domain-specific parsers', () => {
    const validArray = '["item1", "item2"]'

    it('parseThreeWins should parse array', () => {
      expect(parseThreeWins(validArray)).toEqual(['item1', 'item2'])
      expect(parseThreeWins(null)).toEqual([])
    })

    it('parsePainPoints should parse array', () => {
      expect(parsePainPoints(validArray)).toEqual(['item1', 'item2'])
      expect(parsePainPoints(null)).toEqual([])
    })

    it('parseMustHaveFeatures should parse array', () => {
      expect(parseMustHaveFeatures(validArray)).toEqual(['item1', 'item2'])
      expect(parseMustHaveFeatures(null)).toEqual([])
    })

    it('parseNiceToHaveFeatures should parse array', () => {
      expect(parseNiceToHaveFeatures(validArray)).toEqual(['item1', 'item2'])
      expect(parseNiceToHaveFeatures(null)).toEqual([])
    })

    it('parseTags should parse array', () => {
      expect(parseTags(validArray)).toEqual(['item1', 'item2'])
      expect(parseTags(null)).toEqual([])
    })
  })

  describe('serializeStringArray', () => {
    it('should serialize array to JSON string', () => {
      const result = serializeStringArray(['a', 'b', 'c'])
      expect(result).toBe('["a","b","c"]')
    })

    it('should serialize empty array', () => {
      const result = serializeStringArray([])
      expect(result).toBe('[]')
    })

    it('should handle special characters', () => {
      const result = serializeStringArray(['hello "world"', "it's"])
      expect(JSON.parse(result)).toEqual(['hello "world"', "it's"])
    })
  })

  describe('Round-trip parsing', () => {
    it('should serialize and parse back to same value', () => {
      const original = ['Win 1', 'Win 2', 'Win 3']
      const serialized = serializeStringArray(original)
      const parsed = parseStringArray(serialized)
      expect(parsed).toEqual(original)
    })
  })
})
