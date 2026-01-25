/**
 * Type-safe JSON field parsing with fallbacks
 * Eliminates crash risk from malformed JSON in database text fields
 */

/**
 * Parse a JSON string with type safety and fallback
 * @param value - The JSON string to parse (or null)
 * @param fallback - Default value if parsing fails
 * @returns Parsed value or fallback
 */
export function parseJsonField<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch (err) {
    console.warn('Failed to parse JSON field:', value, err)
    return fallback
  }
}

/**
 * Parse a JSON string array with empty array fallback
 */
export const parseStringArray = (v: string | null): string[] =>
  parseJsonField<string[]>(v, [])

// Domain-specific helpers for common fields
export const parseThreeWins = parseStringArray
export const parsePainPoints = parseStringArray
export const parseMustHaveFeatures = parseStringArray
export const parseNiceToHaveFeatures = parseStringArray
export const parseTags = parseStringArray

/**
 * Serialize a string array to JSON
 */
export const serializeStringArray = (arr: string[]): string =>
  JSON.stringify(arr)
