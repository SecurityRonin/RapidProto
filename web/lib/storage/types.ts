/**
 * Storage Adapter Types
 * Core types for the storage abstraction layer (Phase 3)
 */

import type { z } from 'zod'

/**
 * Result type for storage operations
 * Uses discriminated union for type safety
 */
export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string }

/**
 * Storage adapter interface
 * Provides validated, type-safe access to browser storage
 */
export interface StorageAdapter {
  /**
   * Get a value from storage with schema validation
   * @returns null if key doesn't exist, error if validation fails
   */
  get<T>(key: string, schema: z.ZodType<T>): StorageResult<T | null>

  /**
   * Set a value in storage with schema validation
   */
  set<T>(key: string, value: T, schema: z.ZodType<T>): StorageResult<void>

  /**
   * Remove a value from storage
   */
  remove(key: string): StorageResult<void>

  /**
   * Check if a key exists in storage
   */
  has(key: string): boolean

  /**
   * Get all keys matching a prefix
   */
  keys(prefix?: string): string[]

  /**
   * Clear all data (use with caution)
   */
  clear(): StorageResult<void>

  /**
   * Execute multiple operations atomically (best-effort)
   * Note: Browser storage doesn't support true transactions,
   * but this provides rollback on failure
   */
  transaction<T>(fn: (adapter: StorageAdapter) => StorageResult<T>): StorageResult<T>
}

/**
 * Storage provider factory type
 */
export type StorageProviderFactory = () => StorageAdapter
