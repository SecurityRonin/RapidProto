/**
 * Tests for Template #6: Approval Workflow Schema
 */

import { describe, it, expect } from 'vitest'
import {
  approvalTemplates,
  approvalRequests,
  approvalSteps,
  REQUEST_TYPES,
  REQUEST_STATUSES,
  STEP_STATUSES,
} from './schema'

describe('Template #6: Approval Workflow Schema', () => {
  describe('approvalTemplates Table', () => {
    it('should have required fields', () => {
      expect(approvalTemplates).toBeDefined()
      expect(approvalTemplates.id).toBeDefined()
      expect(approvalTemplates.name).toBeDefined()
      expect(approvalTemplates.requestType).toBeDefined()
      expect(approvalTemplates.steps).toBeDefined()
      expect(approvalTemplates.createdBy).toBeDefined()
      expect(approvalTemplates.createdAt).toBeDefined()
      expect(approvalTemplates.updatedAt).toBeDefined()
    })

    it('should use correct column names', () => {
      expect(approvalTemplates.id.name).toBe('id')
      expect(approvalTemplates.name.name).toBe('name')
      expect(approvalTemplates.requestType.name).toBe('request_type')
      expect(approvalTemplates.steps.name).toBe('steps')
      expect(approvalTemplates.createdBy.name).toBe('created_by')
      expect(approvalTemplates.createdAt.name).toBe('created_at')
      expect(approvalTemplates.updatedAt.name).toBe('updated_at')
    })
  })

  describe('approvalRequests Table', () => {
    it('should have required fields', () => {
      expect(approvalRequests).toBeDefined()
      expect(approvalRequests.id).toBeDefined()
      expect(approvalRequests.title).toBeDefined()
      expect(approvalRequests.description).toBeDefined()
      expect(approvalRequests.requesterId).toBeDefined()
      expect(approvalRequests.requesterEmail).toBeDefined()
      expect(approvalRequests.requestType).toBeDefined()
      expect(approvalRequests.amount).toBeDefined()
      expect(approvalRequests.attachmentUrl).toBeDefined()
      expect(approvalRequests.templateId).toBeDefined()
      expect(approvalRequests.currentStep).toBeDefined()
      expect(approvalRequests.status).toBeDefined()
      expect(approvalRequests.createdAt).toBeDefined()
      expect(approvalRequests.updatedAt).toBeDefined()
    })

    it('should use correct column names', () => {
      expect(approvalRequests.id.name).toBe('id')
      expect(approvalRequests.title.name).toBe('title')
      expect(approvalRequests.requesterId.name).toBe('requester_id')
      expect(approvalRequests.requesterEmail.name).toBe('requester_email')
      expect(approvalRequests.requestType.name).toBe('request_type')
      expect(approvalRequests.currentStep.name).toBe('current_step')
      expect(approvalRequests.attachmentUrl.name).toBe('attachment_url')
      expect(approvalRequests.templateId.name).toBe('template_id')
    })
  })

  describe('approvalSteps Table', () => {
    it('should have required fields', () => {
      expect(approvalSteps).toBeDefined()
      expect(approvalSteps.id).toBeDefined()
      expect(approvalSteps.requestId).toBeDefined()
      expect(approvalSteps.stepNumber).toBeDefined()
      expect(approvalSteps.approverId).toBeDefined()
      expect(approvalSteps.approverEmail).toBeDefined()
      expect(approvalSteps.approverRole).toBeDefined()
      expect(approvalSteps.isOptional).toBeDefined()
      expect(approvalSteps.status).toBeDefined()
      expect(approvalSteps.comments).toBeDefined()
      expect(approvalSteps.decidedAt).toBeDefined()
      expect(approvalSteps.createdAt).toBeDefined()
    })

    it('should use correct column names', () => {
      expect(approvalSteps.id.name).toBe('id')
      expect(approvalSteps.requestId.name).toBe('request_id')
      expect(approvalSteps.stepNumber.name).toBe('step_number')
      expect(approvalSteps.approverId.name).toBe('approver_id')
      expect(approvalSteps.approverEmail.name).toBe('approver_email')
      expect(approvalSteps.approverRole.name).toBe('approver_role')
      expect(approvalSteps.isOptional.name).toBe('is_optional')
      expect(approvalSteps.decidedAt.name).toBe('decided_at')
    })
  })

  describe('Enums and Constants', () => {
    it('should have correct request types', () => {
      expect(REQUEST_TYPES).toContain('expense')
      expect(REQUEST_TYPES).toContain('timeoff')
      expect(REQUEST_TYPES).toContain('purchase')
      expect(REQUEST_TYPES).toContain('document')
      expect(REQUEST_TYPES).toHaveLength(4)
    })

    it('should have correct request statuses', () => {
      expect(REQUEST_STATUSES).toContain('pending')
      expect(REQUEST_STATUSES).toContain('in_progress')
      expect(REQUEST_STATUSES).toContain('approved')
      expect(REQUEST_STATUSES).toContain('rejected')
      expect(REQUEST_STATUSES).toContain('cancelled')
      expect(REQUEST_STATUSES).toHaveLength(5)
    })

    it('should have correct step statuses', () => {
      expect(STEP_STATUSES).toContain('pending')
      expect(STEP_STATUSES).toContain('approved')
      expect(STEP_STATUSES).toContain('rejected')
      expect(STEP_STATUSES).toContain('skipped')
      expect(STEP_STATUSES).toHaveLength(4)
    })
  })
})
