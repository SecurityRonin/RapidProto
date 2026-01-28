/**
 * Session Dashboard Constants
 *
 * Centralized configuration for display names, localStorage keys,
 * and other magic values. Single source of truth.
 */

import type { BuilderPhase, FacilitatorStage, SessionStatus } from './types'

// =============================================================================
// DISPLAY NAMES
// =============================================================================

/** Human-readable names for builder phases */
export const BUILDER_PHASE_NAMES: Record<BuilderPhase, string> = {
  discovery: 'Discovery',
  build: 'Build',
  demo: 'Verify', // UI shows "Verify" but internal name is "demo"
}

/** Human-readable names for facilitator stages */
export const FACILITATOR_STAGE_NAMES: Record<FacilitatorStage, string> = {
  expectations: 'Expectations',
  longterm: 'Long Term',
  close: 'Close',
}

/** Status badge variants */
export const STATUS_BADGE_VARIANTS: Record<SessionStatus, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  paused: 'secondary',
  completed: 'outline',
}

// =============================================================================
// LOCALSTORAGE KEYS
// =============================================================================

/** Factory for role storage key */
export const getRoleStorageKey = (sessionId: string): string =>
  `rapidproto_role_${sessionId}`

// =============================================================================
// PHASE PROGRESSION
// =============================================================================

/** Order of builder phases for progress calculation */
export const BUILDER_PHASE_ORDER: readonly BuilderPhase[] = ['discovery', 'build', 'demo']

/** Order of facilitator stages for progress calculation */
export const FACILITATOR_STAGE_ORDER: readonly FacilitatorStage[] = ['expectations', 'longterm', 'close']

/** Check if a builder phase is completed based on current phase */
export function isBuilderPhaseCompleted(phase: BuilderPhase, currentPhase: BuilderPhase): boolean {
  const phaseIndex = BUILDER_PHASE_ORDER.indexOf(phase)
  const currentIndex = BUILDER_PHASE_ORDER.indexOf(currentPhase)
  return phaseIndex < currentIndex
}

/** Check if a facilitator stage is completed based on current stage */
export function isFacilitatorStageCompleted(
  stage: FacilitatorStage,
  currentStage: FacilitatorStage
): boolean {
  const stageIndex = FACILITATOR_STAGE_ORDER.indexOf(stage)
  const currentIndex = FACILITATOR_STAGE_ORDER.indexOf(currentStage)
  return stageIndex < currentIndex
}

// =============================================================================
// BUTTON LABELS
// =============================================================================

/** Get the next phase button label for builder */
export function getNextPhaseLabel(currentPhase: BuilderPhase): string | null {
  switch (currentPhase) {
    case 'discovery':
      return 'Start Build'
    case 'build':
      return 'Start Verify'
    case 'demo':
      return null // No next phase
  }
}

/** Get the next stage button label for facilitator */
export function getNextStageLabel(currentStage: FacilitatorStage): string | null {
  switch (currentStage) {
    case 'expectations':
      return 'Start Long Term'
    case 'longterm':
      return 'Start Close'
    case 'close':
      return null // No next stage
  }
}

// =============================================================================
// SESSION CODE
// =============================================================================

/** Format session ID for display (first 6 chars, uppercase) */
export function formatSessionCode(sessionId: string): string {
  return sessionId.toUpperCase().slice(0, 6)
}
