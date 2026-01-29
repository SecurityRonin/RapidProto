/**
 * Template #6: Approval Workflow
 * TDD: Tests written FIRST to define expected behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => ({ userId: 'user_requester1' })),
  currentUser: vi.fn(() => ({
    id: 'user_requester1',
    emailAddresses: [{ emailAddress: 'requester@company.com' }],
    firstName: 'Test',
    lastName: 'Requester',
  })),
}))

// Mock the database module
vi.mock('@/lib/db', async () => {
  const { createClient } = await import('@libsql/client')
  const { drizzle } = await import('drizzle-orm/libsql')
  const client = createClient({ url: ':memory:' })
  const db = drizzle(client)
  return { db }
})

// Import actions after mocks
import {
  createRequest,
  getRequests,
  getRequestById,
  approveStep,
  rejectStep,
  skipStep,
  cancelRequest,
  reassignStep,
  getMyPendingApprovals,
  getRequestHistory,
  createTemplate,
  getTemplates,
  updateTemplate,
  deleteTemplate,
} from './index'

describe('Template #6: Approval Workflow Actions', () => {
  let db: ReturnType<typeof drizzle>

  beforeEach(async () => {
    // Get fresh db instance
    const client = createClient({ url: ':memory:' })
    db = drizzle(client)

    // Create tables
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS approval_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        request_type TEXT NOT NULL,
        steps TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS approval_requests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        requester_id TEXT NOT NULL,
        requester_email TEXT NOT NULL,
        request_type TEXT NOT NULL,
        amount REAL,
        attachment_url TEXT,
        template_id TEXT,
        current_step INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (template_id) REFERENCES approval_templates(id)
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS approval_steps (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        approver_id TEXT,
        approver_email TEXT NOT NULL,
        approver_role TEXT,
        is_optional INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        comments TEXT,
        decided_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (request_id) REFERENCES approval_requests(id) ON DELETE CASCADE
      )
    `)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================
  // TEMPLATE CRUD OPERATIONS
  // ============================================================
  describe('Template Operations', () => {
    describe('createTemplate', () => {
      it('should create a new approval template', async () => {
        const result = await createTemplate({
          name: 'Standard Expense Approval',
          requestType: 'expense',
          steps: [
            { email: 'manager@company.com', role: 'manager' },
            { email: 'finance@company.com', role: 'finance' },
          ],
        })

        expect(result.success).toBe(true)
        expect(result.data?.name).toBe('Standard Expense Approval')
        expect(result.data?.requestType).toBe('expense')
        expect(result.data?.steps).toHaveLength(2)
      })

      it('should validate required fields', async () => {
        const result = await createTemplate({
          name: '',
          requestType: 'expense',
          steps: [],
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('name')
      })

      it('should require at least one step', async () => {
        const result = await createTemplate({
          name: 'Invalid Template',
          requestType: 'expense',
          steps: [],
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('step')
      })

      it('should validate request type', async () => {
        const result = await createTemplate({
          name: 'Test',
          // @ts-expect-error Testing validation
          requestType: 'invalid_type',
          steps: [{ email: 'test@test.com' }],
        })

        expect(result.success).toBe(false)
      })
    })

    describe('getTemplates', () => {
      beforeEach(async () => {
        await createTemplate({
          name: 'Expense Template',
          requestType: 'expense',
          steps: [{ email: 'approver@test.com' }],
        })
        await createTemplate({
          name: 'Time Off Template',
          requestType: 'timeoff',
          steps: [{ email: 'hr@test.com' }],
        })
      })

      it('should return all templates', async () => {
        const result = await getTemplates()

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(2)
      })

      it('should filter by request type', async () => {
        const result = await getTemplates({ requestType: 'expense' })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data![0].requestType).toBe('expense')
      })
    })

    describe('updateTemplate', () => {
      it('should update template name and steps', async () => {
        const created = await createTemplate({
          name: 'Original Name',
          requestType: 'expense',
          steps: [{ email: 'old@test.com' }],
        })

        const result = await updateTemplate(created.data!.id, {
          name: 'Updated Name',
          steps: [{ email: 'new@test.com' }, { email: 'another@test.com' }],
        })

        expect(result.success).toBe(true)
        expect(result.data?.name).toBe('Updated Name')
        expect(result.data?.steps).toHaveLength(2)
      })
    })

    describe('deleteTemplate', () => {
      it('should delete a template', async () => {
        const created = await createTemplate({
          name: 'To Delete',
          requestType: 'expense',
          steps: [{ email: 'test@test.com' }],
        })

        const result = await deleteTemplate(created.data!.id)

        expect(result.success).toBe(true)

        const templates = await getTemplates()
        expect(templates.data).toHaveLength(0)
      })
    })
  })

  // ============================================================
  // REQUEST OPERATIONS
  // ============================================================
  describe('Request Operations', () => {
    let templateId: string

    beforeEach(async () => {
      // Create a template for requests
      const template = await createTemplate({
        name: 'Test Expense Template',
        requestType: 'expense',
        steps: [
          { email: 'manager@company.com', role: 'manager' },
          { email: 'finance@company.com', role: 'finance', isOptional: false },
          { email: 'cfo@company.com', role: 'executive', isOptional: true },
        ],
      })
      templateId = template.data!.id
    })

    describe('createRequest', () => {
      it('should create request with auto-generated steps from template', async () => {
        const result = await createRequest({
          title: 'Team lunch expense',
          description: 'Quarterly team lunch event',
          requestType: 'expense',
          amount: 500,
          templateId,
        })

        expect(result.success).toBe(true)
        expect(result.data?.title).toBe('Team lunch expense')
        expect(result.data?.status).toBe('pending')
        expect(result.data?.currentStep).toBe(1)
        expect(result.data?.steps).toHaveLength(3)
        expect(result.data?.steps![0].approverEmail).toBe('manager@company.com')
        expect(result.data?.steps![0].stepNumber).toBe(1)
        expect(result.data?.steps![1].stepNumber).toBe(2)
      })

      it('should create request without template (ad-hoc approvers)', async () => {
        const result = await createRequest({
          title: 'Ad-hoc request',
          requestType: 'document',
          steps: [
            { email: 'reviewer1@company.com' },
            { email: 'reviewer2@company.com' },
          ],
        })

        expect(result.success).toBe(true)
        expect(result.data?.steps).toHaveLength(2)
      })

      it('should require title', async () => {
        const result = await createRequest({
          title: '',
          requestType: 'expense',
          templateId,
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('title')
      })

      it('should require valid request type', async () => {
        const result = await createRequest({
          title: 'Test',
          // @ts-expect-error Testing validation
          requestType: 'invalid',
          templateId,
        })

        expect(result.success).toBe(false)
      })

      it('should require either templateId or steps', async () => {
        const result = await createRequest({
          title: 'No steps defined',
          requestType: 'expense',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('template or steps')
      })

      it('should set requester from authenticated user', async () => {
        const result = await createRequest({
          title: 'Test request',
          requestType: 'expense',
          templateId,
        })

        expect(result.success).toBe(true)
        expect(result.data?.requesterId).toBe('user_requester1')
      })
    })

    describe('getRequests', () => {
      beforeEach(async () => {
        await createRequest({
          title: 'Expense 1',
          requestType: 'expense',
          amount: 100,
          templateId,
        })
        await createRequest({
          title: 'Time Off 1',
          requestType: 'timeoff',
          templateId,
        })
      })

      it('should return all requests', async () => {
        const result = await getRequests()

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(2)
      })

      it('should filter by status', async () => {
        const result = await getRequests({ status: 'pending' })

        expect(result.success).toBe(true)
        expect(result.data!.every((r) => r.status === 'pending')).toBe(true)
      })

      it('should filter by request type', async () => {
        const result = await getRequests({ requestType: 'expense' })

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data![0].requestType).toBe('expense')
      })

      it('should filter by requester', async () => {
        const result = await getRequests({ requesterId: 'user_requester1' })

        expect(result.success).toBe(true)
        expect(result.data!.every((r) => r.requesterId === 'user_requester1')).toBe(true)
      })
    })

    describe('getRequestById', () => {
      it('should return request with all steps', async () => {
        const created = await createRequest({
          title: 'Test Request',
          requestType: 'expense',
          templateId,
        })

        const result = await getRequestById(created.data!.id)

        expect(result.success).toBe(true)
        expect(result.data?.id).toBe(created.data!.id)
        expect(result.data?.steps).toHaveLength(3)
      })

      it('should return not found for invalid id', async () => {
        const result = await getRequestById('nonexistent')

        expect(result.success).toBe(false)
        expect(result.error).toContain('not found')
      })
    })
  })

  // ============================================================
  // APPROVAL FLOW OPERATIONS
  // ============================================================
  describe('Approval Flow', () => {
    let templateId: string
    let requestId: string

    beforeEach(async () => {
      const template = await createTemplate({
        name: 'Two-Step Approval',
        requestType: 'expense',
        steps: [
          { email: 'manager@company.com', role: 'manager' },
          { email: 'finance@company.com', role: 'finance' },
        ],
      })
      templateId = template.data!.id

      const request = await createRequest({
        title: 'Office supplies',
        requestType: 'expense',
        amount: 250,
        templateId,
      })
      requestId = request.data!.id
    })

    describe('approveStep', () => {
      it('should approve current step', async () => {
        // Mock as the manager approver
        const { auth } = await import('@clerk/nextjs')
        vi.mocked(auth).mockReturnValueOnce({
          userId: 'user_manager',
          sessionId: 'sess_123',
        } as any)

        const result = await approveStep(requestId, {
          approverId: 'user_manager',
          comments: 'Looks good!',
        })

        expect(result.success).toBe(true)
        expect(result.data?.step.status).toBe('approved')
        expect(result.data?.step.comments).toBe('Looks good!')
        expect(result.data?.step.decidedAt).toBeDefined()
      })

      it('should advance to next step after approval', async () => {
        // First approval
        await approveStep(requestId, { approverId: 'user_manager' })

        const request = await getRequestById(requestId)

        expect(request.data?.currentStep).toBe(2)
        expect(request.data?.status).toBe('in_progress')
      })

      it('should complete request when last step approved', async () => {
        // Approve step 1
        await approveStep(requestId, { approverId: 'user_manager' })
        // Approve step 2
        await approveStep(requestId, { approverId: 'user_finance' })

        const request = await getRequestById(requestId)

        expect(request.data?.status).toBe('approved')
      })

      it('should not allow approving out-of-sequence steps', async () => {
        // Try to approve step 2 before step 1
        const result = await approveStep(requestId, {
          approverId: 'user_finance',
          stepNumber: 2,
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('not the current step')
      })

      it('should not allow re-approving already approved steps', async () => {
        await approveStep(requestId, { approverId: 'user_manager' })

        const result = await approveStep(requestId, {
          approverId: 'user_manager',
          stepNumber: 1,
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('already')
      })
    })

    describe('rejectStep', () => {
      it('should reject step with comments', async () => {
        const result = await rejectStep(requestId, {
          approverId: 'user_manager',
          comments: 'Over budget, need CFO approval',
        })

        expect(result.success).toBe(true)
        expect(result.data?.step.status).toBe('rejected')
        expect(result.data?.step.comments).toBe('Over budget, need CFO approval')
      })

      it('should reject entire request when step is rejected', async () => {
        await rejectStep(requestId, {
          approverId: 'user_manager',
          comments: 'Denied',
        })

        const request = await getRequestById(requestId)

        expect(request.data?.status).toBe('rejected')
      })

      it('should require rejection comments', async () => {
        const result = await rejectStep(requestId, {
          approverId: 'user_manager',
          comments: '',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('comment')
      })

      it('should not allow rejecting already rejected request', async () => {
        await rejectStep(requestId, {
          approverId: 'user_manager',
          comments: 'First rejection',
        })

        const result = await rejectStep(requestId, {
          approverId: 'user_manager',
          comments: 'Second rejection',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('already rejected')
      })
    })

    describe('skipStep', () => {
      let optionalTemplateId: string
      let optionalRequestId: string

      beforeEach(async () => {
        const template = await createTemplate({
          name: 'With Optional Step',
          requestType: 'expense',
          steps: [
            { email: 'manager@company.com', role: 'manager' },
            { email: 'vp@company.com', role: 'vp', isOptional: true },
            { email: 'finance@company.com', role: 'finance' },
          ],
        })
        optionalTemplateId = template.data!.id

        const request = await createRequest({
          title: 'Optional step test',
          requestType: 'expense',
          templateId: optionalTemplateId,
        })
        optionalRequestId = request.data!.id
      })

      it('should skip optional step', async () => {
        // Approve step 1
        await approveStep(optionalRequestId, { approverId: 'user_manager' })

        // Skip step 2 (optional)
        const result = await skipStep(optionalRequestId, {
          stepNumber: 2,
          reason: 'VP on vacation',
        })

        expect(result.success).toBe(true)
        expect(result.data?.step.status).toBe('skipped')
      })

      it('should advance to next step after skip', async () => {
        await approveStep(optionalRequestId, { approverId: 'user_manager' })
        await skipStep(optionalRequestId, { stepNumber: 2 })

        const request = await getRequestById(optionalRequestId)

        expect(request.data?.currentStep).toBe(3)
      })

      it('should not allow skipping required steps', async () => {
        const result = await skipStep(optionalRequestId, {
          stepNumber: 1,
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('not optional')
      })

      it('should not allow skipping steps not yet reached', async () => {
        const result = await skipStep(optionalRequestId, {
          stepNumber: 3,
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('not the current step')
      })
    })
  })

  // ============================================================
  // REQUEST MANAGEMENT
  // ============================================================
  describe('Request Management', () => {
    let templateId: string
    let requestId: string

    beforeEach(async () => {
      const template = await createTemplate({
        name: 'Test Template',
        requestType: 'expense',
        steps: [
          { email: 'manager@company.com' },
          { email: 'finance@company.com' },
        ],
      })
      templateId = template.data!.id

      const request = await createRequest({
        title: 'Test Request',
        requestType: 'expense',
        templateId,
      })
      requestId = request.data!.id
    })

    describe('cancelRequest', () => {
      it('should allow requester to cancel pending request', async () => {
        const result = await cancelRequest(requestId)

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('cancelled')
      })

      it('should allow requester to cancel in-progress request', async () => {
        await approveStep(requestId, { approverId: 'user_manager' })

        const result = await cancelRequest(requestId)

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('cancelled')
      })

      it('should not allow cancelling already approved request', async () => {
        await approveStep(requestId, { approverId: 'user_manager' })
        await approveStep(requestId, { approverId: 'user_finance' })

        const result = await cancelRequest(requestId)

        expect(result.success).toBe(false)
        expect(result.error).toContain('cannot cancel')
      })

      it('should not allow non-requester to cancel', async () => {
        const { auth } = await import('@clerk/nextjs')
        vi.mocked(auth).mockReturnValueOnce({
          userId: 'user_other',
          sessionId: 'sess_other',
        } as any)

        const result = await cancelRequest(requestId)

        expect(result.success).toBe(false)
        expect(result.error).toContain('not authorized')
      })
    })

    describe('reassignStep', () => {
      it('should reassign current step to different approver', async () => {
        const result = await reassignStep(requestId, {
          stepNumber: 1,
          newApproverEmail: 'alt-manager@company.com',
          reason: 'Original manager on leave',
        })

        expect(result.success).toBe(true)
        expect(result.data?.approverEmail).toBe('alt-manager@company.com')
      })

      it('should not allow reassigning completed steps', async () => {
        await approveStep(requestId, { approverId: 'user_manager' })

        const result = await reassignStep(requestId, {
          stepNumber: 1,
          newApproverEmail: 'alt@company.com',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('already completed')
      })

      it('should validate email format', async () => {
        const result = await reassignStep(requestId, {
          stepNumber: 1,
          newApproverEmail: 'invalid-email',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('email')
      })
    })
  })

  // ============================================================
  // QUERY OPERATIONS
  // ============================================================
  describe('Query Operations', () => {
    let templateId: string

    beforeEach(async () => {
      const template = await createTemplate({
        name: 'Test Template',
        requestType: 'expense',
        steps: [
          { email: 'manager@company.com' },
          { email: 'finance@company.com' },
        ],
      })
      templateId = template.data!.id
    })

    describe('getMyPendingApprovals', () => {
      it('should return requests pending my approval', async () => {
        // Create requests
        await createRequest({
          title: 'Request 1',
          requestType: 'expense',
          templateId,
        })
        await createRequest({
          title: 'Request 2',
          requestType: 'expense',
          templateId,
        })

        // Mock as manager who needs to approve
        const { auth } = await import('@clerk/nextjs')
        vi.mocked(auth).mockReturnValue({
          userId: 'user_manager',
          sessionId: 'sess_123',
        } as any)

        const result = await getMyPendingApprovals('manager@company.com')

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(2)
      })

      it('should not include requests already actioned', async () => {
        const request = await createRequest({
          title: 'Request 1',
          requestType: 'expense',
          templateId,
        })

        await approveStep(request.data!.id, { approverId: 'user_manager' })

        const result = await getMyPendingApprovals('manager@company.com')

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(0)
      })

      it('should include requests at my step', async () => {
        const request = await createRequest({
          title: 'Request 1',
          requestType: 'expense',
          templateId,
        })

        // Advance to step 2
        await approveStep(request.data!.id, { approverId: 'user_manager' })

        const result = await getMyPendingApprovals('finance@company.com')

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
      })
    })

    describe('getRequestHistory', () => {
      it('should return full audit trail for request', async () => {
        const request = await createRequest({
          title: 'Audited Request',
          requestType: 'expense',
          templateId,
        })

        await approveStep(request.data!.id, {
          approverId: 'user_manager',
          comments: 'Approved by manager',
        })
        await approveStep(request.data!.id, {
          approverId: 'user_finance',
          comments: 'Approved by finance',
        })

        const result = await getRequestHistory(request.data!.id)

        expect(result.success).toBe(true)
        expect(result.data?.request.status).toBe('approved')
        expect(result.data?.history).toHaveLength(2)
        expect(result.data?.history![0].status).toBe('approved')
        expect(result.data?.history![0].comments).toBe('Approved by manager')
        expect(result.data?.history![1].status).toBe('approved')
        expect(result.data?.history![1].comments).toBe('Approved by finance')
      })

      it('should include timestamps in history', async () => {
        const request = await createRequest({
          title: 'Time Tracked Request',
          requestType: 'expense',
          templateId,
        })

        await approveStep(request.data!.id, { approverId: 'user_manager' })

        const result = await getRequestHistory(request.data!.id)

        expect(result.success).toBe(true)
        expect(result.data?.history![0].decidedAt).toBeDefined()
      })
    })
  })

  // ============================================================
  // COMPLEX SCENARIOS
  // ============================================================
  describe('Complex Scenarios', () => {
    describe('Multi-step approval flow end-to-end', () => {
      it('should handle complete 3-step approval process', async () => {
        const template = await createTemplate({
          name: 'Three-Step',
          requestType: 'purchase',
          steps: [
            { email: 'dept-head@company.com', role: 'dept_head' },
            { email: 'procurement@company.com', role: 'procurement' },
            { email: 'cfo@company.com', role: 'cfo' },
          ],
        })

        const request = await createRequest({
          title: 'New server purchase',
          description: 'Production server upgrade',
          requestType: 'purchase',
          amount: 15000,
          templateId: template.data!.id,
        })

        const requestId = request.data!.id

        // Step 1: Dept head approves
        let result = await approveStep(requestId, {
          approverId: 'user_dept_head',
          comments: 'Budget approved for this quarter',
        })
        expect(result.success).toBe(true)

        let currentRequest = await getRequestById(requestId)
        expect(currentRequest.data?.currentStep).toBe(2)
        expect(currentRequest.data?.status).toBe('in_progress')

        // Step 2: Procurement approves
        result = await approveStep(requestId, {
          approverId: 'user_procurement',
          comments: 'Vendor verified',
        })
        expect(result.success).toBe(true)

        currentRequest = await getRequestById(requestId)
        expect(currentRequest.data?.currentStep).toBe(3)

        // Step 3: CFO approves
        result = await approveStep(requestId, {
          approverId: 'user_cfo',
          comments: 'Final approval granted',
        })
        expect(result.success).toBe(true)

        currentRequest = await getRequestById(requestId)
        expect(currentRequest.data?.status).toBe('approved')

        // Verify history
        const history = await getRequestHistory(requestId)
        expect(history.data?.history).toHaveLength(3)
      })

      it('should handle mid-process rejection', async () => {
        const template = await createTemplate({
          name: 'Three-Step',
          requestType: 'purchase',
          steps: [
            { email: 'manager@company.com' },
            { email: 'director@company.com' },
            { email: 'vp@company.com' },
          ],
        })

        const request = await createRequest({
          title: 'Equipment purchase',
          requestType: 'purchase',
          amount: 5000,
          templateId: template.data!.id,
        })

        const requestId = request.data!.id

        // Step 1 approved
        await approveStep(requestId, { approverId: 'user_manager' })

        // Step 2 rejected
        await rejectStep(requestId, {
          approverId: 'user_director',
          comments: 'Budget freeze in effect',
        })

        const finalRequest = await getRequestById(requestId)
        expect(finalRequest.data?.status).toBe('rejected')

        // Verify step 3 was never actioned
        const step3 = finalRequest.data?.steps?.find((s) => s.stepNumber === 3)
        expect(step3?.status).toBe('pending')
      })
    })

    describe('Parallel vs Sequential approvals', () => {
      it('should process steps sequentially by default', async () => {
        const template = await createTemplate({
          name: 'Sequential',
          requestType: 'expense',
          steps: [
            { email: 'first@company.com' },
            { email: 'second@company.com' },
          ],
        })

        const request = await createRequest({
          title: 'Sequential test',
          requestType: 'expense',
          templateId: template.data!.id,
        })

        // Try to approve step 2 first - should fail
        const result = await approveStep(request.data!.id, {
          approverId: 'user_second',
          stepNumber: 2,
        })

        expect(result.success).toBe(false)
      })
    })

    describe('Edge cases', () => {
      it('should handle request with single approver', async () => {
        const template = await createTemplate({
          name: 'Single Approver',
          requestType: 'timeoff',
          steps: [{ email: 'hr@company.com' }],
        })

        const request = await createRequest({
          title: 'Vacation request',
          requestType: 'timeoff',
          templateId: template.data!.id,
        })

        await approveStep(request.data!.id, { approverId: 'user_hr' })

        const finalRequest = await getRequestById(request.data!.id)
        expect(finalRequest.data?.status).toBe('approved')
      })

      it('should handle request with amount as 0', async () => {
        const template = await createTemplate({
          name: 'Zero Amount',
          requestType: 'expense',
          steps: [{ email: 'approver@company.com' }],
        })

        const result = await createRequest({
          title: 'Reimbursement reversal',
          requestType: 'expense',
          amount: 0,
          templateId: template.data!.id,
        })

        expect(result.success).toBe(true)
        expect(result.data?.amount).toBe(0)
      })

      it('should handle very long descriptions', async () => {
        const template = await createTemplate({
          name: 'Long Desc',
          requestType: 'document',
          steps: [{ email: 'reviewer@company.com' }],
        })

        const longDescription = 'A'.repeat(5000)
        const result = await createRequest({
          title: 'Long description test',
          description: longDescription,
          requestType: 'document',
          templateId: template.data!.id,
        })

        expect(result.success).toBe(true)
        expect(result.data?.description).toHaveLength(5000)
      })
    })
  })

  // ============================================================
  // AUTHORIZATION TESTS
  // ============================================================
  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: null } as any)

      const result = await createTemplate({
        name: 'Test',
        requestType: 'expense',
        steps: [{ email: 'test@test.com' }],
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })
})
