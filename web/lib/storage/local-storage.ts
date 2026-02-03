/**
 * LocalStorage Adapter
 * Browser localStorage implementation of StorageAdapter (Phase 3)
 */

import { z } from 'zod'
import { StorageError } from '@/lib/utils/errors'
import type { StorageAdapter, StorageResult } from './types'

/**
 * Create a localStorage-based storage adapter
 * SSR-safe: returns null operations when localStorage is unavailable
 */
export function createLocalStorageAdapter(): StorageAdapter {
  const getStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null
    try {
      // Test that localStorage is actually accessible
      const testKey = '__storage_test__'
      window.localStorage.setItem(testKey, testKey)
      window.localStorage.removeItem(testKey)
      return window.localStorage
    } catch {
      return null
    }
  }

  const adapter: StorageAdapter = {
    get<T>(key: string, schema: z.ZodType<T>): StorageResult<T | null> {
      const storage = getStorage()
      if (!storage) {
        return {
          success: false,
          error: 'Storage not available',
          code: 'STORAGE_UNAVAILABLE',
        }
      }

      try {
        const raw = storage.getItem(key)
        if (raw === null) {
          return { success: true, data: null }
        }

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
        if (error instanceof SyntaxError) {
          return {
            success: false,
            error: `Invalid JSON in key '${key}'`,
            code: 'SESSION_CORRUPTED',
          }
        }
        const storageError = StorageError.fromError(error, key)
        return {
          success: false,
          error: storageError.message,
          code: storageError.code,
        }
      }
    },

    set<T>(key: string, value: T, schema: z.ZodType<T>): StorageResult<void> {
      const storage = getStorage()
      if (!storage) {
        return {
          success: false,
          error: 'Storage not available',
          code: 'STORAGE_UNAVAILABLE',
        }
      }

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
        storage.setItem(key, serialized)
        return { success: true, data: undefined }
      } catch (error) {
        const storageError = StorageError.fromError(error, key)
        return {
          success: false,
          error: storageError.message,
          code: storageError.code,
        }
      }
    },

    remove(key: string): StorageResult<void> {
      const storage = getStorage()
      if (!storage) {
        return {
          success: false,
          error: 'Storage not available',
          code: 'STORAGE_UNAVAILABLE',
        }
      }

      try {
        storage.removeItem(key)
        return { success: true, data: undefined }
      } catch (error) {
        const storageError = StorageError.fromError(error, key)
        return {
          success: false,
          error: storageError.message,
          code: storageError.code,
        }
      }
    },

    has(key: string): boolean {
      const storage = getStorage()
      if (!storage) return false
      return storage.getItem(key) !== null
    },

    keys(prefix?: string): string[] {
      const storage = getStorage()
      if (!storage) return []

      const allKeys: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key !== null) {
          if (!prefix || key.startsWith(prefix)) {
            allKeys.push(key)
          }
        }
      }
      return allKeys
    },

    clear(): StorageResult<void> {
      const storage = getStorage()
      if (!storage) {
        return {
          success: false,
          error: 'Storage not available',
          code: 'STORAGE_UNAVAILABLE',
        }
      }

      try {
        storage.clear()
        return { success: true, data: undefined }
      } catch (error) {
        const storageError = StorageError.fromError(error)
        return {
          success: false,
          error: storageError.message,
          code: storageError.code,
        }
      }
    },

    transaction<T>(fn: (adapter: StorageAdapter) => StorageResult<T>): StorageResult<T> {
      const storage = getStorage()
      if (!storage) {
        return {
          success: false,
          error: 'Storage not available',
          code: 'STORAGE_UNAVAILABLE',
        }
      }

      // Take a snapshot of current state for rollback
      const snapshot: Record<string, string | null> = {}
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key !== null) {
          snapshot[key] = storage.getItem(key)
        }
      }

      try {
        const result = fn(adapter)
        if (!result.success) {
          // Rollback on failure
          rollback(storage, snapshot)
        }
        return result
      } catch (error) {
        // Rollback on exception
        rollback(storage, snapshot)
        const storageError = StorageError.fromError(error)
        return {
          success: false,
          error: storageError.message,
          code: storageError.code,
        }
      }
    },
  }

  return adapter
}

/**
 * Restore storage to a previous snapshot
 */
function rollback(storage: Storage, snapshot: Record<string, string | null>): void {
  // Clear current state
  storage.clear()
  // Restore snapshot
  for (const [key, value] of Object.entries(snapshot)) {
    if (value !== null) {
      storage.setItem(key, value)
    }
  }
}

/**
 * Singleton instance for convenience
 */
let defaultAdapter: StorageAdapter | null = null

export function getLocalStorageAdapter(): StorageAdapter {
  if (!defaultAdapter) {
    defaultAdapter = createLocalStorageAdapter()
  }
  return defaultAdapter
}
