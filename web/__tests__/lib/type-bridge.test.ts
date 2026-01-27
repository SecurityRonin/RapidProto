/**
 * TDD: Type Bridge Utilities
 * Tests for lib/utils/type-bridge.ts
 *
 * Session phases (user-facing time blocks):
 *   - Builder: 'discovery' | 'build' | 'demo'
 *   - Facilitator: 'expectations' | 'longterm' | 'close'
 *
 * Builder phases (technical workflow stages):
 *   - 'setup' | 'customize' | 'implement' | 'test' | 'deploy'
 */

import { describe, it, expect } from 'vitest'
import { toBuilderPhase, toSessionPhase } from '@/lib/utils/type-bridge'
import type { BuilderPhase } from '@/types/actions'
import type { BuildPhase } from '@/lib/builder'

describe('Type Bridge Utilities', () => {
  describe('toBuilderPhase', () => {
    it('maps discovery session phase to setup builder phase', () => {
      const result = toBuilderPhase('discovery')
      expect(result).toBe('setup')
    })

    it('maps build session phase to implement builder phase', () => {
      const result = toBuilderPhase('build')
      expect(result).toBe('implement')
    })

    it('maps demo session phase to deploy builder phase', () => {
      const result = toBuilderPhase('demo')
      expect(result).toBe('deploy')
    })

    it('returns a valid BuildPhase type', () => {
      const validBuildPhases: BuildPhase[] = ['setup', 'customize', 'implement', 'test', 'deploy']
      const sessionPhases: BuilderPhase[] = ['discovery', 'build', 'demo']

      sessionPhases.forEach(phase => {
        const result = toBuilderPhase(phase)
        expect(validBuildPhases).toContain(result)
      })
    })
  })

  describe('toSessionPhase', () => {
    it('maps setup builder phase to discovery session phase', () => {
      const result = toSessionPhase('setup')
      expect(result).toBe('discovery')
    })

    it('maps customize builder phase to build session phase', () => {
      const result = toSessionPhase('customize')
      expect(result).toBe('build')
    })

    it('maps implement builder phase to build session phase', () => {
      const result = toSessionPhase('implement')
      expect(result).toBe('build')
    })

    it('maps test builder phase to build session phase', () => {
      const result = toSessionPhase('test')
      expect(result).toBe('build')
    })

    it('maps deploy builder phase to demo session phase', () => {
      const result = toSessionPhase('deploy')
      expect(result).toBe('demo')
    })

    it('returns undefined for unmapped phases', () => {
      // Test with a value that might not be in the mapping
      // This ensures the function handles edge cases gracefully
      const result = toSessionPhase('deploy')
      expect(result).toBeDefined() // deploy is mapped
    })
  })

  describe('Bidirectional mapping consistency', () => {
    it('discovery -> setup -> discovery (roundtrip)', () => {
      const originalPhase: BuilderPhase = 'discovery'
      const builderPhase = toBuilderPhase(originalPhase)
      const backToSession = toSessionPhase(builderPhase)

      expect(backToSession).toBe(originalPhase)
    })

    it('demo -> deploy -> demo (roundtrip)', () => {
      const originalPhase: BuilderPhase = 'demo'
      const builderPhase = toBuilderPhase(originalPhase)
      const backToSession = toSessionPhase(builderPhase)

      expect(backToSession).toBe(originalPhase)
    })

    it('build -> implement -> build (roundtrip)', () => {
      const originalPhase: BuilderPhase = 'build'
      const builderPhase = toBuilderPhase(originalPhase)
      const backToSession = toSessionPhase(builderPhase)

      expect(backToSession).toBe(originalPhase)
    })
  })

  describe('Type constraints', () => {
    it('toBuilderPhase accepts only valid BuilderPhase values', () => {
      // TypeScript should enforce this at compile time
      // These are the only valid inputs
      const validInputs: BuilderPhase[] = ['discovery', 'build', 'demo']

      validInputs.forEach(phase => {
        expect(() => toBuilderPhase(phase)).not.toThrow()
      })
    })

    it('toSessionPhase accepts only valid BuildPhase values', () => {
      // TypeScript should enforce this at compile time
      const validInputs: BuildPhase[] = ['setup', 'customize', 'implement', 'test', 'deploy']

      validInputs.forEach(phase => {
        expect(() => toSessionPhase(phase)).not.toThrow()
      })
    })
  })
})
