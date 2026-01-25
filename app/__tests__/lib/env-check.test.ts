/**
 * TDD: Environment Validation Tests
 * Write tests FIRST, then implement to pass them
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Environment Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validateEnv', () => {
    it('should not throw when all required vars are present', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
      process.env.CLERK_SECRET_KEY = 'sk_test_123'
      process.env.TURSO_DATABASE_URL = 'libsql://test.turso.io'
      process.env.TURSO_AUTH_TOKEN = 'token123'

      const { validateEnv } = await import('@/lib/utils/env-check')

      expect(() => validateEnv()).not.toThrow()
    })

    it('should throw EnvValidationError when required vars missing', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
      // Missing: CLERK_SECRET_KEY, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN

      const { validateEnv, EnvValidationError } = await import('@/lib/utils/env-check')

      expect(() => validateEnv()).toThrow(EnvValidationError)
    })

    it('should list all missing vars in error message', async () => {
      // Clear all required vars
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      delete process.env.CLERK_SECRET_KEY
      delete process.env.TURSO_DATABASE_URL
      delete process.env.TURSO_AUTH_TOKEN

      const { validateEnv } = await import('@/lib/utils/env-check')

      try {
        validateEnv()
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
        expect(err.message).toContain('CLERK_SECRET_KEY')
        expect(err.message).toContain('TURSO_DATABASE_URL')
        expect(err.message).toContain('TURSO_AUTH_TOKEN')
      }
    })

    it('should include helpful instructions in error', async () => {
      delete process.env.CLERK_SECRET_KEY

      const { validateEnv } = await import('@/lib/utils/env-check')

      try {
        validateEnv()
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).toContain('.env.example')
        expect(err.message).toContain('.env.local')
      }
    })

    it('should warn about missing optional vars in development', async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
      process.env.CLERK_SECRET_KEY = 'sk_test_123'
      process.env.TURSO_DATABASE_URL = 'libsql://test.turso.io'
      process.env.TURSO_AUTH_TOKEN = 'token123'
      process.env.NODE_ENV = 'development'
      // Missing optional: RESEND_API_KEY

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { validateEnv } = await import('@/lib/utils/env-check')
      validateEnv()

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('RESEND_API_KEY')
      )

      warnSpy.mockRestore()
    })
  })

  describe('env object', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
      process.env.CLERK_SECRET_KEY = 'sk_test_123'
      process.env.TURSO_DATABASE_URL = 'libsql://test.turso.io'
      process.env.TURSO_AUTH_TOKEN = 'token123'
    })

    it('should provide type-safe access to clerk vars', async () => {
      const { env } = await import('@/lib/utils/env-check')

      expect(env.clerk.publishableKey()).toBe('pk_test_123')
      expect(env.clerk.secretKey()).toBe('sk_test_123')
    })

    it('should provide type-safe access to turso vars', async () => {
      const { env } = await import('@/lib/utils/env-check')

      expect(env.turso.url()).toBe('libsql://test.turso.io')
      expect(env.turso.token()).toBe('token123')
    })

    it('should return undefined for missing optional vars', async () => {
      const { env } = await import('@/lib/utils/env-check')

      expect(env.resend.apiKey()).toBeUndefined()
    })

    it('should provide fallback app URL', async () => {
      const { env } = await import('@/lib/utils/env-check')

      expect(env.app.url()).toBe('http://localhost:3000')
    })

    it('should use VERCEL_URL when available', async () => {
      process.env.VERCEL_URL = 'my-app.vercel.app'

      const { env } = await import('@/lib/utils/env-check')

      expect(env.app.url()).toBe('my-app.vercel.app')
    })
  })
})
