/**
 * Storage Module
 * Re-exports all storage utilities (Phase 3)
 */

// Types
export type { StorageAdapter, StorageResult, StorageProviderFactory } from './types'

// Schemas
export {
  SessionStatusSchema,
  PhaseSchema,
  FacilitatorStageSchema,
  StepStatusSchema,
  RoleSchema,
  SessionStepSchema,
  SyncedInputsSchema,
  SessionSchema,
  SessionsCollectionSchema,
  TimeRemainingSchema,
  SessionStatusDataSchema,
  UserRoleSchema,
  validateSession,
  safeValidateSession,
  validateSessionsCollection,
  safeValidateSessionsCollection,
} from './schemas'

export type {
  SessionStepData,
  SyncedInputsData,
  SessionData,
  SessionsCollectionData,
  SessionStatusDataValue,
  UserRoleData,
} from './schemas'

// Adapters
export { createLocalStorageAdapter, getLocalStorageAdapter } from './local-storage'
export { createMemoryStorageAdapter, createFailingStorageAdapter } from './memory-storage'
