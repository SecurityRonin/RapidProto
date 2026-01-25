import { z } from 'zod'

/**
 * Validation utilities
 * Common validation functions used across the app
 */

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailSchema = z.string().email()
  return emailSchema.safeParse(email).success
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  const urlSchema = z.string().url()
  return urlSchema.safeParse(url).success
}

/**
 * Sanitize user input by removing dangerous characters
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
}

/**
 * Safely parse JSON with error handling
 */
export function parseJsonSafely<T = unknown>(
  json: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = JSON.parse(json) as T
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    }
  }
}

/**
 * Validate phone number (basic US format)
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?1?\d{10,14}$/
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''))
}

/**
 * Validate date string
 */
export function validateDate(date: string): boolean {
  const dateSchema = z.string().datetime()
  return dateSchema.safeParse(date).success || !isNaN(Date.parse(date))
}
