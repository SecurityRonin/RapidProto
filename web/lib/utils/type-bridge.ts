/**
 * Type Bridge Utilities
 * Safely converts between different phase type systems
 *
 * Session phases ('discovery' | 'build' | 'demo') are user-facing time blocks
 * Builder phases ('setup' | 'customize' | 'implement' | 'test' | 'deploy') are technical workflow stages
 */

import type { Phase } from '@/types/actions'
import type { BuildPhase } from '@/lib/builder'

/**
 * Maps session phases to their corresponding builder phases
 * - discovery: Initial setup and configuration
 * - build: Main implementation phase
 * - demo: Final deployment for presentation
 */
const SESSION_TO_BUILD: Record<Phase, BuildPhase> = {
  discovery: 'setup',
  build: 'implement',
  demo: 'deploy',
}

/**
 * Convert a session phase to the equivalent builder phase
 * @param phase - The session phase ('discovery' | 'build' | 'demo')
 * @returns The corresponding builder phase
 */
export function toBuilderPhase(phase: Phase): BuildPhase {
  return SESSION_TO_BUILD[phase]
}

/**
 * Maps builder phases back to session phases (for reverse lookups)
 */
const BUILD_TO_SESSION: Partial<Record<BuildPhase, Phase>> = {
  setup: 'discovery',
  customize: 'build',
  implement: 'build',
  test: 'build',
  deploy: 'demo',
}

/**
 * Convert a builder phase to the equivalent session phase
 * @param phase - The builder phase
 * @returns The corresponding session phase (or undefined if not mappable)
 */
export function toSessionPhase(phase: BuildPhase): Phase | undefined {
  return BUILD_TO_SESSION[phase]
}
