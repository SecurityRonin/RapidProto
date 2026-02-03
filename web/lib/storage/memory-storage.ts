/**
 * Memory Storage Adapter
 * In-memory implementation for deterministic testing (Phase 3)
 */

import { z } from 'zod'
import type { StorageAdapter, StorageResult } from './types'

/**
 * Create an in-memory storage adapter for testing
 * Provides deterministic behavior without browser dependencies
 */
export function createMemoryStorageAdapter(
  initialData: Record<string, unknown> = {}
): StorageAdapter & {
  // Test helpers
  _getStore: () => Map<string, string>
  _setStore: (data: Record<string, string>) => void
  _clear: () => void
} {
  const store = new Map<string, string>()

  // Initialize with any provided data
  for (const [key, value] of Object.entries(initialData)) {
    store.set(key, JSON.stringify(value))
  }

  const adapter: StorageAdapter & {
    _getStore: () => Map<string, string>
    _setStore: (data: Record<string, string>) => void
    _clear: () => void
  } = {
    get<T>(key: string, schema: z.ZodType<T>): StorageResult<T | null> {
      const raw = store.get(key)
      if (raw === undefined) {
        return { success: true, data: null }
      }

      try {
        const parsed = JSON.parse(raw)
        const validated = schema.safeParse(parsed)

        if (!validated.success) {
          return {
            success: false,
            error: `Validation failed for key '${key}': ${validated.error.message}`,
            code: 'SESSION_CORRUPTED',
          }
        }

        return { success: true, data: validated.data }
      } catch (error) {
        return {
          success: false,
          error: `Invalid JSON in key '${key}'`,
          code: 'SESSION_CORRUPTED',
        }
      }
    },

    set<T>(key: string, value: T, schema: z.ZodType<T>): StorageResult<void> {
      try {
        // Validate before storing
        const validated = schema.safeParse(value)
        if (!validated.success) {
          return {
            success: false,
            error: `Validation failed: ${validated.error.message}`,
            code: 'VALIDATION_ERROR',
          }
        }

        const serialized = JSON.stringify(validated.data)
        store.set(key, serialized)
        return { success: true, data: undefined }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'INTERNAL_ERROR',
        }
      }
    },

    remove(key: string): StorageResult<void> {
      store.delete(key)
      return { success: true, data: undefined }
    },

    has(key: string): boolean {
      return store.has(key)
    },

    keys(prefix?: string): string[] {
      const allKeys = Array.from(store.keys())
      if (!prefix) return allKeys
      return allKeys.filter(key => key.startsWith(prefix))
    },

    clear(): StorageResult<void> {
      store.clear()
      return { success: true, data: undefined }
    },

    transaction<T>(fn: (adapter: StorageAdapter) => StorageResult<T>): StorageResult<T> {
      // Take a snapshot for rollback
      const snapshot = new Map(store)

      try {
        const result = fn(adapter)
        if (!result.success) {
          // Rollback on failure
          store.clear()
          for (const [key, value] of snapshot) {
            store.set(key, value)
          }
        }
        return result
      } catch (error) {
        // Rollback on exception
        store.clear()
        for (const [key, value] of snapshot) {
          store.set(key, value)
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'INTERNAL_ERROR',
        }
      }
    },

    // Test helpers
    _getStore: () => store,
    _setStore: (data: Record<string, string>) => {
      store.clear()
      for (const [key, value] of Object.entries(data)) {
        store.set(key, value)
      }
    },
    _clear: () => store.clear(),
  }

  return adapter
}

/**
 * Create a failing storage adapter for testing error handling
 */
export function createFailingStorageAdapter(
  errorCode: string = 'STORAGE_UNAVAILABLE',
  errorMessage: string = 'Storage not available'
): StorageAdapter {
  const failResult = <T>(): StorageResult<T> => ({
    success: false,
    error: errorMessage,
    code: errorCode,
  })

  return {
    get: () => failResult(),
    set: () => failResult(),
    remove: () => failResult(),
    has: () => false,
    keys: () => [],
    clear: () => failResult(),
    transaction: () => failResult(),
  }
}
